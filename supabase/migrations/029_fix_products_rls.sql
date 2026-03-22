-- Fix products RLS to allow admin SELECT after INSERT
DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Admin manage products" ON public.products;

-- Allow public to read active products
CREATE POLICY "Public read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Allow admins to read all products
CREATE POLICY "Admin read all products"
  ON public.products FOR SELECT
  USING (is_admin());

-- Allow admins to insert products
CREATE POLICY "Admin insert products"
  ON public.products FOR INSERT
  WITH CHECK (is_admin());

-- Allow admins to update products
CREATE POLICY "Admin update products"
  ON public.products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admins to delete products
CREATE POLICY "Admin delete products"
  ON public.products FOR DELETE
  USING (is_admin());
