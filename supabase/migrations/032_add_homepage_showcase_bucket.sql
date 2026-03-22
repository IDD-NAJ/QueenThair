-- Create homepage-showcase storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage-showcase',
  'homepage-showcase',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

-- Allow public read access
DROP POLICY IF EXISTS "Public read homepage showcase" ON storage.objects;
CREATE POLICY "Public read homepage showcase"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homepage-showcase');

-- Allow admins to upload
DROP POLICY IF EXISTS "Admin upload homepage showcase" ON storage.objects;
CREATE POLICY "Admin upload homepage showcase"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'homepage-showcase' AND
    (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );

-- Allow admins to update
DROP POLICY IF EXISTS "Admin update homepage showcase" ON storage.objects;
CREATE POLICY "Admin update homepage showcase"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'homepage-showcase' AND
    (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );

-- Allow admins to delete
DROP POLICY IF EXISTS "Admin delete homepage showcase" ON storage.objects;
CREATE POLICY "Admin delete homepage showcase"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'homepage-showcase' AND
    (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );
