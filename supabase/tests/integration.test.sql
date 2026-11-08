-- An integration's ticks say what changed in the activity, so the Integration dashboard can count
-- connections and tests. `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

set local app.now = '2030-01-06 10:00:00+03';
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;
create function pg_temp.last_line() returns text language sql as $$
  select text from public.activity where member_id = 960 order by id desc limit 1
$$;
-- With Yazan (Integration) now: Hala to connect and test.
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, integration_id, stage, integrations)
values (960, 'Int', 'Test', 'int@x.test', '0', 'en', 'I Co', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000031', 'integration', '{hala}');

select pg_temp.as_user('00000000-0000-4000-8000-000000000031');
select public.set_integration_check(960, 'hala', '{"connected": true}');
select is(pg_temp.last_line(), 'Hala connected', 'connecting is logged as connected');
select public.set_integration_check(960, 'hala', '{"tested": true}');
select is(pg_temp.last_line(), 'Hala tested', 'testing as tested');
select public.set_integration_check(960, 'hala', '{"waiting": false}');
select is(pg_temp.last_line(), 'Hala no longer waiting on provider', 'and waiting on the provider either way');

select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select throws_ok($$ select public.set_integration_check(960, 'hala', '{"tested": false}') $$, '42501', null, 'Sales can’t tick an integration');

select * from finish();
rollback;
