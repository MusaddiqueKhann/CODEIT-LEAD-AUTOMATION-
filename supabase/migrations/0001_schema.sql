-- Lead Codeit: the tables and the helpers every policy needs.
-- Every time is timestamptz. The database runs on Riyadh time, so "today" and ::date mean Riyadh
-- days even between 00:00 and 03:00.

alter database postgres set timezone to 'Asia/Riyadh';

-- Internal helpers live here: the API only exposes `public`, so nothing in `private` can be
-- called as /rest/v1/rpc/*.
create schema if not exists private;

create type public.team_role as enum ('admin', 'sales', 'account', 'integration', 'onboarding');
create type public.member_stage as enum ('collecting', 'integration', 'setup', 'session', 'recording', 'closed');
create type public.member_outcome as enum ('lost', 'cancelled');

-- ── People ─────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  role public.team_role not null,
  hours jsonb,                            -- 7 × {on, from, to}, Sunday first; null = office hours
  team_note text,                         -- shown to the team under their hours: "Leaves at 15:00 on Thursdays"
  active boolean not null default true,
  must_change_password boolean not null default true,
  email_alerts boolean not null default true,
  language text not null default 'en' check (language in ('en', 'ar')),   -- the app, their alerts and team emails
  locked_until timestamptz,               -- too many wrong passwords: no sign-in until then (Settings → Timing → Sign-in)
  avatar_path text,
  last_assigned_at timestamptz,           -- the auto-pick tie-break: whoever waited longest
  created_at timestamptz not null default now()
);

create table public.leave (
  id bigint generated always as identity primary key,
  person_id uuid not null references public.profiles (id) on delete cascade,
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index leave_person on public.leave (person_id, starts_on);

-- ── Configuration (nothing in code: the Admin edits all of it) ─────────────

create table public.settings (
  id boolean primary key default true check (id),   -- exactly one row
  buffer_days int not null check (buffer_days between 3 and 5),
  integration_due_days int not null check (integration_due_days >= 0),
  setup_due_days int not null check (setup_due_days >= 0),
  session_minutes int not null check (session_minutes > 0),
  gap_minutes int not null check (gap_minutes >= 0),
  slot_step_minutes int not null check (slot_step_minutes > 0),
  book_ahead_days int not null check (book_ahead_days > 0),
  link_hours int not null check (link_hours > 0),
  reminder_hours int[] not null,
  recording_alert_hours int not null check (recording_alert_hours > 0),
  feedback_reminder_hours int not null check (feedback_reminder_hours > 0),
  low_rating_max int not null check (low_rating_max between 1 and 5),
  extend_hours int[] not null,
  alerts_keep_days int not null check (alerts_keep_days > 0),
  session_hours int not null check (session_hours > 0),   -- sign-in time-box, enforced in my_role too
  max_open_members int not null default 6 check (max_open_members > 0),   -- most open members one person is given
  files_ready_days int not null default 2 check (files_ready_days >= 0),  -- working days from the promised files to the session
  no_show_limit int not null default 2 check (no_show_limit > 0),         -- no-shows before the Admin is alerted
  phone_min_digits int not null default 9 check (phone_min_digits between 5 and 15),
  phone_prefix text not null default '+966 ',                              -- what a new member's phone starts with
  due_soon_days int not null default 2 check (due_soon_days >= 0),        -- dashboards: "due soon" (working days)
  ahead_days int not null default 7 check (ahead_days > 0),               -- dashboards: "coming up" (days)
  recent_days int not null default 30 check (recent_days > 0),            -- dashboards: "recent" (days)
  lock_tries int not null default 5 check (lock_tries > 0),               -- wrong passwords before a lock
  lock_window_minutes int not null default 15 check (lock_window_minutes > 0),
  lock_minutes int not null default 15 check (lock_minutes > 0),
  emails_off text[] not null default '{}',                                 -- email templates the Admin turned off
  office_hours jsonb not null,            -- 7 × {on, from, to}; the days that are on are the working days
  company jsonb not null,                 -- {name, name_ar, app_name, product_name, legal_name, legal_name_ar, sender_email, support_phone, app_url}
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table public.holidays (
  day date primary key,
  name text not null
);

-- Settings → History: every Admin change to settings, lists, texts and holidays.
create table public.settings_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id),
  area text not null check (area in ('settings', 'option', 'text', 'holiday')),
  item text not null,                     -- the setting, 'list/key', text key or day that changed
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);
create index settings_log_at on public.settings_log (at desc);

-- Every dropdown, checklist and reason list. `meta` carries what a list needs:
-- business_type {site}, document {short, plans[], integration}, feature {plans[]}, due_choice {days}.
create table public.options (
  list text not null,
  key text not null,
  label text not null,
  label_ar text,
  sort int not null default 0,
  active boolean not null default true,
  meta jsonb not null default '{}',
  primary key (list, key)
);

-- Email and customer-page wording, with {placeholders}.
create table public.texts (
  key text primary key,
  en text not null,
  ar text not null
);

-- ── Members ────────────────────────────────────────────────────────────────

/**
 * A password for the customer's CODEIT login, made on the server: three groups of four letters
 * and digits, leaving out the ones that read alike (I, l, O, 0, 1).
 */
