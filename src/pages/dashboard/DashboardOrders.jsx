import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, ChevronRight } from 'lucide-react';
import useStore from '../../store/useStore';
import { getUserOrders } from '../../services/orderService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import EmptyState from '../../components/dashboard/EmptyState';
import { format } from 'date-fns';

export default function DashboardOrders() {
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    if (!user) {
      setLoading(false);
      setOrders([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserOrders(user.id, { limit: 100 });
      setOrders(result.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  if (loading) {
    return <LoadingState message="Loading your orders..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadOrders} />;
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600">Track and manage your orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or email..."
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
            <option value="all">All Orders ({statusCounts.all})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="processing">Processing ({statusCounts.processing})</option>
            <option value="shipped">Shipped ({statusCounts.shipped})</option>
            <option value="delivered">Delivered ({statusCounts.delivered})</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={searchTerm || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
            description={searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Start shopping to see your orders here'}
            actionLabel={!searchTerm && statusFilter === 'all' ? 'Browse Products' : undefined}
            actionLink={!searchTerm && statusFilter === 'all' ? '/shop' : undefined}
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${order.grand_total?.toFixed(2) || '0.00'}
                    </p>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-2" />
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg"></div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-600">+{order.items.length - 3}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
