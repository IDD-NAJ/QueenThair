import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react';
import useStore from '../../store/useStore';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../services/addressService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import EmptyState from '../../components/dashboard/EmptyState';

export default function DashboardAddresses() {
  const user = useStore(state => state.user);
  const showToast = useStore(state => state.showToast);
  
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state_region: '',
    postal_code: '',
    country: 'US',
    type: 'shipping'
  });

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAddresses(user.id);
      setAddresses(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateAddress(editingId, formData);
        showToast('Address updated successfully');
      } else {
        await createAddress(formData);
        showToast('Address added successfully');
      }
      
      await loadAddresses();
      resetForm();
    } catch (err) {
      console.error('Failed to save address:', err);
      showToast('Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await deleteAddress(id);
      showToast('Address deleted successfully');
      await loadAddresses();
    } catch (err) {
      showToast('Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      showToast('Default address updated');
      await loadAddresses();
    } catch (err) {
      showToast('Failed to update default address');
    }
  };

  const handleEdit = (address) => {
    setEditingId(address.id);
    setFormData({
      full_name: address.full_name,
      phone: address.phone || '',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state_region: address.state_region,
      postal_code: address.postal_code,
      country: address.country,
      type: address.type
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      full_name: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state_region: '',
      postal_code: '',
      country: 'US',
      type: 'shipping'
    });
  };

  if (loading) {
    return <LoadingState message="Loading your addresses..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAddresses} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
          <p className="text-gray-600">Manage your shipping and billing addresses</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                type="text"
                required
                value={formData.line1}
                onChange={(e) => setFormData({...formData, line1: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                value={formData.line2}
                onChange={(e) => setFormData({...formData, line2: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={formData.state_region}
                  onChange={(e) => setFormData({...formData, state_region: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  required
                  value={formData.postal_code}
                  onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="shipping">Shipping</option>
                <option value="billing">Billing</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
              >
                {editingId ? 'Update Address' : 'Add Address'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <EmptyState
          icon={MapPin}
          title="No addresses saved"
          description="Add your first address to make checkout faster"
          actionLabel="Add Address"
          actionLink="#"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map(address => (
            <div key={address.id} className="bg-white rounded-lg border border-gray-200 p-6 relative">
              {(address.is_default_shipping || address.is_default_billing) && (
                <span className="absolute top-4 right-4 px-2 py-1 bg-gold/10 text-purple-700 text-xs rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {address.is_default_shipping && address.is_default_billing ? 'Default' : 
                   address.is_default_shipping ? 'Default Shipping' : 'Default Billing'}
                </span>
              )}
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-1">{address.full_name}</h3>
                <p className="text-sm text-gray-600">{address.line1}</p>
                {address.line2 && <p className="text-sm text-gray-600">{address.line2}</p>}
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state_region} {address.postal_code}
                </p>
                {address.phone && <p className="text-sm text-gray-600 mt-2">{address.phone}</p>}
              </div>

              <div className="flex gap-2">
                {(!address.is_default_shipping && address.type === 'shipping') && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-sm text-gold hover:text-gold-dark font-medium"
                  >
                    Set as Default Shipping
                  </button>
                )}
                {(!address.is_default_billing && address.type === 'billing') && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-sm text-gold hover:text-gold-dark font-medium"
                  >
                    Set as Default Billing
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
