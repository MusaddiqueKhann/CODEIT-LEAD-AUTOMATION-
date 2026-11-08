-- One function per button. Each one locks the member, checks private.can(), makes the change,
-- and writes the activity line, the alerts and any email or calendar job in the same transaction.
-- The browser never writes a table directly.

-- ── Helpers ────────────────────────────────────────────────────────────────

create function private.full_name(m public.members) returns text
language sql immutable set search_path = '' as $$
  select m.first_name || ' ' || m.last_name
$$;

create function private.person_name(p_person uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select name from public.profiles where id = p_person), 'nobody')
$$;

create function private.label(p_list text, p_key text) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select label from public.options where list = p_list and key = p_key), p_key)
$$;

/** The Arabic name of an option, or its English one when the Admin left the Arabic empty. */
create function private.label_ar(p_list text, p_key text) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select coalesce(nullif(label_ar, ''), label) from public.options where list = p_list and key = p_key), p_key)
$$;

/** Locks the member and checks the action is allowed; raises a plain sentence when it isn't. */
create function private.load(p_member bigint, p_action text) returns public.members
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
begin
  select * into m from public.members where id = p_member for update;
  if not found or not private.can(p_action, m) then
    raise exception 'You can’t do that on this member right now.' using errcode = '42501';
  end if;
  return m;
end $$;

/**
 * A line in English and Arabic: the text `p_key` (Settings → Emails & texts → Alerts & activity)
 * with its {placeholders} filled. A value is plain text, or { en, ar } when it reads differently
 * in each language (a role's name, a date). Arabic left empty falls back to English.
 */
create function private.say(p_key text, p_values jsonb default '{}') returns text[]
language plpgsql stable security definer set search_path = '' as $$
declare
  t public.texts;
  en text;
  ar text;
  k text;
  v jsonb;
