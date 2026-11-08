-- Local sample data only. NEVER run against the real project (`db push` without --include-seed):
-- it creates team logins with a known password.
--
-- Every team login uses the password  LeadCodeit-dev1  except Tariq (a new hire), who has the
-- temporary password  Welcome-123  and must change it at first sign-in.
-- Dates are relative to today, so the sample never goes stale.

set timezone to 'Asia/Riyadh';

-- ── Helpers for this file only ─────────────────────────────────────────────

-- The nth working day from today (Sun–Thu), negative for the past; 0 = today, or the next working
-- day when today is off. Holidays are ignored here.
create function pg_temp.wd(n int) returns date language plpgsql as $$
declare
  d date := current_date;
  left_ int := abs(n);
begin
  while extract(dow from d) in (5, 6) loop d := d + 1; end loop;
  while left_ > 0 loop
    d := d + sign(n)::int;
    if extract(dow from d) not in (5, 6) then left_ := left_ - 1; end if;
  end loop;
  return d;
end $$;

create function pg_temp.at(n int, t time) returns timestamptz language sql as $$
  select (pg_temp.wd(n) + t)::timestamptz
$$;

create function pg_temp.add_user(p_id uuid, p_email text, p_name text, p_role text, p_password text, p_must_change boolean)
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
    email_change, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    -- Cost 10: Supabase Auth refuses the pgcrypto default (6) as a wrong password.
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now(),
    jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', p_role, 'must_change_password', p_must_change),
    jsonb_build_object('name', p_name), now(), now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );
end $$;

-- ── Local settings, Vault, holidays ────────────────────────────────────────
-- The starting settings, lists and wording come from migration 0007; these are local touches.

update public.settings set company = company || '{"support_phone":"+966 11 000 0000","app_url":"http://localhost:5173"}'
where id;

-- Where the database wakes the worker function from, and its shared secret (local only; the README
-- sets these for the real project). The secret matches [edge_runtime.secrets] in config.toml.
select vault.create_secret('http://api.supabase.internal:8000', 'project_url');
select vault.create_secret('local-worker-secret', 'worker_secret');

insert into public.holidays (day, name) values
  ((extract(year from current_date)::int + 1 || '-02-22')::date, 'Founding Day'),
  ((extract(year from current_date)::int + 1 || '-09-23')::date, 'National Day');

-- ── The team ───────────────────────────────────────────────────────────────

