-- What happens on its own: late alerts, customer reminders, links closing, clean-up (run_timers,
-- every 5 minutes), and the outbox that the worker function drains (emails, Google Calendar).
-- Every clock read goes through private.app_now(), so tests can pin the time.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ── Alerts by email ────────────────────────────────────────────────────────

/** An alert also goes by email to people who asked for that (Settings → My profile). */
create function private.alert_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- A failing email must not alert about itself by email, or it would loop.
  if new.kind <> 'job_failed'
     and exists (select 1 from public.profiles p where p.id = new.person_id and p.active and p.email_alerts) then
    perform private.queue('email', jsonb_build_object('template', 'alert', 'alert_id', new.id), 'alert:' || new.id);
  end if;
  return new;
end $$;

create trigger alerts_email after insert on public.alerts
  for each row execute function private.alert_email();

-- ── The sidebar counts and the Alerts page ─────────────────────────────────

/**
 * The numbers beside the sidebar entries: sessions today, members waiting on you (the Admin:
 * late ones and ones with nobody picked), people on leave today (Admin), unread alerts.
 */
create function public.my_counts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  r public.team_role := private.my_role();
  admin boolean := r = 'admin';
begin
  if r is null then return '{}'; end if;
  return jsonb_build_object(
    'sessions_today', (select count(*) from public.members m
      where m.outcome is null and m.session_at is not null and private.riyadh_day(m.session_at) = private.today()
        and (admin or me in (m.sales_id, m.account_person_id, m.integration_id, m.onboarding_id))),
    'waiting', (select count(*) from public.members m
      where case when admin then cardinality(private.late_flags(m)) > 0
                 when r = 'account' then m.account_person_id = me and m.account_created_at is null and m.outcome is null and m.stage = 'collecting'
                 else private.holder(m) = me end),
    -- The Admin's Members badge: open members with something late.
    'late', case when admin then (select count(*) from public.members m where cardinality(private.late_flags(m)) > 0) else 0 end,
    'on_leave', case when admin then (select count(distinct l.person_id) from public.leave l
      where private.today() between l.starts_on and l.ends_on) else 0 end,
    'unread', (select count(*) from public.alerts a where a.person_id = me and a.read_at is null));
end $$;

/** Marks your alerts read: the ones given, or all of them (null). */
create function public.mark_alerts_read(p_ids bigint[]) returns void
language sql security definer set search_path = '' as $$
  update public.alerts set read_at = now()
  where person_id = auth.uid() and read_at is null and (p_ids is null or id = any (p_ids))
$$;

alter publication supabase_realtime add table public.alerts;

-- ── The timers ─────────────────────────────────────────────────────────────

/**
 * Runs every 5 minutes. Each alert and job has a key naming its instance (the due date, the
 * session time), so running twice never repeats one, and a new date alerts again.
 */
create function private.run_timers() returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.settings := private.settings();
  today date := private.today();
  now_ timestamptz := private.app_now();
  m public.members;
  due date;
  h int;
  doc record;
