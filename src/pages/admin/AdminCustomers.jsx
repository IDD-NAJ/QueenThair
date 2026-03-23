import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, Eye } from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format } from 'date-fns';
import { withTimeout } from '../../utils/safeAsync';

const TIMEOUT_MS = 30000; // 30 second timeout

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await withTimeout(() => adminService.getUsers({}), TIMEOUT_MS);
      console.log('Customers data from service:', data);
      console.log('First customer sample:', data?.[0]);
      setCustomers(data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err.message || 'Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = async (customerId) => {
    try {
      const customerDetails = await adminService.getCustomerDetails(customerId);
      console.log('Customer details:', customerDetails);
      alert('Customer details loaded. Check console for full data.');
    } catch (err) {
      console.error('Failed to load customer details:', err);
      alert('Failed to load customer details: ' + err.message);
    }
  };

  const handleUpdateCustomer = async (customerId, updates) => {
    try {
      await adminService.updateCustomerProfile(customerId, updates);
      
      // Log activity
      await adminService.logActivity(null, 'update', 'customer', customerId, {
        changes: updates
      });
      
      await loadCustomers();
    } catch (err) {
      console.error('Failed to update customer:', err);
      alert('Failed to update customer: ' + err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      
      // Log activity
      await adminService.logActivity(null, 'update', 'customer', userId, {
        role: newRole
      });
      
      await loadCustomers();
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Failed to update user role: ' + err.message);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  };

  if (loading) {
    return <LoadingState message="Loading customers..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadCustomers} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm sm:text-base text-gray-600">{filteredCustomers.length} total customers</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map(customer => {
                console.log('Processing customer:', customer);
                const totalOrders = customer.orders?.length || 0;
                const totalSpent = customer.orders?.length > 0 
                  ? customer.orders.reduce((sum, order) => sum + (order.grand_total || 0), 0)
                  : 0;
                const primaryAddress = Array.isArray(customer.addresses) 
                  ? customer.addresses.find(addr => addr.is_default) || customer.addresses[0]
                  : null;
                const reviewCount = Array.isArray(customer.reviews) ? customer.reviews.length : 0;
                
                console.log('Customer data processed:', {
                  totalOrders,
                  totalSpent,
                  primaryAddress,
                  reviewCount,
                  orders: customer.orders,
                  addresses: customer.addresses,
                  reviews: customer.reviews
                });
                
                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-gold font-semibold text-sm">
                            {customer.first_name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.first_name && customer.last_name 
                              ? `${customer.first_name} ${customer.last_name}`
                              : 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.phone && customer.phone.trim() ? customer.phone : 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {primaryAddress && primaryAddress.city ? (
                          <div>
                            <p>{primaryAddress.line1 ? `${primaryAddress.line1}, ` : ''}{primaryAddress.city}{primaryAddress.state_region ? `, ${primaryAddress.state_region}` : ''}</p>
                            <p className="text-gray-500">{primaryAddress.country || 'US'}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">No address</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{totalOrders}</div>
                      <div className="text-xs text-gray-500">{reviewCount} reviews</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${isNaN(totalSpent) ? '0.00' : totalSpent.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                        customer.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.role || 'customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.created_at ? 
                        (() => {
                          try {
                            return format(new Date(customer.created_at), 'MMM dd, yyyy');
                          } catch {
                            return 'Invalid date';
                          }
                        })() 
                        : 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewCustomer(customer.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <select
                          value={customer.role || 'customer'}
                          onChange={(e) => handleRoleChange(customer.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
