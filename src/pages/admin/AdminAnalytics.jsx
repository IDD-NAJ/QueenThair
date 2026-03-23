import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar, Download, BarChart3 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  handleAdminError, 
  safeCalculatePercentage, 
  safeCurrencyFormat, 
  safeNumberFormat,
  processDateRange,
  validateDateRange,
  getSafeArray,
  getSafeObject,
  getChartColors
} from '../../services/adminUtils';
import { withTimeout } from '../../utils/safeAsync';

const COLORS = getChartColors();
const TIMEOUT_MS = 30000; // 30 second timeout

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    revenueData: [],
    ordersData: [],
    topProducts: [],
    categoryData: [],
    customerGrowth: [],
    metrics: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const days = parseInt(dateRange);
      
      console.log(`Loading analytics for ${days} days`);
      
      // Fetch real analytics data using RPC functions with timeout
      const [revenueAnalytics, topProducts, customerAnalytics, categoryAnalytics] = await Promise.all([
        withTimeout(() => adminService.getRevenueAnalytics(days), TIMEOUT_MS),
        withTimeout(() => adminService.getTopProducts(days, 10), TIMEOUT_MS),
        withTimeout(() => adminService.getCustomerAnalytics(days), TIMEOUT_MS),
        withTimeout(() => adminService.getCategoryAnalytics(days), TIMEOUT_MS)
      ]);

      console.log('Real Analytics Data Loaded:', {
        revenuePoints: revenueAnalytics?.length || 0,
        topProductsCount: topProducts?.length || 0,
        customerPoints: customerAnalytics?.length || 0,
        categoryPoints: categoryAnalytics?.length || 0
      });

      // Process revenue data for charts
      const revenueData = (revenueAnalytics || []).map(item => ({
        date: format(new Date(item.date), 'MMM dd'),
        revenue: parseFloat(item.revenue) || 0,
        orders: item.orders_count || 0,
        customers: item.unique_customers || 0,
        avgOrderValue: parseFloat(item.avg_order_value) || 0
      }));

      // Process top products data
      const topProductsData = (topProducts || []).map(item => ({
        name: item.product_name || 'Unknown',
        slug: item.product_slug || '',
        sold: item.total_sold || 0,
        revenue: parseFloat(item.revenue) || 0,
        avgPrice: parseFloat(item.avg_price) || 0,
        category: item.category_name || 'Uncategorized'
      }));

      // Process customer growth data
      const customerGrowthData = (customerAnalytics || []).map(item => ({
        date: format(new Date(item.date), 'MMM dd'),
        newCustomers: item.new_customers || 0,
        totalCustomers: item.total_customers || 0,
        repeatCustomers: item.repeat_customers || 0,
        retentionRate: parseFloat(item.customer_retention_rate) || 0
      }));

      // Process category data
      const categoryData = (categoryAnalytics || []).map(item => ({
        name: item.category_name || 'Unknown',
        sold: item.total_sold || 0,
        revenue: parseFloat(item.revenue) || 0,
        orders: item.orders_count || 0,
        avgOrderValue: parseFloat(item.avg_order_value) || 0,
        topProduct: item.top_product || 'N/A'
      }));

      // Calculate summary metrics
      const metrics = {
        totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
        totalOrders: revenueData.reduce((sum, item) => sum + item.orders, 0),
        totalCustomers: customerGrowthData.length > 0 ? customerGrowthData[customerGrowthData.length - 1]?.totalCustomers || 0 : 0,
        avgOrderValue: revenueData.length > 0 ? revenueData.reduce((sum, item) => sum + item.avgOrderValue, 0) / revenueData.length : 0,
        topProductRevenue: topProductsData.length > 0 ? topProductsData[0].revenue : 0,
        customerRetentionRate: customerGrowthData.length > 0 ? customerGrowthData[customerGrowthData.length - 1]?.retentionRate || 0 : 0
      };

      console.log('Processed Real Analytics:', {
        revenueDataPoints: revenueData.length,
        topProductsCount: topProductsData.length,
        customerGrowthPoints: customerGrowthData.length,
        categoryDataPoints: categoryData.length,
        metrics
      });

      setAnalytics({
        revenueData,
        ordersData: revenueData, // Use same data for orders chart
        topProducts: topProductsData,
        categoryData,
        customerGrowth: customerGrowthData,
        metrics
      });

    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (orders, days) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= date && orderDate < endOfDay(date);
      });
      
      data.push({
        date: format(date, 'MMM dd'),
        revenue: dayOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0),
        orders: dayOrders.length
      });
    }
    return data;
  };

  const processOrdersData = (orders, days) => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: safeCalculatePercentage(count, orders.length)
    }));
  };

  const getTopProducts = (orders, products) => {
    const productSales = {};
    
    orders.forEach(order => {
      // Safely access order items
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item && item.product_id && item.quantity) {
            productSales[item.product_id] = (productSales[item.product_id] || 0) + (item.quantity || 0);
          }
        });
      }
    });

    return products
      .map(product => ({
        id: product.id,
        name: product.name || 'Unknown Product',
        sales: productSales[product.id] || 0,
        revenue: (productSales[product.id] || 0) * (product.base_price || 0)
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  };

  const getCategoryData = (orders, products) => {
    const categoryRevenue = {};
    
    orders.forEach(order => {
      // Safely access order items
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item && item.product_id && item.quantity) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              const categoryName = product.category?.name || 'Uncategorized';
              const itemRevenue = item.quantity * (product.base_price || 0);
              categoryRevenue[categoryName] = (categoryRevenue[categoryName] || 0) + itemRevenue;
            }
          }
        });
      }
    });

    return Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getCustomerGrowth = (users, days) => {
    const data = [];
    for (let i = Math.min(days - 1, 30); i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayUsers = users.filter(user => {
        const userDate = new Date(user.created_at);
        return userDate >= date && userDate < endOfDay(date);
      });
      
      data.push({
        date: format(date, 'MMM dd'),
        customers: dayUsers.length
      });
    }
    return data;
  };

  const calculateMetrics = (orders, users, products) => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const conversionRate = users.length > 0 ? (orders.filter(o => o.user_id).length / users.length) * 100 : 0;

    return {
      totalRevenue,
      avgOrderValue,
      conversionRate,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalProducts: products.length
    };
  };

  const exportAnalytics = () => {
    const data = {
      metrics: analytics.metrics,
      topProducts: analytics.topProducts,
      categoryData: analytics.categoryData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingState message="Loading analytics..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAnalytics} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Detailed insights into your business performance</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={exportAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && (!analytics.metrics.totalRevenue && !analytics.metrics.totalOrders) && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
          <p className="text-gray-600 mb-6">
            There's no data to display for the selected time period. This could be because:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto mb-6">
            <li>• No orders have been placed yet</li>
            <li>• The selected time period has no activity</li>
            <li>• Database tables are still being set up</li>
            <li>• There's a connection issue with the database</li>
          </ul>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
          >
            Refresh Data
          </button>
        </div>
      )}

      {/* Analytics Content */}
      {(analytics.metrics.totalRevenue || analytics.metrics.totalOrders) && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {safeCurrencyFormat(analytics.metrics.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {safeCurrencyFormat(analytics.metrics.avgOrderValue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.metrics.conversionRate ? safeNumberFormat(analytics.metrics.conversionRate, 1) : '0.0'}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.metrics.totalProducts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [safeCurrencyFormat(value), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ordersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${safeCurrencyFormat(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [safeCurrencyFormat(value), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Growth */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="customers" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sales</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topProducts.map((product, index) => (
                    <tr key={product.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                          <span className="text-sm text-gray-700">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{product.sales}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {safeCurrencyFormat(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
