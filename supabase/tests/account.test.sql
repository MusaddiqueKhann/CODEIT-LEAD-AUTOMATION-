-- The Account Member's ticks: each part of the CODEIT account, then whether the customer signed in.
-- `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

set local app.now = '2030-01-06 10:00:00+03';
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;
-- Faris sells it, Omar (Account) makes the account.
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, account_person_id, stage)
values (950, 'Acc', 'Test', 'acc@x.test', '0', 'en', 'A Co', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000021', 'collecting');

select pg_temp.as_user('00000000-0000-4000-8000-000000000021');
select public.set_account_check(950, 'login', true);
select is((select account_checks from public.members where id = 950), '{"login": true}'::jsonb, 'the Account Member ticks Login ID');
select is((select account_started_at from public.members where id = 950), '2030-01-06 10:00:00+03'::timestamptz, 'and the first tick starts the account');
select is((select text from public.activity where member_id = 950 order by id desc limit 1), 'Login ID set up on CODEIT', 'and it is logged');
select throws_ok($$ select public.set_account_check(950, 'colour', true) $$, 'P0001', 'Unknown account step: colour', 'only the three parts can be ticked');
select throws_ok($$ select public.set_customer_signed_in(950, true) $$, '42501', null, 'signed in waits for the account');

select public.set_account(950, 'CX-1');
select public.set_customer_signed_in(950, true);
select ok((select customer_signed_in_at is not null from public.members where id = 950), 'once made, the Account Member ticks that the customer signed in');

select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select throws_ok($$ select public.set_customer_signed_in(950, false) $$, '42501', null, 'Sales can’t tick it');
select throws_ok($$ select public.set_account_check(950, 'password', true) $$, '42501', null, 'nor the account parts');

select * from finish();
rollback;
