-- Who sees what on the calendar: `supabase test db`. The clock is pinned to Sun 6 Jan 2030.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

set local app.now = '2030-01-06 10:00:00+03';
delete from public.members;
delete from public.leave;

-- One member with an integration, owned by Faris, with Yazan on the integration and nobody for
-- onboarding yet; its session is Sun 13 Jan 11:00. Khalid (onboarding) is on leave on the 9th.
insert into public.members (id, first_name, last_name, email, phone, language, company, integrations,
  sales_id, integration_id, stage, session_at, session_ends_at)
values (900, 'Cal', 'Test', 'cal@x.test', '0', 'en', 'Cal Co', '{hala}',
  '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000031', 'integration',
  '2030-01-13 11:00+03', '2030-01-13 11:30+03');
insert into public.leave (person_id, starts_on, ends_on) values ('00000000-0000-4000-8000-000000000042', '2030-01-09', '2030-01-09');

-- A second member still with Sales (Faris), Lina making its account: the CR is due on the 10th, the
-- logo is already in, the hardware arrives on the 12th, and its session (Sun 20 Jan) puts Transfer
-- on Thu 17 Jan.
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, account_person_id,
  stage, session_at, session_ends_at, doc_due, hardware)
values (901, 'Still', 'Sales', 'sales@x.test', '0', 'en', 'S Co', '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000022', 'collecting', '2030-01-20 11:00+03', '2030-01-20 11:30+03',
  '{"cr": "2030-01-10", "logo": "2030-01-11"}', '{"needs": true, "step": 1, "date": "2030-01-12"}');
insert into public.documents (member_id, kind, path, name) values (901, 'logo', '901/logo/a.png', 'a.png');

create temp table seen (who text, kind text);
grant select, insert on seen to authenticated;
create function pg_temp.look(who text, id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
  insert into seen select who, c.kind from public.calendar_items('2030-01-01', '2030-01-31') c;
end $$;

set local role authenticated;
select pg_temp.look('faris', '00000000-0000-4000-8000-000000000011');
select pg_temp.look('yazan', '00000000-0000-4000-8000-000000000031');
select pg_temp.look('lina', '00000000-0000-4000-8000-000000000022');
select pg_temp.look('rana', '00000000-0000-4000-8000-000000000032');
select pg_temp.look('khalid', '00000000-0000-4000-8000-000000000042');
select pg_temp.look('admin', '00000000-0000-4000-8000-000000000001');
reset role;

select is((select count(*) from seen where who = 'faris' and kind = 'session'), 2::bigint, 'Sales sees their members’ sessions');
select is((select count(*) from seen where who = 'faris' and kind = 'integration_due'), 0::bigint, 'but not an integration due date');
select is((select string_agg(kind, ',' order by kind) from seen where who = 'faris' and kind not in ('session')), 'files_due,hardware_due,transfer_due',
  'Sales sees Transfer due, the hardware and the one file still to come (not the logo already in)');
select is((select count(*) from seen where who = 'lina' and kind = 'account_due'), 1::bigint, 'the Account Member sees the account to make by Transfer');
select is((select count(*) from seen where who = 'yazan' and kind in ('transfer_due', 'account_due', 'files_due', 'hardware_due')), 0::bigint, 'nobody else sees Sales or Setup work');
select is((select count(*) from seen where who = 'yazan' and kind = 'integration_due'), 1::bigint, 'the Integration Person sees the integration due date');
select is((select count(*) from seen where who = 'rana'), 0::bigint, 'another Integration Person sees nothing of it');
select is((select count(*) from seen where who = 'khalid' and kind = 'leave'), 1::bigint, 'a person sees their own leave');
select is((select count(*) from seen where who = 'khalid' and kind = 'session'), 0::bigint, 'and no session they aren’t on');
select is((select count(*) from seen where who = 'admin'), 10::bigint, 'the Admin sees all of it: 2 sessions, 2 setup checklists, the integration, Transfer, the account, a file, the hardware and the leave');
select set_config('request.jwt.claims', '', true);
select is((select day from public.calendar_items('2030-01-01', '2030-01-31') where kind = 'integration_due'), null::date,
  'nobody signed in sees nothing');

select * from finish();
rollback;
