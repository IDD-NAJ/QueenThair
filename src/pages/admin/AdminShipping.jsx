import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, Search, MapPin, DollarSign, Package, Clock, Globe, Eye, EyeOff } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';

export default function AdminShipping() {
  const [shippingZones, setShippingZones] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  const [activeTab, setActiveTab] = useState('zones');

  const zoneFormData = {
    name: '',
    countries: '',
    states: '',
    postal_codes: '',
    active: true
  };

  const rateFormData = {
    name: '',
    zone_id: '',
    type: 'flat_rate',
    base_cost: '0.00',
    cost_per_item: '0.00',
    cost_per_weight: '0.00',
    free_shipping_threshold: '',
    min_delivery_days: '',
    max_delivery_days: '',
    active: true
  };

  const [zoneForm, setZoneForm] = useState(zoneFormData);
  const [rateForm, setRateForm] = useState(rateFormData);

  const shippingTypes = [
    { value: 'flat_rate', label: 'Flat Rate' },
    { value: 'per_item', label: 'Per Item' },
    { value: 'per_weight', label: 'Per Weight' },
    { value: 'free_shipping', label: 'Free Shipping' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { zones, rates } = await adminService.getShippingZonesWithRates();
      setShippingZones(zones);
      setShippingRates(rates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleZoneSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingZone) {
        await adminService.upsertShippingZone(zoneForm, editingZone.id);
        await adminService.logActivity(null, 'update', 'shipping_zone', editingZone.id, { name: zoneForm.name });
      } else {
        const z = await adminService.upsertShippingZone(zoneForm);
        await adminService.logActivity(null, 'create', 'shipping_zone', z.id, { name: zoneForm.name });
      }
      
      setShowZoneModal(false);
      setEditingZone(null);
      setZoneForm(zoneFormData);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRate) {
        await adminService.upsertShippingRate(rateForm, editingRate.id);
        await adminService.logActivity(null, 'update', 'shipping_rate', editingRate.id, { name: rateForm.name });
      } else {
        const r = await adminService.upsertShippingRate(rateForm);
        await adminService.logActivity(null, 'create', 'shipping_rate', r.id, { name: rateForm.name });
      }
      
      setShowRateModal(false);
      setEditingRate(null);
      setRateForm(rateFormData);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditZone = (zone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      countries: zone.countries,
      states: zone.states || '',
      postal_codes: zone.postal_codes || '',
      active: zone.active
    });
    setShowZoneModal(true);
  };

  const handleEditRate = (rate) => {
    setEditingRate(rate);
    setRateForm({
      name: rate.name,
      zone_id: rate.zone_id,
      type: rate.type,
      base_cost: rate.base_cost,
      cost_per_item: rate.cost_per_item,
      cost_per_weight: rate.cost_per_weight,
      free_shipping_threshold: rate.free_shipping_threshold || '',
      min_delivery_days: rate.min_delivery_days || '',
      max_delivery_days: rate.max_delivery_days || '',
      active: rate.active
    });
    setShowRateModal(true);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      try {
        if (type === 'zone') {
          await adminService.deleteShippingZone(id);
          await adminService.logActivity(null, 'delete', 'shipping_zone', id, {});
        } else {
          await adminService.deleteShippingRate(id);
          await adminService.logActivity(null, 'delete', 'shipping_rate', id, {});
        }
        loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleStatus = async (id, type, active) => {
    try {
      if (type === 'zone') {
        const z = shippingZones.find((x) => x.id === id);
        if (z) await adminService.upsertShippingZone({ ...z, active: !active }, id);
      } else {
        const r = shippingRates.find((x) => x.id === id);
        if (r) await adminService.upsertShippingRate({ ...r, active: !active }, id);
      }
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredZones = (shippingZones || []).filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.countries.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRates = (shippingRates || []).filter(rate =>
    rate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.zone_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading shipping configuration..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping</h1>
          <p className="text-gray-600">Manage shipping zones and rates</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('zones')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'zones'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Shipping Zones
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rates'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Shipping Rates
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
          onClick={() => activeTab === 'zones' ? setShowZoneModal(true) : setShowRateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'zones' ? 'Zone' : 'Rate'}
        </button>
      </div>

      {/* Shipping Zones */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          {filteredZones.map((zone) => (
            <div key={zone.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      zone.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {zone.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>Countries: {zone.countries}</span>
                    </div>
                    {zone.states && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>States: {zone.states}</span>
                      </div>
                    )}
                    {zone.postal_codes && (
                      <div className="flex items-center text-gray-600">
                        <Package className="w-4 h-4 mr-2" />
                        <span>Postal Codes: {zone.postal_codes}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Truck className="w-4 h-4 mr-2" />
                      <span>{zone.rate_count} shipping rates</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => handleEditZone(zone)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(zone.id, 'zone', zone.active)}
                    className="p-1 text-gray-400 hover:text-yellow-600"
                  >
                    {zone.active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(zone.id, 'shipping zone')}
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

      {/* Shipping Rates */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          {filteredRates.map((rate) => (
            <div key={rate.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{rate.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rate.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rate.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {shippingTypes.find(t => t.value === rate.type)?.label}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>Zone: {rate.zone_name}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Base Cost: ${rate.base_cost}</span>
                    </div>
                    {rate.type === 'per_item' && parseFloat(rate.cost_per_item) > 0 && (
                      <div className="flex items-center text-gray-600">
                        <Package className="w-4 h-4 mr-2" />
                        <span>Per Item: ${rate.cost_per_item}</span>
                      </div>
                    )}
                    {rate.type === 'per_weight' && parseFloat(rate.cost_per_weight) > 0 && (
                      <div className="flex items-center text-gray-600">
                        <Package className="w-4 h-4 mr-2" />
                        <span>Per Weight: ${rate.cost_per_weight}/kg</span>
                      </div>
                    )}
                    {rate.free_shipping_threshold && (
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Free over: ${rate.free_shipping_threshold}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {rate.min_delivery_days && rate.max_delivery_days
                          ? `${rate.min_delivery_days}-${rate.max_delivery_days} days`
                          : 'No delivery estimate'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => handleEditRate(rate)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(rate.id, 'rate', rate.active)}
                    className="p-1 text-gray-400 hover:text-yellow-600"
                  >
                    {rate.active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(rate.id, 'shipping rate')}
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

      {/* Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowZoneModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
              </h2>
              
              <form onSubmit={handleZoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Countries *
                  </label>
                  <input
                    type="text"
                    required
                    value={zoneForm.countries}
                    onChange={(e) => setZoneForm({ ...zoneForm, countries: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="US, CA, GB (comma-separated country codes)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    States/Provinces
                  </label>
                  <input
                    type="text"
                    value={zoneForm.states}
                    onChange={(e) => setZoneForm({ ...zoneForm, states: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="CA,NY,TX (optional, comma-separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Codes
                  </label>
                  <input
                    type="text"
                    value={zoneForm.postal_codes}
                    onChange={(e) => setZoneForm({ ...zoneForm, postal_codes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="90210-90215,10001 (optional, ranges or comma-separated)"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={zoneForm.active}
                    onChange={(e) => setZoneForm({ ...zoneForm, active: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowZoneModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    {editingZone ? 'Update' : 'Create'} Zone
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowRateModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingRate ? 'Edit Shipping Rate' : 'Add Shipping Rate'}
              </h2>
              
              <form onSubmit={handleRateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={rateForm.name}
                      onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Zone *
                    </label>
                    <select
                      required
                      value={rateForm.zone_id}
                      onChange={(e) => setRateForm({ ...rateForm, zone_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select zone</option>
                      {shippingZones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Type *
                  </label>
                  <select
                    required
                    value={rateForm.type}
                    onChange={(e) => setRateForm({ ...rateForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {shippingTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Cost ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={rateForm.base_cost}
                      onChange={(e) => setRateForm({ ...rateForm, base_cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {rateForm.type === 'per_item' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Per Item ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateForm.cost_per_item}
                        onChange={(e) => setRateForm({ ...rateForm, cost_per_item: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {rateForm.type === 'per_weight' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Per Weight ($/kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={rateForm.cost_per_weight}
                        onChange={(e) => setRateForm({ ...rateForm, cost_per_weight: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Free Shipping Over ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={rateForm.free_shipping_threshold}
                      onChange={(e) => setRateForm({ ...rateForm, free_shipping_threshold: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Leave empty for no free shipping"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Delivery Days
                    </label>
                    <input
                      type="number"
                      value={rateForm.min_delivery_days}
                      onChange={(e) => setRateForm({ ...rateForm, min_delivery_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Delivery Days
                    </label>
                    <input
                      type="number"
                      value={rateForm.max_delivery_days}
                      onChange={(e) => setRateForm({ ...rateForm, max_delivery_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rateForm.active}
                    onChange={(e) => setRateForm({ ...rateForm, active: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    {editingRate ? 'Update' : 'Create'} Rate
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
