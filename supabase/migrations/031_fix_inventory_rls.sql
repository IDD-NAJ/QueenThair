-- Fix inventory RLS to allow admin inserts
DROP POLICY IF EXISTS "Public read inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admin manage inventory" ON public.inventory;

-- Allow public to read inventory
CREATE POLICY "Public read inventory"
  ON public.inventory FOR SELECT
  USING (true);

-- Allow admins to insert inventory
CREATE POLICY "Admin insert inventory"
  ON public.inventory FOR INSERT
  WITH CHECK (is_admin());

-- Allow admins to update inventory
CREATE POLICY "Admin update inventory"
  ON public.inventory FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admins to delete inventory
CREATE POLICY "Admin delete inventory"
  ON public.inventory FOR DELETE
  USING (is_admin());
