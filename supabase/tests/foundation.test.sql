-- What a fresh project starts with (migration 0007), Settings → History, hardware after Transfer,
-- and removing a document. `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

set local app.now = '2030-01-06 10:00:00+03';
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;
-- admin 01, Faris (Sales) 11, Nada (Sales) 12, Omar (Account) 21.

-- ── The defaults come with the migrations ─────────────────────────────────

select is((select count(*)::int from public.settings), 1, 'the settings row comes with the migrations');
select is((select count(*)::int from public.options where list = 'account_part'), 3, 'the account set-up parts are a list');
select is((select count(*)::int from public.options where list = 'hardware_step'), 3, 'the hardware steps are a list');
select is((select count(*)::int from public.options where label_ar is null), 0, 'every option has an Arabic name');
select ok((select count(*) from public.texts where ar <> en or key like 'after\_%') >= 30, 'the wording comes in English and Arabic');
select is((select language from public.profiles where id = '00000000-0000-4000-8000-000000000011'), 'en', 'people start in English');

-- ── Settings → History ─────────────────────────────────────────────────────

delete from public.settings_log;
select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select public.update_settings('{"buffer_days": 5, "company": {"sender_email": "team@x.test"}}');
select is((select buffer_days from public.settings), 5, 'the Admin changes a setting');
select is((select company ->> 'app_name' from public.settings), 'Lead Codeit', 'a company field sent alone keeps the others');
select is((select count(*)::int from public.settings_log where area = 'settings'), 2, 'each changed setting goes in the history');
select public.update_settings('{"buffer_days": 5}');
select is((select count(*)::int from public.settings_log where area = 'settings'), 2, 'saving the same value adds nothing');
select throws_ok($$ select public.update_settings('{"colour": 1}') $$, 'P0001', 'Unknown setting: colour', 'unknown settings are refused');
select public.save_text('after_send', 'Send now', 'إرسال');
select public.save_option('lost_reason', 'price', 'Too expensive', 'السعر', true, 1, '{}');
select public.set_holiday('2030-02-22', 'Founding Day');
select public.remove_holiday('2030-02-22');
select is((select array_agg(area order by id) from public.settings_log where area <> 'settings'), array['text', 'option', 'holiday', 'holiday'],
  'texts, lists and holidays go in the history too');
select is((select actor_id from public.settings_log order by id desc limit 1), '00000000-0000-4000-8000-000000000001'::uuid, 'with who did it');

set local role authenticated;
select is((select count(*)::int from public.settings_log), 6, 'the Admin reads the history');
select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select is((select count(*)::int from public.settings_log), 0, 'nobody else does');
reset role;

-- ── Hardware after Transfer ────────────────────────────────────────────────

insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, stage, hardware)
values (960, 'Hw', 'Test', 'hw@x.test', '0', 'en', 'H Co', '00000000-0000-4000-8000-000000000011', 'integration', '{"needs":true,"step":0}');

select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select ok('hardware' = any (private.allowed_actions(m)) and not ('edit' = any (private.allowed_actions(m))),
  'after Transfer, Sales may still move the hardware on (but not edit)') from public.members m where id = 960;
select public.set_hardware(960, '{"needs":true,"step":2,"delivered":true}');
select is((select hardware ->> 'delivered' from public.members where id = 960), 'true', 'Sales marks it delivered');
select is((select text from public.activity where member_id = 960 order by id desc limit 1), 'Hardware delivered', 'and it is logged');
select throws_ok($$ select public.set_hardware(960, '{"colour":1}') $$, 'P0001', 'Unknown hardware field: colour', 'only hardware fields are kept');
select pg_temp.as_user('00000000-0000-4000-8000-000000000012');
select throws_ok($$ select public.set_hardware(960, '{"none":true}') $$, '42501', null, 'another Sales Member can’t');
update public.members set stage = 'closed' where id = 960;
select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select throws_ok($$ select public.set_hardware(960, '{"none":true}') $$, '42501', null, 'nor anyone once Closed');

-- ── Removing a document ────────────────────────────────────────────────────

insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, stage)
values (961, 'Doc', 'Test', 'doc@x.test', '0', 'en', 'D Co', '00000000-0000-4000-8000-000000000011', 'collecting');
insert into public.documents (member_id, kind, path, name) values (961, 'logo', '961/logo/f.pdf', 'f.pdf');

select pg_temp.as_user('00000000-0000-4000-8000-000000000021');
select throws_ok($$ select public.remove_document(961, 'logo') $$, '42501', null, 'the Account Member can’t remove a file');
select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select is(public.remove_document(961, 'logo'), '961/logo/f.pdf', 'Sales removes it and gets the path to delete');
select is((select text from public.activity where member_id = 961 order by id desc limit 1), 'Company logo removed', 'and it is logged');

select * from finish();
rollback;
