-- The rules, on a world this file builds itself: `supabase test db`.
-- The clock is pinned to Sunday 6 Jan 2030, 10:00 Riyadh; the buffer is 3 working days, the gap
-- 10 minutes, sessions 30 minutes, office hours Sun–Thu.
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

set local app.now = '2030-01-06 10:00:00+03';
delete from public.members;
delete from public.leave;
delete from public.holidays;
update public.profiles set last_assigned_at = null, hours = null;

-- The people (from seed.sql). Tariq is still on his temporary password.
create temp table ppl (k text primary key, id uuid);
insert into ppl values
  ('admin', '00000000-0000-4000-8000-000000000001'), ('faris', '00000000-0000-4000-8000-000000000011'),
  ('nada', '00000000-0000-4000-8000-000000000012'), ('omar', '00000000-0000-4000-8000-000000000021'),
  ('lina', '00000000-0000-4000-8000-000000000022'), ('yazan', '00000000-0000-4000-8000-000000000031'),
  ('rana', '00000000-0000-4000-8000-000000000032'), ('sara', '00000000-0000-4000-8000-000000000041'),
  ('khalid', '00000000-0000-4000-8000-000000000042'), ('mona', '00000000-0000-4000-8000-000000000043'),
  ('tariq', '00000000-0000-4000-8000-000000000044');