create function private.new_password() returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', get_byte(r.b, i) % 56 + 1, 1)
    || case when i in (3, 7) then '-' else '' end, '' order by i)
  from (select extensions.gen_random_bytes(12) as b) r, generate_series(0, 11) i
$$;

create table public.members (
  id bigint generated by default as identity (start with 100) primary key,
  code text generated always as ('MBR-' || lpad(id::text, 6, '0')) stored unique,

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  language text not null check (language in ('en', 'ar')),
  company text not null,
  cr text,
  vat text,
  city text,
  website text,
  industry text,
  size text,

  plan text,                              -- options list business_type
  branches int,
  users int,
  features jsonb not null default '{}',   -- {feature_key: true|false}
  integrations text[] not null default '{}',
  hardware jsonb not null default '{}',   -- {none: bool, delivered: bool, date: 'YYYY-MM-DD'}
  doc_due jsonb not null default '{}',    -- {document_key: 'YYYY-MM-DD'}

  stage public.member_stage not null default 'collecting',
  outcome public.member_outcome,
  outcome_reason text,

  sales_id uuid references public.profiles (id),
  account_person_id uuid references public.profiles (id),
  integration_id uuid references public.profiles (id),
  onboarding_id uuid references public.profiles (id),
  auto_picked text[] not null default '{}',   -- roles whose person was picked automatically
  holder_since timestamptz not null default now(),

  codeit_account_id text,
  codeit_password text default private.new_password(),   -- for the customer's CODEIT login; never logged or emailed
  account_created_at timestamptz,
  account_checks jsonb not null default '{}',     -- {login, password, language: true}: ticked as each is set up on CODEIT
  account_started_at timestamptz,                 -- the first of those ticks
  customer_signed_in_at timestamptz,              -- ticked by the Account Member once the customer has signed in

  integration_checks jsonb not null default '{}',   -- {integration_key: {connected, tested, waiting, notes}}
  integration_done_at timestamptz,
  setup_checks jsonb not null default '{}',         -- {setup_check_key: true}
  setup_done_at timestamptz,

  session_at timestamptz,
  session_ends_at timestamptz,            -- stored at booking: a later change to session length leaves it alone
  session_joined_at timestamptz,          -- when the Onboarding Member first pressed Join Meet; cleared if the session moves
  booking_no int not null default 0,      -- bumped on every fresh booking; part of the calendar event id
  meet_link text,
  calendar_event_id text,
  no_shows int not null default 0,

  completed_at timestamptz,
  recording_link text,
  recording_sent_at timestamptz,
  link_expires_at timestamptz,
  after_token uuid not null default gen_random_uuid() unique,
  rating int check (rating between 1 and 5),
  rating_comment text,
  onboarding_feedback text,               -- how the session went, written by the Onboarding Member
  rated_at timestamptz,

  sent_back_reason text,
  sent_back_by uuid references public.profiles (id),
  sent_back_at timestamptz,

  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check ((session_at is null) = (session_ends_at is null))
);
-- The constraints catch two Sales saving the same customer at once; add_member turns them into a message.
create unique index members_email on public.members (lower(email));
create unique index members_cr on public.members (cr) where cr is not null;
create index members_sales on public.members (sales_id);
create index members_account on public.members (account_person_id);
create index members_integration on public.members (integration_id);
create index members_onboarding on public.members (onboarding_id);
create index members_session on public.members (session_at);

create table public.documents (
  id bigint generated always as identity primary key,
  member_id bigint not null references public.members (id) on delete cascade,
  kind text not null,                     -- a key of the options list document
  path text not null,                     -- storage: <member_id>/<kind>/<uuid>.<ext>
  name text not null,                     -- the original file name, which may be Arabic
  size bigint,
  uploaded_by uuid references public.profiles (id),
  uploaded_at timestamptz not null default now(),
  unique (member_id, kind)
);

