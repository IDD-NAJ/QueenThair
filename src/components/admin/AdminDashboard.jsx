import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Eye,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  MessageSquare,
  Tag,
  Bell,
  LayoutGrid
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import supabase from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const [dashboardStats, orders, products, notificationData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getOrders({ limit: 5 }),
        adminService.getTopProducts(7, 5),
        userId ? adminService.getNotifications(userId, true) : Promise.resolve([])
      ]);

      setStats(dashboardStats);
      setRecentOrders(orders.slice(0, 5));
      setTopProducts(products);
      setNotifications(notificationData?.slice(0, 5) || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatCard = (title, value, icon, trend, trendValue, color) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCard(
          'Total Revenue',
          `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
          <DollarSign className="w-6 h-6 text-green-600" />,
          'up',
          stats?.revenueToday > 0 ? `+$${stats.revenueToday.toFixed(2)} today` : '+12.5%',
          'green'
        )}
        
        {getStatCard(
          'Total Orders',
          stats?.totalOrders || 0,
          <ShoppingCart className="w-6 h-6 text-blue-600" />,
          'up',
          stats?.ordersToday > 0 ? `+${stats.ordersToday} today` : '+8.2%',
          'blue'
        )}
        
        {getStatCard(
          'Total Customers',
          stats?.totalCustomers || 0,
          <Users className="w-6 h-6 text-purple-600" />,
          'up',
          stats?.newCustomersToday > 0 ? `+${stats.newCustomersToday} today` : '+15.3%',
          'purple'
        )}
        
        {getStatCard(
          'Products',
          stats?.totalProducts || 0,
          <Package className="w-6 h-6 text-orange-600" />,
          'down',
          `${stats?.lowStockProducts || 0} low stock`,
          'orange'
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/admin/products"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <Package className="w-4 h-4 mr-2" />
            Add Product
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Orders
          </Link>
          <Link
            to="/admin/customers"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Customers
          </Link>
          <Link
            to="/admin/analytics"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Link>
          <Link
            to="/admin/homepage-showcase"
            className="flex items-center justify-center px-4 py-3 border border-indigo-200 bg-indigo-50/80 rounded-md text-indigo-800 hover:bg-indigo-100"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Homepage categories
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link
                to="/admin/orders"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${order.grand_total?.toFixed(2) || '0.00'}
                    </p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'order' && <ShoppingCart className="w-4 h-4 text-blue-500" />}
                      {notification.type === 'customer' && <Users className="w-4 h-4 text-green-500" />}
                      {notification.type === 'system' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      {notification.type === 'inventory' && <Package className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                      <p className="text-xs text-gray-500">{product.total_sold} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${product.revenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${product.avg_price.toFixed(2)} avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Database</span>
              </div>
              <span className="text-sm text-green-600">Healthy</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">API</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Storage</span>
              </div>
              <span className="text-sm text-green-600">Normal</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700">Low Stock</span>
              </div>
              <span className="text-sm text-yellow-600">{stats?.lowStockProducts || 0} items</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">Out of Stock</span>
              </div>
              <span className="text-sm text-red-600">{stats?.outOfStockProducts || 0} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">New order</span> #QTH-000123 received
              </p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">New customer</span> registered
              </p>
              <p className="text-xs text-gray-500">15 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Low stock alert</span> for Luxury Hair Extensions
              </p>
              <p className="text-xs text-gray-500">1 hour ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">
                <span className="font-medium">New review</span> submitted for Premium Shampoo
              </p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
