-- ============================================================================
-- QUEENTHAIR Admin Dashboard Migration
-- Run this in Supabase SQL Editor to enable admin functionality
-- ============================================================================

-- Admin dashboard functions and procedures

-- Get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalRevenue', COALESCE((SELECT SUM(grand_total) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0),
        'totalOrders', COALESCE((SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0),
        'totalProducts', COALESCE((SELECT COUNT(*) FROM products), 0),
        'totalUsers', COALESCE((SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0),
        'pendingOrders', COALESCE((SELECT COUNT(*) FROM orders WHERE status = 'pending'), 0),
        'processingOrders', COALESCE((SELECT COUNT(*) FROM orders WHERE status = 'processing'), 0),
        'deliveredOrders', COALESCE((SELECT COUNT(*) FROM orders WHERE status = 'delivered'), 0),
        'activeProducts', COALESCE((SELECT COUNT(*) FROM products WHERE status = 'active'), 0),
        'draftProducts', COALESCE((SELECT COUNT(*) FROM products WHERE status = 'draft'), 0),
        'totalReviews', COALESCE((SELECT COUNT(*) FROM reviews), 0),
        'pendingReviews', COALESCE((SELECT COUNT(*) FROM reviews WHERE status = 'pending'), 0),
        'approvedReviews', COALESCE((SELECT COUNT(*) FROM reviews WHERE status = 'approved'), 0)
    )
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;

-- Add admin role check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' = 'admin' 
            OR email LIKE '%@Queenthair.com'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Create admin_users table for explicit admin management
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can manage admin users
CREATE POLICY "Admins can manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
                raw_user_meta_data->>'role' = 'admin' 
                OR email LIKE '%@Queenthair.com'
            )
        )
    );

-- Update trigger for admin_users
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- ============================================================================
-- IMPORTANT: Set up your first admin user
-- ============================================================================
-- After running this migration, execute ONE of the following:
--
-- Option 1: Set admin role via user metadata (recommended)
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--     COALESCE(raw_user_meta_data, '{}'::jsonb), 
--     '{role}', 
--     '"admin"'
-- )
-- WHERE email = 'your-admin-email@example.com';
--
-- Option 2: Use an @Queenthair.com email address
-- (Users with @Queenthair.com emails automatically get admin access)
--
-- ============================================================================
