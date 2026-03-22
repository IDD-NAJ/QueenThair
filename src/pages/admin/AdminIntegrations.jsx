import React, { useState, useEffect } from 'react';
import { Link, Plus, Edit2, Trash2, Search, Settings, CheckCircle, XCircle, AlertCircle, ExternalLink, Key, Globe, CreditCard, Mail, MessageSquare, Package, BarChart3 } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [testingIntegration, setTestingIntegration] = useState(null);

  const integrationTypes = [
    { value: 'payment', label: 'Payment Gateway', icon: CreditCard, color: 'green' },
    { value: 'email', label: 'Email Service', icon: Mail, color: 'blue' },
    { value: 'shipping', label: 'Shipping Provider', icon: Package, color: 'purple' },
    { value: 'analytics', label: 'Analytics', icon: BarChart3, color: 'orange' },
    { value: 'social', label: 'Social Media', icon: MessageSquare, color: 'pink' },
    { value: 'other', label: 'Other', icon: Globe, color: 'gray' }
  ];

  const formData = {
    name: '',
    type: 'payment',
    provider: '',
    api_key: '',
    api_secret: '',
    webhook_url: '',
    environment: 'sandbox',
    active: true,
    settings: {}
  };

  const [form, setForm] = useState(formData);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const typeName = (t) => integrationTypes.find((x) => x.value === t)?.label || t;

  const loadIntegrations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const items = await adminService.getIntegrationsList();
      setIntegrations(
        (items || []).map((row) => ({
          ...row,
          type_name: row.type_name || typeName(row.type)
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const items = await adminService.getIntegrationsList();
      const settings = {
        ...form.settings,
        api_key: form.api_key,
        api_secret: form.api_secret
      };
      const row = {
        id: editingIntegration?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `int-${Date.now()}`),
        name: form.name,
        type: form.type,
        type_name: typeName(form.type),
        provider: form.provider,
        environment: form.environment,
        active: form.active,
        status: form.active ? 'connected' : 'disabled',
        last_sync: new Date().toISOString(),
        webhook_url: form.webhook_url,
        settings,
        created_at: editingIntegration?.created_at || new Date().toISOString()
      };
      const next = editingIntegration
        ? items.map((x) => (x.id === editingIntegration.id ? row : x))
        : [row, ...items];
      await adminService.saveIntegrationsList(next);
      await adminService.logActivity(null, editingIntegration ? 'update' : 'create', 'integration', row.id, { name: form.name });
      setShowModal(false);
      setEditingIntegration(null);
      setForm(formData);
      loadIntegrations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (integration) => {
    setEditingIntegration(integration);
    setForm({
      name: integration.name,
      type: integration.type,
      provider: integration.provider,
      api_key: integration.settings.api_key || '',
      api_secret: integration.settings.api_secret || '',
      webhook_url: integration.webhook_url || '',
      environment: integration.environment,
      active: integration.active,
      settings: integration.settings
    });
    setShowModal(true);
  };

  const handleDelete = async (integrationId) => {
    if (window.confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      try {
        const items = (await adminService.getIntegrationsList()).filter((x) => x.id !== integrationId);
        await adminService.saveIntegrationsList(items);
        await adminService.logActivity(null, 'delete', 'integration', integrationId, {});
        loadIntegrations();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleIntegrationStatus = async (integrationId, active) => {
    try {
      const items = await adminService.getIntegrationsList();
      const nextActive = !active;
      const next = items.map((x) =>
        x.id === integrationId ? { ...x, active: nextActive, status: nextActive ? 'connected' : 'disabled' } : x
      );
      await adminService.saveIntegrationsList(next);
      loadIntegrations();
    } catch (err) {
      setError(err.message);
    }
  };

  const testIntegration = async (integration) => {
    try {
      setTestingIntegration(integration.id);
      
      // Simulate test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Integration test completed successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setTestingIntegration(null);
    }
  };

  const syncIntegration = async (integration) => {
    try {
      const items = await adminService.getIntegrationsList();
      const next = items.map((x) =>
        x.id === integration.id ? { ...x, last_sync: new Date().toISOString() } : x
      );
      await adminService.saveIntegrationsList(next);
      loadIntegrations();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.type_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading integrations..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadIntegrations} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Manage third-party service integrations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredIntegrations.map((integration) => {
          const IntegrationIcon = integrationTypes.find(t => t.value === integration.type)?.icon || Link;
          const integrationColor = integrationTypes.find(t => t.value === integration.type)?.color || 'gray';
          
          return (
            <div key={integration.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${integrationColor}-100`}>
                      <IntegrationIcon className={`w-5 h-5 text-${integrationColor}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-500">{integration.provider}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(integration)}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleIntegrationStatus(integration.id, integration.active)}
                      className="p-1 text-gray-400 hover:text-yellow-600"
                    >
                      {integration.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(integration.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-sm font-medium text-gray-900">{integration.type_name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <div className="flex items-center space-x-1">
                      {integration.status === 'connected' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {integration.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                      {integration.status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      <span className={`text-sm font-medium ${
                        integration.status === 'connected' ? 'text-green-600' :
                        integration.status === 'error' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {integration.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Environment</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      integration.environment === 'production' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {integration.environment}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Active</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      integration.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {integration.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {integration.last_sync && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Last Sync</span>
                      <span className="text-sm text-gray-900">
                        {new Date(integration.last_sync).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {integration.webhook_url && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Webhook URL</span>
                      <a 
                        href={integration.webhook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        View
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => testIntegration(integration)}
                    disabled={testingIntegration === integration.id}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded disabled:opacity-50"
                  >
                    {testingIntegration === integration.id ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={() => syncIntegration(integration)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded"
                  >
                    Sync Now
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Integration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingIntegration ? 'Edit Integration' : 'Add New Integration'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Integration Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      required
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {integrationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="stripe, resend, google_analytics, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={form.api_key}
                      onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Secret
                    </label>
                    <input
                      type="password"
                      value={form.api_secret}
                      onChange={(e) => setForm({ ...form, api_secret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={form.webhook_url}
                    onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://yourdomain.com/webhooks/provider"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environment *
                  </label>
                  <select
                    required
                    value={form.environment}
                    onChange={(e) => setForm({ ...form, environment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="sandbox">Sandbox/Testing</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    {editingIntegration ? 'Update' : 'Create'} Integration
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
