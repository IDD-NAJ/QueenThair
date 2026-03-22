import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Heart,
  MapPin,
  User,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  BarChart3,
  Star,
  MessageSquare,
  Tag,
  Activity,
  Upload,
  X
} from 'lucide-react';
import { signOut } from '../../services/authService';

const userNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/dashboard/orders', icon: Package, label: 'Orders' },
  { path: '/dashboard/wishlist', icon: Heart, label: 'Wishlist' },
  { path: '/dashboard/addresses', icon: MapPin, label: 'Addresses' },
  { path: '/dashboard/profile', icon: User, label: 'Profile' },
  { path: '/dashboard/preferences', icon: Bell, label: 'Notifications' },
  { path: '/dashboard/security', icon: Settings, label: 'Security' },
  { path: '/dashboard/support', icon: HelpCircle, label: 'Support' },
];

const adminNavItems = [
  { path: '/admin', icon: BarChart3, label: 'Overview' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/admin/customers', icon: Users, label: 'Customers' },
  { path: '/admin/customer-insights', icon: Users, label: 'Customer Insights' },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/products/import', icon: Upload, label: 'Import Products' },
  { path: '/admin/inventory', icon: Package, label: 'Inventory' },
  { path: '/admin/categories', icon: Tag, label: 'Categories' },
  { path: '/admin/financial', icon: BarChart3, label: 'Financial' },
  { path: '/admin/reviews', icon: Star, label: 'Reviews' },
  { path: '/admin/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { path: '/admin/activity', icon: Activity, label: 'Activity Log' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardSidebar({ type, isOpen, onClose }) {
  const navigate = useNavigate();
  const navItems = type === 'admin' ? adminNavItems : userNavItems;

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleNavClick = (path) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 min-h-screen
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">
            {type === 'admin' ? 'Admin Menu' : 'Menu'}
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard' || item.path === '/admin'}
              onClick={() => handleNavClick(item.path)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gold/10 text-gold-dark font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          
          <hr className="my-4" />
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