-- Who did what and when. A note is kind = 'note'.
create table public.activity (
  id bigint generated always as identity primary key,
  member_id bigint not null references public.members (id) on delete cascade,
  actor_id uuid references public.profiles (id),   -- null = the system
  kind text not null,                     -- the event, fixed so screens count it (transferred, completed, …); 'note' is a note
  text text not null,                     -- in English; a note as typed
  text_ar text,                           -- the same line in Arabic (null for a note: it stays as typed)
  at timestamptz not null default now()
);
create index activity_member on public.activity (member_id, at desc);

-- `key` includes the instance (e.g. 'rem24:<id>:<session epoch>'), so timers never alert twice
-- for the same thing but do alert again after a reschedule.
create table public.alerts (
  id bigint generated always as identity primary key,
  person_id uuid not null references public.profiles (id) on delete cascade,
  member_id bigint references public.members (id) on delete cascade,
  kind text not null,
  text text not null,                     -- in English
  text_ar text,                           -- in Arabic
  key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (person_id, key)
);
create index alerts_person on public.alerts (person_id, created_at desc);

-- The outbox for emails and calendar changes, drained by the worker function.
create table private.jobs (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('email', 'calendar_sync')),
  key text unique,
  payload jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  tries int not null default 0,
  run_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index jobs_queue on private.jobs (status, run_at);

-- ── Helpers every policy uses ──────────────────────────────────────────────

-- The one clock. Tests pin it with `set local app.now = '…'`.
create function private.app_now() returns timestamptz
language sql stable set search_path = '' as $$
  select coalesce(nullif(current_setting('app.now', true), '')::timestamptz, now())
$$;

-- Wrong passwords, per email, for the lockout; only the Admin's window of them is kept.
create table private.sign_in_tries (
  email text not null,
  at timestamptz not null default now()
);
create index sign_in_tries_email on private.sign_in_tries (email, at);

-- The caller's role, or null when they are inactive, still on their temporary password, or
-- signed in longer than the time-box (the cloud time-box needs the Pro plan; this covers Free).
-- A token without a session id (tests, service calls) skips the time-box check.
create function private.my_role() returns public.team_role
language sql stable security definer set search_path = '' as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.active
    and not p.must_change_password
    and (
      auth.jwt() ->> 'session_id' is null
      or exists (
        select 1 from auth.sessions s, public.settings st
        where s.id = (auth.jwt() ->> 'session_id')::uuid
          and s.created_at > private.app_now() - make_interval(hours => st.session_hours)
      )
    )
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() = 'admin', false)
$$;

-- Every active team member sees every member (read-only; actions are checked by private.can()).
create function private.can_see_member(p_member bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.my_role() is not null and exists (select 1 from public.members m where m.id = p_member)
$$;

create function private.touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger members_touch before update on public.members
  for each row execute function private.touch();

-- ── Keeping profiles in step with auth.users ───────────────────────────────

-- Role comes from app metadata, which only the server can set; never from user metadata.
-- The admin API inserts the user first and adds app metadata in a second write, so this waits
-- until a role is there. Later role changes go through set_role, not metadata.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data ->> 'role' is null then
    return new;
  end if;
  insert into public.profiles (id, email, name, role, must_change_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    (new.raw_app_meta_data ->> 'role')::public.team_role,
    coalesce((new.raw_app_meta_data ->> 'must_change_password')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert or update of raw_app_meta_data on auth.users
  for each row execute function private.handle_new_user();

-- Signing in with Google (an account the Admin added, linked by its email) needs no password of
-- their own, so the first-password step is skipped.
create function private.handle_google_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.provider = 'google' then
    update public.profiles set must_change_password = false where id = new.user_id;
  end if;
  return new;
end $$;

create trigger on_auth_identity_created after insert on auth.identities
  for each row execute function private.handle_google_identity();

-- A real password change clears the first-password flag, so no RPC can skip it. The Admin's
-- reset sets it back afterwards (admin-users function).
create function private.handle_password_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.profiles set must_change_password = false where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_password_change after update of encrypted_password on auth.users
  for each row execute function private.handle_password_change();

create function private.handle_email_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_email_change after update of email on auth.users
  for each row when (new.email is distinct from old.email)
  execute function private.handle_email_change();

-- ── What the pages read ────────────────────────────────────────────────────

-- security_invoker: the caller's RLS applies. Phase 2 adds the computed columns
-- (holder, ready count, due dates, late flags, allowed actions).
create view public.member_list with (security_invoker = true) as
select m.*, m.first_name || ' ' || m.last_name as name
from public.members m;
