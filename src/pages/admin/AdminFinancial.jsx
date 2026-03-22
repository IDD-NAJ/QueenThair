import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, ShoppingCart, Calendar, Download, Filter, FileText } from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { 
  handleAdminError, 
  safeCalculatePercentage, 
  safeCurrencyFormat, 
  safeNumberFormat,
  processDateRange,
  validateDateRange,
  getSafeArray,
  getSafeObject,
  getChartColors,
  calculateGrowthRate
} from '../../services/adminUtils';

const COLORS = getChartColors();

export default function AdminFinancial() {
  const [financialData, setFinancialData] = useState({
    revenueMetrics: {},
    revenueTrend: [],
    monthlyRevenue: [],
    paymentMethods: [],
    orderValueDistribution: [],
    refundsData: [],
    profitAnalysis: [],
    cashFlow: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('revenue');

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate date range
      if (!validateDateRange(dateRange)) {
        throw new Error('Invalid date range selected');
      }

      const { days } = processDateRange(dateRange);
      
      const [ordersData, productsData] = await Promise.all([
        adminService.getOrders(),
        adminService.getProducts()
      ]);

      const orders = getSafeArray(ordersData);
      const products = getSafeArray(productsData);

      // Calculate revenue metrics
      const revenueMetrics = calculateRevenueMetrics(orders);
      
      // Get revenue trend
      const revenueTrend = getRevenueTrend(orders, days);
      
      // Get monthly revenue
      const monthlyRevenue = getMonthlyRevenue(orders);
      
      // Get payment methods distribution
      const paymentMethods = getPaymentMethodsData(orders);
      
      // Get order value distribution
      const orderValueDistribution = getOrderValueDistribution(orders);
      
      // Get refunds data
      const refundsData = getRefundsData(orders);
      
      // Get profit analysis
      const profitAnalysis = getProfitAnalysis(orders, products);
      
      // Get cash flow data
      const cashFlow = getCashFlowData(orders);

      setFinancialData({
        revenueMetrics,
        revenueTrend,
        monthlyRevenue,
        paymentMethods,
        orderValueDistribution,
        refundsData,
        profitAnalysis,
        cashFlow
      });
    } catch (err) {
      setError(handleAdminError(err, 'Failed to load financial data'));
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueMetrics = (orders) => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate growth (comparing to previous period)
    const now = new Date();
    const days = parseInt(dateRange);
    const currentPeriod = subDays(now, days);
    const previousPeriod = subDays(currentPeriod, days);
    
    const currentOrders = orders.filter(order => new Date(order.created_at) >= currentPeriod);
    const previousOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previousPeriod && orderDate < currentPeriod;
    });
    
    const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    
    const revenueGrowth = calculateGrowthRate(currentRevenue, previousRevenue);
    
    // Calculate refunds
    const refundedOrders = orders.filter(order => order.status === 'refunded');
    const totalRefunds = refundedOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const refundRate = safeCalculatePercentage(totalRefunds, totalRevenue);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueGrowth,
      totalRefunds,
      refundRate,
      netRevenue: totalRevenue - totalRefunds
    };
  };

  const getRevenueTrend = (orders, days) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= date && orderDate < endOfDay(date);
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
      const dayOrdersCount = dayOrders.length;
      
      data.push({
        date: format(date, 'MMM dd'),
        revenue: dayRevenue,
        orders: dayOrdersCount,
        avgOrderValue: dayOrdersCount > 0 ? dayRevenue / dayOrdersCount : 0
      });
    }
    return data;
  };

  const getMonthlyRevenue = (orders) => {
    const monthlyData = {};
    
    orders.forEach(order => {
      const month = format(new Date(order.created_at), 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, orders: 0, refunds: 0 };
      }
      
      if (order.status === 'refunded') {
        monthlyData[month].refunds += order.grand_total || 0;
      } else {
        monthlyData[month].revenue += order.grand_total || 0;
      }
      monthlyData[month].orders += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
        netRevenue: data.revenue - data.refunds
      }))
      .slice(-12); // Last 12 months
  };

  const getPaymentMethodsData = (orders) => {
    const methods = {};
    
    orders.forEach(order => {
      const method = order.payment_method || 'Unknown';
      methods[method] = (methods[method] || 0) + (order.grand_total || 0);
    });

    return Object.entries(methods).map(([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount,
      percentage: (amount / orders.reduce((sum, order) => sum + (order.grand_total || 0), 0)) * 100
    }));
  };

  const getOrderValueDistribution = (orders) => {
    const ranges = {
      '0-25': 0,
      '25-50': 0,
      '50-100': 0,
      '100-250': 0,
      '250-500': 0,
      '500+': 0
    };

    orders.forEach(order => {
      const value = order.grand_total || 0;
      if (value < 25) ranges['0-25']++;
      else if (value < 50) ranges['25-50']++;
      else if (value < 100) ranges['50-100']++;
      else if (value < 250) ranges['100-250']++;
      else if (value < 500) ranges['250-500']++;
      else ranges['500+']++;
    });

    return Object.entries(ranges).map(([range, count]) => ({
      range: `$${range}`,
      count,
      percentage: (count / orders.length) * 100
    }));
  };

  const getRefundsData = (orders) => {
    const refundedOrders = orders.filter(order => order.status === 'refunded');
    
    const monthlyRefunds = {};
    refundedOrders.forEach(order => {
      const month = format(new Date(order.created_at), 'MMM yyyy');
      monthlyRefunds[month] = (monthlyRefunds[month] || 0) + (order.grand_total || 0);
    });

    return Object.entries(monthlyRefunds)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6); // Last 6 months
  };

  const getProfitAnalysis = (orders, products) => {
    // This is a simplified profit analysis
    // In a real scenario, you'd need cost data for products
    const totalRevenue = orders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const estimatedCosts = totalRevenue * 0.6; // Assuming 60% cost
    const grossProfit = totalRevenue - estimatedCosts;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      estimatedCosts,
      grossProfit,
      profitMargin
    };
  };

  const getCashFlowData = (orders) => {
    const monthlyCashFlow = {};
    
    orders.forEach(order => {
      const month = format(new Date(order.created_at), 'MMM yyyy');
      if (!monthlyCashFlow[month]) {
        monthlyCashFlow[month] = { inflow: 0, outflow: 0 };
      }
      
      if (order.status === 'refunded') {
        monthlyCashFlow[month].outflow += order.grand_total || 0;
      } else if (order.status === 'paid') {
        monthlyCashFlow[month].inflow += order.grand_total || 0;
      }
    });

    return Object.entries(monthlyCashFlow)
      .map(([month, data]) => ({
        month,
        ...data,
        netCashFlow: data.inflow - data.outflow
      }))
      .slice(-6); // Last 6 months
  };

  const exportFinancialReport = () => {
    const reportData = {
      type: reportType,
      metrics: financialData.revenueMetrics,
      data: financialData,
      generatedAt: new Date().toISOString(),
      period: `Last ${dateRange} days`
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingState message="Loading financial data..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadFinancialData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive financial analysis and reporting</p>
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
            <option value="365">Last year</option>
          </select>
          <button
            onClick={exportFinancialReport}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialData.revenueMetrics.totalRevenue?.toFixed(2) || '0.00'}
              </p>
              <div className={`flex items-center gap-1 text-sm ${
                financialData.revenueMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {financialData.revenueMetrics.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(financialData.revenueMetrics.revenueGrowth)?.toFixed(1)}%
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialData.revenueMetrics.netRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500">After refunds</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialData.revenueMetrics.avgOrderValue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Refund Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {financialData.revenueMetrics.refundRate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-xs text-gray-500">
                ${financialData.revenueMetrics.totalRefunds?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={financialData.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
              <Bar dataKey="revenue" fill="#10b981" />
              <Bar dataKey="refunds" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={financialData.paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ method, percentage }) => `${method}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {financialData.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Order Value Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Value Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialData.orderValueDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-lg font-bold text-gray-900">
              ${financialData.profitAnalysis.totalRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Estimated Costs</p>
            <p className="text-lg font-bold text-red-600">
              ${financialData.profitAnalysis.estimatedCosts?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Gross Profit</p>
            <p className="text-lg font-bold text-green-600">
              ${financialData.profitAnalysis.grossProfit?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Profit Margin</p>
            <p className="text-lg font-bold text-blue-600">
              {financialData.profitAnalysis.profitMargin?.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financialData.cashFlow}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
            <Bar dataKey="inflow" fill="#10b981" />
            <Bar dataKey="outflow" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
