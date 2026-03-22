import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Menu,
  Home,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

export default function AdminHeader({ onMenuClick, showMobileMenu }) {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Mock notifications
  const notifications = [
    {
      id: 1,
      type: 'order',
      message: 'New order #QTH-000123 received',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'customer',
      message: 'New customer registration',
      time: '15 minutes ago',
      read: false
    },
    {
      id: 3,
      type: 'system',
      message: 'Database backup completed successfully',
      time: '1 hour ago',
      read: true
    },
    {
      id: 4,
      type: 'inventory',
      message: 'Low stock alert: Luxury Hair Extensions',
      time: '2 hours ago',
      read: true
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'Dashboard';
    if (path.startsWith('/admin/orders')) return 'Orders';
    if (path.startsWith('/admin/customers')) return 'Customers';
    if (path.startsWith('/admin/products')) return 'Products';
    if (path.startsWith('/admin/categories')) return 'Categories';
    if (path.startsWith('/admin/collections')) return 'Collections';
    if (path.startsWith('/admin/inventory')) return 'Inventory';
    if (path.startsWith('/admin/reviews')) return 'Reviews';
    if (path.startsWith('/admin/banners')) return 'Banners';
    if (path.startsWith('/admin/homepage-showcase')) return 'Homepage categories';
    if (path.startsWith('/admin/blogs')) return 'Blogs';
    if (path.startsWith('/admin/coupons')) return 'Coupons';
    if (path.startsWith('/admin/announcements')) return 'Announcements';
    if (path.startsWith('/admin/shipping')) return 'Shipping';
    if (path.startsWith('/admin/taxes')) return 'Taxes';
    if (path.startsWith('/admin/email-templates')) return 'Email Templates';
    if (path.startsWith('/admin/messages')) return 'Messages';
    if (path.startsWith('/admin/analytics')) return 'Analytics';
    if (path.startsWith('/admin/customer-insights')) return 'Customer Insights';
    if (path.startsWith('/admin/financial')) return 'Financial';
    if (path.startsWith('/admin/reports')) return 'Reports';
    if (path.startsWith('/admin/users')) return 'Users';
    if (path.startsWith('/admin/integrations')) return 'Integrations';
    if (path.startsWith('/admin/backup')) return 'Backup';
    if (path.startsWith('/admin/logs')) return 'Logs';
    if (path.startsWith('/admin/maintenance')) return 'Maintenance';
    if (path.startsWith('/admin/settings')) return 'Settings';
    if (path.startsWith('/admin/activity')) return 'Activity';
    return 'Admin';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'customer':
        return '👤';
      case 'system':
        return '⚙️';
      case 'inventory':
        return '📊';
      default:
        return '📢';
    }
  };

  return (
    <header className="relative z-30 shrink-0 border-b border-gray-200 bg-white shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center space-x-2 ml-4 lg:ml-0">
              <Link 
                to="/admin" 
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <Home className="w-4 h-4 mr-1" />
                Admin
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-gray-900">
                {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500">{unreadCount} unread</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 border-b border-gray-100 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
              <Sun className="w-5 h-5" />
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* Profile dropdown */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">admin@queenhair.com</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/admin/settings"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders, customers, products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
