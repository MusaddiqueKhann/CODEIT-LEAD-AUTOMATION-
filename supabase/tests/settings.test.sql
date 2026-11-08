-- The Admin's settings and lists are what the rules use: `supabase test db`.
-- The clock is pinned to Sunday 6 Jan 2030, 10:00 Riyadh; office hours Sun–Thu.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

set local app.now = '2030-01-06 10:00:00+03';
delete from public.holidays;
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;

-- ── Files ready ────────────────────────────────────────────────────────────
-- Buffer 3 from Sun 6 is Wed 9; files on Wed 9 plus 2 working days is Sun 13 (Fri, Sat are off).
select is(private.earliest_day('2030-01-09'), '2030-01-13'::date, 'the first day waits for the files plus the files-ready days');
update public.settings set files_ready_days = 4;
select is(private.earliest_day('2030-01-09'), '2030-01-15'::date, 'and moves when the Admin changes them');

-- ── Phone digits ───────────────────────────────────────────────────────────
insert into public.members (id, first_name, last_name, email, phone, language, company, cr, city, industry, size, sales_id)
values (970, 'Ph', 'One', 'ph@x.test', '+966 50 000 0000', 'en', 'P Co', '1', 'Riyadh', 'retail', '1-10', '00000000-0000-4000-8000-000000000011');
select is(private.ready_check(m) ->> 'details', 'true', 'a 12-digit phone passes at 9 digits') from public.members m where id = 970;
update public.settings set phone_min_digits = 13;
select is(private.ready_check(m) ->> 'details', 'false', 'and fails once the Admin asks for 13') from public.members m where id = 970;

-- ── No-show limit ──────────────────────────────────────────────────────────
update public.settings set no_show_limit = 1;
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, onboarding_id, stage, session_at, session_ends_at)
values (971, 'No', 'Show', 'ns@x.test', '0', 'en', 'N Co', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000041',
  'session', '2030-01-06 09:00+03', '2030-01-06 09:30+03');
select pg_temp.as_user('00000000-0000-4000-8000-000000000041');
select public.no_show(971, null);
select ok(exists (select 1 from public.alerts a join public.profiles p on p.id = a.person_id where a.member_id = 971 and a.kind = 'no_show' and p.role = 'admin'),
  'the Admin is told at the Admin''s no-show limit');

-- ── Lists the rules read ───────────────────────────────────────────────────
insert into public.options (list, key, label, label_ar, sort) values ('account_part', 'branches', 'Branches', 'الفروع', 4);
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, account_person_id, stage)
values (972, 'Acc', 'Part', 'ap@x.test', '0', 'en', 'A Co', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000021', 'collecting');
select pg_temp.as_user('00000000-0000-4000-8000-000000000021');
select public.set_account_check(972, 'branches', true);
select is((select text from public.activity where member_id = 972 order by id desc limit 1), 'Branches set up on CODEIT', 'a part the Admin added can be ticked');

select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select public.save_option('role', 'sales', 'Seller', 'البائع', true, 2, '{"portal":"Sellers"}');
select is((select meta ->> 'portal' || '|' || (meta ->> 'portal_ar') from public.options where list = 'role' and key = 'sales'), 'Sellers|بوابة المبيعات',
  'the Admin renames a role''s portal; the Arabic one stays');
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id)
values (973, 'Re', 'Name', 'rn@x.test', '0', 'en', 'R Co', '00000000-0000-4000-8000-000000000011');
select private.assign(973, 'sales', '00000000-0000-4000-8000-000000000012', false);
select is((select text from public.alerts where member_id = 973 and kind = 'given' order by id desc limit 1), 'Re Name is now yours (Seller)', 'alerts use the new role name');

-- ── The brand for the sign-in pages ────────────────────────────────────────
reset role;
set local role anon;
select is(public.brand() ->> 'app_name', 'Lead Codeit', 'a visitor reads the app''s name');
select ok(not (public.brand() ? 'sender_email') and not (public.brand() ? 'support_phone'), 'and nothing else from Settings');
reset role;

-- ── Fixed kinds the dashboards count ───────────────────────────────────────
select pg_temp.as_user('00000000-0000-4000-8000-000000000041');
update public.members set stage = 'session', session_at = '2030-01-06 09:00+03', session_ends_at = '2030-01-06 09:30+03' where id = 971;
select public.complete_session(971);
select is((select kind from public.activity where member_id = 971 order by id desc limit 1), 'completed', 'a completed session is logged as completed, whatever the wording');

select * from finish();
rollback;
