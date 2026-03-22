-- Align homepage-showcase bucket MIME allowlist with what browsers/OS send (avoids Storage 400 on upload).
-- Run in Supabase SQL Editor if this migration was not applied via CLI.

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[],
  file_size_limit = COALESCE(file_size_limit, 52428800)
WHERE id = 'homepage-showcase';