begin
  select * into t from public.texts where key = p_key;
  en := coalesce(t.en, p_key);
  ar := coalesce(nullif(t.ar, ''), en);
  for k, v in select * from jsonb_each(coalesce(p_values, '{}')) loop
    en := replace(en, '{' || k || '}', coalesce(case jsonb_typeof(v) when 'object' then v ->> 'en' else v #>> '{}' end, ''));
    ar := replace(ar, '{' || k || '}', coalesce(case jsonb_typeof(v) when 'object' then coalesce(v ->> 'ar', v ->> 'en') else v #>> '{}' end, ''));
  end loop;
  return array[en, ar];
end $$;

/** An option's name in both languages, for say(). */
create function private.l2(p_list text, p_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('en', private.label(p_list, p_key), 'ar', private.label_ar(p_list, p_key))
$$;

/** A day in both languages: "Tue 10 Nov" and "الثلاثاء 10 نوفمبر" (Gregorian, digits 0–9). */
create function private.d2(p_day date) returns jsonb
language sql immutable set search_path = '' as $$
  select case when p_day is not null then jsonb_build_object('en', to_char(p_day, 'Dy DD Mon'),
    'ar', (array['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'])[extract(dow from p_day)::int + 1]
      || ' ' || extract(day from p_day)::int || ' '
      || (array['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'])[extract(month from p_day)::int])
  end
$$;

/** A moment in both languages, Riyadh time: "Tue 10 Nov, 14:30". */
create function private.dt2(p_at timestamptz) returns jsonb
language sql stable set search_path = '' as $$
  select case when p_at is not null then jsonb_build_object(
    'en', to_char(p_at at time zone 'Asia/Riyadh', 'Dy DD Mon, HH24:MI'),
    'ar', (private.d2((p_at at time zone 'Asia/Riyadh')::date) ->> 'ar') || '، ' || to_char(p_at at time zone 'Asia/Riyadh', 'HH24:MI'))
  end
$$;

/** The product customers get an account on (Settings → Company). */
create function private.product() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(company ->> 'product_name', '') from public.settings
$$;

/** An activity line on a member, in both languages, from the text `p_key`. Returns its id. */
create function private.log(p_member bigint, p_kind text, p_key text, p_values jsonb default '{}') returns bigint
language sql security definer set search_path = '' as $$
  insert into public.activity (member_id, actor_id, kind, text, text_ar)
  select p_member, auth.uid(), p_kind, s[1], s[2] from private.say(p_key, p_values) s
  returning id
$$;

/**
 * One alert to one person, in both languages, from the text `p_text_key`. Never to the person who
 * did it; never twice for the same `p_key`.
 */
create function private.alert(p_person uuid, p_member bigint, p_kind text, p_text_key text, p_values jsonb, p_key text) returns void
language sql security definer set search_path = '' as $$
  insert into public.alerts (person_id, member_id, kind, text, text_ar, key)
  select p_person, p_member, p_kind, s[1], s[2], p_key from private.say(p_text_key, p_values) s
  where p_person is not null and p_person is distinct from auth.uid()
  on conflict (person_id, key) do nothing
$$;

create function private.alert_admins(p_member bigint, p_kind text, p_text_key text, p_values jsonb, p_key text) returns void
language sql security definer set search_path = '' as $$
  select private.alert(p.id, p_member, p_kind, p_text_key, p_values, p_key)
  from public.profiles p where p.role = 'admin' and p.active
$$;

create function private.queue(p_kind text, p_payload jsonb, p_key text) returns void
language sql security definer set search_path = '' as $$
  insert into private.jobs (kind, payload, key) values (p_kind, p_payload, p_key)
  on conflict (key) do nothing
$$;

/**
 * Brings the calendar event in line with the member; `email` names the customer email to send
 * after. The session time is kept with the job, so a cancellation email can still name the day.
 */
create function private.sync_calendar(p_member bigint, p_email text) returns void
language sql security definer set search_path = '' as $$
  select private.queue('calendar_sync',
    jsonb_build_object('member_id', p_member, 'email', p_email,
      'session_at', (select session_at from public.members where id = p_member)),
    'cal:' || p_member || ':' || extract(epoch from clock_timestamp()))
$$;

/** A unique-enough suffix for alert keys that may repeat (a second send-back, a new booking). */
create function private.now_key() returns text
language sql stable set search_path = '' as $$
  select extract(epoch from private.app_now())::bigint::text
$$;

/**
 * Puts a person on a member in a role, logs it, and tells them. `p_auto` marks an automatic pick.
 * Their last_assigned_at moves to now, so the next tie goes to someone else.
 */
create function private.assign(p_member bigint, p_role public.team_role, p_person uuid, p_auto boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
begin
  update public.members set
    sales_id = case when p_role = 'sales' then p_person else sales_id end,
    account_person_id = case when p_role = 'account' then p_person else account_person_id end,
    integration_id = case when p_role = 'integration' then p_person else integration_id end,
    onboarding_id = case when p_role = 'onboarding' then p_person else onboarding_id end,
    auto_picked = case when p_auto then array_append(array_remove(auto_picked, p_role::text), p_role::text)
                       else array_remove(auto_picked, p_role::text) end
  where id = p_member
  returning * into m;

  if p_person is null then return; end if;
  update public.profiles set last_assigned_at = private.app_now() where id = p_person;

  perform private.log(p_member, 'person_' || p_role::text, case when p_auto then 'log_person_auto' else 'log_person_changed' end,
    jsonb_build_object('role', private.l2('role', p_role::text), 'person', private.person_name(p_person)));
  perform private.alert(p_person, p_member, 'given', 'alert_given',
    jsonb_build_object('name', private.full_name(m), 'role', private.l2('role', p_role::text)),
    'given:' || p_role || ':' || p_member || ':' || private.now_key());
end $$;

/**
 * Makes sure the session has an Onboarding Member who is free: keeps the current one when they
 * still are, else picks again. Nobody free → the Admin is asked to pick.
 */
create function private.place_onboarding(p_member bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
  pick uuid;
begin
  select * into m from public.members where id = p_member;
  if m.session_at is null then return; end if;
  if m.onboarding_id is not null
     and private.busy_reason(m.onboarding_id, m.session_at, m.session_ends_at, m.id) is null then
    return;
  end if;

  pick := private.pick_onboarding(m.session_at, m.session_ends_at, m.id);
  if m.onboarding_id is not null then
    perform private.alert(m.onboarding_id, m.id, 'taken_off', 'alert_taken_off', jsonb_build_object('name', private.full_name(m)),
      'taken_off:' || m.id || ':' || private.now_key());
  end if;
  if pick is null then
    update public.members set onboarding_id = null, auto_picked = array_remove(auto_picked, 'onboarding') where id = m.id;
    perform private.log(m.id, 'person', 'log_nobody_free', jsonb_build_object('role', private.l2('role', 'onboarding')));
    perform private.alert_admins(m.id, 'nobody_free', 'alert_nobody_session',
      jsonb_build_object('name', private.full_name(m), 'role', private.l2('role', 'onboarding')),
      'nobody_free:' || m.id || ':' || private.now_key());
  else
    perform private.assign(m.id, 'onboarding', pick, true);
  end if;
end $$;

/** When the files still to send come in: the latest promised date among documents not uploaded yet (null when none). */
create function private.files_ready(p_member bigint) returns date
language sql stable security definer set search_path = '' as $$
  select max(e.value::date) from public.members m, jsonb_each_text(m.doc_due) e
  where m.id = p_member and e.key not in (select d.kind from public.documents d where d.member_id = m.id)
$$;

/**
 * The first day a session can go on: the Admin's buffer from today, or the files' ready day plus the
 * Admin's files-ready working days, whichever is later.
 */
create function private.earliest_day(p_ready date) returns date
language sql stable security definer set search_path = '' as $$
  select greatest(
    private.add_working_days(private.today(), s.buffer_days),
    case when p_ready is not null then private.add_working_days(p_ready, s.files_ready_days) end)
  from private.settings() s
$$;

/** Raises a plain sentence when a time can't be booked. The Admin may book any time (after a warning on screen). */
create function private.check_slot(p_at timestamptz, p_member bigint) returns void
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.settings := private.settings();
  d date := private.riyadh_day(p_at);
  ends timestamptz := p_at + make_interval(mins => s.session_minutes);
  h jsonb := s.office_hours -> extract(dow from d)::int;
  ready date := private.files_ready(p_member);
begin
  if p_at <= private.app_now() then raise exception 'That time has already passed.' using hint = 'time_passed'; end if;
  if private.is_admin() then return; end if;
  if d < private.add_working_days(private.today(), s.buffer_days) then
    raise exception 'Too soon: sessions are booked at least % working days ahead.', s.buffer_days
      using hint = 'too_soon', detail = jsonb_build_object('days', s.buffer_days)::text;
  end if;
  if ready is not null and d < private.add_working_days(ready, s.files_ready_days) then
    raise exception 'Too soon: the files come in on %, so the first session day is %.',
      to_char(ready, 'Dy DD Mon'), to_char(private.add_working_days(ready, s.files_ready_days), 'Dy DD Mon')
      using hint = 'too_soon_files', detail = jsonb_build_object('ready', ready, 'first', private.add_working_days(ready, s.files_ready_days))::text;
  end if;
  if d > private.today() + s.book_ahead_days then
    raise exception 'Too far ahead: sessions are booked up to % days ahead.', s.book_ahead_days
      using hint = 'too_far', detail = jsonb_build_object('days', s.book_ahead_days)::text;
  end if;
  if not private.is_working_day(d) then raise exception 'That day isn’t a working day.' using hint = 'not_working_day'; end if;
  if private.riyadh_time(p_at) < (h ->> 'from')::time or private.riyadh_time(ends) > (h ->> 'to')::time then
    raise exception 'That time is outside office hours.' using hint = 'outside_hours';
  end if;
  if private.room_at(p_at, ends, p_member) <= 0 then
    raise exception 'No Onboarding Member is free at that time. Pick another.' using hint = 'no_room';
  end if;
end $$;

-- ── Booking ────────────────────────────────────────────────────────────────

/**
 * The days a session can go on: from the earliest day (see earliest_day; `p_ready` is the files'
 * ready day on a form not saved yet, else the member's own), within book-ahead, working days that
 * still have a free time. `p_member` is the member being moved.
 */
create function public.bookable_days(p_ready date default null, p_member bigint default null) returns setof date
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.settings := private.settings();
  d date;
begin
  if private.my_role() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  d := private.earliest_day(coalesce(p_ready, private.files_ready(p_member)));
  while d <= private.today() + s.book_ahead_days loop
    -- ponytail: works out every time of every day; fine for a month of days and a small team
    if private.is_working_day(d) and exists (select 1 from public.open_times(d, p_member) t where t.room > 0) then
      return next d;
    end if;
    d := d + 1;
  end loop;
end $$;

/**
 * Every start time on a day with how much room it has (0 = full) and the Onboarding Members free
 * then. The one who runs it is still picked at handover. `p_member` is the one being moved.
 */
create function public.open_times(p_day date, p_member bigint default null)
returns table (slot text, room int, free uuid[])
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.settings := private.settings();
  h jsonb := s.office_hours -> extract(dow from p_day)::int;
  start_ int;
  last_ int;
  at_ timestamptz;
begin
  if private.my_role() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if not private.is_working_day(p_day) then return; end if;
  start_ := extract(epoch from (h ->> 'from')::time)::int / 60;
  last_ := extract(epoch from (h ->> 'to')::time)::int / 60 - s.session_minutes;
  while start_ <= last_ loop
    at_ := (p_day + make_interval(mins => start_)) at time zone 'Asia/Riyadh';
    slot := to_char(make_interval(mins => start_), 'HH24:MI');
    room := case when at_ <= private.app_now() then 0
                 else greatest(0, private.room_at(at_, at_ + make_interval(mins => s.session_minutes), p_member)) end;
    free := case when room = 0 then '{}' else array(
      select p.id from public.profiles p
      where p.role = 'onboarding' and private.busy_reason(p.id, at_, at_ + make_interval(mins => s.session_minutes), p_member) is null
      order by p.name) end;
    return next;
    start_ := start_ + s.slot_step_minutes;
  end loop;
end $$;

/** Books or moves the session. Keeps or re-picks the Onboarding Member once one is on it. */
create function public.book_session(p_member bigint, p_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
  fresh boolean;
  len int := (private.settings()).session_minutes;
begin
  perform pg_advisory_xact_lock(1); -- ponytail: one lock for every booking; fine at this team size
  m := private.load(p_member, 'book');
  perform private.check_slot(p_at, m.id);
  fresh := m.session_at is null;

  update public.members set
    session_at = p_at,
    session_ends_at = p_at + make_interval(mins => len),
    session_joined_at = case when p_at = m.session_at then m.session_joined_at end,
    booking_no = booking_no + case when fresh then 1 else 0 end
  where id = m.id;

  perform private.log(m.id, 'session', case when fresh then 'log_session_booked' else 'log_session_moved' end,
    jsonb_build_object('at', private.dt2(p_at), 'from', private.dt2(m.session_at), 'to', private.dt2(p_at)));

  if m.onboarding_id is not null or m.stage in ('setup', 'session') then
    perform private.place_onboarding(m.id);
  end if;
  perform private.sync_calendar(m.id, case when fresh then 'session_booked' else 'session_moved' end);
end $$;

-- ── Collecting (Sales and the Account Member) ──────────────────────────────

/** The fields Sales may set on add and edit. Anything else is refused. */
create function private.member_fields() returns text[]
language sql immutable set search_path = '' as $$
  select array['first_name', 'last_name', 'email', 'phone', 'language', 'company', 'cr', 'vat', 'city', 'website',
    'industry', 'size', 'plan', 'branches', 'users', 'features', 'integrations', 'hardware', 'doc_due']
$$;

/** Refuses a duplicate email or CR, naming the member that already has it. */
create function private.check_duplicates(p_email text, p_cr text, p_except bigint) returns void
language plpgsql stable security definer set search_path = '' as $$
declare
  hit public.members;
begin
  select * into hit from public.members
  where id is distinct from p_except and (lower(email) = lower(trim(p_email)) or (nullif(trim(p_cr), '') is not null and cr = trim(p_cr)))
  limit 1;
  if found then
    raise exception '% already has this % (Sales: %).', hit.code,
      case when lower(hit.email) = lower(trim(p_email)) then 'email' else 'CR number' end,
      private.person_name(hit.sales_id)
      using errcode = '23505', hint = 'duplicate', detail = jsonb_build_object('code', hit.code, 'sales', private.person_name(hit.sales_id),
        'field', case when lower(hit.email) = lower(trim(p_email)) then 'email' else 'cr' end)::text;
  end if;
end $$;

/**
 * Saves a new member. Whoever adds it is the Sales owner (the Admin names one in `sales_id`).
 * An Account Member is picked straight away. Returns { id, code, account, phone_match }.
 */
create function public.add_member(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r public.team_role := private.my_role();
  sales uuid := case when private.is_admin() then (p ->> 'sales_id')::uuid else auth.uid() end;
  bad text;
  m public.members;
  phone_match text;
  account uuid;
begin
  if r is null or r not in ('admin', 'sales') then
    raise exception 'Only Sales and the Admin add members.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = sales and role = 'sales' and active) then
    raise exception 'Pick an active Sales Member as the owner.' using hint = 'pick_sales_owner';
  end if;
  select k into bad from jsonb_object_keys(p) k where k <> all (private.member_fields() || array['sales_id', 'session_at']) limit 1;
  if bad is not null then raise exception 'Unknown field: %', bad; end if;
  perform private.check_duplicates(p ->> 'email', p ->> 'cr', null);

  insert into public.members (
    first_name, last_name, email, phone, language, company, cr, vat, city, website, industry, size,
    plan, branches, users, features, integrations, hardware, doc_due,
    sales_id, created_by)
  select
    trim(x.first_name), trim(x.last_name), lower(trim(x.email)), trim(x.phone), coalesce(x.language, 'en'),
    trim(x.company), nullif(trim(x.cr), ''), nullif(trim(x.vat), ''), x.city, nullif(trim(x.website), ''),
    x.industry, x.size, x.plan, x.branches, x.users, coalesce(x.features, '{}'), coalesce(x.integrations, '{}'),
    coalesce(x.hardware, '{}'), coalesce(x.doc_due, '{}'),
    sales, auth.uid()
  from jsonb_populate_record(null::public.members, p) x
  returning * into m;

  perform private.log(m.id, 'created', case when sales <> auth.uid() then 'log_created_for' else 'log_created' end,
    jsonb_build_object('by', private.person_name(auth.uid()), 'sales', private.person_name(sales)));
  if sales <> auth.uid() then
    perform private.alert(sales, m.id, 'given', 'alert_given', jsonb_build_object('name', private.full_name(m), 'role', private.l2('role', 'sales')), 'given:sales:' || m.id);
  end if;

  account := private.pick_least_busy('account');
  if account is null then
    perform private.alert_admins(m.id, 'nobody_free', 'alert_nobody_account',
      jsonb_build_object('name', private.full_name(m), 'product', private.product(), 'role', private.l2('role', 'account')), 'nobody_free:account:' || m.id);
  else
    perform private.assign(m.id, 'account', account, true);
  end if;

  if p ? 'session_at' then perform public.book_session(m.id, (p ->> 'session_at')::timestamptz); end if;

  select code into phone_match from public.members
  where id <> m.id and regexp_replace(phone, '\D', '', 'g') = regexp_replace(m.phone, '\D', '', 'g') limit 1;

  return jsonb_build_object('id', m.id, 'code', m.code, 'account', private.person_name(account), 'phone_match', phone_match);
end $$;

/** Sales edits (until Transfer). Email and business type lock once the account exists. */
create function public.update_member(p_member bigint, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'edit');
  bad text;
begin
  select k into bad from jsonb_object_keys(p) k where k <> all (private.member_fields()) limit 1;
  if bad is not null then raise exception 'That field can’t be changed here: %', bad; end if;
  if m.account_created_at is not null
     and ((p ? 'email' and lower(p ->> 'email') <> lower(m.email)) or (p ? 'plan' and p ->> 'plan' is distinct from m.plan)) then
    raise exception 'Email and business type are locked once the CODEIT account exists. The Admin can untick Account created first.' using hint = 'email_locked';
  end if;
  if p ? 'email' or p ? 'cr' then
    perform private.check_duplicates(coalesce(p ->> 'email', m.email), coalesce(p ->> 'cr', m.cr), m.id);
  end if;

  update public.members t set
    first_name = coalesce(x.first_name, t.first_name), last_name = coalesce(x.last_name, t.last_name),
    email = coalesce(lower(trim(x.email)), t.email), phone = coalesce(x.phone, t.phone),
    language = coalesce(x.language, t.language), company = coalesce(x.company, t.company),
    cr = case when p ? 'cr' then nullif(trim(x.cr), '') else t.cr end,
    vat = case when p ? 'vat' then nullif(trim(x.vat), '') else t.vat end,
    city = case when p ? 'city' then x.city else t.city end,
    website = case when p ? 'website' then nullif(trim(x.website), '') else t.website end,
    industry = case when p ? 'industry' then x.industry else t.industry end,
    size = case when p ? 'size' then x.size else t.size end,
    plan = case when p ? 'plan' then x.plan else t.plan end,
    branches = case when p ? 'branches' then x.branches else t.branches end,
    users = case when p ? 'users' then x.users else t.users end,
    features = coalesce(x.features, t.features), integrations = coalesce(x.integrations, t.integrations),
    hardware = coalesce(x.hardware, t.hardware), doc_due = coalesce(x.doc_due, t.doc_due)
  from jsonb_populate_record(null::public.members, p) x
  where t.id = m.id;

  perform private.log(m.id, 'edited', 'log_edited', jsonb_build_object('fields', (
    select jsonb_build_object('en', string_agg(f[1], ', '), 'ar', string_agg(f[2], '، '))
    from jsonb_object_keys(p) k, private.say('field_' || k) f)));
end $$;

/** The Account Member ticks Account created with the CODEIT account ID. Sales hears about it. */
create function public.set_account(p_member bigint, p_codeit_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'set_account');
begin
  if nullif(trim(p_codeit_id), '') is null then raise exception 'Type the CODEIT account ID first.' using hint = 'need_account_id'; end if;
  update public.members set codeit_account_id = trim(p_codeit_id), account_created_at = private.app_now() where id = m.id;
  perform private.log(m.id, 'account_created', 'log_account_created', jsonb_build_object('product', private.product(), 'id', trim(p_codeit_id)));
  perform private.alert(m.sales_id, m.id, 'account_created', 'alert_account_created',
    jsonb_build_object('name', private.full_name(m), 'product', private.product()), 'account_created:' || m.id || ':' || private.now_key());
end $$;

/**
 * The Onboarding Member pressed Join Meet: the first press is when the session started, for
 * "started on time". Quiet: no activity line.
 */
create function public.join_session(p_member bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'join');
begin
  update public.members set session_joined_at = coalesce(session_joined_at, private.app_now()) where id = m.id;
end $$;

/** Account Member: tick (or untick) a part of making the CODEIT account: its login, password or language. */
create function public.set_account_check(p_member bigint, p_key text, p_on boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'set_account');
  part text := (select label from public.options where list = 'account_part' and key = p_key);
begin
  if part is null then raise exception 'Unknown account step: %', p_key; end if;
  update public.members set
    account_checks = case when p_on then account_checks || jsonb_build_object(p_key, true) else account_checks - p_key end,
    account_started_at = coalesce(account_started_at, case when p_on then private.app_now() end)
  where id = m.id;
  perform private.log(m.id, 'account', case when p_on then 'log_account_part_on' else 'log_account_part_off' end,
    jsonb_build_object('part', private.l2('account_part', p_key), 'product', private.product()));
end $$;

/** Account Member: the customer has signed in to their CODEIT account (or, unticked, not yet). */
create function public.set_customer_signed_in(p_member bigint, p_on boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'customer_signin');
begin
  update public.members set customer_signed_in_at = case when p_on then private.app_now() end where id = m.id;
  perform private.log(m.id, case when p_on then 'customer_signed_in' else 'account' end,
    case when p_on then 'log_signed_in' else 'log_signed_in_off' end);
end $$;

/** Admin only: untick Account created, which unlocks the email and business type. */
create function public.unset_account(p_member bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'unset_account');
begin
  update public.members set account_created_at = null where id = m.id;
  perform private.log(m.id, 'account', 'log_account_unticked');
  perform private.alert(m.account_person_id, m.id, 'account_reopened', 'alert_account_reopened',
    jsonb_build_object('name', private.full_name(m), 'product', private.product()), 'account_reopened:' || m.id || ':' || private.now_key());
end $$;

/**
 * Sales or the Admin move the hardware on (Ordered → Arriving → Delivered) at any stage until
 * Closed: it often arrives after Transfer, when the Sales form is already read-only.
 */
create function public.set_hardware(p_member bigint, p_hardware jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'hardware');
  bad text;
begin
  if jsonb_typeof(p_hardware) is distinct from 'object' then raise exception 'Hardware must be an object.'; end if;
  select k into bad from jsonb_object_keys(p_hardware) k where k <> all (array['none', 'needs', 'step', 'ordered', 'date', 'delivered']) limit 1;
  if bad is not null then raise exception 'Unknown hardware field: %', bad; end if;
  if m.hardware = p_hardware then return; end if;
  update public.members set hardware = p_hardware where id = m.id;
  perform private.log(m.id, 'hardware', case
    when (p_hardware ->> 'none')::boolean then 'log_hardware_none'
    when (p_hardware ->> 'delivered')::boolean then 'log_hardware_delivered'
    when p_hardware ? 'date' then 'log_hardware_arriving'
    else 'log_hardware_updated' end, jsonb_build_object('date', private.d2((p_hardware ->> 'date')::date)));
end $$;

/** Records a file already uploaded to <member_id>/<kind>/… in the documents bucket. */
create function public.attach_document(p_member bigint, p_kind text, p_path text, p_name text, p_size bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'edit');
begin
  if p_path not like m.id || '/' || p_kind || '/%'
     or not exists (select 1 from storage.objects where bucket_id = 'documents' and name = p_path) then
    raise exception 'That file isn’t in this member’s folder.' using hint = 'file_missing';
  end if;
  if p_size > (private.settings()).max_upload_mb * 1048576 then
    raise exception 'That file is bigger than % MB.', (private.settings()).max_upload_mb
      using hint = 'file_too_big', detail = jsonb_build_object('mb', (private.settings()).max_upload_mb)::text;
  end if;
  insert into public.documents (member_id, kind, path, name, size, uploaded_by)
  values (m.id, p_kind, p_path, p_name, p_size, auth.uid())
  on conflict (member_id, kind) do update set path = excluded.path, name = excluded.name, size = excluded.size,
    uploaded_by = excluded.uploaded_by, uploaded_at = now();
  perform private.log(m.id, 'document_uploaded', 'log_document_uploaded', jsonb_build_object('document', private.l2('document', p_kind), 'file', p_name));
end $$;

/** Forgets a file; returns its storage path so the browser can delete the object itself. */
create function public.remove_document(p_member bigint, p_kind text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'edit');
  old text;
begin
  delete from public.documents where member_id = m.id and kind = p_kind returning path into old;
  if old is not null then perform private.log(m.id, 'document_removed', 'log_document_removed', jsonb_build_object('document', private.l2('document', p_kind))); end if;
  return old;
end $$;

/** Sales presses Transfer: the ready check must pass, then it goes to the first stage not done. */
create function public.transfer(p_member bigint) returns text
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
  ready jsonb;
  missing text;
  next_ public.member_stage;
  pick uuid;
begin
  perform pg_advisory_xact_lock(1);
  m := private.load(p_member, 'transfer');
  ready := private.ready_check(m);
  if not (ready ->> 'ok')::boolean then
    select string_agg(initcap(k), ', ') into missing from jsonb_each_text(ready) e(k, v) where k <> 'ok' and v = 'false';
    raise exception 'Not ready to transfer yet: %.', missing using hint = 'not_ready',
      detail = jsonb_build_object('missing', (select jsonb_agg(k) from jsonb_each_text(ready) e(k, v) where k <> 'ok' and v = 'false'))::text;
  end if;

  next_ := private.next_stage(m);
  update public.members set stage = next_, holder_since = private.app_now(),
    sent_back_reason = null, sent_back_by = null, sent_back_at = null
  where id = m.id;
  perform private.log(m.id, 'transferred', 'log_transferred',
    jsonb_build_object('step', private.l2('step', case when next_ = 'integration' then 'integration' else 'onboarding' end)));

  if next_ = 'integration' then
    if m.integration_id is null then
      pick := private.pick_least_busy('integration');
      if pick is null then
        perform private.alert_admins(m.id, 'nobody_free', 'alert_nobody_integration',
          jsonb_build_object('name', private.full_name(m), 'role', private.l2('role', 'integration')), 'nobody_free:integration:' || m.id || ':' || private.now_key());
      else
        perform private.assign(m.id, 'integration', pick, true);
      end if;
    else
      perform private.alert(m.integration_id, m.id, 'back', 'alert_back', jsonb_build_object('name', private.full_name(m)), 'back:' || m.id || ':' || private.now_key());
    end if;
  else
    perform private.place_onboarding(m.id);
    perform private.sync_calendar(m.id, null);
  end if;
  return next_::text;
end $$;

create function public.mark_lost(p_member bigint, p_reason text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'mark_lost');
  why text;
  why_ar text;
begin
  if not exists (select 1 from public.options where list = 'lost_reason' and key = p_reason) then
    raise exception 'Pick a reason.' using hint = 'pick_reason';
  end if;
  why := private.label('lost_reason', p_reason) || coalesce(': ' || nullif(trim(p_note), ''), '');
  why_ar := private.label_ar('lost_reason', p_reason) || coalesce(': ' || nullif(trim(p_note), ''), '');
  update public.members set outcome = 'lost', outcome_reason = why, holder_since = private.app_now() where id = m.id;
  perform private.log(m.id, 'lost', 'log_lost', jsonb_build_object('why', jsonb_build_object('en', why, 'ar', why_ar)));
  if m.session_at is not null then perform private.sync_calendar(m.id, 'session_cancelled'); end if;
  if m.account_created_at is not null then
    perform private.alert(m.account_person_id, m.id, 'lost', 'alert_lost_account',
      jsonb_build_object('name', private.full_name(m), 'product', private.product()), 'lost:' || m.id || ':' || private.now_key());
  end if;
  perform private.alert_admins(m.id, 'lost', 'alert_lost_admin',
    jsonb_build_object('name', private.full_name(m), 'why', jsonb_build_object('en', why, 'ar', why_ar)), 'lost_admin:' || m.id || ':' || private.now_key());
end $$;

/** Admin only: a Lost member goes back to Collecting with the same Sales owner and no booking. */
create function public.reopen(p_member bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'reopen');
begin
  update public.members set outcome = null, outcome_reason = null, stage = 'collecting',
    session_at = null, session_ends_at = null, meet_link = null, holder_since = private.app_now()
  where id = m.id;
  perform private.log(m.id, 'reopened', 'log_reopened');
  perform private.alert(m.sales_id, m.id, 'reopened', 'alert_reopened', jsonb_build_object('name', private.full_name(m)), 'reopened:' || m.id || ':' || private.now_key());
  perform private.alert_admins(m.id, 'reopened', 'alert_reopened_admin',
    jsonb_build_object('name', private.full_name(m), 'by', private.person_name(auth.uid())), 'reopened_admin:' || m.id || ':' || private.now_key());
end $$;

-- ── Integration ────────────────────────────────────────────────────────────

/** One integration's ticks: { connected, tested, waiting, notes }. */
create function public.set_integration_check(p_member bigint, p_key text, p_check jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'integration');
begin
  if not p_key = any (m.integrations) then raise exception 'That integration isn’t on this member.'; end if;
  update public.members set integration_checks = integration_checks || jsonb_build_object(p_key,
    coalesce(integration_checks -> p_key, '{}') || (p_check - array(
      select k from jsonb_object_keys(p_check) k where k not in ('connected', 'tested', 'waiting', 'notes'))))
  where id = m.id;
  -- Say what changed ("Hala connected", "Surepay waiting on provider"), so activity can count it.
  perform private.log(m.id, case
    when (p_check ->> 'connected')::boolean then 'connected'
    when (p_check ->> 'tested')::boolean then 'tested'
    else 'integration' end, case
    when p_check ? 'connected' then case when (p_check ->> 'connected')::boolean then 'log_int_connected' else 'log_int_unconnected' end
    when p_check ? 'tested' then case when (p_check ->> 'tested')::boolean then 'log_int_tested' else 'log_int_untested' end
    when p_check ? 'waiting' then case when (p_check ->> 'waiting')::boolean then 'log_int_waiting' else 'log_int_unwaiting' end
    else 'log_int_notes' end, jsonb_build_object('integration', private.l2('integration', p_key)));
end $$;

create function public.hand_to_onboarding(p_member bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
  open_ text;
  next_ public.member_stage;
begin
  perform pg_advisory_xact_lock(1);
  m := private.load(p_member, 'integration');
  select string_agg(private.label('integration', k), ', ') into open_
  from unnest(m.integrations) k
  where not coalesce((m.integration_checks -> k ->> 'connected')::boolean, false)
     or not coalesce((m.integration_checks -> k ->> 'tested')::boolean, false);
  if open_ is not null then raise exception 'Still to connect and test: %.', open_ using hint = 'still_to_connect'; end if;

  update public.members set integration_done_at = private.app_now() where id = m.id returning * into m;
  next_ := private.next_stage(m);
  update public.members set stage = next_, holder_since = private.app_now() where id = m.id;
  perform private.log(m.id, 'handed_over', 'log_handed_over', jsonb_build_object('step', private.l2('step', 'onboarding')));
  perform private.place_onboarding(m.id);
  perform private.sync_calendar(m.id, null);
end $$;

/**
 * Sends a member back with a reason, keeping its booked time: Integration → Sales; Onboarding →
 * Integration when there was one, else Sales.
 */
create function public.send_back(p_member bigint, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'send_back');
  to_integration boolean := m.stage in ('setup', 'session') and cardinality(m.integrations) > 0;
  to_person uuid;
begin
  if nullif(trim(p_reason), '') is null then raise exception 'Write what is missing.' using hint = 'need_send_back_reason'; end if;
  to_person := case when to_integration then m.integration_id else m.sales_id end;
  update public.members set
    stage = case when to_integration then 'integration'::public.member_stage else 'collecting'::public.member_stage end,
    integration_done_at = case when to_integration then null else integration_done_at end,
    sent_back_reason = trim(p_reason), sent_back_by = auth.uid(), sent_back_at = private.app_now(),
    holder_since = private.app_now()
  where id = m.id;
  perform private.log(m.id, 'sent_back', 'log_sent_back',
    jsonb_build_object('step', private.l2('step', case when to_integration then 'integration' else 'sales' end), 'reason', trim(p_reason)));
  perform private.alert(to_person, m.id, 'sent_back', 'alert_sent_back',
    jsonb_build_object('name', private.full_name(m), 'reason', trim(p_reason)), 'sent_back:' || m.id || ':' || private.now_key());
end $$;

-- ── Onboarding ─────────────────────────────────────────────────────────────

/** One setup checklist tick. All ticked → Session; unticking one sends it back to Setup. */
create function public.set_setup_check(p_member bigint, p_key text, p_done boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'setup');
  all_done boolean;
begin
  if not exists (select 1 from public.options where list = 'setup_check' and key = p_key and active) then
    raise exception 'Unknown checklist item.';
  end if;
  update public.members set setup_checks = setup_checks || jsonb_build_object(p_key, p_done) where id = m.id returning * into m;
  all_done := not exists (
    select 1 from public.options o where o.list = 'setup_check' and o.active
      and not coalesce((m.setup_checks ->> o.key)::boolean, false));
  if all_done and m.setup_done_at is null then
    update public.members set setup_done_at = private.app_now(), stage = 'session' where id = m.id;
    perform private.log(m.id, 'setup_done', 'log_setup_done');
  elsif not all_done and m.setup_done_at is not null then
    update public.members set setup_done_at = null, stage = 'setup' where id = m.id;
    perform private.log(m.id, 'setup_reopened', 'log_setup_reopened', jsonb_build_object('item', private.l2('setup_check', p_key)));
  end if;
end $$;

create function public.complete_session(p_member bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'finish');
begin
  update public.members set completed_at = private.app_now(), stage = 'recording', holder_since = private.app_now() where id = m.id;
  perform private.log(m.id, 'completed', 'log_completed');
end $$;

/** The customer didn't come: back to Sales to book a new time. The second time, the Admin hears too. */
create function public.no_show(p_member bigint, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'finish');
begin
  perform private.sync_calendar(m.id, 'session_missed'); -- first, while the job can still see the time
  update public.members set no_shows = no_shows + 1, stage = 'collecting', session_at = null, session_ends_at = null,
    meet_link = null, holder_since = private.app_now()
  where id = m.id returning * into m;
  perform private.log(m.id, 'no_show', case when nullif(trim(p_note), '') is null then 'log_no_show' else 'log_no_show_note' end,
    jsonb_build_object('note', trim(p_note), 'step', private.l2('step', 'sales')));
  perform private.alert(m.sales_id, m.id, 'no_show', 'alert_no_show', jsonb_build_object('name', private.full_name(m)), 'no_show:' || m.id || ':' || m.no_shows);
  if m.no_shows >= (private.settings()).no_show_limit then
    perform private.alert_admins(m.id, 'no_show', 'alert_no_show_admin', jsonb_build_object('name', private.full_name(m), 'n', m.no_shows), 'no_show:' || m.id || ':' || m.no_shows);
  end if;
end $$;

/** Sends the follow-up email: the recording link (or, with a reason, the feedback form alone). */
create function public.send_recording(p_member bigint, p_link text, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'send_recording');
  hours int := (private.settings()).link_hours;
begin
  if nullif(trim(p_link), '') is null and nullif(trim(p_reason), '') is null then
    raise exception 'Paste the recording link, or say why there is none.' using hint = 'need_recording';
  end if;
  update public.members set recording_link = nullif(trim(p_link), ''), recording_sent_at = private.app_now(),
    link_expires_at = private.app_now() + make_interval(hours => hours)
  where id = m.id;
  perform private.log(m.id, case when nullif(trim(p_link), '') is null then 'recording' else 'recording_sent' end,
    case when nullif(trim(p_link), '') is null then 'log_feedback_only' else 'log_recording_sent' end,
    jsonb_build_object('reason', trim(p_reason), 'hours', hours));
  perform private.queue('email', jsonb_build_object('member_id', m.id, 'template', 'follow_up'), 'follow_up:' || m.id || ':' || private.now_key());
end $$;

/** Admin only: more time on the customer's link (choices in Settings → Timing). Reopens a Closed one. */
create function public.extend_link(p_member bigint, p_hours int) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'extend_link');
begin
  if not p_hours = any ((private.settings()).extend_hours) then raise exception 'Pick one of the extend choices.' using hint = 'pick_extend'; end if;
  -- A rated member stays Closed; one closed by the clock opens again until the new end.
  update public.members set stage = case when rating is null then 'recording'::public.member_stage else stage end,
    link_expires_at = greatest(private.app_now(), link_expires_at) + make_interval(hours => p_hours)
  where id = m.id;
  perform private.log(m.id, 'link_extended', 'log_link_extended', jsonb_build_object('hours', p_hours));
  perform private.queue('email', jsonb_build_object('member_id', m.id, 'template', 'link_extended'), 'link_extended:' || m.id || ':' || private.now_key());
end $$;

create function public.cancel_member(p_member bigint, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'cancel');
begin
  if nullif(trim(p_reason), '') is null then raise exception 'Write why it is cancelled.' using hint = 'need_cancel_reason'; end if;
  update public.members set outcome = 'cancelled', outcome_reason = trim(p_reason), holder_since = private.app_now() where id = m.id;
  perform private.log(m.id, 'cancelled', 'log_cancelled', jsonb_build_object('reason', trim(p_reason)));
  perform private.alert(m.sales_id, m.id, 'cancelled', 'alert_cancelled', jsonb_build_object('name', private.full_name(m), 'reason', trim(p_reason)), 'cancelled:' || m.id);
  perform private.alert_admins(m.id, 'cancelled', 'alert_cancelled', jsonb_build_object('name', private.full_name(m), 'reason', trim(p_reason)), 'cancelled:' || m.id);
  if m.session_at is not null then perform private.sync_calendar(m.id, 'session_cancelled'); end if;
end $$;

-- ── The Admin's picker, and notes ──────────────────────────────────────────

/**
 * Everyone who could hold a role on a member, free first, each with a short reason. Onboarding is
 * judged at the member's session time; the others at today.
 */
create function public.person_options(p_member bigint, p_role public.team_role)
returns table (id uuid, name text, free boolean, reason text, open_count int)
language plpgsql stable security definer set search_path = '' as $$
declare
  m public.members;
begin
  if not private.is_admin() then raise exception 'Only the Admin changes people.' using errcode = '42501'; end if;
  select * into m from public.members where members.id = p_member;
  return query
  select p.id, p.name, x.why is null, coalesce(x.why, 'free:' || private.open_count(p.id, p_role)),
    private.open_count(p.id, p_role)
  from public.profiles p
  cross join lateral (select case
    when p_role = 'onboarding' and m.session_at is not null then private.busy_reason(p.id, m.session_at, m.session_ends_at, m.id)
    when not p.active then 'inactive'
    when private.leave_until(p.id, private.today()) is not null then 'leave:' || private.leave_until(p.id, private.today())
    when p_role <> 'sales' and private.open_count(p.id, p_role) >= (private.settings()).max_open_members
      then 'full:' || private.open_count(p.id, p_role)
  end as why) x
  where p.role = p_role
  order by x.why is not null, private.open_count(p.id, p_role), p.name;
end $$;

/** Admin only: puts someone else on a member. A busy person is allowed (the screen warns first). */
create function public.change_person(p_member bigint, p_role public.team_role, p_person uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
begin
  perform pg_advisory_xact_lock(1);
  m := private.load(p_member, 'change_person');
  if not exists (select 1 from public.profiles where id = p_person and role = p_role and active) then
    raise exception 'Pick an active % for this.', private.label('role', p_role::text)
      using hint = 'pick_active_role', detail = jsonb_build_object('role', private.label('role', p_role::text), 'role_ar', private.label_ar('role', p_role::text))::text;
  end if;
  if p_role = 'account' and m.account_created_at is not null then
    raise exception 'The CODEIT account already exists, so the Account Member can’t change.' using hint = 'account_person_locked';
  end if;
  perform private.assign(m.id, p_role, p_person, false);
  if p_role = 'onboarding' then perform private.sync_calendar(m.id, null); end if;
end $$;

/** A note on a member. Everyone on it hears, except the writer. */
create function public.add_note(p_member bigint, p_text text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members := private.load(p_member, 'note');
  note_id bigint;
  who uuid;
begin
  if nullif(trim(p_text), '') is null then raise exception 'The note is empty.' using hint = 'note_empty'; end if;
  -- A note stays as typed, in whichever language it was written.
  insert into public.activity (member_id, actor_id, kind, text) values (m.id, auth.uid(), 'note', trim(p_text)) returning id into note_id;
  foreach who in array array[m.sales_id, m.account_person_id, m.integration_id, m.onboarding_id] loop
    perform private.alert(who, m.id, 'note', 'alert_note',
      jsonb_build_object('by', private.person_name(auth.uid()), 'name', private.full_name(m)), 'note:' || note_id);
  end loop;
end $$;

-- ── The calendar ───────────────────────────────────────────────────────────

/**
 * What goes on this person's calendar between two days. Sessions show to everyone on the member.
 * The other steps' dated work shows to whoever does it: Sales sees Transfer due, each file still to
 * come (its document key in `detail`) and the hardware's arrival; the Account Member the account to
 * create by Transfer; the Integration Person the integration due date; the Onboarding Member the
 * setup checklist due date. Leave shows to the person on leave. The Admin sees all of it.
 * `person_id` is whose item it is (null for a session nobody is picked for yet). `p_all` adds every
 * other session too (the Onboarding Sessions view; every team member may read every member).
 */
create function public.calendar_items(p_from date, p_to date, p_all boolean default false)
returns table (kind text, member_id bigint, code text, title text, sub text, day date, ends_day date,
  starts_at timestamptz, ends_at timestamptz, person_id uuid, status text, meet_link text, detail text)
language sql stable security definer set search_path = '' as $$
  with me as (select auth.uid() as id, private.my_role() as role),
  mine as (
    select m.* from public.members m, me
    where me.role is not null and m.outcome is null
      and (me.role = 'admin' or me.id in (m.sales_id, m.account_person_id, m.integration_id, m.onboarding_id))
  )
  select 'session', v.id, v.code, private.full_name(v), v.company, private.riyadh_day(v.session_at), null::date,
    v.session_at, v.session_ends_at, v.onboarding_id, v.stage::text, v.meet_link, null
  from public.members v, me
  where me.role is not null and v.outcome is null and v.session_at is not null
    and private.riyadh_day(v.session_at) between p_from and p_to
    and (p_all or v.id in (select id from mine))
  union all
  select 'integration_due', v.id, v.code, private.full_name(v), v.company, private.integration_due(v), null,
    null, null, v.integration_id, v.stage::text, null, null
  from mine v, me
  where v.integration_done_at is null and v.stage in ('collecting', 'integration')
    and private.integration_due(v) between p_from and p_to
    and (me.role = 'admin' or me.id = v.integration_id)
  union all
  select 'setup_due', v.id, v.code, private.full_name(v), v.company, private.setup_due(v), null,
    null, null, v.onboarding_id, v.stage::text, null, null
  from mine v, me
  where v.setup_done_at is null and v.stage in ('collecting', 'integration', 'setup')
    and private.setup_due(v) between p_from and p_to
    and (me.role = 'admin' or me.id = v.onboarding_id)
  union all
  select 'transfer_due', v.id, v.code, private.full_name(v), v.company, private.transfer_deadline(v), null,
    null, null, v.sales_id, v.stage::text, null, null
  from mine v, me
  where v.stage = 'collecting' and private.transfer_deadline(v) between p_from and p_to
    and (me.role = 'admin' or me.id = v.sales_id)
  union all
  select 'account_due', v.id, v.code, private.full_name(v), v.company, private.transfer_deadline(v), null,
    null, null, v.account_person_id, v.stage::text, null, null
  from mine v, me
  where v.stage = 'collecting' and v.account_created_at is null and private.transfer_deadline(v) between p_from and p_to
    and (me.role = 'admin' or me.id = v.account_person_id)
  union all
  select 'files_due', v.id, v.code, private.full_name(v), v.company, e.value::date, null,
    null, null, v.sales_id, v.stage::text, null, e.key
  from mine v cross join me cross join jsonb_each_text(v.doc_due) e
  where v.stage = 'collecting' and e.value::date between p_from and p_to
    and e.key not in (select d.kind from public.documents d where d.member_id = v.id)
    and (me.role = 'admin' or me.id = v.sales_id)
  union all
  select 'hardware_due', v.id, v.code, private.full_name(v), v.company, (v.hardware ->> 'date')::date, null,
    null, null, v.sales_id, v.stage::text, null, null
  from mine v, me
  where v.stage = 'collecting' and v.hardware ? 'date' and not coalesce((v.hardware ->> 'delivered')::boolean, false)
    and (v.hardware ->> 'date')::date between p_from and p_to
    and (me.role = 'admin' or me.id = v.sales_id)
  union all
  select 'leave', null, null, p.name, null, l.starts_on, l.ends_on, null, null, l.person_id, null, null, null
  from public.leave l
  join public.profiles p on p.id = l.person_id
  cross join me
  where me.role is not null and (me.role = 'admin' or l.person_id = me.id)
    and l.starts_on <= p_to and l.ends_on >= p_from
$$;

-- ── The team (Admin; leave and hours also by the person themselves) ────────

/** The Team page: each person with their status, open members, sessions this week and leave. */
create function public.team_overview()
returns table (id uuid, name text, email text, phone text, role public.team_role, active boolean,
  must_change_password boolean, hours jsonb, team_note text, on_leave_until date, next_leave_from date, open_count int,
  sessions_week int, locked_until timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Only the Admin sees the team page.' using errcode = '42501'; end if;
  return query
  select p.id, p.name, p.email, p.phone, p.role, p.active, p.must_change_password, p.hours, p.team_note,
    private.leave_until(p.id, private.today()),
    (select min(l.starts_on) from public.leave l where l.person_id = p.id and l.starts_on > private.today()),
    (select count(*)::int from public.members m
     where m.outcome is null and m.stage <> 'closed'
       and p.id in (m.sales_id, m.account_person_id, m.integration_id, m.onboarding_id)),
    private.week_sessions(p.id, private.today()),
    case when p.locked_until > now() then p.locked_until end
  from public.profiles p
  order by p.active desc, p.role, p.name;
end $$;

-- ── Sign-in lockout ─────────────────────────────────────────────────────────

/** Until when this email is locked out after too many wrong passwords, or null. The sign-in page asks first. */
create function public.sign_in_locked(p_email text) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select locked_until from public.profiles where lower(email) = lower(trim(p_email)) and locked_until > now()
$$;

/**
 * The sign-in page reports a wrong password. After the Admin's number of tries within the Admin's
 * window, the person is locked out for the Admin's minutes (Supabase's own ban, so even a sign-in
 * made another way is refused) and the Admins are told. Returns until when, or null.
 * ponytail: a caller who skips this report and calls Supabase's sign-in directly isn't counted;
 * Supabase's own per-address limit covers that. A password-attempt hook (Team plan) would close it.
 */
create function public.sign_in_failed(p_email text) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  s public.settings := private.settings();
  p public.profiles;
  tries int;
  until_ timestamptz;
begin
  select * into p from public.profiles where lower(email) = lower(trim(p_email)) and active;
  if not found then return null; end if;   -- nobody on the team has it: nothing to count
  if p.locked_until > now() then return p.locked_until; end if;
  delete from private.sign_in_tries where at < now() - make_interval(mins => s.lock_window_minutes);
  insert into private.sign_in_tries (email) values (lower(p.email));
  select count(*) into tries from private.sign_in_tries where email = lower(p.email);
  if tries < s.lock_tries then return null; end if;
  until_ := now() + make_interval(mins => s.lock_minutes);
  update public.profiles set locked_until = until_ where id = p.id;
  update auth.users set banned_until = until_ where id = p.id;
  delete from private.sign_in_tries where email = lower(p.email);
  perform private.alert_admins(null, 'locked', 'alert_locked',
    jsonb_build_object('name', p.name, 'n', tries, 'time', to_char(until_ at time zone 'Asia/Riyadh', 'HH24:MI')),
    'locked:' || p.id || ':' || extract(epoch from until_)::bigint);
  return until_;
end $$;

/** After a good sign-in, the wrong tries before it are forgotten. */
create function public.sign_in_ok() returns void
language sql security definer set search_path = '' as $$
  delete from private.sign_in_tries where email = (select lower(email) from public.profiles where id = auth.uid())
$$;

/** Admin: lets a locked-out person try again now. A deactivated person stays off. */
create function public.unlock_person(p_person uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  p public.profiles;
begin
  if not private.is_admin() then raise exception 'Only the Admin changes people.' using errcode = '42501'; end if;
  select * into p from public.profiles where id = p_person;
  if not found or not p.active then raise exception 'Turn this person back on first.' using hint = 'person_off'; end if;
  update public.profiles set locked_until = null where id = p.id;
  update auth.users set banned_until = null where id = p.id;   -- active, so the only ban is the lock's
  delete from private.sign_in_tries where email = lower(p.email);
end $$;

/** Refuses taking away the last active Admin. */
create function private.keep_an_admin(p_person uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if exists (select 1 from public.profiles where id = p_person and role = 'admin')
     and (select count(*) from public.profiles where role = 'admin' and active) <= 1 then
    raise exception 'There must be at least one active Admin.' using hint = 'last_admin';
  end if;
end $$;

create function public.set_role(p_person uuid, p_role public.team_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Only the Admin changes roles.' using errcode = '42501'; end if;
  if p_role <> 'admin' then perform private.keep_an_admin(p_person); end if;
  update public.profiles set role = p_role where id = p_person;
end $$;

/** Called by the admin-users function when someone is turned off: never the last Admin. */
create function public.can_deactivate(p_person uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.keep_an_admin(p_person);
end $$;

/** Weekly hours (7 × {on, from, to}, Sunday first), or null for office hours. Your own, or anyone's for the Admin. */
create function public.set_hours(p_person uuid, p_hours jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (private.is_admin() or (private.my_role() is not null and p_person = auth.uid())) then
    raise exception 'You can only change your own hours.' using errcode = '42501';
  end if;
  if p_hours is not null and (jsonb_typeof(p_hours) <> 'array' or jsonb_array_length(p_hours) <> 7) then
    raise exception 'Hours need all seven days.' using hint = 'seven_days';
  end if;
  perform pg_advisory_xact_lock(1);
  update public.profiles set hours = p_hours where id = p_person;
end $$;

/** The short note the team sees under someone's hours. Your own, or anyone's for the Admin. */
create function public.set_team_note(p_person uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (private.is_admin() or (private.my_role() is not null and p_person = auth.uid())) then
    raise exception 'You can only change your own note.' using errcode = '42501';
  end if;
  update public.profiles set team_note = nullif(trim(p_note), '') where id = p_person;
end $$;

/**
 * Leave from one day to another. Your own, or anyone's for the Admin. Never blocked: when the
 * person has open members or sessions in those days, the Admin is told and can move them.
 * Returns { open, sessions }.
 */
create function public.add_leave(p_person uuid, p_from date, p_to date) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  leave_id bigint;
  open_ int;
  sessions int;
  who text := private.person_name(p_person);
begin
  if not (private.is_admin() or (private.my_role() is not null and p_person = auth.uid())) then
    raise exception 'You can only add your own leave.' using errcode = '42501';
  end if;
  if p_to < p_from then raise exception 'The leave ends before it starts.' using hint = 'leave_backwards'; end if;
  perform pg_advisory_xact_lock(1);
  insert into public.leave (person_id, starts_on, ends_on, created_by) values (p_person, p_from, p_to, auth.uid())
  returning id into leave_id;

  select count(*) into open_ from public.members m
  where m.outcome is null and m.stage <> 'closed' and p_person in (m.sales_id, m.account_person_id, m.integration_id, m.onboarding_id);
  select count(*) into sessions from public.members m
  where m.onboarding_id = p_person and m.outcome is null and m.session_at is not null
    and private.riyadh_day(m.session_at) between p_from and p_to;

  if sessions > 0 then
    perform private.alert_admins(null, 'leave', 'alert_leave_sessions',
      jsonb_build_object('who', who, 'n', sessions, 'sessions', sessions || ' session' || case when sessions = 1 then '' else 's' end), 'leave:' || leave_id || ':sessions');
  elsif open_ > 0 then
    perform private.alert_admins(null, 'leave', 'alert_leave_open',
      jsonb_build_object('who', who, 'date', private.d2(p_from), 'n', open_, 'members', open_ || ' open member' || case when open_ = 1 then '' else 's' end), 'leave:' || leave_id || ':open');
  end if;
  return jsonb_build_object('open', open_, 'sessions', sessions);
end $$;

create function public.remove_leave(p_leave bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  owner uuid;
begin
  select person_id into owner from public.leave where id = p_leave;
  if not (private.is_admin() or (private.my_role() is not null and owner = auth.uid())) then
    raise exception 'You can only remove your own leave.' using errcode = '42501';
  end if;
  delete from public.leave where id = p_leave;
end $$;

/**
 * Moves everyone's open members off one person: to `p_to`, or (null) picked again automatically
 * for each member. Sales members always need a named person. Returns how many moved.
 */
create function public.move_members(p_from uuid, p_to uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  r public.team_role;
  m public.members;
  pick uuid;
  moved int := 0;
begin
  if not private.is_admin() then raise exception 'Only the Admin moves members.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(1);
  select role into r from public.profiles where id = p_from;
  if r = 'admin' then raise exception 'The Admin holds no members to move.' using hint = 'admin_no_members'; end if;
  if p_to is null and r = 'sales' then raise exception 'Pick the Sales Member who takes them.' using hint = 'pick_sales_taker'; end if;
  if p_to is not null and not exists (select 1 from public.profiles where id = p_to and role = r and active) then
    raise exception 'Pick an active % to move them to.', private.label('role', r::text)
      using hint = 'pick_active_role', detail = jsonb_build_object('role', private.label('role', r::text), 'role_ar', private.label_ar('role', r::text))::text;
  end if;

  for m in
    select * from public.members
    where outcome is null and stage <> 'closed'
      and p_from = case r when 'sales' then sales_id when 'account' then account_person_id
                          when 'integration' then integration_id else onboarding_id end
    order by id
    for update
  loop
    pick := coalesce(p_to, case
      when r = 'onboarding' and m.session_at is not null then private.pick_onboarding(m.session_at, m.session_ends_at, m.id, p_from)
      when r = 'onboarding' then null
      else private.pick_least_busy(r, p_from) end);
    perform private.assign(m.id, r, pick, p_to is null);
    if pick is null then
      perform private.alert_admins(m.id, 'nobody_free', 'alert_nobody_move', jsonb_build_object('name', private.full_name(m), 'from', private.person_name(p_from)), 'nobody_free:move:' || m.id || ':' || private.now_key());
    elsif r = 'onboarding' then
      perform private.sync_calendar(m.id, null);
    end if;
    moved := moved + 1;
  end loop;
  return moved;
end $$;

-- ── Settings ───────────────────────────────────────────────────────────────

/** Your own name, phone, photo and whether alerts also come by email. */
create function public.update_my_profile(p_name text, p_phone text, p_email_alerts boolean, p_avatar_path text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if private.my_role() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Your name can’t be empty.' using hint = 'name_empty'; end if;
  if p_avatar_path is not null and p_avatar_path not like auth.uid()::text || '/%' then
    raise exception 'That photo isn’t in your folder.' using hint = 'photo_not_yours';
  end if;
  update public.profiles set name = trim(p_name), phone = nullif(trim(p_phone), ''), email_alerts = p_email_alerts,
    avatar_path = p_avatar_path
  where id = auth.uid();
end $$;

/** Your own language for the app, your alerts and team emails (the sidebar's EN | ع). */
create function public.set_my_language(p_language text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_language not in ('en', 'ar') then raise exception 'Pick English or Arabic.'; end if;
  update public.profiles set language = p_language where id = auth.uid();
end $$;

/** Settings → History: one row per change, skipped when nothing really changed. */
create function private.log_setting(p_area text, p_item text, p_before jsonb, p_after jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.settings_log (actor_id, area, item, before, after)
  select auth.uid(), p_area, p_item, p_before, p_after
  where p_before is distinct from p_after
$$;

/** Admin only: change any of the settings; the keys sent are the only ones touched. */
create function public.update_settings(p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  bad text;
  editable text[] := array['buffer_days', 'integration_due_days', 'setup_due_days', 'session_minutes', 'gap_minutes',
    'slot_step_minutes', 'book_ahead_days', 'link_hours', 'reminder_hours', 'recording_alert_hours',
    'feedback_reminder_hours', 'low_rating_max', 'extend_hours', 'alerts_keep_days', 'session_hours',
    'max_open_members', 'files_ready_days', 'no_show_limit', 'phone_min_digits', 'phone_prefix', 'due_soon_days',
    'ahead_days', 'recent_days', 'lock_tries', 'lock_window_minutes', 'lock_minutes', 'emails_off',
    'office_hours', 'company', 'max_upload_mb'];
  old public.settings;
  x public.settings;
begin
  if not private.is_admin() then raise exception 'Only the Admin changes settings.' using errcode = '42501'; end if;
  select k into bad from jsonb_object_keys(p) k where k <> all (editable) limit 1;
  if bad is not null then raise exception 'Unknown setting: %', bad; end if;
  if p ? 'office_hours' and (jsonb_typeof(p -> 'office_hours') <> 'array' or jsonb_array_length(p -> 'office_hours') <> 7) then
    raise exception 'Office hours need all seven days.' using hint = 'seven_days';
  end if;

  select * into old from public.settings for update;
  -- Company is merged, so a screen can send just the fields it shows.
  if p ? 'company' then p := jsonb_set(p, '{company}', old.company || (p -> 'company')); end if;
  x := jsonb_populate_record(old, p);

  update public.settings s set
    buffer_days = x.buffer_days, integration_due_days = x.integration_due_days, setup_due_days = x.setup_due_days,
    session_minutes = x.session_minutes, gap_minutes = x.gap_minutes, slot_step_minutes = x.slot_step_minutes,
    book_ahead_days = x.book_ahead_days, link_hours = x.link_hours, reminder_hours = x.reminder_hours,
    recording_alert_hours = x.recording_alert_hours, feedback_reminder_hours = x.feedback_reminder_hours,
    low_rating_max = x.low_rating_max, extend_hours = x.extend_hours, alerts_keep_days = x.alerts_keep_days,
    session_hours = x.session_hours, max_open_members = x.max_open_members, files_ready_days = x.files_ready_days,
    no_show_limit = x.no_show_limit, phone_min_digits = x.phone_min_digits, phone_prefix = x.phone_prefix,
    due_soon_days = x.due_soon_days, ahead_days = x.ahead_days, recent_days = x.recent_days,
    lock_tries = x.lock_tries, lock_window_minutes = x.lock_window_minutes, lock_minutes = x.lock_minutes,
    emails_off = x.emails_off, office_hours = x.office_hours, company = x.company,
    updated_at = now(), updated_by = auth.uid()
  where s.id; -- the one settings row (Supabase refuses an UPDATE with no WHERE)

  perform private.log_setting('settings', k, to_jsonb(old) -> k, to_jsonb(x) -> k) from jsonb_object_keys(p) k;
exception
  when check_violation then
    raise exception 'That value isn’t allowed for %.',
      replace(coalesce(substring(sqlerrm from 'settings_(\w+)_check'), 'one of the settings'), '_', ' ') using hint = 'value_not_allowed';
  when invalid_text_representation or datatype_mismatch then
    raise exception 'Use whole numbers.' using hint = 'whole_numbers';
end $$;

/** Admin only: a public holiday (not a working day). Returns how many sessions are already on it. */
create function public.set_holiday(p_day date, p_name text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  sessions int;
  was text := (select name from public.holidays where day = p_day);
begin
  if not private.is_admin() then raise exception 'Only the Admin changes holidays.' using errcode = '42501'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Name the holiday.' using hint = 'name_holiday'; end if;
  insert into public.holidays (day, name) values (p_day, trim(p_name))
  on conflict (day) do update set name = excluded.name;
  perform private.log_setting('holiday', p_day::text, to_jsonb(was), to_jsonb(trim(p_name)));
  select count(*) into sessions from public.members
  where outcome is null and session_at is not null and private.riyadh_day(session_at) = p_day;
  if sessions > 0 then
    perform private.alert_admins(null, 'holiday', 'alert_holiday', jsonb_build_object('n', sessions,
      'sessions', sessions || ' session' || case when sessions = 1 then ' is' else 's are' end, 'holiday', trim(p_name), 'date', private.d2(p_day)), 'holiday:' || p_day);
  end if;
  return sessions;
end $$;

create function public.remove_holiday(p_day date) returns void
language plpgsql security definer set search_path = '' as $$
declare
  was text;
begin
  if not private.is_admin() then raise exception 'Only the Admin changes holidays.' using errcode = '42501'; end if;
  delete from public.holidays where day = p_day returning name into was;
  if found then perform private.log_setting('holiday', p_day::text, to_jsonb(was), null); end if;
end $$;

/**
 * Admin only: add or change one option in a list (Settings → Lists). Roles and steps are fixed
 * by the code, so only their words can change (and a role's portal and team names).
 */
create function public.save_option(p_list text, p_key text, p_label text, p_label_ar text, p_active boolean, p_sort int, p_meta jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  fixed boolean := p_list in ('role', 'step');
  was jsonb := (select to_jsonb(o) - 'list' - 'key' from public.options o where list = p_list and key = p_key);
begin
  if not private.is_admin() then raise exception 'Only the Admin changes lists.' using errcode = '42501'; end if;
  if nullif(trim(p_label), '') is null then raise exception 'The option needs a name.' using hint = 'option_name'; end if;
  if p_key !~ '^[A-Za-z0-9_+-]+$' then raise exception 'Keys use letters, numbers, - and _ only.' using hint = 'option_key'; end if;
  if fixed then
    update public.options set label = trim(p_label), label_ar = nullif(trim(p_label_ar), ''),
      meta = case when p_list = 'role'
        then meta || jsonb_strip_nulls(jsonb_build_object('portal', p_meta ->> 'portal', 'portal_ar', p_meta ->> 'portal_ar',
          'team', p_meta ->> 'team', 'team_ar', p_meta ->> 'team_ar'))
        else meta end
    where list = p_list and key = p_key;
    if not found then raise exception 'Roles and steps are fixed; only their names can change.' using hint = 'fixed_list'; end if;
  else
    insert into public.options (list, key, label, label_ar, active, sort, meta)
    values (p_list, p_key, trim(p_label), nullif(trim(p_label_ar), ''), coalesce(p_active, true), coalesce(p_sort, 0), coalesce(p_meta, '{}'))
    on conflict (list, key) do update set label = excluded.label, label_ar = excluded.label_ar,
      active = excluded.active, sort = excluded.sort, meta = excluded.meta;
  end if;
  perform private.log_setting('option', p_list || '/' || p_key, was,
    (select to_jsonb(o) - 'list' - 'key' from public.options o where list = p_list and key = p_key));
end $$;

/** Admin only: the English and Arabic wording of one email or customer-page text. */
create function public.save_text(p_key text, p_en text, p_ar text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  was jsonb := (select to_jsonb(t) - 'key' from public.texts t where key = p_key);
begin
  if not private.is_admin() then raise exception 'Only the Admin changes the wording.' using errcode = '42501'; end if;
  update public.texts set en = p_en, ar = p_ar where key = p_key;
  if not found then raise exception 'Unknown text: %', p_key; end if;
  perform private.log_setting('text', p_key, was, jsonb_build_object('en', p_en, 'ar', p_ar));
end $$;

/**
 * Admin: one email to their own address, as saved now, filled with a sample member (Settings →
 * Emails & texts → Send a test to me). It goes even when that email is turned off.
 */
create function public.send_test_email(p_template text, p_lang text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles;
begin
  if not private.is_admin() then raise exception 'Only the Admin sends test emails.' using errcode = '42501'; end if;
  if not exists (select 1 from public.texts where key = p_template || '_subject') then raise exception 'Unknown email: %', p_template; end if;
  select * into me from public.profiles where id = auth.uid();
  perform private.queue('email', jsonb_build_object('template', p_template, 'test', true,
    'lang', case when p_lang = 'ar' then 'ar' else 'en' end, 'to', me.email, 'name', split_part(me.name, ' ', 1)),
    'test:' || p_template || ':' || auth.uid() || ':' || extract(epoch from clock_timestamp()));
end $$;

-- ── The customer's CODEIT login, and how the session went ─────────────────

/**
 * A new password for the customer's CODEIT login, while the account isn't made yet. Whoever can
 * edit the member or create its account may ask. The password itself is never logged.
 */
create function public.new_codeit_password(p_member bigint) returns text
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
  pw text := private.new_password();
begin
  select * into m from public.members where id = p_member for update;
  if not found or not (private.can('edit', m) or private.can('set_account', m)) then
    raise exception 'You can’t do that on this member right now.' using errcode = '42501';
  end if;
  if m.account_created_at is not null then
    raise exception 'The CODEIT account already exists, so its password can’t change here.' using hint = 'password_locked';
  end if;
  update public.members set codeit_password = pw where id = m.id;
  perform private.log(m.id, 'account', 'log_new_password', jsonb_build_object('product', private.product()));
  return pw;
end $$;

/** The Onboarding Member's own words on how the session went, once it has happened. */
create function public.save_onboarding_feedback(p_member bigint, p_text text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.members;
begin
  select * into m from public.members where id = p_member for update;
  if not found or not (private.is_admin() or (private.my_role() is not null and m.onboarding_id = auth.uid())) then
    raise exception 'Only the Onboarding Member on this member writes its feedback.' using errcode = '42501';
  end if;
  if m.completed_at is null then raise exception 'Feedback is written after the session.' using hint = 'feedback_after_session'; end if;
  update public.members set onboarding_feedback = nullif(trim(p_text), '') where id = m.id;
  perform private.log(m.id, 'feedback', 'log_feedback_saved');
end $$;

-- ── The email service key (Settings → Company → Email sending) ─────────────

/**
 * Admin: the SendGrid key, kept encrypted in Vault. It can be replaced or removed (empty) but never
 * read back in the browser; History notes that it changed, never the key itself.
 */
create function public.set_email_key(p_key text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  had boolean := exists (select 1 from vault.secrets where name = 'sendgrid_api_key');
  id_ uuid := (select id from vault.secrets where name = 'sendgrid_api_key');
begin
  if not private.is_admin() then raise exception 'Only the Admin changes the settings.' using errcode = '42501'; end if;
  if nullif(trim(p_key), '') is null then
    delete from vault.secrets where id = id_;
  elsif had then
    perform vault.update_secret(id_, trim(p_key));
  else
    perform vault.create_secret(trim(p_key), 'sendgrid_api_key', 'SendGrid key for customer and team emails');
  end if;
  perform private.log_setting('settings', 'email_key', to_jsonb(case when had then 'set' else 'none' end),
    to_jsonb(case when nullif(trim(p_key), '') is null then 'none' when had then 'replaced' else 'set' end));
end $$;

/** Admin: whether a key is set, so the Company card can say "Sending". */
create function public.email_key_set() returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Only the Admin sees the settings.' using errcode = '42501'; end if;
  return exists (select 1 from vault.secrets where name = 'sendgrid_api_key');
end $$;

/** The worker and admin-users (service key only): the key itself, or null. */
create function public.email_key() returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'sendgrid_api_key'
$$;

-- ── Who can call what ──────────────────────────────────────────────────────

grant execute on function
  public.bookable_days(date, bigint), public.open_times(date, bigint), public.book_session(bigint, timestamptz),
  public.add_member(jsonb), public.update_member(bigint, jsonb), public.set_account(bigint, text),
  public.unset_account(bigint), public.set_account_check(bigint, text, boolean), public.set_customer_signed_in(bigint, boolean), public.join_session(bigint),
  public.set_hardware(bigint, jsonb),
  public.attach_document(bigint, text, text, text, bigint), public.remove_document(bigint, text),
  public.transfer(bigint), public.mark_lost(bigint, text, text), public.reopen(bigint),
  public.set_integration_check(bigint, text, jsonb), public.hand_to_onboarding(bigint), public.send_back(bigint, text),
  public.set_setup_check(bigint, text, boolean), public.complete_session(bigint), public.no_show(bigint, text),
  public.send_recording(bigint, text, text), public.extend_link(bigint, int), public.cancel_member(bigint, text),
  public.person_options(bigint, public.team_role), public.change_person(bigint, public.team_role, uuid),
  public.add_note(bigint, text), public.calendar_items(date, date, boolean),
  public.team_overview(), public.set_role(uuid, public.team_role), public.set_hours(uuid, jsonb),
  public.add_leave(uuid, date, date), public.remove_leave(bigint), public.move_members(uuid, uuid),
  public.update_my_profile(text, text, boolean, text), public.set_my_language(text), public.update_settings(jsonb),
  public.set_holiday(date, text), public.remove_holiday(date),
  public.save_option(text, text, text, text, boolean, int, jsonb), public.save_text(text, text, text), public.send_test_email(text, text),
  public.set_team_note(uuid, text), public.new_codeit_password(bigint), public.save_onboarding_feedback(bigint, text),
  public.sign_in_ok(), public.unlock_person(uuid), public.set_email_key(text), public.email_key_set()
  to authenticated;
-- Only the server functions read the email key (with the service key).
grant execute on function public.email_key() to service_role;
-- The sign-in page asks and reports before anyone is signed in.
grant execute on function public.sign_in_locked(text), public.sign_in_failed(text) to anon, authenticated;
-- Only the admin-users server function calls this (with the service key).
grant execute on function public.can_deactivate(uuid) to service_role;
