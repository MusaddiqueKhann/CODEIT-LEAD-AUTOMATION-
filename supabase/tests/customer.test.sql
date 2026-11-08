-- The customer's page: `supabase test db`. The clock is pinned to Sun 6 Jan 2030.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

set local app.now = '2030-01-06 10:00:00+03';
delete from public.members;
delete from public.alerts;

insert into public.members (first_name, last_name, email, phone, language, company, sales_id, onboarding_id, stage,
  recording_link, recording_sent_at, link_expires_at, after_token)
values
  ('Open', 'Link', 'open@x.test', '0', 'ar', 'O', '00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000041', 'recording',
   'https://drive.google.com/file/d/x/view', '2030-01-05 10:00+03', '2030-01-07 10:00+03', '11111111-1111-4111-8111-111111111111'),
  ('Shut', 'Link', 'shut@x.test', '0', 'en', 'S', '00000000-0000-4000-8000-000000000011', null, 'recording',
   null, '2030-01-02 10:00+03', '2030-01-04 10:00+03', '22222222-2222-4222-8222-222222222222');

set local role anon;
select is(public.after_get('99999999-9999-4999-8999-999999999999') - 'texts' - 'company' - 'support_phone',
  '{"found": false, "language": "en", "name": null, "recording_link": null, "expires_at": null, "closed": null, "rated": false}'::jsonb,
  'a wrong link shows nothing about any member');
select is(public.after_get('not-a-link') -> 'texts' ->> 'after_not_found', 'Please check the link in your email.', 'a mangled link still gets the page’s words');
select is(public.after_get('11111111-1111-4111-8111-111111111111') ->> 'closed', 'false', 'an open link is open');
select is(public.after_get('11111111-1111-4111-8111-111111111111') -> 'texts' ->> 'after_send', 'إرسال', 'the page’s words come in the member’s language');
select is(public.after_get('22222222-2222-4222-8222-222222222222') ->> 'closed', 'true', 'a link past its time is closed');
select is(public.after_get('11111111-1111-4111-8111-111111111111') ->> 'recording_link', 'https://drive.google.com/file/d/x/view', 'an open link gives the recording');
select throws_ok($$select public.after_rate('22222222-2222-4222-8222-222222222222', 5, null)$$, 'P0001', 'This link has closed.', 'a closed link takes no rating');
select throws_ok($$select public.after_rate('11111111-1111-4111-8111-111111111111', 9, null)$$, 'P0001', 'Pick from 1 to 5 stars.', 'stars stay between 1 and 5');
select public.after_rate('11111111-1111-4111-8111-111111111111', 2, 'Too fast');
select throws_ok($$select public.after_rate('11111111-1111-4111-8111-111111111111', 5, null)$$, 'P0001', 'Thank you, your rating is already in.', 'a rating is given once');
select throws_ok('select count(*) from public.members', '42501', null, 'a visitor still can’t read any member');
reset role;

select is((select count(*) from public.alerts where kind = 'low_rating'), 2::bigint, 'a low rating tells the Admin and the Onboarding Member');
select is((select stage::text from public.members where email = 'open@x.test'), 'closed', 'the feedback closes the member at once');
set local role anon;
select is(public.after_get('11111111-1111-4111-8111-111111111111') ->> 'recording_link', 'https://drive.google.com/file/d/x/view',
  'but the recording stays open until the link ends');
reset role;
select is((select stage::text from public.members where email = 'shut@x.test'), 'recording', 'a link that ended unrated waits for the timer');

select * from finish();
rollback;
