import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, TrendingUp, TrendingDown, Package, Edit2, Save, X, History } from 'lucide-react';
import { adminService } from '../../services/adminService';
import supabase from '../../lib/supabaseClient';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format } from 'date-fns';
import { withTimeout } from '../../utils/safeAsync';

const TIMEOUT_MS = 30000; // 30 second timeout

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, stockFilter]);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await withTimeout(() => adminService.getInventoryList({}), TIMEOUT_MS);
      setProducts(result || []);
    } catch (err) {
      console.error('Inventory load error:', err);
      setError(err.message || 'Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(p => {
        const qty = p.inventory?.quantity_available || 0;
        const threshold = p.inventory?.low_stock_threshold || 5;
        return qty <= threshold && qty > 0;
      });
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(p => (p.inventory?.quantity_available || 0) === 0);
    } else if (stockFilter === 'in-stock') {
      filtered = filtered.filter(p => {
        const qty = p.inventory?.quantity_available || 0;
        const threshold = p.inventory?.low_stock_threshold || 5;
        return qty > threshold;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditValues({
      quantity_available: product.inventory?.quantity_available || 0,
      low_stock_threshold: product.inventory?.low_stock_threshold || 5,
      track_inventory: product.inventory?.track_inventory ?? true,
      allow_backorder: product.inventory?.allow_backorder ?? false,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSave = async (productId) => {
    setSaving(true);
    try {
      console.log('[AdminInventory] Updating stock for product:', productId);
      await adminService.updateStock(productId, parseInt(editValues.quantity_available), 'adjustment');
      
      // Update inventory settings
      console.log('[AdminInventory] Updating inventory settings');
      const { error: settingsError } = await supabase
        .from('inventory')
        .update({
          low_stock_threshold: parseInt(editValues.low_stock_threshold),
          track_inventory: editValues.track_inventory,
          allow_backorder: editValues.allow_backorder,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', productId);

      if (settingsError) {
        console.error('[AdminInventory] Settings update error:', settingsError);
        throw settingsError;
      }
      console.log('[AdminInventory] Settings updated successfully');

      // Log activity
      console.log('[AdminInventory] Logging activity');
      await adminService.logActivity(null, 'update', 'inventory', productId, {
        quantity: editValues.quantity_available,
        settings: {
          low_stock_threshold: editValues.low_stock_threshold,
          track_inventory: editValues.track_inventory,
          allow_backorder: editValues.allow_backorder
        }
      });

      console.log('[AdminInventory] Reloading inventory data');
      await loadInventory();
      handleCancel();
    } catch (err) {
      console.error('[AdminInventory] Failed to update inventory:', err);
      alert('Failed to update inventory: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleViewMovements = async (product) => {
    setSelectedProduct(product);
    setShowMovements(true);
    
    try {
      const movementsData = await adminService.getInventoryMovements({ 
        productId: product.id,
        limit: 50 
      });
      setMovements(movementsData || []);
    } catch (err) {
      console.error('Failed to load movements:', err);
      setMovements([]);
    }
  };

  const getStockStatus = (product) => {
    const qty = product.inventory?.quantity_available || 0;
    const threshold = product.inventory?.low_stock_threshold || 5;

    if (qty === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> };
    } else if (qty <= threshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-3 h-3" /> };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: <Package className="w-3 h-3" /> };
    }
  };

  const stats = {
    total: products.length,
    inStock: products.filter(p => {
      const qty = p.inventory?.quantity_available || 0;
      const threshold = p.inventory?.low_stock_threshold || 5;
      return qty > threshold;
    }).length,
    lowStock: products.filter(p => {
      const qty = p.inventory?.quantity_available || 0;
      const threshold = p.inventory?.low_stock_threshold || 5;
      return qty <= threshold && qty > 0;
    }).length,
    outOfStock: products.filter(p => (p.inventory?.quantity_available || 0) === 0).length,
  };

  if (loading) {
    return <LoadingState message="Loading inventory..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadInventory} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Manage stock levels and inventory settings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="all">All Stock Levels</option>
            <option value="in-stock">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Low Stock Alert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Settings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map(product => {
                const isEditing = editingId === product.id;
                const status = getStockStatus(product);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded mr-3 overflow-hidden flex-shrink-0">
                          {product.images?.[0]?.image_url && (
                            <img 
                              src={product.images[0].image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.quantity_available}
                          onChange={(e) => setEditValues(prev => ({ ...prev, quantity_available: e.target.value }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {product.inventory?.quantity_available || 0}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.inventory?.quantity_reserved || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.low_stock_threshold}
                          onChange={(e) => setEditValues(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">
                          {product.inventory?.low_stock_threshold || 5}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="space-y-1">
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={editValues.track_inventory}
                              onChange={(e) => setEditValues(prev => ({ ...prev, track_inventory: e.target.checked }))}
                              className="w-3 h-3 text-gold focus:ring-gold rounded"
                            />
                            Track
                          </label>
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={editValues.allow_backorder}
                              onChange={(e) => setEditValues(prev => ({ ...prev, allow_backorder: e.target.checked }))}
                              className="w-3 h-3 text-gold focus:ring-gold rounded"
                            />
                            Backorder
                          </label>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>{product.inventory?.track_inventory ? '✓ Tracked' : '✗ Not tracked'}</div>
                          <div>{product.inventory?.allow_backorder ? '✓ Backorder' : '✗ No backorder'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(product.id)}
                            disabled={saving}
                            className="text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit Inventory"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
