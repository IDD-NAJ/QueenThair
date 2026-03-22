import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Edit2, Trash2, Search, MapPin, DollarSign, Percent, Globe, FileText } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';

export default function AdminTaxes() {
  const [taxRules, setTaxRules] = useState([]);
  const [taxClasses, setTaxClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');

  const ruleFormData = {
    name: '',
    country: '',
    state: '',
    postal_codes: '',
    tax_class_id: '',
    rate: '0.00',
    compounding: false,
    shipping: false,
    active: true,
    priority: 1
  };

  const classFormData = {
    name: '',
    slug: '',
    description: ''
  };

  const [ruleForm, setRuleForm] = useState(ruleFormData);
  const [classForm, setClassForm] = useState(classFormData);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { rules, classes } = await adminService.getTaxData();
      setTaxRules(rules);
      setTaxClasses(classes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRule) {
        await adminService.upsertTaxRate(ruleForm, editingRule.id);
        await adminService.logActivity(null, 'update', 'tax_rate', editingRule.id, { name: ruleForm.name });
      } else {
        const t = await adminService.upsertTaxRate(ruleForm);
        await adminService.logActivity(null, 'create', 'tax_rate', t.id, { name: ruleForm.name });
      }
      
      setShowRuleModal(false);
      setEditingRule(null);
      setRuleForm(ruleFormData);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const id = editingClass?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `class-${Date.now()}`);
      const entry = {
        id,
        name: classForm.name,
        slug: classForm.slug,
        description: classForm.description || '',
        created_at: editingClass?.created_at || new Date().toISOString()
      };
      let items;
      if (editingClass) {
        items = taxClasses.map((c) => {
          const { rule_count, ...rest } = c;
          return c.id === editingClass.id ? entry : rest;
        });
      } else {
        items = [
          ...taxClasses.map((c) => {
            const { rule_count, ...rest } = c;
            return rest;
          }).filter((c) => c.id !== 'standard'),
          entry
        ];
      }
      await adminService.saveTaxClasses(items);
      await adminService.logActivity(null, editingClass ? 'update' : 'create', 'tax_class', id, { name: classForm.name });
      setShowClassModal(false);
      setEditingClass(null);
      setClassForm(classFormData);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      country: rule.country,
      state: rule.state || '',
      postal_codes: rule.postal_codes || '',
      tax_class_id: rule.tax_class_id,
      rate: rule.rate,
      compounding: rule.compounding,
      shipping: rule.shipping,
      active: rule.active,
      priority: rule.priority
    });
    setShowRuleModal(true);
  };

  const handleEditClass = (taxClass) => {
    setEditingClass(taxClass);
    setClassForm({
      name: taxClass.name,
      slug: taxClass.slug,
      description: taxClass.description || ''
    });
    setShowClassModal(true);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      try {
        if (type === 'rule') {
          await adminService.deleteTaxRate(id);
          await adminService.logActivity(null, 'delete', 'tax_rate', id, {});
        } else {
          const items = taxClasses
            .filter((c) => c.id !== id)
            .map((c) => {
              const { rule_count, ...rest } = c;
              return rest;
            });
          await adminService.saveTaxClasses(items);
          await adminService.logActivity(null, 'delete', 'tax_class', id, {});
        }
        loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleStatus = async (id, type, active) => {
    try {
      if (type === 'rule') {
        const rule = taxRules.find((r) => r.id === id);
        if (rule) await adminService.upsertTaxRate({ ...rule, active: !active }, id);
      }
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredRules = taxRules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.tax_class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = taxClasses.filter(taxClass =>
    taxClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taxClass.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading tax configuration..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taxes</h1>
          <p className="text-gray-600">Manage tax rules and tax classes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tax Rules
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'classes'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tax Classes
          </button>
        </nav>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => activeTab === 'rules' ? setShowRuleModal(true) : setShowClassModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'rules' ? 'Tax Rule' : 'Tax Class'}
        </button>
      </div>

      {/* Tax Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                      Priority: {rule.priority}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Percent className="w-4 h-4 mr-2" />
                      <span>Rate: {rule.rate}%</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>Country: {rule.country}</span>
                    </div>
                    {rule.state && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>State: {rule.state}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>Class: {rule.tax_class_name}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calculator className="w-4 h-4 mr-2" />
                      <span>
                        {rule.compounding ? 'Compounding' : 'Non-compounding'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>
                        {rule.shipping ? 'Tax on shipping' : 'No shipping tax'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => handleEditRule(rule)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(rule.id, 'tax rule', rule.active)}
                    className="p-1 text-gray-400 hover:text-yellow-600"
                  >
                    {rule.active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id, 'tax rule')}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tax Classes */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {filteredClasses.map((taxClass) => (
            <div key={taxClass.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{taxClass.name}</h3>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      /{taxClass.slug}
                    </span>
                  </div>
                  
                  {taxClass.description && (
                    <p className="text-gray-600 mb-3">{taxClass.description}</p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calculator className="w-4 h-4 mr-2" />
                    <span>{taxClass.rule_count} tax rules</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => handleEditClass(taxClass)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(taxClass.id, 'tax class')}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tax Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowRuleModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingRule ? 'Edit Tax Rule' : 'Add Tax Rule'}
              </h2>
              
              <form onSubmit={handleRuleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={ruleForm.name}
                      onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={ruleForm.rate}
                      onChange={(e) => setRuleForm({ ...ruleForm, rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={ruleForm.country}
                      onChange={(e) => setRuleForm({ ...ruleForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="US, CA, GB (comma-separated country codes)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={ruleForm.state}
                      onChange={(e) => setRuleForm({ ...ruleForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="CA,NY,TX (optional, comma-separated)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Codes
                  </label>
                  <input
                    type="text"
                    value={ruleForm.postal_codes}
                    onChange={(e) => setRuleForm({ ...ruleForm, postal_codes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="90210-90215,10001 (optional, ranges or comma-separated)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Class *
                    </label>
                    <select
                      required
                      value={ruleForm.tax_class_id}
                      onChange={(e) => setRuleForm({ ...ruleForm, tax_class_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select tax class</option>
                      {taxClasses.map(taxClass => (
                        <option key={taxClass.id} value={taxClass.id}>
                          {taxClass.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={ruleForm.priority}
                      onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={ruleForm.compounding}
                      onChange={(e) => setRuleForm({ ...ruleForm, compounding: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Compounding tax (tax on tax)</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={ruleForm.shipping}
                      onChange={(e) => setRuleForm({ ...ruleForm, shipping: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Apply tax to shipping</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={ruleForm.active}
                      onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    {editingRule ? 'Update' : 'Create'} Tax Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tax Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowClassModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingClass ? 'Edit Tax Class' : 'Add Tax Class'}
              </h2>
              
              <form onSubmit={handleClassSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={classForm.slug}
                    onChange={(e) => setClassForm({ ...classForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowClassModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    {editingClass ? 'Update' : 'Create'} Tax Class
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
