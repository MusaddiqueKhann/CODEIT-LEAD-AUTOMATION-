-- Too many wrong passwords lock a person out for a while; the Admin is told and can unlock them.
-- Signing in with Google skips choosing a password.
-- `supabase test db`. The sample settings: 5 tries within 15 minutes lock for 15 minutes.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;
create function pg_temp.fail(email text, n int) returns timestamptz language sql as $$
  select max(public.sign_in_failed(email)) from generate_series(1, n)
$$;

-- ── Counting ───────────────────────────────────────────────────────────────
select is(pg_temp.fail('nada@codeit.test', 4), null, 'four wrong passwords don’t lock');
select isnt(pg_temp.fail('Nada@CodeIT.test ', 1), null, 'the fifth does, whatever the case or spaces');
select isnt(public.sign_in_locked('nada@codeit.test'), null, 'the sign-in page sees the lock');
select ok((select banned_until > now() from auth.users where email = 'nada@codeit.test'), 'Supabase refuses the sign-in itself');
select is((select count(*)::int from public.alerts where kind = 'locked' and text like 'Nada Al-Zahrani typed a wrong password 5 times%'
  and text_ar like 'أدخل Nada Al-Zahrani كلمة مرور خاطئة 5 مرات%'), 1, 'the Admin is told, in both languages');
select is(public.sign_in_failed('nobody@x.test'), null, 'an email nobody has is not counted, and says nothing');

insert into private.sign_in_tries (email, at) select 'omar@codeit.test', now() - interval '20 minutes' from generate_series(1, 4);
select is(pg_temp.fail('omar@codeit.test', 1), null, 'tries older than the window don’t count');
select pg_temp.fail('lina@codeit.test', 4);
select pg_temp.as_user('00000000-0000-4000-8000-000000000022');
select public.sign_in_ok();
select is(pg_temp.fail('lina@codeit.test', 1), null, 'a good sign-in forgets the wrong tries before it');

-- ── The Admin ──────────────────────────────────────────────────────────────
select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select isnt((select locked_until from public.team_overview() where email = 'nada@codeit.test'), null, 'the team page shows the lock');
select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select throws_ok($$ select public.unlock_person('00000000-0000-4000-8000-000000000012') $$, '42501', null, 'only the Admin unlocks');
select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select public.unlock_person('00000000-0000-4000-8000-000000000012');
select ok((select p.locked_until is null and u.banned_until is null from public.profiles p join auth.users u using (id)
  where p.email = 'nada@codeit.test'), 'Unlock lets them try again now');

update public.profiles set active = false where email = 'omar@codeit.test';
select throws_like($$ select public.unlock_person('00000000-0000-4000-8000-000000000021') $$, '%back on first%',
  'a deactivated person isn’t turned back on by Unlock');
select is(pg_temp.fail('omar@codeit.test', 5), null, 'and isn’t counted or locked');

-- ── Google sign-in ─────────────────────────────────────────────────────────
insert into auth.identities (provider_id, user_id, identity_data, provider)
select 'email-' || id, id, jsonb_build_object('sub', id::text, 'email', email), 'email' from auth.users where email = 'tariq@codeit.test';
select is((select must_change_password from public.profiles where email = 'tariq@codeit.test'), true, 'another email sign-in still asks for a password of their own');
insert into auth.identities (provider_id, user_id, identity_data, provider)
select 'google-123', id, jsonb_build_object('sub', 'google-123', 'email', email), 'google' from auth.users where email = 'tariq@codeit.test';
select is((select must_change_password from public.profiles where email = 'tariq@codeit.test'), false, 'signing in with Google skips choosing a password');

select * from finish();
rollback;
