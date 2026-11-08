-- The timers and the outbox: `supabase test db`. The clock is pinned to Sun 6 Jan 2030, 10:00 Riyadh.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

set local app.now = '2030-01-06 10:00:00+03';
delete from public.members;
delete from public.alerts;
delete from private.jobs;

create function pg_temp.add(p_email text, p jsonb) returns bigint language plpgsql as $$
declare id_ bigint;
begin
  insert into public.members (first_name, last_name, email, phone, language, company, sales_id)
  values ('T', p_email, p_email || '@x.test', '0', 'en', 'T Co', '00000000-0000-4000-8000-000000000011')
  returning id into id_;
  update public.members set
    stage = coalesce((p ->> 'stage')::public.member_stage, stage),
    integrations = coalesce(array(select jsonb_array_elements_text(p -> 'integrations')), integrations),
    integration_id = (p ->> 'integration_id')::uuid,
    session_at = (p ->> 'session_at')::timestamptz,
    session_ends_at = (p ->> 'session_at')::timestamptz + interval '30 minutes',
    recording_sent_at = (p ->> 'recording_sent_at')::timestamptz,
    link_expires_at = (p ->> 'link_expires_at')::timestamptz,
    completed_at = (p ->> 'completed_at')::timestamptz
  where id = id_;
  return id_;
end $$;

-- Integration due Thu 3 Jan (2 working days before Mon 7 Jan) and still not done.
select pg_temp.add('late', '{"stage":"integration","integrations":["hala"],"integration_id":"00000000-0000-4000-8000-000000000031","session_at":"2030-01-07 11:00+03"}');
-- Still with Sales and the session time has passed.
select pg_temp.add('missed', '{"stage":"collecting","session_at":"2030-01-05 11:00+03"}');
-- The recording link ended yesterday.
select pg_temp.add('ended', '{"stage":"recording","completed_at":"2030-01-03 09:00+03","recording_sent_at":"2030-01-03 10:00+03","link_expires_at":"2030-01-05 10:00+03"}');
-- Tomorrow 09:00: inside the 24-hour reminder, not the 1-hour one; and today is its Transfer deadline.
select pg_temp.add('soon', '{"stage":"collecting","session_at":"2030-01-07 09:00+03"}');

select ok('integration' = any (private.late_flags(m)), 'the Overview sees the late integration') from public.members m where email = 'late@x.test';

select private.run_timers();

select is((select count(*) from public.alerts where person_id = '00000000-0000-4000-8000-000000000031' and kind = 'late'), 1::bigint,
  'the Integration Person is told their integration is late');
select is((select count(*) from public.alerts a join public.profiles p on p.id = a.person_id where p.role = 'admin' and a.key like 'late_integration:%'), 1::bigint,
  'and so is the Admin');
select is((select session_at from public.members where email = 'missed@x.test'), null::timestamptz,
  'a session that passed while still with Sales drops its booking');
select is((select count(*) from public.alerts where person_id = '00000000-0000-4000-8000-000000000011' and kind = 'missed'), 1::bigint,
  'and Sales is told to book again');
select is((select stage::text from public.members where email = 'ended@x.test'), 'closed', 'a member whose link ended is Closed');
select is((select count(*) from private.jobs where key like 'rem:24:%'), 1::bigint, 'the 24-hour reminder is queued');
select is((select count(*) from private.jobs where key like 'rem:1:%'), 0::bigint, 'the 1-hour reminder waits');
select is((select count(*) from public.alerts where key like 'late_transfer:%' and person_id = '00000000-0000-4000-8000-000000000011'), 1::bigint,
  'Sales is told it is too late to transfer for tomorrow’s session');
select ok((select count(*) from private.jobs where payload ->> 'template' = 'alert') > 0, 'alerts also queue emails for people who want them');

create temp table before as select (select count(*) from public.alerts) as a, (select count(*) from private.jobs) as j;
grant select on before to service_role;
select private.run_timers();
select is((select count(*) from public.alerts) + (select count(*) from private.jobs), (select a + j from before),
  'running the timers again repeats nothing');

-- The worker's side: claim, then finish.
set local role service_role;
select is((select count(*) from public.claim_jobs(100)), (select j from before), 'the worker claims every due job');
select public.finish_job(id, true, null) from private.jobs limit 1;
reset role;
select is((select count(*) from private.jobs where status = 'done'), 1::bigint, 'a finished job is done');

select * from finish();
rollback;