begin
  -- Integration still not done after its due day.
  for m in select * from public.members x where x.outcome is null and x.stage = 'integration' and private.integration_due(x) < today loop
    due := private.integration_due(m);
    perform private.alert(p, m.id, 'late', 'alert_late_integration', jsonb_build_object('name', private.full_name(m), 'date', private.d2(due)),
      'late_integration:' || m.id || ':' || due)
    from unnest(array[m.integration_id, m.sales_id]) p;
    perform private.alert_admins(m.id, 'late', 'alert_late_integration', jsonb_build_object('name', private.full_name(m), 'date', private.d2(due)), 'late_integration:' || m.id || ':' || due);
  end loop;

  -- Setup still not done after its due day.
  for m in select * from public.members x where x.outcome is null and x.stage = 'setup' and private.setup_due(x) < today loop
    due := private.setup_due(m);
    perform private.alert(m.onboarding_id, m.id, 'late', 'alert_late_setup', jsonb_build_object('name', private.full_name(m), 'date', private.d2(due)), 'late_setup:' || m.id || ':' || due);
    perform private.alert_admins(m.id, 'late', 'alert_late_setup', jsonb_build_object('name', private.full_name(m), 'date', private.d2(due)), 'late_setup:' || m.id || ':' || due);
  end loop;

  -- Still with Sales, booked, and past the Transfer deadline: the session has to move.
  for m in select * from public.members x where x.outcome is null and x.stage = 'collecting' and x.session_at > now_
      and private.transfer_deadline(x) <= today loop
    due := private.transfer_deadline(m);
    perform private.alert(m.sales_id, m.id, 'late', 'alert_late_transfer', jsonb_build_object('name', private.full_name(m)), 'late_transfer:' || m.id || ':' || due);
    perform private.alert_admins(m.id, 'late', 'alert_late_transfer_admin', jsonb_build_object('name', private.full_name(m)), 'late_transfer:' || m.id || ':' || due);
  end loop;

  -- The session time passed while it was still with Sales: the booking drops.
  for m in select * from public.members x where x.outcome is null and x.stage = 'collecting' and x.session_at <= now_ loop
    update public.members set session_at = null, session_ends_at = null, meet_link = null where id = m.id;
    perform private.log(m.id, 'session', 'log_missed_before_transfer');
    perform private.alert(m.sales_id, m.id, 'missed', 'alert_missed', jsonb_build_object('name', private.full_name(m)), 'missed:' || m.id || ':' || extract(epoch from m.session_at)::bigint);
    perform private.alert_admins(m.id, 'missed', 'alert_missed_admin', jsonb_build_object('name', private.full_name(m)), 'missed:' || m.id || ':' || extract(epoch from m.session_at)::bigint);
    perform private.sync_calendar(m.id, null);
  end loop;

  -- Completed, but the recording still isn't sent.
  for m in select * from public.members x where x.outcome is null and x.stage = 'recording' and x.recording_sent_at is null
      and x.completed_at <= now_ - make_interval(hours => s.recording_alert_hours) loop
    perform private.alert(m.onboarding_id, m.id, 'late', 'alert_late_recording', jsonb_build_object('name', private.full_name(m)), 'late_recording:' || m.id);
  end loop;

  -- Customer reminders before the session (Settings → Timing).
  foreach h in array s.reminder_hours loop
    for m in select * from public.members x where x.outcome is null and x.stage in ('collecting', 'integration', 'setup', 'session')
        and x.session_at > now_ and x.session_at <= now_ + make_interval(hours => h) loop
      perform private.queue('email', jsonb_build_object('member_id', m.id, 'template', 'session_reminder', 'hours', h),
        'rem:' || h || ':' || m.id || ':' || extract(epoch from m.session_at)::bigint);
    end loop;
  end loop;

  -- No rating yet a while after the recording went out: one reminder.
  for m in select * from public.members x where x.outcome is null and x.stage = 'recording' and x.rating is null
      and x.recording_sent_at <= now_ - make_interval(hours => s.feedback_reminder_hours) and x.link_expires_at > now_ loop
    perform private.queue('email', jsonb_build_object('member_id', m.id, 'template', 'feedback_reminder'),
      'fbrem:' || m.id || ':' || extract(epoch from m.recording_sent_at)::bigint);
  end loop;

  -- The customer's link time ended: Closed.
  for m in update public.members set stage = 'closed', holder_since = now_
      where outcome is null and stage = 'recording' and recording_sent_at is not null and link_expires_at <= now_ returning * loop
    perform private.log(m.id, 'closed', 'log_closed_link');
  end loop;

  -- A document they promised by a date that has passed, still not in.
  for doc in select x.id, x.sales_id, x.first_name || ' ' || x.last_name as who, e.key, e.value::date as by_
      from public.members x, jsonb_each_text(x.doc_due) e
      where x.outcome is null and x.stage = 'collecting' and e.value::date < today
        and not exists (select 1 from public.documents d where d.member_id = x.id and d.kind = e.key) loop
    perform private.alert(doc.sales_id, doc.id, 'doc_late', 'alert_doc_late',
      jsonb_build_object('name', doc.who, 'document', private.l2('document', doc.key), 'date', private.d2(doc.by_)),
      'doc_late:' || doc.id || ':' || doc.key || ':' || doc.by_);
  end loop;

  -- Clean-up, by the wall clock: these rows were stamped with it.
  delete from private.jobs where status = 'done' and created_at < now() - interval '7 days';
  delete from public.alerts where created_at < now() - make_interval(days => s.alerts_keep_days);
  delete from cron.job_run_details where end_time < now() - interval '7 days';
