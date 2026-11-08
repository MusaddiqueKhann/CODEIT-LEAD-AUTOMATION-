-- Pick a time: the earliest day is the Admin's buffer or the files' ready day plus one working
-- day, whichever is later; days with no free time are left out; each time says who is free.
-- `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

set local app.now = '2030-01-06 10:00:00+03'; -- a Sunday; the week works Sun–Thu
delete from public.members;
delete from public.leave;
delete from public.holidays;
update public.settings set buffer_days = 3, book_ahead_days = 30;

create temp table ppl (k text primary key, id uuid);
insert into ppl values
  ('admin', '00000000-0000-4000-8000-000000000001'), ('faris', '00000000-0000-4000-8000-000000000011'),
  ('sara', '00000000-0000-4000-8000-000000000041'), ('khalid', '00000000-0000-4000-8000-000000000042'),
  ('mona', '00000000-0000-4000-8000-000000000043'), ('tariq', '00000000-0000-4000-8000-000000000044');
create function pg_temp.p(k text) returns uuid language sql as $$ select id from ppl where ppl.k = $1 $$;
create function pg_temp.as_user(k text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', pg_temp.p(k), 'role', 'authenticated')::text, true)
$$;

select is(private.earliest_day(null), '2030-01-09'::date, 'no files due: the buffer, 3 working days on');
select is(private.earliest_day('2030-01-09'), '2030-01-13'::date, 'files in on Wed: Thu to set up, so Sun (the weekend skipped)');
select is(private.earliest_day('2030-01-06'), '2030-01-09'::date, 'files in today: the buffer is later, so it wins');

-- The CR is promised for Wed; the logo was promised later but is already uploaded, so it doesn't count.
insert into public.members (first_name, last_name, email, phone, language, company, sales_id, stage, doc_due)
values ('Files', 'Due', 'files@x.test', '0', 'en', 'F', pg_temp.p('faris'), 'collecting', '{"cr": "2030-01-09", "logo": "2030-01-12"}');
create temp table ids as select email, id from public.members;
create function pg_temp.m(e text) returns bigint language sql as $$ select id from ids where email = $1 $$;
insert into public.documents (member_id, kind, path, name) values (pg_temp.m('files@x.test'), 'logo', 'x/logo/a.png', 'a.png');
select is(private.files_ready(pg_temp.m('files@x.test')), '2030-01-09'::date, 'the files are ready on the latest date still to come');

select pg_temp.as_user('faris');
select throws_like($$ select private.check_slot('2030-01-10 10:00+03', pg_temp.m('files@x.test')) $$,
  'Too soon: the files come in on Wed 09 Jan, so the first session day is Sun 13 Jan.', 'Sales can’t book before the files are in plus a day');
select lives_ok($$ select private.check_slot('2030-01-13 10:00+03', pg_temp.m('files@x.test')) $$, 'the second working day after the files is fine');
select is((select min(d) from public.bookable_days(null, pg_temp.m('files@x.test')) d), '2030-01-13'::date, 'the member’s first open day follows its files');
select is((select min(d) from public.bookable_days('2030-01-06') d), '2030-01-09'::date, 'a form not saved yet sends its own ready day');
select ok((select pg_temp.p('sara') = any(free) from public.open_times('2030-01-13') where slot = '10:00'), 'each time lists who is free');

-- Every Onboarding Member away on Mon 14: that day has no free time, so it isn't offered.
insert into public.leave (person_id, starts_on, ends_on, created_by)
select id, '2030-01-14', '2030-01-14', pg_temp.p('admin') from public.profiles where role = 'onboarding';
select ok('2030-01-14'::date not in (select public.bookable_days('2030-01-06')), 'a day nobody is free on is left out');

select pg_temp.as_user('admin');
select lives_ok($$ select private.check_slot('2030-01-10 10:00+03', pg_temp.m('files@x.test')) $$, 'the Admin can still book any time');

select * from finish();
rollback;
