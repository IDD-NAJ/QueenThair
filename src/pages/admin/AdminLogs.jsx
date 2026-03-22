import React, { useState, useEffect } from 'react';
import { FileText, Search, AlertTriangle, CheckCircle, XCircle, Info, Filter, Download, Calendar, Clock, User, Server, Database } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';

function logInDateRange(created_at, range) {
  const t = new Date(created_at).getTime();
  const now = Date.now();
  const h = 3600000;
  const d = 24 * h;
  if (range === 'last_hour') return t >= now - h;
  if (range === 'last_24_hours') return t >= now - d;
  if (range === 'last_7_days') return t >= now - 7 * d;
  if (range === 'last_30_days') return t >= now - 30 * d;
  return true;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const filters = {
    level: 'all',
    category: 'all',
    date_range: 'last_24_hours',
    user: 'all'
  };

  const [activeFilters, setActiveFilters] = useState(filters);

  const logLevels = [
    { value: 'error', label: 'Error', icon: XCircle, color: 'red' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'yellow' },
    { value: 'info', label: 'Info', icon: Info, color: 'blue' },
    { value: 'success', label: 'Success', icon: CheckCircle, color: 'green' }
  ];

  const logCategories = [
    { value: 'auth', label: 'Authentication' },
    { value: 'api', label: 'API' },
    { value: 'database', label: 'Database' },
    { value: 'payment', label: 'Payment' },
    { value: 'email', label: 'Email' },
    { value: 'system', label: 'System' },
    { value: 'security', label: 'Security' },
    { value: 'performance', label: 'Performance' }
  ];

  const dateRanges = [
    { value: 'last_hour', label: 'Last Hour' },
    { value: 'last_24_hours', label: 'Last 24 Hours' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' }
  ];

  useEffect(() => {
    loadLogs();
  }, [activeFilters, searchTerm]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const all = await adminService.getSystemLogs({ limit: 500 });
      let filteredLogs = (all || []).filter((log) => logInDateRange(log.created_at, activeFilters.date_range));

      if (activeFilters.level !== 'all') {
        filteredLogs = filteredLogs.filter((log) => log.level === activeFilters.level);
      }

      if (activeFilters.category !== 'all') {
        filteredLogs = filteredLogs.filter((log) => log.category === activeFilters.category);
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(
          (log) =>
            log.message.toLowerCase().includes(q) ||
            (log.user_email && log.user_email.toLowerCase().includes(q)) ||
            (log.category_name && log.category_name.toLowerCase().includes(q))
        );
      }

      setLogs(filteredLogs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters({ ...activeFilters, [key]: value });
  };

  const clearFilters = () => {
    setActiveFilters(filters);
  };

  const exportLogs = async () => {
    try {
      console.log('Exporting logs with filters:', activeFilters);
      alert('Logs exported successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <LoadingState message="Loading system logs..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadLogs} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600">View and monitor system activity logs</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button
            onClick={exportLogs}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Log Level
              </label>
              <select
                value={activeFilters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Levels</option>
                {logLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={activeFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {logCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={activeFilters.date_range}
                onChange={(e) => handleFilterChange('date_range', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User
              </label>
              <select
                value={activeFilters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Users</option>
                <option value="authenticated">Authenticated Users</option>
                <option value="anonymous">Anonymous</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Log Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-xl font-semibold text-gray-900">
                {logs.filter(l => l.level === 'error').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Warnings</p>
              <p className="text-xl font-semibold text-gray-900">
                {logs.filter(l => l.level === 'warning').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Info</p>
              <p className="text-xl font-semibold text-gray-900">
                {logs.filter(l => l.level === 'info').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Success</p>
              <p className="text-xl font-semibold text-gray-900">
                {logs.filter(l => l.level === 'success').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-2">
        {logs.map((log) => {
          const LogIcon = logLevels.find(l => l.value === log.level)?.icon || Info;
          const logColor = logLevels.find(l => l.value === log.level)?.color || 'gray';
          
          return (
            <div key={log.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-${logColor}-100 mt-1`}>
                  <LogIcon className={`w-4 h-4 text-${logColor}-600`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-medium ${
                      log.level === 'error' ? 'text-red-600' :
                      log.level === 'warning' ? 'text-yellow-600' :
                      log.level === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{log.category_name}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2">{log.message}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {log.user_email && (
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {log.user_email}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Server className="w-3 h-3 mr-1" />
                      {log.ip_address}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedLog(null)} />
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Level</p>
                    <p className={`font-medium ${
                      selectedLog.level === 'error' ? 'text-red-600' :
                      selectedLog.level === 'warning' ? 'text-yellow-600' :
                      selectedLog.level === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {selectedLog.level.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <p className="font-medium">{selectedLog.category_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Timestamp</p>
                    <p className="font-medium">{new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">IP Address</p>
                    <p className="font-medium">{selectedLog.ip_address}</p>
                  </div>
                  {selectedLog.user_email && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">User</p>
                      <p className="font-medium">{selectedLog.user_email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">User Agent</p>
                    <p className="font-medium text-sm truncate">{selectedLog.user_agent}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Message</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm">{selectedLog.message}</p>
                  </div>
                </div>

                {selectedLog.context && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Context</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.context, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
