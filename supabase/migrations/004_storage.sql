-- ============================================================
--  QUEENTHAIR – Migration 004: Storage Buckets
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',  'product-images',  true,  10485760,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('category-images', 'category-images', true,  5242880,   array['image/jpeg','image/png','image/webp']),
  ('content-images',  'content-images',  true,  10485760,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars',         'avatars',         false, 2097152,   array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- ── Storage RLS ──────────────────────────────────────────────

-- product-images: public read, admin write
create policy "Public read product images bucket"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admin upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

create policy "Admin update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());

create policy "Admin delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- category-images: public read, admin write
create policy "Public read category images bucket"
  on storage.objects for select
  using (bucket_id = 'category-images');

create policy "Admin manage category images"
  on storage.objects for all
  using (bucket_id = 'category-images' and is_admin())
  with check (bucket_id = 'category-images' and is_admin());

-- content-images: public read, admin write
create policy "Public read content images bucket"
  on storage.objects for select
  using (bucket_id = 'content-images');

create policy "Admin manage content images"
  on storage.objects for all
  using (bucket_id = 'content-images' and is_admin())
  with check (bucket_id = 'content-images' and is_admin());

-- avatars: owner read/write only
create policy "Users read own avatar"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
