-- Admin dashboard functions and procedures

-- Get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalRevenue', COALESCE(SUM(o.total), 0),
        'totalOrders', COUNT(o.id),
        'totalProducts', COUNT(p.id),
        'totalUsers', COUNT(u.id),
        'pendingOrders', COUNT(CASE WHEN o.status = 'pending' THEN 1 END),
        'processingOrders', COUNT(CASE WHEN o.status = 'processing' THEN 1 END),
        'deliveredOrders', COUNT(CASE WHEN o.status = 'delivered' THEN 1 END),
        'activeProducts', COUNT(CASE WHEN p.status = 'active' THEN 1 END),
        'draftProducts', COUNT(CASE WHEN p.status = 'draft' THEN 1 END),
        'totalReviews', COUNT(r.id),
        'pendingReviews', COUNT(CASE WHEN r.status = 'pending' THEN 1 END),
        'approvedReviews', COUNT(CASE WHEN r.status = 'approved' THEN 1 END)
    )
    INTO result
    FROM orders o
    CROSS JOIN products p
    CROSS JOIN profiles u
    CROSS JOIN reviews r
    WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
    OR p.created_at >= CURRENT_DATE - INTERVAL '30 days'
    OR u.created_at >= CURRENT_DATE - INTERVAL '30 days'
    OR r.created_at >= CURRENT_DATE - INTERVAL '30 days';
    
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

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- Insert default admin (you'll need to update this with actual user ID)
-- This is commented out for security - uncomment and update with actual user ID
-- INSERT INTO admin_users (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'admin');
