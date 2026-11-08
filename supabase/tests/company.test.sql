-- Company settings: optional documents, and the email service key kept in Vault.
-- `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true)
$$;
create function pg_temp.docs_ok(id bigint) returns boolean language sql as $$
  select (private.ready_check(m) ->> 'documents')::boolean from public.members m where m.id = id
$$;

-- ── Optional documents ─────────────────────────────────────────────────────
select is(pg_temp.docs_ok(100), false, 'MBR-000100 still owes its products list and Hala form');
update public.options set meta = meta || '{"optional": true}' where list = 'document' and key in ('products', 'hala');
select is(pg_temp.docs_ok(100), true, 'once both are optional they no longer hold up Transfer');
select ok(not ('products' = any (private.required_docs(m))), 'and they leave the required list') from public.members m where m.id = 100;

-- ── The email key ──────────────────────────────────────────────────────────
select pg_temp.as_user('00000000-0000-4000-8000-000000000011');
select throws_ok($$ select public.set_email_key('SG.sales') $$, '42501', null, 'only the Admin sets the email key');
select pg_temp.as_user('00000000-0000-4000-8000-000000000001');
select is(public.email_key_set(), false, 'no key to start with');
select public.set_email_key('SG.first');
select public.set_email_key('SG.second');
select ok(public.email_key_set() and public.email_key() = 'SG.second', 'the Admin adds and replaces it; the servers read the newest');
select is((select array_agg(after #>> '{}' order by id) from public.settings_log where item = 'email_key'), array['set', 'replaced'],
  'History notes that it changed, never the key');
select public.set_email_key('');
select is(public.email_key_set(), false, 'an empty key removes it');
reset role;
select ok(not has_function_privilege('authenticated', 'public.email_key()', 'execute'), 'signed-in people can’t read the key; only the server functions');

select * from finish();
rollback;
