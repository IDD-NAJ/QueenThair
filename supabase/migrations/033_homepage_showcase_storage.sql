-- Public media bucket for homepage category cards (images + short videos).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage-showcase',
  'homepage-showcase',
  true,
  31457280,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read homepage showcase media" ON storage.objects;
CREATE POLICY "Public read homepage showcase media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homepage-showcase');

DROP POLICY IF EXISTS "Admin manage homepage showcase media" ON storage.objects;
CREATE POLICY "Admin manage homepage showcase media"
  ON storage.objects FOR ALL
  USING (bucket_id = 'homepage-showcase' AND is_admin())
  WITH CHECK (bucket_id = 'homepage-showcase' AND is_admin());
