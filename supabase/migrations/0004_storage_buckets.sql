-- ════════════════════════════════════════════════════════════════
-- MATCHLO — Storage : photos/logos (publics), documents (privé modération)
-- ════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('photos','photos',true), ('logos','logos',true), ('documents','documents',false)
on conflict (id) do nothing;

create policy "public read photos" on storage.objects
  for select using (bucket_id in ('photos','logos'));

create policy "user upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('photos','logos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user update own photos" on storage.objects
  for update to authenticated
  using (bucket_id in ('photos','logos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id in ('photos','logos') and (storage.foldername(name))[1] = auth.uid()::text);

-- Documents privés : écriture par le propriétaire, lecture propriétaire + admin
create policy "user upload own docs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner or admin read docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
