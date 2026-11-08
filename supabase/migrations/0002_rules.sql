-- The rules every screen and every action agree on: working days, who is free, who gets picked,
-- the ready check, the deadlines, who holds a member now, and who may do what.
-- All in `private`, so the API can't call them directly. Every clock read goes through
-- private.app_now(), so tests can pin the time.

-- ── Time ───────────────────────────────────────────────────────────────────

create function private.settings() returns public.settings
language sql stable security definer set search_path = '' as $$
  select s from public.settings s
$$;

create function private.riyadh_day(t timestamptz) returns date
language sql immutable set search_path = '' as $$
  select (t at time zone 'Asia/Riyadh')::date
$$;

create function private.riyadh_time(t timestamptz) returns time
language sql immutable set search_path = '' as $$
  select (t at time zone 'Asia/Riyadh')::time
$$;

create function private.today() returns date
language sql stable set search_path = '' as $$
  select private.riyadh_day(private.app_now())
$$;

/** A day the office is open (Settings → Working week) that isn't a public holiday. */
create function private.is_working_day(d date) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((s.office_hours -> extract(dow from d)::int ->> 'on')::boolean, false)
     and not exists (select 1 from public.holidays h where h.day = d)
  from public.settings s
$$;

/** `n` working days after `d` (before it when n is negative). */
create function private.add_working_days(d date, n int) returns date
language plpgsql stable security definer set search_path = '' as $$
declare
  cur date := d;
  left_ int := abs(n);
  guard int := 0;
begin
  while left_ > 0 loop
    cur := cur + sign(n)::int;
    if private.is_working_day(cur) then left_ := left_ - 1; end if;
    guard := guard + 1;
    if guard > 3660 then
      raise exception 'No working days are set. Check Settings → Working week.' using hint = 'no_working_days';
    end if;
  end loop;
  return cur;
end $$;

create function private.working_days_before(d date, n int) returns date
language sql stable set search_path = '' as $$
  select private.add_working_days(d, -n)
$$;

-- ── People: hours, leave, busy ─────────────────────────────────────────────

/** A person's hours on a day: their own, or the office hours. */
create function private.hours_on(p_person uuid, d date) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(p.hours, s.office_hours) -> extract(dow from d)::int
  from public.profiles p, public.settings s
  where p.id = p_person
$$;

/** The last day of the leave that covers `d`, or null when they aren't on leave. */
create function private.leave_until(p_person uuid, d date) returns date
language sql stable security definer set search_path = '' as $$
  select max(l.ends_on) from public.leave l
  where l.person_id = p_person and d between l.starts_on and l.ends_on
$$;

/**
 * Why a person can't take a session from p_at to p_ends, or null when they are free, as a short code
 * the screen words in the reader's language: inactive, not_signed_in, full:<n>, leave:<day>,
 * not_working_day, outside_hours, session:<HH:MM>. `p_except` is the member being booked, so its
 * own session never blocks itself.
 * Someone still on their temporary password isn't picked: they haven't signed in yet.
 */
create function private.busy_reason(p_person uuid, p_at timestamptz, p_ends timestamptz, p_except bigint)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  p public.profiles;
  gap interval := make_interval(mins => (private.settings()).gap_minutes);
  d date := private.riyadh_day(p_at);
  h jsonb;
  until_ date;
  clash timestamptz;
begin
  select * into p from public.profiles where id = p_person;
  if not found or not p.active then return 'inactive'; end if;
  if p.must_change_password then return 'not_signed_in'; end if;
  if (select count(*) from public.members m
      where m.onboarding_id = p_person and m.outcome is null and m.stage in ('setup', 'session', 'recording')
        and m.id is distinct from p_except) >= (private.settings()).max_open_members then
    return 'full:' || (private.settings()).max_open_members;
  end if;
  until_ := private.leave_until(p_person, d);
  if until_ is not null then return 'leave:' || until_; end if;
  if not private.is_working_day(d) then return 'not_working_day'; end if;
  h := private.hours_on(p_person, d);
  if not coalesce((h ->> 'on')::boolean, false)
     or private.riyadh_time(p_at) < (h ->> 'from')::time
     or private.riyadh_time(p_ends) > (h ->> 'to')::time then
    return 'outside_hours';
  end if;
  select m.session_at into clash
  from public.members m
  where m.onboarding_id = p_person
    and m.id is distinct from p_except
    and m.outcome is null
    and m.session_at is not null
    and m.stage not in ('recording', 'closed')
    and tstzrange(p_at - gap, p_ends + gap) && tstzrange(m.session_at, m.session_ends_at)
  order by m.session_at
  limit 1;
  if found then return 'session:' || to_char(clash at time zone 'Asia/Riyadh', 'HH24:MI'); end if;
  return null;