select pg_temp.add_user('00000000-0000-4000-8000-000000000001', 'admin@codeit.test', 'Musaddique Khan', 'admin', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000011', 'faris@codeit.test', 'Faris Al-Otaibi', 'sales', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000012', 'nada@codeit.test', 'Nada Al-Zahrani', 'sales', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000021', 'omar@codeit.test', 'Omar Haddad', 'account', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000022', 'lina@codeit.test', 'Lina Al-Mansour', 'account', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000031', 'yazan@codeit.test', 'Yazan Al-Rashid', 'integration', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000032', 'rana@codeit.test', 'Rana Saleh', 'integration', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000041', 'sara@codeit.test', 'Sara Al-Harbi', 'onboarding', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000042', 'khalid@codeit.test', 'Khalid Al-Dossary', 'onboarding', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000043', 'mona@codeit.test', 'Mona Al-Shehri', 'onboarding', 'LeadCodeit-dev1', false);
select pg_temp.add_user('00000000-0000-4000-8000-000000000044', 'tariq@codeit.test', 'Tariq Al-Amri', 'onboarding', 'Welcome-123', true);

update public.profiles set last_assigned_at = now() - interval '2 days' where role <> 'admin';

-- Khalid is on leave this week.
insert into public.leave (person_id, starts_on, ends_on, created_by)
values ('00000000-0000-4000-8000-000000000042', pg_temp.wd(0), pg_temp.wd(2), '00000000-0000-4000-8000-000000000042');

-- ── Members, one or more in every stage and way out ────────────────────────
-- Emails use the reserved .test domain, so nothing can reach a real inbox.

insert into public.members (
  first_name, last_name, email, phone, language, company, cr, vat, city, industry, size,
  plan, branches, users, features, integrations, sales_id, account_person_id, auto_picked, created_by, created_at
) values
  ('Noura', 'Al-Qahtani', 'noura@najm-perfumes.test', '+966 50 771 0294', 'ar', 'Najm Perfumes', '1010458821', '300458821700003', 'Riyadh', 'retail', '11-50',
   'retail', 3, 8, '{"loyalty":true,"selfService":false,"gl":true}', '{surepay,hala}',
   '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000021', '{account}', '00000000-0000-4000-8000-000000000011', now() - interval '2 hours'),
  ('Faisal', 'Al-Harbi', 'faisal@sahab-grill.test', '+966 55 214 8830', 'en', 'Sahab Grill', '1010332190', '300332190400003', 'Jeddah', 'other', '51-200',
   'restaurant', 2, 12, '{"loyalty":true,"selfService":true,"waiter":true,"kds":true,"manufacturing":false,"gl":true}', '{surepay,deliverect}',
   '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000022', '{account}', '00000000-0000-4000-8000-000000000011', now() - interval '1 day'),
  ('Khalid', 'Al-Mutairi', 'k.mutairi@aman-mart.test', '+966 55 640 7782', 'ar', 'Aman Mart', '2050119874', '300119874600003', 'Dammam', 'retail', '1-10',
   'basic', 2, 3, '{}', '{surepay}',
   '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000021', '{account,integration}', '00000000-0000-4000-8000-000000000012', now() - interval '4 days'),
  ('Reem', 'Al-Shehri', 'reem@rawabi-kitchen.test', '+966 53 902 4410', 'en', 'Rawabi Kitchen', '1010877450', '300877450200003', 'Riyadh', 'other', '11-50',
   'restaurant', 1, 6, '{"loyalty":false,"selfService":true,"waiter":true,"kds":true,"manufacturing":false,"gl":true}', '{}',
   '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000022', '{account,onboarding}', '00000000-0000-4000-8000-000000000012', now() - interval '9 days'),
  ('Hessa', 'Al-Ghamdi', 'hessa@ghamdi-fashion.test', '+966 50 413 6658', 'en', 'Ghamdi Fashion', '1010556610', '300556610300003', 'Riyadh', 'retail', '11-50',
   'retail', 1, 4, '{"loyalty":true,"selfService":false,"gl":false}', '{hala}',
   '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000021', '{account,integration}', '00000000-0000-4000-8000-000000000011', now() - interval '5 days'),
  ('Abdullah', 'Al-Otaibi', 'abdullah@otaibi-electronics.test', '+966 56 380 1127', 'en', 'Otaibi Electronics', '1010998812', '300998812100003', 'Riyadh', 'retail', '11-50',
   'retail', 2, 5, '{"loyalty":false,"selfService":false,"gl":true}', '{}',
   '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000022', '{account,onboarding}', '00000000-0000-4000-8000-000000000012', now() - interval '6 days'),
  ('Omar', 'Al-Zahrani', 'omar.z@zahrani-bakery.test', '+966 54 227 9051', 'ar', 'Zahrani Bakery', '1010223344', '300223344500003', 'Taif', 'other', '1-10',
   'basic', 1, 2, '{}', '{}',
   '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000021', '{account,onboarding}', '00000000-0000-4000-8000-000000000011', now() - interval '8 days'),
  ('Lama', 'Al-Dosari', 'lama@dosari-flowers.test', '+966 59 118 3306', 'en', 'Dosari Flowers', '1010667788', '300667788900003', 'Khobar', 'retail', '1-10',
   'retail', 1, 3, '{"loyalty":true,"selfService":true,"gl":false}', '{}',
   '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000022', '{account,onboarding}', '00000000-0000-4000-8000-000000000012', now() - interval '10 days'),
  ('Yousef', 'Al-Malki', 'yousef@malki-restaurants.test', '+966 55 309 4482', 'ar', 'Malki Restaurants', '1010445566', '300445566700003', 'Riyadh', 'other', '51-200',
   'restaurant', 4, 20, '{"loyalty":true,"selfService":true,"waiter":true,"kds":true,"manufacturing":true,"gl":true}', '{deliverect}',
   '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000021', '{account,integration,onboarding}', '00000000-0000-4000-8000-000000000011', now() - interval '20 days'),
  ('Turki', 'Al-Shammari', 'turki@shammari-logistics.test', '+966 56 835 2019', 'en', 'Shammari Logistics', '1010112233', '300112233400003', 'Riyadh', 'technology', '51-200',
   'basic', 1, 4, '{}', '{}',
   '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000021', '{account}', '00000000-0000-4000-8000-000000000012', now() - interval '7 days'),
  ('Maha', 'Al-Subaie', 'maha@subaie-clinics.test', '+966 53 560 8873', 'en', 'Subaie Clinics', '1010778899', '300778899600003', 'Riyadh', 'healthcare', '11-50',
   'retail', 2, 6, '{"loyalty":false,"selfService":true,"gl":true}', '{}',
   '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000022', '{account,onboarding}', '00000000-0000-4000-8000-000000000011', now() - interval '12 days'),
  ('Sultan', 'Al-Anazi', 'sultan@anazi-auto.test', '+966 54 776 1203', 'en', 'Anazi Auto Parts', '1010334455', '300334455800003', 'Riyadh', 'retail', '1-10',
   'basic', 1, 2, '{}', '{}',
   '00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000021', '{account}', '00000000-0000-4000-8000-000000000012', now() - interval '6 days');

-- Everyone past "waiting for an account" has one.
update public.members set
  codeit_account_id = 'CI-' || (40000 + id),
  account_created_at = created_at + interval '3 hours'
where email <> 'noura@najm-perfumes.test';

-- Collecting: waiting for an account, documents still coming.
update public.members set
  session_at = pg_temp.at(5, '11:00'), session_ends_at = pg_temp.at(5, '11:30'), booking_no = 1,
  meet_link = 'https://meet.google.com/nqa-wpqr-tyu',
  doc_due = jsonb_build_object('products', pg_temp.wd(3), 'hala', pg_temp.wd(5)),
  -- The Account Member has started it: login and password are set up, language and confirming to go.
  account_checks = '{"login": true, "password": true}', account_started_at = now() - interval '40 minutes'
where email = 'noura@najm-perfumes.test';

-- Two customers have signed in to the CODEIT accounts made for them.
update public.members set customer_signed_in_at = account_created_at + interval '1 day'
where email in ('lama@dosari-flowers.test', 'yousef@malki-restaurants.test') and account_created_at is not null;

-- Collecting: everything ready, Sales can press Transfer.
update public.members set
  hardware = '{"delivered":true}',
  session_at = pg_temp.at(6, '13:00'), session_ends_at = pg_temp.at(6, '13:30'), booking_no = 1,
  meet_link = 'https://meet.google.com/fah-sgrl-kmz'
where email = 'faisal@sahab-grill.test';

-- Collecting: sent back by Integration, who stays on the member.
update public.members set
  integration_id = '00000000-0000-4000-8000-000000000031',
  hardware = '{"none":true}',
  sent_back_reason = 'The Surepay form is not signed. Please ask the customer to sign page 2.',
  sent_back_by = '00000000-0000-4000-8000-000000000031', sent_back_at = now() - interval '3 hours',
  session_at = pg_temp.at(4, '10:00'), session_ends_at = pg_temp.at(4, '10:30'), booking_no = 1,
  meet_link = 'https://meet.google.com/kam-trty-pqo', holder_since = now() - interval '3 hours'
where email = 'k.mutairi@aman-mart.test';

-- Collecting: back after a No-show, needs a new time. Setup was already done.
update public.members set
  onboarding_id = '00000000-0000-4000-8000-000000000041',
  hardware = '{"delivered":true}',
  setup_checks = '{"branches":true,"products":true,"staff":true,"attendees":true}',
  setup_done_at = now() - interval '3 days', no_shows = 1, booking_no = 1,
  holder_since = now() - interval '1 day'
where email = 'reem@rawabi-kitchen.test';

-- Integration: Hala connected, not yet tested.
update public.members set
  stage = 'integration', integration_id = '00000000-0000-4000-8000-000000000032',
  hardware = jsonb_build_object('date', pg_temp.wd(3)),
  integration_checks = '{"hala":{"connected":true,"tested":false,"notes":"Waiting for the test card from Hala."}}',
  session_at = pg_temp.at(4, '13:00'), session_ends_at = pg_temp.at(4, '13:30'), booking_no = 1,
  meet_link = 'https://meet.google.com/hgf-ashn-wee', holder_since = now() - interval '1 day'
where email = 'hessa@ghamdi-fashion.test';

-- Setup: half the checklist done.
update public.members set
  stage = 'setup', onboarding_id = '00000000-0000-4000-8000-000000000041',
  hardware = '{"none":true}', setup_checks = '{"branches":true,"products":true}',
  session_at = pg_temp.at(2, '11:30'), session_ends_at = pg_temp.at(2, '12:00'), booking_no = 1,
  meet_link = 'https://meet.google.com/abd-otai-bix', holder_since = now() - interval '2 days'
where email = 'abdullah@otaibi-electronics.test';

-- Setup with nobody picked: no Onboarding Member was free at handover.
update public.members set
  stage = 'setup', hardware = '{"none":true}',
  session_at = pg_temp.at(3, '09:30'), session_ends_at = pg_temp.at(3, '10:00'), booking_no = 1,
  meet_link = 'https://meet.google.com/sul-anaz-ipq', holder_since = now() - interval '5 hours'
where email = 'sultan@anazi-auto.test';

-- Session: today.
update public.members set
  stage = 'session', onboarding_id = '00000000-0000-4000-8000-000000000043',
  hardware = '{"none":true}',
  setup_checks = '{"branches":true,"products":true,"staff":true,"attendees":true}', setup_done_at = now() - interval '1 day',
  session_at = pg_temp.at(0, '15:00'), session_ends_at = pg_temp.at(0, '15:30'), booking_no = 1,
  meet_link = 'https://meet.google.com/zah-bkry-omr', holder_since = now() - interval '1 day'
where email = 'omar.z@zahrani-bakery.test';

-- Recording: link out, about a day left.
update public.members set
  stage = 'recording', onboarding_id = '00000000-0000-4000-8000-000000000041',
  hardware = '{"delivered":true}',
  setup_checks = '{"branches":true,"products":true,"staff":true,"attendees":true}', setup_done_at = pg_temp.at(-2, '12:00'),
  session_at = pg_temp.at(-1, '10:00'), session_ends_at = pg_temp.at(-1, '10:30'), booking_no = 1,
  meet_link = 'https://meet.google.com/lam-dosa-rif', completed_at = pg_temp.at(-1, '10:35'),
  recording_link = 'https://drive.google.com/file/d/sample-lama/view',
  recording_sent_at = now() - interval '17 hours', link_expires_at = now() + interval '31 hours'
where email = 'lama@dosari-flowers.test';

-- Recording: rated 2, so the Admin should hear about it.
update public.members set
  stage = 'recording', onboarding_id = '00000000-0000-4000-8000-000000000043',
  hardware = '{"none":true}',
  setup_checks = '{"branches":true,"products":true,"staff":true,"attendees":true}', setup_done_at = pg_temp.at(-3, '12:00'),
  session_at = pg_temp.at(-2, '13:00'), session_ends_at = pg_temp.at(-2, '13:30'), booking_no = 1,
  meet_link = 'https://meet.google.com/mah-subi-cln', completed_at = pg_temp.at(-2, '13:40'),
  recording_link = 'https://drive.google.com/file/d/sample-maha/view',
  recording_sent_at = now() - interval '30 hours', link_expires_at = now() + interval '18 hours',
  rating = 2, rating_comment = 'The session felt rushed.', rated_at = now() - interval '20 hours'
where email = 'maha@subaie-clinics.test';

-- Closed: the whole journey, rated 5.
update public.members set
  stage = 'closed', integration_id = '00000000-0000-4000-8000-000000000031',
  onboarding_id = '00000000-0000-4000-8000-000000000043', hardware = '{"delivered":true}',
  integration_checks = '{"deliverect":{"connected":true,"tested":true}}', integration_done_at = pg_temp.at(-9, '15:00'),
  setup_checks = '{"branches":true,"products":true,"staff":true,"attendees":true}', setup_done_at = pg_temp.at(-8, '12:00'),
  session_at = pg_temp.at(-6, '12:00'), session_ends_at = pg_temp.at(-6, '12:30'), booking_no = 1,
  meet_link = 'https://meet.google.com/yus-malk-res', completed_at = pg_temp.at(-6, '12:40'),
  recording_link = 'https://drive.google.com/file/d/sample-yousef/view',
  recording_sent_at = pg_temp.at(-6, '15:00'), link_expires_at = pg_temp.at(-6, '15:00') + interval '48 hours',
  rating = 5, rating_comment = 'Very clear, thank you.', rated_at = pg_temp.at(-5, '09:00')
where email = 'yousef@malki-restaurants.test';

-- Lost.
update public.members set
  outcome = 'lost', outcome_reason = 'Chose a competitor: went with another provider for now.'
where email = 'turki@shammari-logistics.test';

-- Sample files: rows only, so the readiness bars look real. Opening one shows "sample file".
insert into public.documents (member_id, kind, path, name, size, uploaded_by, uploaded_at)
select m.id, d.kind, m.id || '/' || d.kind || '/sample.pdf', d.name, 245760, m.sales_id, m.created_at + interval '1 hour'
from public.members m
cross join lateral (values
  ('logo', 'Company_logo.png'), ('cr', 'CR_certificate.pdf'), ('vat', 'VAT_certificate.pdf'),
  ('basicItems', 'Basic_items.xlsx'), ('menu', 'Menu.pdf'), ('products', 'Product_list.xlsx'),
  ('surepay', 'Surepay_form.pdf'), ('hala', 'Hala_form.pdf'),
  ('surepay_iban', 'IBAN_letter.pdf'), ('surepay_owner_id', 'Owner_ID.jpg'), ('surepay_address', 'National_address.pdf'),
  ('surepay_license', 'Municipal_license.pdf')
) d(kind, name)
where (d.kind in ('logo', 'cr', 'vat'))
   or (d.kind = 'basicItems' and m.plan = 'basic')
   or (d.kind = 'menu' and m.plan = 'restaurant')
   or (d.kind = 'products' and m.plan in ('retail', 'restaurant'))
   or (d.kind = any (m.integrations) and d.kind in ('surepay', 'hala'))
   or (d.kind like 'surepay\_%' and 'surepay' = any (m.integrations));

-- Noura's products list and Hala form are still on their way (see doc_due).
delete from public.documents d using public.members m
where d.member_id = m.id and m.email = 'noura@najm-perfumes.test' and d.kind in ('products', 'hala');

-- ── History and alerts ─────────────────────────────────────────────────────

-- Every line in English and Arabic, from the same wording the app uses (private.say).
insert into public.activity (member_id, actor_id, kind, text, text_ar, at)
select m.id, m.sales_id, 'created', s[1], s[2], m.created_at
from public.members m join public.profiles p on p.id = m.sales_id, private.say('log_created', jsonb_build_object('by', p.name)) s;

insert into public.activity (member_id, actor_id, kind, text, text_ar, at)
select m.id, null, 'person_account', s[1], s[2], m.created_at + interval '1 second'
from public.members m join public.profiles p on p.id = m.account_person_id,
  private.say('log_person_auto', jsonb_build_object('role', private.l2('role', 'account'), 'person', p.name)) s;

insert into public.activity (member_id, actor_id, kind, text, text_ar, at)
select m.id, m.account_person_id, 'account_created', s[1], s[2], m.account_created_at
from public.members m, private.say('log_account_created', jsonb_build_object('product', private.product(), 'id', m.codeit_account_id)) s
where m.account_created_at is not null;

insert into public.activity (member_id, actor_id, kind, text, text_ar, at)
select m.id, m.sent_back_by, 'sent_back', s[1], s[2], m.sent_back_at
from public.members m, private.say('log_sent_back', jsonb_build_object('step', private.l2('step', 'sales'), 'reason', m.sent_back_reason)) s
where m.sent_back_at is not null;

insert into public.activity (member_id, actor_id, kind, text, text_ar, at)
select m.id, m.onboarding_id, 'no_show', s[1], s[2], now() - interval '1 day'
from public.members m, private.say('log_no_show', jsonb_build_object('step', private.l2('step', 'sales'))) s
where m.no_shows > 0;

insert into public.activity (member_id, actor_id, kind, text, text_ar, at)
select m.id, m.sales_id, 'lost', s[1], s[2], now() - interval '2 days'
from public.members m, private.say('log_lost', jsonb_build_object('why', m.outcome_reason)) s
where m.outcome = 'lost';

insert into public.alerts (person_id, member_id, kind, text, text_ar, key, created_at)
select m.account_person_id, m.id, 'given', s[1], s[2], 'given:account:' || m.id, m.created_at
from public.members m, private.say('alert_given', jsonb_build_object('name', m.first_name || ' ' || m.last_name, 'role', private.l2('role', 'account'))) s
where m.email = 'noura@najm-perfumes.test';

insert into public.alerts (person_id, member_id, kind, text, text_ar, key, created_at)
select m.sales_id, m.id, 'sent_back', s[1], s[2], 'sent_back:' || m.id || ':1', m.sent_back_at
from public.members m, private.say('alert_sent_back', jsonb_build_object('name', m.first_name || ' ' || m.last_name, 'reason', m.sent_back_reason)) s
where m.sent_back_at is not null;

insert into public.alerts (person_id, member_id, kind, text, text_ar, key, created_at)
select m.sales_id, m.id, 'no_show', s[1], s[2], 'no_show:' || m.id || ':1', now() - interval '1 day'
from public.members m, private.say('alert_no_show', jsonb_build_object('name', m.first_name || ' ' || m.last_name)) s
where m.no_shows > 0;

insert into public.alerts (person_id, member_id, kind, text, text_ar, key, created_at)
select a.id, m.id, 'low_rating', s[1], s[2], 'low_rating:' || m.id, m.rated_at
from public.members m cross join public.profiles a,
  private.say('alert_low_rating', jsonb_build_object('name', m.first_name || ' ' || m.last_name, 'stars', m.rating)) s
where a.role = 'admin' and m.rating <= 3;

insert into public.alerts (person_id, member_id, kind, text, text_ar, key, created_at)
select a.id, m.id, 'nobody_free', s[1], s[2], 'nobody_free:' || m.id || ':1', m.holder_since
from public.members m cross join public.profiles a,
  private.say('alert_nobody_session', jsonb_build_object('name', m.first_name || ' ' || m.last_name, 'role', private.l2('role', 'onboarding'))) s
where a.role = 'admin' and m.stage = 'setup' and m.onboarding_id is null;

-- When the Onboarding Member pressed Join Meet on past sessions: two on time, one a few minutes late.
update public.members set session_joined_at = session_at + case when email = 'yousef@malki-restaurants.test' then interval '6 minutes' else interval '-2 minutes' end
where completed_at is not null and session_at is not null;
