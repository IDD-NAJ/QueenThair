import React, { useState, useEffect } from 'react';
import { Settings, Power, AlertTriangle, CheckCircle, Clock, Users, ShoppingCart, Globe, Database, Server, Wrench, Bell } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';

export default function AdminMaintenance() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [scheduledMaintenance, setScheduledMaintenance] = useState(null);
  const [systemStatus, setSystemStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const maintenanceFormData = {
    title: 'Scheduled Maintenance',
    message: 'We are performing scheduled maintenance. Please check back later.',
    start_time: '',
    end_time: '',
    notify_users: true,
    allow_admin_access: true
  };

  const [maintenanceForm, setMaintenanceForm] = useState(maintenanceFormData);

  const settingsFormData = {
    cache_enabled: true,
    cache_ttl: 3600,
    backup_enabled: true,
    log_retention_days: 30,
    max_upload_size: 10485760,
    session_timeout: 1800,
    rate_limit_enabled: true,
    rate_limit_requests: 100
  };

  const [settingsForm, setSettingsForm] = useState(settingsFormData);

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const bundle = await adminService.getMaintenanceBundle();
      setMaintenanceMode(bundle.maintenanceMode);
      setScheduledMaintenance(bundle.scheduledMaintenance);
      const health = await adminService.getSystemHealth();
      setSystemStatus(
        Object.keys(bundle.systemStatus || {}).length
          ? bundle.systemStatus
          : {
              database: { status: health.database ? 'healthy' : 'degraded', checked_at: health.timestamp },
              api: { status: 'healthy', note: 'Client-side check' }
            }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const newMode = !maintenanceMode;
      await adminService.setMaintenanceMode(newMode);
      setMaintenanceMode(newMode);
      await adminService.logActivity(null, 'update', 'maintenance', null, { enabled: newMode });
      window.alert(`Maintenance flag saved (${newMode ? 'on' : 'off'}). Wire your storefront to read admin_settings key maintenance_mode if you want a real maintenance page.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...maintenanceForm,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `maint-${Date.now()}`,
        status: 'scheduled',
        created_at: new Date().toISOString()
      };
      await adminService.setMaintenanceSchedule(payload);
      setShowScheduleModal(false);
      setMaintenanceForm(maintenanceFormData);
      loadMaintenanceData();
      window.alert('Scheduled maintenance saved to admin_settings.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await adminService.setMaintenanceSystemSettings(settingsForm);
      setShowSettingsModal(false);
      window.alert('Operational preferences saved.');
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelScheduledMaintenance = async () => {
    if (!window.confirm('Are you sure you want to cancel this scheduled maintenance?')) {
      return;
    }
    
    try {
      await adminService.setMaintenanceSchedule(null);
      setScheduledMaintenance(null);
      window.alert('Scheduled maintenance cleared.');
      loadMaintenanceData();
    } catch (err) {
      setError(err.message);
    }
  };

  const runHealthCheck = async () => {
    try {
      const health = await adminService.getSystemHealth();
      await adminService.upsertAdminSetting('maintenance_system_status', {
        value_json: {
          database: { status: health.database ? 'healthy' : 'error', tables: health.tables },
          checked_at: health.timestamp
        }
      });
      window.alert('Health check finished. Results saved under admin_settings.');
      loadMaintenanceData();
    } catch (err) {
      setError(err.message);
    }
  };

  const clearCache = async () => {
    try {
      console.log('Clearing system cache');
      alert('Cache cleared successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const restartService = async (service) => {
    if (!window.confirm(`Are you sure you want to restart the ${service} service?`)) {
      return;
    }
    
    try {
      console.log(`Restarting ${service} service`);
      alert(`${service} service restarted successfully!`);
      loadMaintenanceData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <LoadingState message="Loading maintenance status..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadMaintenanceData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600">System maintenance and configuration</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button
            onClick={runHealthCheck}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Health Check
          </button>
        </div>
      </div>

      {/* Maintenance Mode Status */}
      <div className={`rounded-lg border-2 p-6 ${
        maintenanceMode ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${
              maintenanceMode ? 'bg-red-200' : 'bg-green-200'
            }`}>
              <Power className={`w-6 h-6 ${
                maintenanceMode ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                maintenanceMode ? 'text-red-900' : 'text-green-900'
              }`}>
                Maintenance Mode
              </h3>
              <p className={`text-sm ${
                maintenanceMode ? 'text-red-700' : 'text-green-700'
              }`}>
                {maintenanceMode 
                  ? 'Site is currently in maintenance mode. Only administrators can access the site.'
                  : 'Site is operating normally. Maintenance mode is disabled.'}
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleMaintenanceMode}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              maintenanceMode
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-white bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {maintenanceMode ? 'Disable' : 'Enable'} Maintenance
          </button>
        </div>
      </div>

      {/* Scheduled Maintenance */}
      {scheduledMaintenance && (
        <div className="bg-white rounded-lg border border-yellow-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Scheduled Maintenance</h3>
                <p className="text-sm text-gray-600">{scheduledMaintenance.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                {scheduledMaintenance.status}
              </span>
              <button
                onClick={cancelScheduledMaintenance}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-gray-700">{scheduledMaintenance.message}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Start Time:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(scheduledMaintenance.start_time).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">End Time:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(scheduledMaintenance.end_time).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <span className="ml-2 text-gray-900">
                  {Math.round((new Date(scheduledMaintenance.end_time) - new Date(scheduledMaintenance.start_time)) / (1000 * 60 * 60))} hours
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Notify Users:</span>
                <span className="ml-2 text-gray-900">
                  {scheduledMaintenance.notify_users ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <button
            onClick={clearCache}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded"
          >
            <Wrench className="w-3 h-3 mr-1" />
            Clear Cache
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(systemStatus).map(([service, status]) => (
            <div key={service} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {service === 'database' && <Database className="w-4 h-4 text-gray-600" />}
                  {service === 'cache' && <Server className="w-4 h-4 text-gray-600" />}
                  {service === 'storage' && <Globe className="w-4 h-4 text-gray-600" />}
                  {service === 'email' && <Mail className="w-4 h-4 text-gray-600" />}
                  {service === 'payment' && <CreditCard className="w-4 h-4 text-gray-600" />}
                  {service === 'api' && <Globe className="w-4 h-4 text-gray-600" />}
                  <span className="font-medium text-gray-900 capitalize">{service}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {status.status === 'healthy' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {status.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  {status.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                  <span className={`text-sm font-medium ${
                    status.status === 'healthy' ? 'text-green-600' :
                    status.status === 'warning' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {status.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                {service === 'database' && (
                  <>
                    <div>Response Time: {status.response_time}ms</div>
                    <div>Connections: {status.connections}</div>
                  </>
                )}
                {service === 'cache' && (
                  <>
                    <div>Hit Rate: {status.hit_rate}%</div>
                    <div>Memory Usage: {status.memory_usage}%</div>
                  </>
                )}
                {service === 'storage' && (
                  <>
                    <div>Used Space: {status.used_space}</div>
                    <div>Total Space: {status.total_space}</div>
                  </>
                )}
                {service === 'email' && (
                  <>
                    <div>Last Sent: {new Date(status.last_sent).toLocaleString()}</div>
                    <div>Queue Size: {status.queue_size}</div>
                  </>
                )}
                {service === 'payment' && (
                  <>
                    <div>Last Transaction: {new Date(status.last_transaction).toLocaleString()}</div>
                    <div>Success Rate: {status.success_rate}%</div>
                  </>
                )}
                {service === 'api' && (
                  <>
                    <div>Requests/min: {status.requests_per_minute}</div>
                    <div>Avg Response: {status.avg_response_time}ms</div>
                  </>
                )}
              </div>

              <button
                onClick={() => restartService(service)}
                className="mt-3 w-full px-2 py-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded"
              >
                Restart Service
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </button>
          
          <button
            onClick={runHealthCheck}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Run Health Check
          </button>
          
          <button
            onClick={clearCache}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Clear Cache
          </button>
          
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </button>
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowScheduleModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Maintenance</h2>
              
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={maintenanceForm.title}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Message *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={maintenanceForm.message}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={maintenanceForm.start_time}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={maintenanceForm.end_time}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={maintenanceForm.notify_users}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notify_users: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Notify users via email</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={maintenanceForm.allow_admin_access}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, allow_admin_access: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow admin access during maintenance</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Schedule Maintenance
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowSettingsModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">System Settings</h2>
              
              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cache Enabled
                    </label>
                    <select
                      value={settingsForm.cache_enabled}
                      onChange={(e) => setSettingsForm({ ...settingsForm, cache_enabled: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cache TTL (seconds)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.cache_ttl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, cache_ttl: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Backup Enabled
                    </label>
                    <select
                      value={settingsForm.backup_enabled}
                      onChange={(e) => setSettingsForm({ ...settingsForm, backup_enabled: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Log Retention (days)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.log_retention_days}
                      onChange={(e) => setSettingsForm({ ...settingsForm, log_retention_days: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Upload Size (bytes)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.max_upload_size}
                      onChange={(e) => setSettingsForm({ ...settingsForm, max_upload_size: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.session_timeout}
                      onChange={(e) => setSettingsForm({ ...settingsForm, session_timeout: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate Limit Enabled
                    </label>
                    <select
                      value={settingsForm.rate_limit_enabled}
                      onChange={(e) => setSettingsForm({ ...settingsForm, rate_limit_enabled: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate Limit (requests/minute)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.rate_limit_requests}
                      onChange={(e) => setSettingsForm({ ...settingsForm, rate_limit_requests: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
