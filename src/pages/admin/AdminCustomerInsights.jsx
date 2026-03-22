import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, ShoppingCart, DollarSign, TrendingUp, Calendar, MapPin, Download, Search, Filter } from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  handleAdminError, 
  safeCalculatePercentage, 
  safeCurrencyFormat, 
  safeNumberFormat,
  processDateRange,
  validateDateRange,
  getSafeArray,
  getSafeObject,
  processCustomerName,
  getChartColors,
  debounce
} from '../../services/adminUtils';

const COLORS = getChartColors();

export default function AdminCustomerInsights() {
  const [insights, setInsights] = useState({
    customerMetrics: {},
    newCustomers: [],
    topCustomers: [],
    customerSegments: [],
    geographicData: [],
    retentionData: [],
    behaviorData: []
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadCustomerInsights();
  }, [dateRange]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, segmentFilter]);

  const loadCustomerInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate date range
      if (!validateDateRange(dateRange)) {
        throw new Error('Invalid date range selected');
      }

      const { days } = processDateRange(dateRange);
      
      const [customersData, ordersData, productsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getOrders(),
        adminService.getProducts()
      ]);

      const customers = getSafeArray(customersData);
      const orders = getSafeArray(ordersData);
      const products = getSafeArray(productsData);

      setCustomers(customers);

      console.log('Customer Insights Data Loaded:', {
        customersCount: customers.length,
        ordersCount: orders.length,
        productsCount: products.length
      });

      // Calculate customer metrics
      const customerMetrics = calculateCustomerMetrics(customers, orders);
      
      // Get new customers over time
      const newCustomers = getNewCustomersData(customers, days);
      
      // Get top customers by spending
      const topCustomers = getTopCustomers(customers, orders);
      
      // Get customer segments
      const customerSegments = getCustomerSegments(customers, orders);
      
      // Get geographic distribution
      const geographicData = getGeographicData(customers);
      
      // Get retention data
      const retentionData = getRetentionData(customers, orders);
      
      // Get customer behavior data
      const behaviorData = getCustomerBehaviorData(customers, orders);

      console.log('Processed Customer Insights Data:', {
        customerMetrics,
        newCustomersPoints: newCustomers.length,
        topCustomersCount: topCustomers.length,
        customerSegmentsCount: customerSegments.length,
        geographicDataPoints: geographicData.length,
        retentionDataPoints: retentionData.length,
        behaviorDataPoints: behaviorData.length
      });

      setInsights({
        customerMetrics,
        newCustomers,
        topCustomers,
        customerSegments,
        geographicData,
        retentionData,
        behaviorData
      });
    } catch (err) {
      console.error('Customer Insights Loading Error:', err);
      setError(handleAdminError(err, 'Failed to load customer insights'));
    } finally {
      setLoading(false);
    }
  };

  const calculateCustomerMetrics = (customers, orders) => {
    const totalCustomers = customers.length;
    const activeCustomers = new Set(orders.map(o => o.user_id).filter(Boolean)).size;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const avgCustomerValue = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;
    const repeatCustomers = customers.filter(customer => {
      const customerOrders = orders.filter(o => o.user_id === customer.id);
      return customerOrders.length > 1;
    }).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return {
      totalCustomers,
      activeCustomers,
      avgCustomerValue,
      repeatRate
    };
  };

  const getNewCustomersData = (customers, days) => {
    const data = [];
    for (let i = Math.min(days - 1, 30); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayCustomers = customers.filter(customer => {
        const customerDate = new Date(customer.created_at);
        return customerDate >= dayStart && customerDate < dayEnd;
      });
      
      data.push({
        date: format(dayStart, 'MMM dd'),
        customers: dayCustomers.length
      });
    }
    return data;
  };

  const getTopCustomers = (customers, orders) => {
    const customerSpending = {};
    
    orders.forEach(order => {
      if (order.user_id) {
        customerSpending[order.user_id] = (customerSpending[order.user_id] || 0) + (order.grand_total || 0);
      }
    });

    return customers
      .map(customer => ({
        id: customer.id,
        name: processCustomerName(customer),
        email: customer.email,
        totalSpent: customerSpending[customer.id] || 0,
        orderCount: orders.filter(o => o.user_id === customer.id).length,
        avgOrderValue: customerSpending[customer.id] ? 
          customerSpending[customer.id] / orders.filter(o => o.user_id === customer.id).length : 0,
        joinedAt: customer.created_at
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  };

  const getCustomerSegments = (customers, orders) => {
    const segments = {
      'New': 0,
      'Active': 0,
      'At Risk': 0,
      'Inactive': 0
    };
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    customers.forEach(customer => {
      const customerOrders = orders.filter(o => o.user_id === customer.id);
      const lastOrder = customerOrders.length > 0 ? 
        new Date(Math.max(...customerOrders.map(o => new Date(o.created_at)))) : null;
      
      if (!lastOrder) {
        segments['New']++;
      } else if (lastOrder >= ninetyDaysAgo) {
        segments['Active']++;
      } else {
        segments['Inactive']++;
      }
    });

    return Object.entries(segments).map(([segment, count]) => ({
      segment,
      count,
      percentage: safeCalculatePercentage(count, customers.length)
    }));
  };

  const getGeographicData = (customers) => {
    const locations = {};
    
    customers.forEach(customer => {
      // Since we don't have addresses data, use a simple geographic distribution
      // In a real implementation, you'd fetch addresses data separately
      const location = 'Unknown'; // Default for now
      locations[location] = (locations[location] || 0) + 1;
    });

    return Object.entries(locations)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getRetentionData = (customers, orders) => {
    const monthlyData = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const monthCustomers = new Set(monthOrders.map(o => o.user_id)).size;
      const returningCustomers = monthOrders.filter(order => {
        const customerOrders = orders.filter(o => o.user_id === order.user_id);
        return customerOrders.length > 1;
      }).length;
      
      monthlyData[format(monthStart, 'MMM yyyy')] = {
        month: format(monthStart, 'MMM'),
        new: monthCustomers - returningCustomers,
        returning: returningCustomers
      };
    }

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  };

  const getCustomerBehaviorData = (customers, orders) => {
    const behavior = {
      one_time: 0,
      occasional: 0,
      regular: 0,
      frequent: 0
    };
    
    customers.forEach(customer => {
      const orderCount = orders.filter(o => o.user_id === customer.id).length;
      
      if (orderCount === 1) {
        behavior.one_time++;
      } else if (orderCount <= 3) {
        behavior.occasional++;
      } else if (orderCount <= 10) {
        behavior.regular++;
      } else {
        behavior.frequent++;
      }
    });

    return Object.entries(behavior).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      count,
      percentage: safeCalculatePercentage(count, customers.length)
    }));
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply segment filter (this would need more complex logic based on actual customer behavior)
    if (segmentFilter !== 'all') {
      // For now, just return filtered by search
    }

    return filtered;
  };

  const exportCustomerData = () => {
    const data = {
      metrics: insights.customerMetrics,
      topCustomers: insights.topCustomers,
      segments: insights.customerSegments,
      geographic: insights.geographicData,
      behavior: insights.behaviorData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-insights-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingState message="Loading customer insights..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadCustomerInsights} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Insights</h1>
          <p className="text-gray-600">Deep dive into customer behavior and preferences</p>
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
            onClick={exportCustomerData}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && (!insights.customerMetrics.totalCustomers && insights.topCustomers.length === 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Data Available</h3>
          <p className="text-gray-600 mb-6">
            There's no customer data to display for the selected time period. This could be because:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto mb-6">
            <li>• No customers have registered yet</li>
            <li>• The selected time period has no customer activity</li>
            <li>• Database tables are still being set up</li>
            <li>• There's a connection issue with the database</li>
          </ul>
          <button
            onClick={loadCustomerInsights}
            className="inline-flex items-center px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
          >
            Refresh Data
          </button>
        </div>
      )}

      {/* Customer Insights Content */}
      {(insights.customerMetrics.totalCustomers || insights.topCustomers.length > 0) && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {insights.customerMetrics.totalCustomers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {insights.customerMetrics.activeCustomers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Repeat Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {insights.customerMetrics.repeatRate ? safeNumberFormat(insights.customerMetrics.repeatRate, 1) : '0.0'}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Customer Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {safeCurrencyFormat(insights.customerMetrics.avgCustomerValue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Customers Trend */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Customers Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={insights.newCustomers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Segments */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={insights.customerSegments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ segment, percentage }) => `${segment}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {insights.customerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Retention */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Retention</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.retentionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="new" stackId="a" fill="#10b981" />
                  <Bar dataKey="returning" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Behavior */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Behavior</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Customers Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Spent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Orders</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Avg Order</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.topCustomers.map((customer, index) => (
                    <tr key={customer.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                          <span className="text-sm text-gray-700">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{customer.email}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {safeCurrencyFormat(customer.totalSpent)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{customer.orderCount}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {safeCurrencyFormat(customer.avgOrderValue)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(customer.joinedAt), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.geographicData.map((location, index) => (
                <div key={location.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{location.location}</span>
                  </div>
                  <span className="text-sm text-gray-600">{location.count} customers</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
