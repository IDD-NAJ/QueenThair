import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  User,
  Package, 
  FileText, 
  Mail, 
  MessageSquare, 
  Tag, 
  Bell, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Database, 
  FolderPlus, 
  Layers, 
  Image, 
  LayoutGrid,
  Edit3, 
  Truck, 
  Calculator, 
  Mail as EmailIcon, 
  Shield, 
  FileText as FileChart, 
  Link as LinkIcon, 
  Archive, 
  Terminal, 
  Wrench,
  ChevronDown,
  ChevronRight,
  X,
  Menu
} from 'lucide-react';

const navigationItems = [
  {
    category: 'Main',
    items: [
      { name: 'Overview', href: '/admin', icon: LayoutDashboard },
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Customers', href: '/admin/customers', icon: Users },
    ]
  },
  {
    category: 'Catalog',
    items: [
      { name: 'Products', href: '/admin/products', icon: Package },
      { name: 'Categories', href: '/admin/categories', icon: FolderPlus },
      { name: 'Collections', href: '/admin/collections', icon: Layers },
      { name: 'Inventory', href: '/admin/inventory', icon: Package },
      { name: 'Reviews', href: '/admin/reviews', icon: FileText },
    ]
  },
  {
    category: 'Marketing',
    items: [
      { name: 'Banners', href: '/admin/banners', icon: Image },
      { name: 'Homepage categories', href: '/admin/homepage-showcase', icon: LayoutGrid },
      { name: 'Blogs', href: '/admin/blogs', icon: Edit3 },
      { name: 'Coupons', href: '/admin/coupons', icon: Tag },
      { name: 'Announcements', href: '/admin/announcements', icon: Bell },
    ]
  },
  {
    category: 'Operations',
    items: [
      { name: 'Shipping', href: '/admin/shipping', icon: Truck },
      { name: 'Taxes', href: '/admin/taxes', icon: Calculator },
      { name: 'Email Templates', href: '/admin/email-templates', icon: EmailIcon },
      { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    ]
  },
  {
    category: 'Analytics',
    items: [
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Customer Insights', href: '/admin/customer-insights', icon: Users },
      { name: 'Financial', href: '/admin/financial', icon: TrendingUp },
      { name: 'Reports', href: '/admin/reports', icon: FileChart },
    ]
  },
  {
    category: 'System',
    items: [
      { name: 'Users', href: '/admin/users', icon: Shield },
      { name: 'Integrations', href: '/admin/integrations', icon: LinkIcon },
      { name: 'Backup', href: '/admin/backup', icon: Archive },
      { name: 'Logs', href: '/admin/logs', icon: Terminal },
      { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Activity', href: '/admin/activity', icon: BarChart3 },
    ]
  }
];

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [expandedCategories, setExpandedCategories] = useState(['Main']);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">QueenTEE</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="min-h-0 flex-1 overflow-y-auto p-4 space-y-6">
            {navigationItems.map((section) => (
              <div key={section.category}>
                <button
                  onClick={() => toggleCategory(section.category)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.category}
                  </span>
                  {expandedCategories.includes(section.category) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {expandedCategories.includes(section.category) && (
                  <div className="mt-2 space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => onClose()}
                          className={`
                            flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                            ${active 
                              ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@queenhair.com</p>
              </div>
            </div>
          </div>
      </div>
    </>
  );
}