create function pg_temp.p(k text) returns uuid language sql as $$ select id from ppl where ppl.k = $1 $$;
create function pg_temp.at(t text) returns timestamptz language sql as $$ select ($1 || '+03')::timestamptz $$;
create function pg_temp.as_user(k text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', pg_temp.p(k), 'role', 'authenticated')::text, true)
$$;

-- A member for Faris that passes every ready check: Retail, no integration, all files in.
create function pg_temp.ready_member(p_email text, p_session text) returns bigint language plpgsql as $$
declare id_ bigint;
begin
  insert into public.members (first_name, last_name, email, phone, language, company, cr, city, industry, size,
    plan, branches, users, features, hardware, sales_id, account_person_id, codeit_account_id, account_created_at,
    session_at, session_ends_at)
  values ('Test', p_email, p_email || '@x.test', '+966 50 000 0000', 'en', 'Test Co', p_email, 'Riyadh', 'retail', '1-10',
    'retail', 1, 2, '{"loyalty":true,"selfService":false,"gl":true}', '{"none":true}', pg_temp.p('faris'), pg_temp.p('omar'),
    'CI-1', now(), pg_temp.at(p_session), pg_temp.at(p_session) + interval '30 minutes')
  returning id into id_;
  insert into public.documents (member_id, kind, path, name)
  select id_, k, id_ || '/' || k || '/f.pdf', 'f.pdf' from unnest(array['logo', 'cr', 'vat', 'products']) k;
  return id_;
end $$;

create temp table ids (k text primary key, id bigint);
grant select on ppl, ids to authenticated;

-- ── Working days ───────────────────────────────────────────────────────────

select is(private.add_working_days('2030-01-02', 2), '2030-01-06'::date, 'Wed + 2 working days skips Fri and Sat');
select is(private.working_days_before('2030-01-06', 1), '2030-01-03'::date, '1 working day before Sun is Thu');
insert into public.holidays values ('2030-01-07', 'Test holiday');
select is(private.add_working_days('2030-01-06', 1), '2030-01-08'::date, 'a holiday is not a working day');
delete from public.holidays;

-- ── Who is free, who gets picked ───────────────────────────────────────────
-- The session time under test: Sun 13 Jan 2030, 11:00–11:30.

update public.profiles set last_assigned_at = '2029-12-01' where id = pg_temp.p('khalid');
update public.profiles set last_assigned_at = '2029-12-15' where id = pg_temp.p('mona');
insert into public.leave (person_id, starts_on, ends_on) values (pg_temp.p('sara'), '2030-01-13', '2030-01-13');

select is(private.busy_reason(pg_temp.p('sara'), pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null),
  'leave:2030-01-13', 'someone on leave says so (and until when)');
select is(private.pick_onboarding(pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null), pg_temp.p('khalid'),
  'someone on leave is never picked (Sara waited longest, but is on leave)');

insert into public.members (first_name, last_name, email, phone, language, company, stage, onboarding_id, session_at, session_ends_at)
values ('Busy', 'K', 'busy@x.test', '0', 'en', 'B', 'setup', pg_temp.p('khalid'), pg_temp.at('2030-01-13 11:20'), pg_temp.at('2030-01-13 11:50'));
select is(private.busy_reason(pg_temp.p('khalid'), pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null),
  'session:11:20', 'a session within the gap makes someone busy');
select is(private.pick_onboarding(pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null), pg_temp.p('mona'),
  'someone with an overlapping session is never picked');
select is(private.busy_reason(pg_temp.p('khalid'), pg_temp.at('2030-01-13 12:00'), pg_temp.at('2030-01-13 12:30'), null),
  null, 'ten minutes clear of a session is free');

delete from public.members;
delete from public.leave;
update public.profiles set last_assigned_at = '2029-12-20' where id = pg_temp.p('sara');
select is(private.pick_onboarding(pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null), pg_temp.p('khalid'),
  'a tie goes to whoever waited longest');

insert into public.members (first_name, last_name, email, phone, language, company, stage, onboarding_id, session_at, session_ends_at)
values ('Week', 'K', 'week@x.test', '0', 'en', 'W', 'setup', pg_temp.p('khalid'), pg_temp.at('2030-01-14 09:00'), pg_temp.at('2030-01-14 09:30'));
select is(private.pick_onboarding(pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null), pg_temp.p('mona'),
  'fewer sessions that week comes before waiting longest');

select is(private.busy_reason(pg_temp.p('tariq'), pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null),
  'not_signed_in', 'someone still on a temporary password is not picked');
select is(private.busy_reason(pg_temp.p('mona'), pg_temp.at('2030-01-10 15:00'), pg_temp.at('2030-01-10 15:30'), null),
  'outside_hours', 'Thursday closes at 14:00');

-- Room: Sara, Khalid and Mona are free at 11:00; three held sessions fill it.
delete from public.members;
insert into public.members (first_name, last_name, email, phone, language, company, session_at, session_ends_at)
select 'Held', n::text, 'held' || n || '@x.test', '0', 'en', 'H', pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30')
from generate_series(1, 2) n;
select is(private.room_at(pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null), 1, 'two held sessions leave room for one');
insert into public.members (first_name, last_name, email, phone, language, company, session_at, session_ends_at)
values ('Held', '3', 'held3@x.test', '0', 'en', 'H', pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'));
select is(private.room_at(pg_temp.at('2030-01-13 11:00'), pg_temp.at('2030-01-13 11:30'), null), 0, 'a full time has no room');
select is(private.room_at(pg_temp.at('2030-01-13 13:00'), pg_temp.at('2030-01-13 13:30'), null), 3, 'another time still has room');

-- Account and Integration: fewest open, then waited longest, never someone on leave today.
delete from public.members;
insert into public.members (first_name, last_name, email, phone, language, company, account_person_id)
values ('Open', 'A', 'open@x.test', '0', 'en', 'O', pg_temp.p('omar'));
select is(private.pick_least_busy('account'), pg_temp.p('lina'), 'the Account Member with fewer open members is picked');
insert into public.leave (person_id, starts_on, ends_on) values (pg_temp.p('lina'), '2030-01-06', '2030-01-08');
select is(private.pick_least_busy('account'), pg_temp.p('omar'), 'someone on leave today is skipped');
delete from public.leave;
delete from public.members;

-- ── The ready check ────────────────────────────────────────────────────────

insert into ids select 'ready', pg_temp.ready_member('ready', '2030-01-13 11:00');
select ok((private.ready_check(m) ->> 'ok')::boolean, 'a complete member passes all 6 checks') from public.members m where id = (select id from ids where k = 'ready');
update public.members set hardware = '{}' where id = (select id from ids where k = 'ready');
select is(private.ready_check(m) -> 'hardware', 'false'::jsonb, 'no hardware answer fails the hardware check') from public.members m where id = (select id from ids where k = 'ready');
update public.members set hardware = '{"none":true}' where id = (select id from ids where k = 'ready');
update public.members set session_at = pg_temp.at('2030-01-07 11:00'), session_ends_at = pg_temp.at('2030-01-07 11:30') where id = (select id from ids where k = 'ready');
select is(private.ready_check(m) -> 'session', 'false'::jsonb, 'too close to the setup deadline fails the session check') from public.members m where id = (select id from ids where k = 'ready');
update public.members set session_at = pg_temp.at('2030-01-13 11:00'), session_ends_at = pg_temp.at('2030-01-13 11:30') where id = (select id from ids where k = 'ready');

-- ── Who may do what ────────────────────────────────────────────────────────

set local role authenticated;
select pg_temp.as_user('yazan');
select is((select count(*) from public.members where id = (select id from ids where k = 'ready')), 1::bigint,
  'an Integration Person not on a member can read it');
select throws_ok(format('select public.transfer(%s)', (select id from ids where k = 'ready')), '42501', null,
  'and can’t press Transfer on it');
select pg_temp.as_user('faris');
select ok('transfer' = any (actions), 'the Sales owner sees Transfer') from public.member_list where id = (select id from ids where k = 'ready');
select throws_ok(format('select public.update_member(%s, %L)', (select id from ids where k = 'ready'), '{"stage":"closed"}'),
  'P0001', 'That field can’t be changed here: stage', 'Sales can’t set the stage by editing');
select throws_like(format('select public.update_member(%s, %L)', (select id from ids where k = 'ready'), '{"email":"new@x.test"}'),
  '%locked once the CODEIT account exists%', 'the email locks once the account exists');
select throws_like(format('select public.book_session(%s, %L)', (select id from ids where k = 'ready'), '2030-01-07 11:00+03'),
  'Too soon%', 'a time inside the buffer is refused');
select pg_temp.as_user('nada');
select throws_ok(format('select public.transfer(%s)', (select id from ids where k = 'ready')), '42501', null,
  'another Sales Member can’t transfer someone else’s member');

-- ── The flow ───────────────────────────────────────────────────────────────

select pg_temp.as_user('faris');
select is(public.transfer((select id from ids where k = 'ready')), 'setup', 'with no integration, Transfer goes to Setup');
reset role;
select isnt(onboarding_id, null, 'and an Onboarding Member is picked at handover') from public.members where id = (select id from ids where k = 'ready');

-- Onboarding sends it back: it returns to Sales and keeps its booked time.
set local role authenticated;
select pg_temp.as_user((select k from ppl where id = (select onboarding_id from public.members where id = (select id from ids where k = 'ready'))));
select public.send_back((select id from ids where k = 'ready'), 'The menu file is missing');
reset role;
select ok(stage = 'collecting' and session_at = pg_temp.at('2030-01-13 11:00'),
  'sending back keeps the booked time') from public.members where id = (select id from ids where k = 'ready');

-- With an integration, Transfer goes to Integration and picks someone.
insert into ids select 'integ', pg_temp.ready_member('integ', '2030-01-14 11:00');
update public.members set integrations = '{hala}' where id = (select id from ids where k = 'integ');
insert into public.documents (member_id, kind, path, name) select id, 'hala', id || '/hala/f.pdf', 'f.pdf' from ids where k = 'integ';
set local role authenticated;
select pg_temp.as_user('faris');
select is(public.transfer((select id from ids where k = 'integ')), 'integration', 'with an integration, Transfer goes to Integration');
reset role;

-- A No-show: back to Sales with no booking, and Sales is told.
insert into ids select 'noshow', pg_temp.ready_member('noshow', '2030-01-05 11:00');
update public.members set stage = 'session', onboarding_id = pg_temp.p('sara'), setup_done_at = now()
where id = (select id from ids where k = 'noshow');
set local role authenticated;
select pg_temp.as_user('sara');
select public.no_show((select id from ids where k = 'noshow'), 'No answer on Meet');
reset role;
select ok(stage = 'collecting' and session_at is null and no_shows = 1,
  'a No-show goes back to Sales with no booking') from public.members where id = (select id from ids where k = 'noshow');

select * from finish();
rollback;
