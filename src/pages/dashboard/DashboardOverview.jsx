import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, Heart, ShoppingBag, ChevronRight } from 'lucide-react';
import useStore from '../../store/useStore';
import { getUserOrders } from '../../services/orderService';
import { getWishlist } from '../../services/wishlistService';
import StatCard from '../../components/dashboard/StatCard';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import EmptyState from '../../components/dashboard/EmptyState';
import { format } from 'date-fns';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [pending, setPending] = useState({ orders: true, wishlist: true });
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(() => {
    if (!user) return;
    setError(null);
    setPending({ orders: true, wishlist: true });

    getUserOrders(user.id, { limit: 5 })
      .then((res) => setOrders(res.orders || []))
      .catch((err) => {
        setError(err.message);
        setOrders([]);
      })
      .finally(() => setPending((p) => ({ ...p, orders: false })));

    getWishlist(user.id)
      .then((list) => setWishlist(list || []))
      .catch(() => setWishlist([]))
      .finally(() => setPending((p) => ({ ...p, wishlist: false })));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPending({ orders: false, wishlist: false });
      return;
    }
    loadDashboardData();
  }, [user, loadDashboardData]);

  const statsLoading = pending.orders || pending.wishlist;

  if (!user) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  const totalSpent = orders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">Here's what's happening with your account</p>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          aria-busy="true"
          aria-label="Loading stats"
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-gray-100 animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            label="Total Orders"
            value={orders.length}
            color="purple"
          />
          <StatCard
            icon={ShoppingBag}
            label="Pending Orders"
            value={pendingOrders}
            color="orange"
          />
          <StatCard
            icon={DollarSign}
            label="Total Spent"
            value={`$${totalSpent.toFixed(2)}`}
            color="green"
          />
          <StatCard
            icon={Heart}
            label="Wishlist Items"
            value={wishlist.length}
            color="red"
          />
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="text-gold hover:text-gold-dark text-sm font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {pending.orders && orders.length === 0 ? (
          <div className="p-6 space-y-4" aria-busy="true" aria-label="Loading orders">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md bg-gray-100 animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Start shopping to see your orders here"
            actionLabel="Browse Products"
            actionLink="/shop"
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.slice(0, 5).map(order => (
              <div
                key={order.id}
                onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')} • {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.grand_total?.toFixed(2) || '0.00'}</p>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/shop')}
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
        >
          <ShoppingBag className="w-8 h-8 text-gold mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Continue Shopping</h3>
          <p className="text-sm text-gray-600">Browse our latest collection</p>
        </button>

        <button
          onClick={() => navigate('/dashboard/wishlist')}
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gold hover:shadow-md transition-all text-left"
        >
          <Heart className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">My Wishlist</h3>
          <p className="text-sm text-gray-600">
            {pending.wishlist ? '…' : `${wishlist.length} items saved`}
          </p>
        </button>

        <button
          onClick={() => navigate('/dashboard/support')}
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
        >
          <Package className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Need Help?</h3>
          <p className="text-sm text-gray-600">Contact our support team</p>
        </button>
      </div>
    </div>
  );
}