end $$;

-- ── The outbox, for the worker function (service key only) ─────────────────

/** Takes up to `p_limit` due jobs (and any stuck for 10 minutes); another worker skips them. */
create function public.claim_jobs(p_limit int)
returns table (id bigint, kind text, payload jsonb, tries int)
language sql security definer set search_path = '' as $$
  update private.jobs j set status = 'running', tries = j.tries + 1, locked_at = now()
  where j.id in (
    select q.id from private.jobs q
    where (q.status = 'queued' and q.run_at <= now()) or (q.status = 'running' and q.locked_at < now() - interval '10 minutes')
    order by q.id
    for update skip locked
    limit p_limit)
  returning j.id, j.kind, j.payload, j.tries
$$;

/** Done, or try again later (1, 2, 4, 8 minutes); after 5 tries it fails and the Admin is told. */
create function public.finish_job(p_id bigint, p_ok boolean, p_error text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  j private.jobs;
begin
  if p_ok then
    update private.jobs set status = 'done', last_error = null, locked_at = null where id = p_id;
    return;
  end if;
  update private.jobs set
    status = case when tries >= 5 then 'failed' else 'queued' end,
    run_at = now() + make_interval(mins => power(2, tries - 1)::int),
    last_error = p_error, locked_at = null
  where id = p_id returning * into j;
  if j.status = 'failed' then
    perform private.alert_admins((j.payload ->> 'member_id')::bigint, 'job_failed',
      case j.kind when 'email' then 'alert_job_failed_email' else 'alert_job_failed_calendar' end, jsonb_build_object('error', left(p_error, 200)),
      'job_failed:' || p_id);
  end if;
end $$;

/** The worker writes back the Google Calendar event and its Meet link. */
create function public.set_meet_link(p_member bigint, p_event text, p_link text) returns void
language sql security definer set search_path = '' as $$
  update public.members set calendar_event_id = p_event, meet_link = coalesce(p_link, meet_link) where id = p_member
$$;

/**
 * Wakes the worker when jobs are waiting. Its address and shared secret live in Vault
 * (project_url, worker_secret), set once per project; without them nothing is called.
 */
create function private.kick_worker() returns void
language sql security definer set search_path = '' as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/worker',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'worker_secret')),
    body := '{}'::jsonb)
  where exists (select 1 from private.jobs where status = 'queued' and run_at <= now())
    and exists (select 1 from vault.decrypted_secrets where name = 'project_url')
    and exists (select 1 from vault.decrypted_secrets where name = 'worker_secret')
$$;

select cron.schedule('lead-codeit-timers', '*/5 * * * *', 'select private.run_timers()');
select cron.schedule('lead-codeit-worker', '* * * * *', 'select private.kick_worker()');

-- ── Who can call what ──────────────────────────────────────────────────────

revoke execute on function public.claim_jobs(int), public.finish_job(bigint, boolean, text),
  public.set_meet_link(bigint, text, text) from public, anon, authenticated;
grant execute on function public.claim_jobs(int), public.finish_job(bigint, boolean, text),
  public.set_meet_link(bigint, text, text) to service_role;
grant execute on function public.my_counts(), public.mark_alerts_read(bigint[]) to authenticated;

-- Functions made after 0004 start callable by everyone (Postgres' default); take that back.
-- The grants by name above (and in 0003) stay.
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
