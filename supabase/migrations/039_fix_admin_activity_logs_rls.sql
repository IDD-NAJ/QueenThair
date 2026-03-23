-- ============================================================
--  Fix RLS for Admin Activity Logs
-- ============================================================

-- Enable RLS on admin_activity_logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admin full access on admin_activity_logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Allow users to insert their own logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Allow users to view their own logs" ON public.admin_activity_logs;

-- Create policy for admin full access (admin is the only valid enum value besides customer)
CREATE POLICY "Allow admin full access on admin_activity_logs"
ON public.admin_activity_logs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Also allow users to insert their own activity logs (for service role key usage)
CREATE POLICY "Allow users to insert their own logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (admin_id = auth.uid());

-- Allow users to view their own logs
CREATE POLICY "Allow users to view their own logs"
ON public.admin_activity_logs
FOR SELECT
USING (admin_id = auth.uid());