end $$;

/**
 * How many more sessions fit at this time: Onboarding Members free then, minus the held
 * sessions (booked, nobody picked yet) that overlap it. Above zero means it can be booked.
 */
create function private.room_at(p_at timestamptz, p_ends timestamptz, p_except bigint) returns int
language sql stable security definer set search_path = '' as $$
  with gap as (select make_interval(mins => gap_minutes) as g from public.settings)
  select
    (select count(*) from public.profiles p
     where p.role = 'onboarding' and private.busy_reason(p.id, p_at, p_ends, p_except) is null)::int
    -
    (select count(*) from public.members m, gap
     where m.onboarding_id is null
       and m.outcome is null
       and m.session_at is not null
       and m.stage not in ('recording', 'closed')
       and m.id is distinct from p_except
       and tstzrange(p_at - gap.g, p_ends + gap.g) && tstzrange(m.session_at, m.session_ends_at))::int
$$;

-- ── Who gets picked ────────────────────────────────────────────────────────

/** A person's open members in a role: what "fewest open" counts. */
create function private.open_count(p_person uuid, p_role public.team_role) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.members m
  where m.outcome is null
    and case p_role
      when 'account' then m.account_person_id = p_person and m.account_created_at is null
      when 'integration' then m.integration_id = p_person and m.stage = 'integration'
      when 'onboarding' then m.onboarding_id = p_person and m.stage in ('setup', 'session', 'recording')
      when 'sales' then m.sales_id = p_person and m.stage = 'collecting'
      else false
    end
$$;

/**
 * Account or Integration: active, signed in, not on leave today, not full, fewest open; tie → waited
 * longest.
 * `p_skip` leaves one person out (the one whose members are being moved).
 */
create function private.pick_least_busy(p_role public.team_role, p_skip uuid default null) returns uuid
language sql stable security definer set search_path = '' as $$
  select p.id from public.profiles p
  where p.role = p_role and p.active and not p.must_change_password
    and p.id is distinct from p_skip
    and private.leave_until(p.id, private.today()) is null
    and private.open_count(p.id, p_role) < (private.settings()).max_open_members
  order by private.open_count(p.id, p_role), p.last_assigned_at nulls first, p.id
  limit 1
$$;

/** Sessions a person has in the Sunday-to-Saturday week around `d`. */
create function private.week_sessions(p_person uuid, d date) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.members m
  where m.onboarding_id = p_person and m.outcome is null and m.session_at is not null
    and private.riyadh_day(m.session_at) between d - extract(dow from d)::int and d - extract(dow from d)::int + 6
$$;

/** Onboarding: free at the time, then fewest sessions that week; tie → waited longest. */
create function private.pick_onboarding(p_at timestamptz, p_ends timestamptz, p_except bigint, p_skip uuid default null) returns uuid
language sql stable security definer set search_path = '' as $$
  select p.id from public.profiles p
  where p.role = 'onboarding' and p.id is distinct from p_skip
    and private.busy_reason(p.id, p_at, p_ends, p_except) is null
  order by private.week_sessions(p.id, private.riyadh_day(p_at)), p.last_assigned_at nulls first, p.id
  limit 1
$$;

-- ── A member's state ───────────────────────────────────────────────────────

/**
 * The documents its business type and integrations need before Transfer (Settings → Required
 * documents: the ones still on and not marked optional). A document's `plans` are the customer
 * types that send it (none listed: every type; an empty list: none), and its `integrations` the
 * integrations that need it.
 */
create function private.required_docs(m public.members) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(o.key order by o.sort), '{}')
  from public.options o
  where o.list = 'document' and o.active and m.plan is not null
    and not coalesce((o.meta ->> 'optional')::boolean, false)
    and (not (o.meta ? 'plans') or (o.meta -> 'plans') ? m.plan
      or (o.meta ? 'integrations' and (o.meta -> 'integrations') ?| m.integrations))
$$;

create function private.required_features(m public.members) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(o.key order by o.sort), '{}')
  from public.options o
  where o.list = 'feature' and o.active and m.plan is not null
    and (not (o.meta ? 'plans') or (o.meta -> 'plans') ? m.plan)
$$;

create function private.integration_due(m public.members) returns date
language sql stable security definer set search_path = '' as $$
  select case when m.session_at is not null and cardinality(m.integrations) > 0
    then private.working_days_before(private.riyadh_day(m.session_at), (private.settings()).integration_due_days) end
