-- Private storage for user-submitted collection import photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'collection-import-images',
  'collection-import-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Users upload their own collection import images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'collection-import-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users read their own collection import images"
on storage.objects for select to authenticated
using (
  bucket_id = 'collection-import-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users delete their own collection import images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'collection-import-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
