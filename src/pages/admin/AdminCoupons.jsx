import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Search, Calendar, Percent, DollarSign, Save, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format } from 'date-fns';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  
    const [formData, setFormData] = useState({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_total: '',
      usage_limit: '',
      is_active: true,
      starts_at: '',
      ends_at: ''
    });

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    filterCoupons();
  }, [coupons, searchTerm, statusFilter]);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await adminService.getCoupons();
      setCoupons(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterCoupons = () => {
      let filtered = [...coupons];

      if (searchTerm) {
        filtered = filtered.filter(coupon =>
          coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter === 'active') {
        filtered = filtered.filter(coupon => coupon.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(coupon => !coupon.is_active);
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(coupon => 
          coupon.ends_at && new Date(coupon.ends_at) < new Date()
        );
      }

      setFilteredCoupons(filtered);
    };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code || '',
        description: coupon.description || '',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value || '',
        min_order_total: coupon.min_order_total || '',
        usage_limit: coupon.usage_limit || '',
        is_active: coupon.is_active ?? true,
        starts_at: coupon.starts_at ? format(new Date(coupon.starts_at), 'yyyy-MM-dd') : '',
        ends_at: coupon.ends_at ? format(new Date(coupon.ends_at), 'yyyy-MM-dd') : ''
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_total: '',
        usage_limit: '',
        is_active: true,
        starts_at: '',
        ends_at: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
        const couponData = {
          ...formData,
          discount_value: parseFloat(formData.discount_value),
          min_order_total: formData.min_order_total ? parseFloat(formData.min_order_total) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
          ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null
        };

      if (editingCoupon) {
        await adminService.updateCoupon(editingCoupon.id, couponData);
        
        // Log activity
        await adminService.logActivity(null, 'update', 'coupon', editingCoupon.id, {
          changes: couponData
        });
      } else {
        const newCoupon = await adminService.createCoupon(couponData);
        
        // Log activity
        await adminService.logActivity(null, 'create', 'coupon', newCoupon.id, {
          coupon: couponData
        });
      }

      await loadCoupons();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save coupon:', err);
      alert('Failed to save coupon: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) return;
    
    try {
      await adminService.deleteCoupon(id);
      
      // Log activity
      await adminService.logActivity(null, 'delete', 'coupon', id, {
        deleted: true
      });
      
      await loadCoupons();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      alert('Failed to delete coupon: ' + err.message);
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      await adminService.updateCoupon(coupon.id, { is_active: !coupon.is_active });
      
      // Log activity
      await adminService.logActivity(null, 'update', 'coupon', coupon.id, {
        status: !coupon.is_active
      });
      
      await loadCoupons();
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
      alert('Failed to toggle coupon status: ' + err.message);
    }
  };

  const getStatusBadge = (coupon) => {
    if (!coupon.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>;
    }
    if (coupon.ends_at && new Date(coupon.ends_at) < new Date()) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
  };

  const getUsageStats = (coupon) => {
    const used = coupon.used_count || 0;
    const limit = coupon.usage_limit;
    const percentage = limit ? Math.round((used / limit) * 100) : 0;
    return { used, limit: limit || 'Unlimited', percentage };
  };

  if (loading) {
    return <LoadingState message="Loading coupons..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadCoupons} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Promo Codes & Coupons</h1>
          <p className="text-sm sm:text-base text-gray-600">{filteredCoupons.length} total coupons</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCoupons.map(coupon => {
                const stats = getUsageStats(coupon);
                return (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{coupon.code}</p>
                        <p className="text-sm text-gray-500">{coupon.name}</p>
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{coupon.discount_value}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">${coupon.discount_value}</span>
                            </>
                          )}
                          {coupon.min_order_total && (
                            <span className="text-xs text-gray-500">
                              (min ${coupon.min_order_total})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {coupon.used_count || 0} / {coupon.usage_limit || 'Unlimited'}
                            </span>
                            {coupon.usage_limit && (
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(Math.round(((coupon.used_count || 0) / coupon.usage_limit) * 100), 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {coupon.starts_at && (
                            <p>From: {format(new Date(coupon.starts_at), 'MMM dd, yyyy')}</p>
                          )}
                          {coupon.ends_at && (
                            <p>To: {format(new Date(coupon.ends_at), 'MMM dd, yyyy')}</p>
                          )}
                          {!coupon.starts_at && !coupon.ends_at && (
                            <p>No expiration</p>
                          )}
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(coupon)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleStatus(coupon)}
                          className={`px-2 py-1 text-xs rounded ${
                            coupon.is_active 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {coupon.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => handleOpenModal(coupon)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit Coupon"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coupon Code *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold uppercase"
                        />
                        <button
                          type="button"
                          onClick={generateCouponCode}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Generate
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Enter coupon description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                  </div>
              </div>

              {/* Discount Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Discount Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type *
                    </label>
                    <select
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount_value"
                        value={formData.discount_value}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder={formData.discount_type === 'percentage' ? '10' : '10.00'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {formData.discount_type === 'percentage' ? '%' : '$'}
                      </div>
                    </div>
                  </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Order Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="min_order_total"
                          value={formData.min_order_total}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="50.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          $
                        </div>
                      </div>
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      name="usage_limit"
                      value={formData.usage_limit}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="Leave empty for unlimited"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Validity Period</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="starts_at"
                      value={formData.starts_at}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        name="ends_at"
                        value={formData.ends_at}
                        onChange={handleInputChange}
                        min={formData.starts_at}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gold focus:ring-gold rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