$$;

create function private.setup_due(m public.members) returns date
language sql stable security definer set search_path = '' as $$
  select case when m.session_at is not null
    then private.working_days_before(private.riyadh_day(m.session_at), (private.settings()).setup_due_days) end
$$;

/** The last day Sales can press Transfer: the next deadline after them. */
create function private.transfer_deadline(m public.members) returns date
language sql stable security definer set search_path = '' as $$
  select case
    when cardinality(m.integrations) > 0 and m.integration_done_at is null then private.integration_due(m)
    else private.setup_due(m)
  end
$$;

/** Where Transfer (and Hand to Onboarding) send it: the first stage not done yet. */
create function private.next_stage(m public.members) returns public.member_stage
language sql stable set search_path = '' as $$
  select case
    when cardinality(m.integrations) > 0 and m.integration_done_at is null then 'integration'::public.member_stage
    when m.setup_done_at is null then 'setup'::public.member_stage
    else 'session'::public.member_stage
  end
$$;

/** Who has it now: the person it is waiting on, or null (the system, or nobody). */
create function private.holder(m public.members) returns uuid
language sql stable set search_path = '' as $$
  select case
    when m.outcome is not null then null
    when m.stage = 'collecting' then m.sales_id
    when m.stage = 'integration' then m.integration_id
    when m.stage in ('setup', 'session') then m.onboarding_id
    when m.stage = 'recording' and m.recording_sent_at is null then m.onboarding_id
  end
$$;

/**
 * What is late on a member, for the Overview: too late to transfer, integration or setup past
 * their due day, the recording not sent in time, or nobody picked to run the session.
 */
create function private.late_flags(m public.members) returns text[]
language sql stable security definer set search_path = '' as $$
  select array_remove(array[
    case when m.outcome is null and m.stage = 'collecting' and m.session_at is not null
      and private.today() >= private.transfer_deadline(m) then 'transfer' end,
    case when m.outcome is null and m.stage = 'integration' and private.today() > private.integration_due(m) then 'integration' end,
    case when m.outcome is null and m.stage = 'setup' and private.today() > private.setup_due(m) then 'setup' end,
    case when m.outcome is null and m.stage = 'recording' and m.recording_sent_at is null
      and m.completed_at <= private.app_now() - make_interval(hours => (private.settings()).recording_alert_hours) then 'recording' end,
    case when m.outcome is null and m.stage in ('setup', 'session') and m.onboarding_id is null then 'nobody' end
  ], null)
$$;

/** The 6 ready checks; Transfer stays off until `ok`. Every screen shows this same answer. */
create function private.ready_check(m public.members) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  details boolean := num_nulls(
      nullif(trim(m.first_name), ''), nullif(trim(m.last_name), ''), nullif(trim(m.email), ''),
      nullif(trim(m.company), ''), nullif(trim(m.cr), ''), nullif(trim(m.city), ''), m.industry, m.size) = 0
    and length(regexp_replace(m.phone, '\D', '', 'g')) >= (private.settings()).phone_min_digits;
  requirements boolean := m.plan is not null and coalesce(m.branches, 0) > 0 and coalesce(m.users, 0) > 0
    and not exists (select 1 from unnest(private.required_features(m)) f where not (m.features ? f));
  documents boolean := m.plan is not null
    and not exists (
      select 1 from unnest(private.required_docs(m)) k
      where not exists (select 1 from public.documents d where d.member_id = m.id and d.kind = k));
  account boolean := m.account_created_at is not null and nullif(trim(m.codeit_account_id), '') is not null;
  hardware boolean := coalesce((m.hardware ->> 'none')::boolean, false)
    or coalesce((m.hardware ->> 'delivered')::boolean, false)
    or m.hardware ? 'date';
  session boolean := m.session_at is not null
    and private.today() < private.transfer_deadline(m)
    and (
      (m.onboarding_id is not null and private.busy_reason(m.onboarding_id, m.session_at, m.session_ends_at, m.id) is null)
      or private.room_at(m.session_at, m.session_ends_at, m.id) > 0
    );
begin
  return jsonb_build_object(
    'details', details, 'requirements', requirements, 'documents', documents, 'account', account,
    'hardware', hardware, 'session', session,
    'ok', details and requirements and documents and account and hardware and session);
end $$;

-- ── Who may do what ────────────────────────────────────────────────────────

/**
 * The permission table (docs/team-roles-prompt.md section 9), as one function. Every action
 * checks it, and allowed_actions() hands the same answer to the screens. The Admin may do
 * anything a member's stage allows; everyone else only on their own members.
 */
