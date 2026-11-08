-- Activity lines and alerts are written in English and Arabic from the editable wording.
-- `supabase test db`. The clock is pinned to Sunday 6 Jan 2030, 10:00 Riyadh.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

set local app.now = '2030-01-06 10:00:00+03';
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;

-- ── The filler ─────────────────────────────────────────────────────────────
select is(private.say('log_transferred', jsonb_build_object('step', private.l2('step', 'integration'))),
  array['Transferred to Integration', 'حُوّل إلى الربط'], 'a line comes in both languages, with the step named in each');
select is(private.d2('2030-01-06') ->> 'ar', 'الأحد 6 يناير', 'days read in Arabic, Gregorian, digits 0–9');
select is(private.d2('2030-01-06') ->> 'en', 'Sun 06 Jan', 'and in English as before');
update public.texts set ar = '' where key = 'log_setup_done';
select is((private.say('log_setup_done'))[2], 'Setup checklist done', 'Arabic left empty falls back to the English');
update public.texts set ar = 'انتهى الإعداد' where key = 'log_setup_done';
select is((private.say('log_setup_done'))[2], 'انتهى الإعداد', 'the Admin’s new wording is used for new lines');

-- ── Real actions write both ────────────────────────────────────────────────
insert into public.members (id, first_name, last_name, email, phone, language, company, sales_id, stage, hardware)
values (990, 'Bi', 'Lingual', 'bi@x.test', '+966 50 000 0000', 'en', 'B Co', '00000000-0000-4000-8000-000000000011', 'collecting', '{}');
select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select public.set_hardware(990, '{"needs":true,"step":"delivered","delivered":true}');
select is((select array[text, text_ar] from public.activity where member_id = 990 order by id desc limit 1),
  array['Hardware delivered', 'سُلّمت الأجهزة'], 'an action’s activity line is saved in both languages');
select public.update_member(990, '{"phone": "+966 55 111 2222"}');
select is((select array[text, text_ar] from public.activity where member_id = 990 order by id desc limit 1),
  array['Changed phone', 'تم تعديل: رقم الجوال'], 'changed fields are named in each language');
select public.add_note(990, 'Customer prefers mornings');
select is((select array[text, coalesce(text_ar, '—')] from public.activity where member_id = 990 order by id desc limit 1),
  array['Customer prefers mornings', '—'], 'a note stays as typed');
select public.mark_lost(990, 'price', null);
select is((select text_ar from public.alerts a join public.profiles p on p.id = a.person_id where a.member_id = 990 and a.kind = 'lost' and p.role = 'admin' limit 1),
  'حُدّد Bi Lingual كخسارة: السعر', 'alerts are saved in Arabic too, with the reason’s Arabic name');
select is((select text from public.alerts a join public.profiles p on p.id = a.person_id where a.member_id = 990 and a.kind = 'lost' and p.role = 'admin' limit 1),
  'Bi Lingual was marked Lost: Price', 'and in English as before');

select * from finish();
rollback;
