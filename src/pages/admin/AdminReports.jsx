import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Search, TrendingUp, DollarSign, Package, Users, ShoppingCart, BarChart3, Activity } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';
import supabase from '../../lib/supabaseClient';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const reportTypes = [
    { value: 'sales_summary', label: 'Sales Summary', icon: DollarSign, description: 'Daily/weekly/monthly sales overview' },
    { value: 'product_performance', label: 'Product Performance', icon: Package, description: 'Best/worst selling products' },
    { value: 'customer_analysis', label: 'Customer Analysis', icon: Users, description: 'Customer demographics and behavior' },
    { value: 'inventory_report', label: 'Inventory Report', icon: Package, description: 'Stock levels and movements' },
    { value: 'order_summary', label: 'Order Summary', icon: ShoppingCart, description: 'Order status and fulfillment' },
    { value: 'financial_report', label: 'Financial Report', icon: TrendingUp, description: 'Revenue, costs, and profit' },
    { value: 'marketing_performance', label: 'Marketing Performance', icon: BarChart3, description: 'Campaign and conversion metrics' },
    { value: 'tax_report', label: 'Tax Report', icon: FileText, description: 'Tax collected by jurisdiction' }
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const generateFormData = {
    type: '',
    date_range: 'last_30_days',
    start_date: '',
    end_date: '',
    format: 'pdf',
    email_to: '',
    include_charts: true,
    include_details: true
  };

  const [generateForm, setGenerateForm] = useState(generateFormData);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const saved = await adminService.listSavedReports();
      setReports(saved || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    try {
      setLoadingReport(true);
      if (!generateForm.type) {
        window.alert('Select a report type.');
        return;
      }
      const snapshot = await adminService.getReportPayload(generateForm.type, generateForm.date_range);
      const typeMeta = reportTypes.find((r) => r.value === generateForm.type);
      const { data: { user } } = await supabase.auth.getUser();
      let email = user?.email || '';
      if (user?.id) {
        const { data: prof } = await supabase.from('profiles').select('email').eq('id', user.id).maybeSingle();
        if (prof?.email) email = prof.email;
      }
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rep-${Date.now()}`;
      const meta = {
        id,
        name: `${typeMeta?.label || generateForm.type} — ${new Date().toLocaleString()}`,
        type: generateForm.type,
        type_name: typeMeta?.label || generateForm.type,
        date_range: generateForm.date_range,
        format: generateForm.format,
        file_size: '—',
        generated_at: new Date().toISOString(),
        generated_by: email || 'admin',
        download_count: 0,
        file_url: null,
        snapshot
      };
      const list = await adminService.listSavedReports();
      await adminService.saveSavedReports([meta, ...list].slice(0, 40));
      await adminService.logActivity(null, 'create', 'report', id, { type: generateForm.type });
      setShowGenerateModal(false);
      setGenerateForm(generateFormData);
      loadReports();
      window.alert('Report generated from live database and saved to the list.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDownload = async (report) => {
    try {
      console.log('Downloading report:', report.id);
      alert('Report download started!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewReport = async (report) => {
    try {
      setSelectedReport(report);
      setReportData(null);
      const data =
        report.snapshot || (await adminService.getReportPayload(report.type, report.date_range));
      setReportData(data || {});
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        const list = (await adminService.listSavedReports()).filter((r) => r.id !== reportId);
        await adminService.saveSavedReports(list);
        loadReports();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading reports..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadReports} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and view business reports</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-xl font-semibold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-xl font-semibold text-gray-900">
                {reports.reduce((sum, report) => sum + report.download_count, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-xl font-semibold text-gray-900">
                {reports.filter(r => new Date(r.generated_at).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Report Types</p>
              <p className="text-xl font-semibold text-gray-900">
                {[...new Set(reports.map(r => r.type))].length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => {
          const ReportIcon = reportTypes.find(t => t.value === report.type)?.icon || FileText;
          return (
            <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <ReportIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-500">{report.type_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date Range</p>
                      <p className="font-medium">{dateRanges.find(d => d.value === report.date_range)?.label}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Format</p>
                      <p className="font-medium uppercase">{report.format}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">File Size</p>
                      <p className="font-medium">{report.file_size}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Generated</p>
                      <p className="font-medium">{new Date(report.generated_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>by {report.generated_by}</span>
                      <span>{report.download_count} downloads</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowGenerateModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Generate New Report</h2>
              
              <form onSubmit={handleGenerateReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type *
                  </label>
                  <select
                    required
                    value={generateForm.type}
                    onChange={(e) => setGenerateForm({ ...generateForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select report type</option>
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range *
                  </label>
                  <select
                    required
                    value={generateForm.date_range}
                    onChange={(e) => setGenerateForm({ ...generateForm, date_range: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {dateRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(generateForm.date_range === 'custom') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={generateForm.start_date}
                        onChange={(e) => setGenerateForm({ ...generateForm, start_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={generateForm.end_date}
                        onChange={(e) => setGenerateForm({ ...generateForm, end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Format *
                    </label>
                    <select
                      required
                      value={generateForm.format}
                      onChange={(e) => setGenerateForm({ ...generateForm, format: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email To (optional)
                    </label>
                    <input
                      type="email"
                      value={generateForm.email_to}
                      onChange={(e) => setGenerateForm({ ...generateForm, email_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="admin@queenhair.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generateForm.include_charts}
                      onChange={(e) => setGenerateForm({ ...generateForm, include_charts: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include charts and graphs</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generateForm.include_details}
                      onChange={(e) => setGenerateForm({ ...generateForm, include_details: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include detailed breakdowns</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingReport}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  >
                    {loadingReport ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedTemplate(null)} />
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Report Preview: {selectedTemplate.name}
                </h2>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {reportData && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${reportData.totalRevenue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-600">Total Orders</p>
                      <p className="text-2xl font-bold text-green-900">
                        {reportData.totalOrders || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-600">Avg Order Value</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ${reportData.averageOrderValue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  {/* Top Products */}
                  {reportData.topProducts && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
                      <div className="space-y-2">
                        {reportData.topProducts.map((product, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                            <div className="text-right">
                              <span className="text-sm text-gray-600">{product.sales} units</span>
                              <span className="ml-4 text-sm font-medium text-gray-900">
                                ${product.revenue.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