create function private.can(p_action text, m public.members) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  r public.team_role := private.my_role();
  me uuid := auth.uid();
  admin boolean := r = 'admin';
  live boolean := m.outcome is null;
  sales boolean := r = 'sales' and me = m.sales_id;
  account boolean := r = 'account' and me = m.account_person_id;
  integ boolean := r = 'integration' and me = m.integration_id;
  onb boolean := r = 'onboarding' and me = m.onboarding_id;
begin
  if r is null then return false; end if;
  return coalesce(case p_action
    when 'edit' then live and m.stage = 'collecting' and (admin or sales)
    when 'transfer' then live and m.stage = 'collecting' and (admin or sales)
    when 'mark_lost' then live and m.stage = 'collecting' and (admin or sales)
    when 'book' then live and m.stage in ('collecting', 'integration', 'setup', 'session')
      and (m.session_at is null or m.session_at > private.app_now()) and (admin or sales)
    when 'set_account' then live and m.stage = 'collecting' and m.account_created_at is null and (admin or account)
    when 'unset_account' then live and m.stage = 'collecting' and m.account_created_at is not null and admin
    when 'customer_signin' then live and m.account_created_at is not null and (admin or account)
    when 'integration' then live and m.stage = 'integration' and (admin or integ)
    when 'send_back' then live and (
      (m.stage = 'integration' and (admin or integ)) or (m.stage in ('setup', 'session') and (admin or onb)))
    when 'setup' then live and m.stage in ('setup', 'session') and (admin or onb)
    when 'finish' then live and m.stage = 'session' and m.session_at <= private.app_now() and (admin or onb)
    when 'join' then live and m.stage in ('setup', 'session') and m.session_at is not null and (admin or onb)
    when 'send_recording' then live and m.stage = 'recording' and m.recording_sent_at is null and (admin or onb)
    when 'cancel' then live and ((admin and m.stage <> 'closed') or (onb and m.stage in ('setup', 'session')))
    when 'hardware' then live and m.stage <> 'closed' and (admin or sales)
    when 'extend_link' then live and m.stage in ('recording', 'closed') and m.recording_sent_at is not null and admin
    when 'reopen' then m.outcome = 'lost' and admin
    when 'change_person' then live and m.stage <> 'closed' and admin
    when 'note' then admin or me in (m.sales_id, m.account_person_id, m.integration_id, m.onboarding_id)
  end, false);
end $$;

create function private.allowed_actions(m public.members) returns text[]
language sql stable set search_path = '' as $$
  select coalesce(array_agg(a), '{}')
  from unnest(array[
    'edit', 'book', 'transfer', 'mark_lost', 'set_account', 'unset_account', 'customer_signin', 'join', 'integration', 'send_back',
    'setup', 'finish', 'send_recording', 'cancel', 'hardware', 'extend_link', 'reopen', 'change_person', 'note'
  ]) a
  where private.can(a, m)
$$;

/** Storage: the documents folder <member_id>/… may be written by whoever may edit that member. */
create function private.can_edit_folder(p_folder text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members m where m.id::text = p_folder and private.can('edit', m))
$$;

-- ── What the pages read ────────────────────────────────────────────────────

create or replace view public.member_list with (security_invoker = true) as
select
  m.*,
  m.first_name || ' ' || m.last_name as name,
  private.holder(m) as holder_id,
  private.ready_check(m) as ready,
  private.integration_due(m) as integration_due,
  private.setup_due(m) as setup_due,
  private.transfer_deadline(m) as transfer_deadline,
  private.allowed_actions(m) as actions,
  private.late_flags(m) as late
from public.members m;

-- The view and the storage policies call these as the signed-in person.
grant execute on function
  private.settings(), private.riyadh_day(timestamptz), private.riyadh_time(timestamptz), private.today(),
  private.is_working_day(date), private.add_working_days(date, int), private.working_days_before(date, int),
  private.hours_on(uuid, date), private.leave_until(uuid, date),
  private.busy_reason(uuid, timestamptz, timestamptz, bigint), private.room_at(timestamptz, timestamptz, bigint),
  private.required_docs(public.members), private.required_features(public.members),
  private.integration_due(public.members), private.setup_due(public.members), private.transfer_deadline(public.members),
  private.next_stage(public.members), private.holder(public.members), private.ready_check(public.members),
  private.can(text, public.members), private.allowed_actions(public.members), private.can_edit_folder(text),
  private.late_flags(public.members)
  to authenticated;
