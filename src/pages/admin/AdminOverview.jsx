import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/dashboard/StatCard';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format } from 'date-fns';
import { withTimeout } from '../../utils/safeAsync';

const TIMEOUT_MS = 30000; // 30 second timeout

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await withTimeout(() => adminService.getDashboardStats(), TIMEOUT_MS);
      
      setStats(stats);
      
      // Get recent orders with better data
      const ordersData = await withTimeout(() => adminService.getOrders({ limit: 10 }), TIMEOUT_MS);
      setRecentOrders(ordersData.slice(0, 5));
    } catch (err) {
      console.error('Dashboard data load error:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
          trend="up"
          trendValue={stats?.revenueToday > 0 ? `+$${stats.revenueToday.toFixed(2)} today` : '+12.5%'}
          color="green"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats?.totalOrders || 0}
          trend="up"
          trendValue={stats?.ordersToday > 0 ? `+${stats.ordersToday} today` : '+8.2%'}
          color="blue"
        />
        <StatCard
          icon={Package}
          label="Pending Orders"
          value={stats?.pendingOrders || 0}
          trend={stats?.processingOrders > 0 ? 'up' : 'down'}
          trendValue={`${stats?.processingOrders || 0} processing`}
          color="orange"
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={stats?.totalCustomers || 0}
          trend="up"
          trendValue={stats?.newCustomersToday > 0 ? `+${stats.newCustomersToday} today` : '+15.3%'}
          color="purple"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={TrendingUp}
          label="Avg Order Value"
          value={`$${stats?.avgOrderValue?.toFixed(2) || '0.00'}`}
          trend="up"
          trendValue="+5.2%"
          color="indigo"
        />
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats?.totalProducts || 0}
          trend="up"
          trendValue={`${stats?.lowStockProducts || 0} low stock`}
          color="cyan"
        />
        <StatCard
          icon={Package}
          label="Out of Stock"
          value={stats?.outOfStockProducts || 0}
          trend={stats?.outOfStockProducts > 0 ? 'down' : 'up'}
          trendValue="Needs attention"
          color="red"
        />
        <StatCard
          icon={Star}
          label="Reviews"
          value={stats?.totalReviews || 0}
          trend="up"
          trendValue={`${stats?.pendingReviews || 0} pending`}
          color="yellow"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{order.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">${order.grand_total?.toFixed(2) || '0.00'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Order Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-medium text-orange-600">{stats?.pendingOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Processing</span>
              <span className="text-sm font-medium text-blue-600">
                {stats?.processingOrders || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shipped</span>
              <span className="text-sm font-medium text-green-600">
                {stats?.shippedOrders || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Delivered</span>
              <span className="text-sm font-medium text-emerald-600">
                {stats?.deliveredOrders || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Revenue Trend</h3>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">
              ${stats?.revenueThisMonth?.toFixed(2) || '0.00'}
            </span>
          </div>
          <p className="text-sm text-green-600">
            {stats?.revenueToday > 0 ? `+$${stats.revenueToday.toFixed(2)} today` : 'No revenue today'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Customer Growth</h3>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</span>
          </div>
          <p className="text-sm text-purple-600">
            {stats?.newCustomersThisMonth > 0 ? `+${stats.newCustomersThisMonth} this month` : 'No new customers this month'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">System Health</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Low Stock</span>
              <span className="text-sm font-medium text-yellow-600">{stats?.lowStockProducts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Out of Stock</span>
              <span className="text-sm font-medium text-red-600">{stats?.outOfStockProducts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Reviews</span>
              <span className="text-sm font-medium text-orange-600">{stats?.pendingReviews || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
