-- Who can read what. Nobody writes tables directly: every change goes through a
-- security-definer function (0003), which checks the permission table in private.can().
-- The CLI no longer grants anything by default, so every grant is spelled out here.

-- ── Schemas and helpers ────────────────────────────────────────────────────

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Postgres lets PUBLIC execute every new function; take that back, then grant by name.
revoke execute on all functions in schema private from public;
revoke execute on all functions in schema public from public;
grant execute on function
  private.app_now(), private.my_role(), private.is_admin(), private.can_see_member(bigint)
  to authenticated;

-- ── Table grants ───────────────────────────────────────────────────────────

grant select on
  public.profiles, public.leave, public.settings, public.holidays, public.options, public.texts,
  public.members, public.member_list, public.documents, public.activity, public.alerts,
  public.settings_log
  to authenticated;

grant all on all tables in schema public to service_role;
grant all on all tables in schema private to service_role;
grant usage, select on all sequences in schema public, private to service_role;

-- ── Row-level security ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.leave enable row level security;
alter table public.settings enable row level security;
alter table public.holidays enable row level security;
alter table public.options enable row level security;
alter table public.texts enable row level security;
alter table public.settings_log enable row level security;
alter table public.members enable row level security;
alter table public.documents enable row level security;
alter table public.activity enable row level security;
alter table public.alerts enable row level security;

-- `(select …)` makes Postgres run the helper once per query instead of once per row.

-- Everyone active sees the team (names and avatars on People cards and pickers). Your own row is
-- always readable, so the Set a new password page works before the flag clears.
create policy profiles_read on public.profiles for select to authenticated
  using ((select private.my_role()) is not null or id = (select auth.uid()));

create policy leave_read on public.leave for select to authenticated
  using (person_id = (select auth.uid()) or (select private.is_admin()));

create policy settings_read on public.settings for select to authenticated
  using ((select private.my_role()) is not null);
create policy holidays_read on public.holidays for select to authenticated
  using ((select private.my_role()) is not null);
create policy options_read on public.options for select to authenticated
  using ((select private.my_role()) is not null);
create policy texts_read on public.texts for select to authenticated
  using ((select private.my_role()) is not null);
create policy settings_log_read on public.settings_log for select to authenticated
  using ((select private.is_admin()));

-- Every active team member reads every member (and its documents and activity), so anyone can
-- look a member up. What they may change is still decided per member by private.can().
create policy members_read on public.members for select to authenticated
  using ((select private.my_role()) is not null);

create policy documents_read on public.documents for select to authenticated
  using (private.can_see_member(member_id));
create policy activity_read on public.activity for select to authenticated
  using (private.can_see_member(member_id));

create policy alerts_read on public.alerts for select to authenticated
  using (person_id = (select auth.uid()));

-- ── Storage ────────────────────────────────────────────────────────────────

-- documents: 50 MB is the hard ceiling; the setting max_upload_mb (default 10) is the everyday limit.
insert into storage.buckets (id, name, public, file_size_limit) values
  ('documents', 'documents', false, 52428800),
  ('avatars', 'avatars', true, null)
on conflict (id) do nothing;

-- Documents sit at <member_id>/<kind>/<uuid>.<ext>. The folder is compared as text, so a stray
-- non-numeric path can't break the bucket; the members policy decides who sees them, and
-- private.can('edit') decides who may add, replace or remove them.
create policy "documents read" on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (select 1 from public.members m where m.id::text = (storage.foldername(name))[1])
  );
create policy "documents add" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and private.can_edit_folder((storage.foldername(name))[1]));
create policy "documents replace" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and private.can_edit_folder((storage.foldername(name))[1]));
create policy "documents remove" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and private.can_edit_folder((storage.foldername(name))[1]));

-- Avatars are public to read; each person writes only inside their own folder.
create policy "avatars write own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
