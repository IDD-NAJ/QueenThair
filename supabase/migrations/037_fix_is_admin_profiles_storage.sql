-- Migration 006 replaced is_admin() to only inspect auth.users (JWT metadata + email domain).
-- Admins granted via public.profiles.role = 'admin' were no longer recognized, breaking
-- storage RLS (product-images uploads, etc.). Restore profiles check alongside legacy rules.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      COALESCE(raw_user_meta_data->>'role', '') = 'admin'
      OR email ILIKE '%@Queenthair.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
