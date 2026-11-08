-- What the CODEIT Lead design added: the customer's CODEIT password, the Onboarding Member's
-- feedback, the team note and the most open members per person. `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

set local app.now = '2030-01-06 10:00:00+03';
delete from public.members;
delete from public.leave;
update public.profiles set last_assigned_at = null, team_note = null;

create temp table ppl (k text primary key, id uuid);
insert into ppl values
  ('admin', '00000000-0000-4000-8000-000000000001'), ('faris', '00000000-0000-4000-8000-000000000011'),
  ('omar', '00000000-0000-4000-8000-000000000021'), ('lina', '00000000-0000-4000-8000-000000000022'),
  ('sara', '00000000-0000-4000-8000-000000000041'), ('mona', '00000000-0000-4000-8000-000000000043');
create function pg_temp.p(k text) returns uuid language sql as $$ select id from ppl where ppl.k = $1 $$;
create function pg_temp.as_user(k text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', pg_temp.p(k), 'role', 'authenticated')::text, true)
$$;
grant select on ppl to authenticated;

-- Lina holds two members still waiting for an account; Omar's one is made, so he holds none.
insert into public.members (first_name, last_name, email, phone, language, company, sales_id, account_person_id, onboarding_id, stage, completed_at, account_created_at)
values
  ('Pass', 'Word', 'pass@x.test', '0', 'en', 'P', pg_temp.p('faris'), pg_temp.p('lina'), null, 'collecting', null, null),
  ('Done', 'Session', 'done@x.test', '0', 'en', 'D', pg_temp.p('faris'), pg_temp.p('omar'), pg_temp.p('sara'), 'recording', '2030-01-05 11:00+03', '2030-01-02 10:00+03'),
  ('Not', 'Yet', 'notyet@x.test', '0', 'en', 'N', pg_temp.p('faris'), pg_temp.p('lina'), pg_temp.p('sara'), 'session', null, null);
create temp table ids as select email, id, codeit_password from public.members;
grant select on ids to authenticated;
create function pg_temp.m(e text) returns bigint language sql as $$ select id from ids where email = $1 $$;

select ok((select codeit_password from ids where email = 'pass@x.test') ~ '^[A-HJ-NP-Za-km-np-z2-9]{4}-[A-HJ-NP-Za-km-np-z2-9]{4}-[A-HJ-NP-Za-km-np-z2-9]{4}$',
  'a new member gets a password with no look-alike characters');

-- Capacity: with one open member each allowed, Lina (holding one) is skipped for Omar.
update public.settings set max_open_members = 1;
select is(private.pick_least_busy('account'), pg_temp.p('omar'), 'someone already at the most open members isn’t picked');
update public.members set account_person_id = pg_temp.p('omar') where email = 'notyet@x.test';
select is(private.pick_least_busy('account'), null, 'nobody is picked when everyone is full');
update public.settings set max_open_members = 6;

set local role authenticated;
select pg_temp.as_user('faris');
select isnt(public.new_codeit_password(pg_temp.m('pass@x.test')), (select codeit_password from ids where email = 'pass@x.test'), 'Sales can make a new password');
select is((select count(*) from public.activity where text like '%' || (select codeit_password from public.members where email = 'pass@x.test') || '%'), 0::bigint,
  'the password never goes in the activity log');
select pg_temp.as_user('mona');
select throws_ok(format('select public.new_codeit_password(%s)', pg_temp.m('pass@x.test')), '42501', null, 'someone not on the member can’t');
select pg_temp.as_user('omar');
select throws_ok(format('select public.new_codeit_password(%s)', pg_temp.m('done@x.test')), '42501', null, 'once the account exists the password stays');

select pg_temp.as_user('sara');
select throws_ok(format('select public.save_onboarding_feedback(%s, %L)', pg_temp.m('notyet@x.test'), 'Early'), 'P0001', 'Feedback is written after the session.', 'feedback waits for the session');
select lives_ok(format('select public.save_onboarding_feedback(%s, %L)', pg_temp.m('done@x.test'), 'Went well'), 'the Onboarding Member writes it after');
select pg_temp.as_user('mona');
select throws_ok(format('select public.save_onboarding_feedback(%s, %L)', pg_temp.m('done@x.test'), 'Mine'), '42501', null, 'another Onboarding Member can’t');

select pg_temp.as_user('sara');
select lives_ok(format('select public.set_team_note(%L, %L)', pg_temp.p('sara'), 'Leaves at 15:00 on Thursdays'), 'you write your own note');
select throws_ok(format('select public.set_team_note(%L, %L)', pg_temp.p('mona'), 'Hi'), '42501', null, 'not someone else’s');
select pg_temp.as_user('admin');
select lives_ok(format('select public.set_team_note(%L, %L)', pg_temp.p('mona'), '  '), 'the Admin writes anyone’s');
reset role;

select is((select team_note from public.profiles where id = pg_temp.p('mona')), null, 'a blank note is no note');

select * from finish();
rollback;
