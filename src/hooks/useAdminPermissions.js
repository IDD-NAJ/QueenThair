import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { adminService } from '../services/adminService';

export function useAdminPermissions() {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!authUser) {
        setLoading(false);
        return;
      }

      // Get user profile with role and permissions
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, permissions')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Check if user is admin
      const adminRoles = ['super_admin', 'admin', 'manager', 'support'];
      if (!profile || !adminRoles.includes(profile.role)) {
        setError('Access denied: Admin privileges required');
        setLoading(false);
        return;
      }

      setUser(authUser);
      
      // Set permissions based on role
      if (profile.role === 'super_admin') {
        // Super admins have all permissions
        setPermissions(['*']);
      } else if (profile.permissions && Array.isArray(profile.permissions)) {
        setPermissions(profile.permissions);
      } else {
        // Default role-based permissions
        const rolePermissions = {
          admin: [
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'orders.view', 'orders.edit', 'customers.view', 'analytics.view',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'collections.view', 'collections.create', 'collections.edit', 'collections.delete',
            'banners.view', 'banners.create', 'banners.edit', 'banners.delete',
            'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.delete',
            'shipping.view', 'shipping.edit', 'taxes.view', 'taxes.edit',
            'email_templates.view', 'email_templates.edit',
            'reviews.view', 'reviews.edit', 'messages.view', 'messages.edit',
            'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
            'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete',
            'reports.view', 'integrations.view', 'backup.view', 'logs.view'
          ],
          manager: [
            'products.view', 'products.create', 'products.edit',
            'orders.view', 'orders.edit', 'customers.view',
            'categories.view', 'categories.create', 'categories.edit',
            'collections.view', 'collections.create', 'collections.edit',
            'banners.view', 'banners.create', 'banners.edit',
            'reviews.view', 'reviews.edit', 'messages.view', 'messages.edit',
            'coupons.view', 'coupons.create', 'coupons.edit'
          ],
          support: [
            'orders.view', 'customers.view', 'messages.view', 'messages.edit',
            'reviews.view', 'reviews.edit'
          ]
        };
        
        setPermissions(rolePermissions[profile.role] || []);
      }

    } catch (err) {
      console.error('Permission check failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!permissions.length) return false;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    if (!permissions.length) return false;
    if (permissions.includes('*')) return true;
    return permissionList.some(permission => permissions.includes(permission));
  };

  const canAccess = (resource, action = 'view') => {
    const permission = `${resource}.${action}`;
    return hasPermission(permission);
  };

  return {
    user,
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    canAccess,
    checkPermissions
  };
}

// Permission constants for easy reference
export const PERMISSIONS = {
  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DELETE: 'orders.delete',
  
  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',
  
  // Categories
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_EDIT: 'categories.edit',
  CATEGORIES_DELETE: 'categories.delete',
  
  // Collections
  COLLECTIONS_VIEW: 'collections.view',
  COLLECTIONS_CREATE: 'collections.create',
  COLLECTIONS_EDIT: 'collections.edit',
  COLLECTIONS_DELETE: 'collections.delete',
  
  // Banners
  BANNERS_VIEW: 'banners.view',
  BANNERS_CREATE: 'banners.create',
  BANNERS_EDIT: 'banners.edit',
  BANNERS_DELETE: 'banners.delete',
  
  // Blogs
  BLOGS_VIEW: 'blogs.view',
  BLOGS_CREATE: 'blogs.create',
  BLOGS_EDIT: 'blogs.edit',
  BLOGS_DELETE: 'blogs.delete',
  
  // Shipping
  SHIPPING_VIEW: 'shipping.view',
  SHIPPING_EDIT: 'shipping.edit',
  
  // Taxes
  TAXES_VIEW: 'taxes.view',
  TAXES_EDIT: 'taxes.edit',
  
  // Email Templates
  EMAIL_TEMPLATES_VIEW: 'email_templates.view',
  EMAIL_TEMPLATES_EDIT: 'email_templates.edit',
  
  // Reviews
  REVIEWS_VIEW: 'reviews.view',
  REVIEWS_EDIT: 'reviews.edit',
  
  // Messages
  MESSAGES_VIEW: 'messages.view',
  MESSAGES_EDIT: 'messages.edit',
  
  // Coupons
  COUPONS_VIEW: 'coupons.view',
  COUPONS_CREATE: 'coupons.create',
  COUPONS_EDIT: 'coupons.edit',
  COUPONS_DELETE: 'coupons.delete',
  
  // Announcements
  ANNOUNCEMENTS_VIEW: 'announcements.view',
  ANNOUNCEMENTS_CREATE: 'announcements.create',
  ANNOUNCEMENTS_EDIT: 'announcements.edit',
  ANNOUNCEMENTS_DELETE: 'announcements.delete',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  
  // Integrations
  INTEGRATIONS_VIEW: 'integrations.view',
  
  // Backup
  BACKUP_VIEW: 'backup.view',
  
  // Logs
  LOGS_VIEW: 'logs.view',
  
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit'
};
