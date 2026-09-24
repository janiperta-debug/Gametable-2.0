-- Public newsletter images are intentionally accessible to email clients.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('newsletter-images', 'newsletter-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

alter table public.admin_broadcasts add column if not exists image_url text;
