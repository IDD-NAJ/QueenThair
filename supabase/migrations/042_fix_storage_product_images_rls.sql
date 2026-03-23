-- ============================================================
--  Fix Storage RLS for product-images bucket
-- ============================================================
-- The is_admin() function used in the original policies (004_storage.sql)
-- is not resolving correctly for storage operations.
-- Replace all product-images storage policies with a direct profiles role check.

-- Drop existing policies
DROP POLICY IF EXISTS "Admin upload product images"  ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images"  ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product images"  ON storage.objects;
DROP POLICY IF EXISTS "Public read product images bucket" ON storage.objects;

-- Re-create: public read
CREATE POLICY "Public read product images bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Re-create: admin insert (upload)
CREATE POLICY "Admin upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Re-create: admin update
CREATE POLICY "Admin update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Re-create: admin delete
CREATE POLICY "Admin delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );
