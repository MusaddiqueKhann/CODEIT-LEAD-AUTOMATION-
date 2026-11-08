-- Emails and alerts: which email each action queues, the test email, and who the Admin hears
-- about. `supabase test db`. The clock is pinned to Sunday 6 Jan 2030, 10:00 Riyadh.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

set local app.now = '2030-01-06 10:00:00+03';
delete from private.jobs;
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;
-- admin 01, Faris (Sales) 11, Sara (Onboarding) 41.

-- ── No-show: "We missed you", not "cancelled" ──────────────────────────────
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, onboarding_id, stage, session_at, session_ends_at)
values (980, 'Miss', 'Ed', 'me@x.test', '0', 'en', 'M Co', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000041',
  'session', '2030-01-06 09:00+03', '2030-01-06 09:30+03');
select pg_temp.as_user('00000000-0000-4000-8000-000000000041');
select public.no_show(980, null);
select is((select payload ->> 'email' from private.jobs where kind = 'calendar_sync' and (payload ->> 'member_id')::bigint = 980),
  'session_missed', 'a no-show sends "We missed you"');

-- ── Extending the link tells the customer; a rated member stays Closed ─────
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, stage,
  recording_sent_at, link_expires_at, rating)
values (981, 'Ex', 'Tend', 'ex@x.test', '0', 'en', 'E Co', '00000000-0000-4000-8000-000000000011', 'closed',
  '2030-01-04 10:00+03', '2030-01-06 09:00+03', 4);
select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select public.extend_link(981, 24);
select ok(exists (select 1 from private.jobs where payload ->> 'template' = 'link_extended' and (payload ->> 'member_id')::bigint = 981),
  'Extend emails the customer the new end time');
select is((select stage::text from public.members where id = 981), 'closed', 'a member who rated stays Closed');
update public.members set rating = null, stage = 'closed' where id = 981;
select public.extend_link(981, 24);
select is((select stage::text from public.members where id = 981), 'recording', 'one closed by the clock opens again');

-- ── The Admin hears about Lost ─────────────────────────────────────────────
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, stage)
values (982, 'Lo', 'St', 'lo@x.test', '0', 'en', 'L Co', '00000000-0000-4000-8000-000000000011', 'collecting');
select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select public.mark_lost(982, 'price', null);
select ok(exists (select 1 from public.alerts a join public.profiles p on p.id = a.person_id where a.member_id = 982 and a.kind = 'lost' and p.role = 'admin'),
  'Lost tells the Admin');

-- ── Send a test to me ──────────────────────────────────────────────────────
select throws_ok($$ select public.send_test_email('session_booked', 'en') $$, '42501', null, 'only the Admin sends test emails');
select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select public.send_test_email('session_booked', 'ar');
select is((select payload ->> 'to' || '|' || (payload ->> 'lang') from private.jobs where (payload ->> 'test')::boolean),
  (select email from public.profiles where id = '00000000-0000-4000-8000-000000000001') || '|ar', 'a test goes to the Admin who asked, in the language picked');
select throws_ok($$ select public.send_test_email('nothing', 'en') $$, 'P0001', 'Unknown email: nothing', 'only real emails');

-- ── The customer page falls back to English ────────────────────────────────
update public.texts set ar = '' where key = 'after_send';
update public.members set language = 'ar', recording_sent_at = '2030-01-05 10:00+03', link_expires_at = '2030-01-08 10:00+03', stage = 'recording'
where id = 981;
select is(public.after_get((select after_token::text from public.members where id = 981)) -> 'texts' ->> 'after_send', 'Send',
  'an Arabic text left empty shows the English one');

-- ── A calendar job that keeps failing says so plainly ──────────────────────
select set_config('request.jwt.claims', '', true); -- the worker, not a person
insert into private.jobs (kind, key, payload, tries) values ('calendar_sync', 'fail-test', '{"member_id": 980}', 5);
select public.finish_job((select id from private.jobs where key = 'fail-test'), false, 'The Meet link isn’t ready yet');
select ok(exists (select 1 from public.alerts where kind = 'job_failed' and text like 'A calendar update keeps failing: The Meet link%'),
  'the Admin is told the calendar update failed, and why');

select * from finish();
rollback;
