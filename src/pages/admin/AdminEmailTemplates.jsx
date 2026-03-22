import React, { useState, useEffect } from 'react';
import { Mail, Edit2, Eye, Search, Plus, Send, FileText, Code, User, ShoppingCart, Package, Star } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');

  const templateTypes = [
    { value: 'order_confirmation', label: 'Order Confirmation', icon: ShoppingCart },
    { value: 'shipping_confirmation', label: 'Shipping Confirmation', icon: Package },
    { value: 'customer_welcome', label: 'Customer Welcome', icon: User },
    { value: 'password_reset', label: 'Password Reset', icon: Mail },
    { value: 'newsletter_welcome', label: 'Newsletter Welcome', icon: Send },
    { value: 'review_request', label: 'Review Request', icon: Star },
    { value: 'contact_reply', label: 'Contact Reply', icon: FileText }
  ];

  const formData = {
    name: '',
    type: '',
    subject: '',
    from_email: '',
    from_name: '',
    reply_to: '',
    html_content: '',
    text_content: '',
    variables: '',
    active: true
  };

  const [form, setForm] = useState(formData);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const items = await adminService.getEmailTemplatesStore();
      setTemplates(items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const items = await adminService.getEmailTemplatesStore();
      const now = new Date().toISOString();
      const id = editingTemplate?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tpl-${Date.now()}`);
      const row = {
        id,
        ...form,
        created_at: editingTemplate?.created_at || now,
        updated_at: now,
        usage_count: editingTemplate?.usage_count || 0
      };
      const next = editingTemplate ? items.map((t) => (t.id === editingTemplate.id ? row : t)) : [row, ...items];
      await adminService.saveEmailTemplatesStore(next);
      await adminService.logActivity(null, editingTemplate ? 'update' : 'create', 'email_template', id, { name: form.name });
      setShowModal(false);
      setEditingTemplate(null);
      setForm(formData);
      loadTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      type: template.type,
      subject: template.subject,
      from_email: template.from_email,
      from_name: template.from_name,
      reply_to: template.reply_to,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables,
      active: template.active
    });
    setShowModal(true);
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this email template? This action cannot be undone.')) {
      try {
        const items = (await adminService.getEmailTemplatesStore()).filter((t) => t.id !== templateId);
        await adminService.saveEmailTemplatesStore(items);
        await adminService.logActivity(null, 'delete', 'email_template', templateId, {});
        loadTemplates();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleTemplateStatus = async (templateId, active) => {
    try {
      const items = await adminService.getEmailTemplatesStore();
      const next = items.map((t) => (t.id === templateId ? { ...t, active: !active } : t));
      await adminService.saveEmailTemplatesStore(next);
      loadTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  const sendTestEmail = async (templateId) => {
    try {
      window.alert('Sending mail requires your email provider API (e.g. Resend). Template definitions are stored in admin_settings.');
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading email templates..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadTemplates} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600">Manage email templates and notifications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => {
          const TemplateIcon = templateTypes.find(t => t.value === template.type)?.icon || Mail;
          return (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <TemplateIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">
                        {templateTypes.find(t => t.value === template.type)?.label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePreview(template)}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Subject</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{template.subject}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">From</p>
                      <p className="text-gray-600">
                        {template.from_name} &lt;{template.from_email}&gt;
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Reply To</p>
                      <p className="text-gray-600">{template.reply_to}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Variables</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.split(',').map((variable, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {`{{${variable.trim()}}}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {template.usage_count} uses
                      </span>
                    </div>
                    
                    <button
                      onClick={() => sendTestEmail(template.id)}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Send Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingTemplate ? 'Edit Email Template' : 'Add Email Template'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
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
                      Template Type *
                    </label>
                    <select
                      required
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select type</option>
                      {templateTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Use {{variable}} for dynamic content"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.from_email}
                      onChange={(e) => setForm({ ...form, from_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.from_name}
                      onChange={(e) => setForm({ ...form, from_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reply To Email
                    </label>
                    <input
                      type="email"
                      value={form.reply_to}
                      onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* HTML Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTML Content *
                  </label>
                  <div className="relative">
                    <textarea
                      rows={8}
                      required
                      value={form.html_content}
                      onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      placeholder="HTML content with {{variables}}"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plain Text Content
                  </label>
                  <textarea
                    rows={4}
                    value={form.text_content}
                    onChange={(e) => setForm({ ...form, text_content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    placeholder="Plain text version for email clients that don't support HTML"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Variables
                  </label>
                  <input
                    type="text"
                    value={form.variables}
                    onChange={(e) => setForm({ ...form, variables: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="order_number,customer_name,total (comma-separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    List of variables available in this template (comma-separated, no {{ }})
                  </p>
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
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPreview(false)} />
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Preview: {selectedTemplate.name}</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Email Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Subject:</span> {selectedTemplate.subject}
                    </div>
                    <div>
                      <span className="font-medium">From:</span> {selectedTemplate.from_name} &lt;{selectedTemplate.from_email}&gt;
                    </div>
                    <div>
                      <span className="font-medium">Reply To:</span> {selectedTemplate.reply_to}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {templateTypes.find(t => t.value === selectedTemplate.type)?.label}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">HTML Preview</h3>
                  <div 
                    className="border border-gray-200 rounded bg-white p-4"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }}
                  />
                </div>

                {selectedTemplate.text_content && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Plain Text Version</h3>
                    <div className="border border-gray-200 rounded bg-white p-4 font-mono text-sm whitespace-pre-wrap">
                      {selectedTemplate.text_content}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.split(',').map((variable, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded font-mono">
                        {`{{${variable.trim()}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
