-- Who sees which members, and that seeing isn't changing. Runs on the seed data: `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- What exists, counted as the owner before switching to a signed-in role.
create temp table expect as
select
  (select count(*) from public.members) as all_members,
  (select min(id) from public.members
   where '00000000-0000-4000-8000-000000000011' not in (sales_id, coalesce(account_person_id, sales_id),
     coalesce(integration_id, sales_id), coalesce(onboarding_id, sales_id))) as not_faris;
grant select on expect to authenticated, anon;

-- Faris, a Sales Member.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated"}';

select is((select count(*) from public.members), (select all_members from expect),
  'every team member reads every member');
select ok(exists (select 1 from public.member_list where id = (select not_faris from expect)),
  'including one they aren’t on, through the view');
select throws_ok(format('select public.add_note(%s, %L)', (select not_faris from expect), 'Hello'), '42501', null,
  'but can’t add a note to a member they aren’t on');
select is((select count(*) from public.alerts where person_id <> (select auth.uid())), 0::bigint,
  'Sales sees only their own alerts');

-- The Admin.
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is((select count(*) from public.members), (select all_members from expect), 'the Admin sees every member');

-- Tariq, still on his temporary password.
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000044","role":"authenticated"}';
select is((select count(*) from public.profiles), 1::bigint,
  'someone on a temporary password sees only their own profile');
select is((select count(*) from public.settings), 0::bigint, 'and no settings until the password is changed');
select is((select count(*) from public.members), 0::bigint, 'and no members either');

-- Not signed in.
reset role;
set local role anon;
select throws_ok('select count(*) from public.members', '42501', null, 'anonymous visitors cannot read members');

select * from finish();
rollback;
