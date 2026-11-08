-- Join Meet records when a session started, once, and a moved session starts over. `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

set local app.now = '2030-01-06 10:00:00+03';
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;
create function pg_temp.joined() returns timestamptz language sql as $$ select session_joined_at from public.members where id = 970 $$;
-- Sara runs it, at 10:00 today.
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, onboarding_id, stage, session_at, session_ends_at)
values (970, 'On', 'Board', 'onb@x.test', '0', 'en', 'O Co', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000041',
  'session', '2030-01-06 10:00+03', '2030-01-06 10:30+03');

select pg_temp.as_user('00000000-0000-4000-8000-000000000041');
select public.join_session(970);
select is(pg_temp.joined(), '2030-01-06 10:00:00+03'::timestamptz, 'Join Meet records when the session started');
set local app.now = '2030-01-06 10:07:00+03';
select public.join_session(970);
select is(pg_temp.joined(), '2030-01-06 10:00:00+03'::timestamptz, 'pressing it again keeps the first time');

select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select throws_ok($$ select public.join_session(970) $$, '42501', null, 'only the Onboarding Member (or the Admin) records it');

-- Back with Sales after a No-show, the Admin books another day: the old start no longer counts.
update public.members set stage = 'collecting' where id = 970;
set local app.now = '2030-01-06 09:00:00+03';
select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select public.book_session(970, '2030-01-13 11:00+03');
select is(pg_temp.joined(), null, 'moving the session clears it');
update public.members set stage = 'session' where id = 970;
select pg_temp.as_user('00000000-0000-4000-8000-000000000041');
select lives_ok($$ select public.join_session(970) $$, 'and it can be recorded for the new time');

select * from finish();
rollback;
