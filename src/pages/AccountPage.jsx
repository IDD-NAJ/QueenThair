import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Package, Heart, MapPin, Settings, LogOut, Bell } from 'lucide-react';
import { getOrderById, lookupGuestOrder } from '../services/orderService';

export default function AccountPage({ section = 'orders' }) {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [activeTab, setActiveTab] = useState(section === 'order-detail' ? 'order-detail' : section);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navItems = [
    { id: 'orders', icon: <Package className="w-4 h-4" />, label: 'Orders' },
    { id: 'wishlist', icon: <Heart className="w-4 h-4" />, label: 'Wishlist', onClick: () => navigate('/wishlist') },
    { id: 'addresses', icon: <MapPin className="w-4 h-4" />, label: 'Addresses' },
    { id: 'profile', icon: <User className="w-4 h-4" />, label: 'Profile' },
    { id: 'notifications', icon: <Bell className="w-4 h-4" />, label: 'Notifications', onClick: () => navigate('/account/notifications') },
    { id: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
  ];

  useEffect(() => {
    if (section === 'order-detail' && orderId) {
      loadOrderDetail();
    }
  }, [section, orderId]);

  const loadOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, we'll show a simple order detail view
      // In a real implementation, you'd fetch the actual order data
      setOrderDetail({
        id: orderId,
        orderNumber: orderId,
        status: 'Processing',
        total: '$299.99',
        items: [
          { name: 'Luxury Wig Collection', quantity: 1, price: '$299.99' }
        ]
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-charcoal to-dark-brown py-9 px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-7 flex-wrap">
            <span className="cursor-pointer hover:text-white" onClick={() => navigate('/')}>Home</span>
            <span className="text-neutral-300">›</span>
            <span className="text-white">My Account</span>
          </div>
          <div className="font-serif text-[32px] font-normal text-white">My Account</div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-10 py-10">
        <div className="grid grid-cols-[220px_1fr] gap-8 items-start">
          <nav className="bg-white border border-border rounded overflow-hidden">
            {navItems.map((item, i) => (
              <div 
                key={item.id}
                className={`flex items-center gap-3 py-3 px-4.5 text-[13px] transition-all cursor-pointer border-b border-border last:border-b-0 ${activeTab === item.id ? 'bg-neutral-100 text-charcoal' : 'text-text-secondary hover:bg-neutral-100 hover:text-charcoal'}`}
                onClick={() => item.onClick ? item.onClick() : setActiveTab(item.id)}
              >
                <span className="text-gold">{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div 
              className="flex items-center gap-3 py-3 px-4.5 text-[13px] text-text-secondary transition-all cursor-pointer hover:bg-neutral-100 hover:text-charcoal"
              onClick={() => navigate('/login')}
            >
              <LogOut className="w-4 h-4 text-gold" />
              Sign Out
            </div>
          </nav>

          <div className="bg-white border border-border rounded p-7">
            <div className="font-serif text-[22px] font-normal text-charcoal mb-5 pb-3.5 border-b border-border">
              {navItems.find(n => n.id === activeTab)?.label || 'Orders'}
            </div>
            
            {activeTab === 'order-detail' && (
              <div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading order details...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button 
                      className="bg-gold text-white py-2.5 px-6 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-gold-light"
                      onClick={() => setActiveTab('orders')}
                    >
                      Back to Orders
                    </button>
                  </div>
                ) : orderDetail ? (
                  <div>
                    <div className="mb-6">
                      <button 
                        className="text-gold hover:text-gold-light text-sm mb-4"
                        onClick={() => setActiveTab('orders')}
                      >
                        ← Back to Orders
                      </button>
                      <div className="bg-neutral-50 border border-border rounded p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-serif text-lg text-charcoal mb-2">Order {orderDetail.orderNumber}</h3>
                            <p className="text-sm text-text-muted">Status: <span className="text-charcoal font-medium">{orderDetail.status}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-muted">Total</p>
                            <p className="text-xl font-semibold text-charcoal">{orderDetail.total}</p>
                          </div>
                        </div>
                        
                        <div className="border-t border-border pt-4">
                          <h4 className="text-sm font-medium text-charcoal mb-3">Order Items</h4>
                          <div className="space-y-2">
                            {orderDetail.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <div>
                                  <p className="text-charcoal">{item.name}</p>
                                  <p className="text-text-muted">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-charcoal font-medium">{item.price}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div>
                <p className="text-[13px] text-text-muted mb-6">You haven't placed any orders yet.</p>
                <button 
                  className="bg-gold text-white py-3 px-8 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-gold-light"
                  onClick={() => navigate('/catalog')}
                >
                  Start Shopping
                </button>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="mb-4">
                    <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">First Name</label>
                    <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold bg-white" placeholder="Jane" />
                  </div>
                  <div className="mb-4">
                    <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Last Name</label>
                    <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold bg-white" placeholder="Smith" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Email</label>
                  <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold bg-white" type="email" placeholder="you@email.com" />
                </div>
                <div className="mb-4">
                  <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Phone</label>
                  <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold bg-white" placeholder="+1 (555) 000-0000" />
                </div>
                <button className="bg-charcoal text-white py-3 px-8 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-dark-brown mt-2">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <p className="text-[13px] text-text-muted mb-6">No saved addresses yet.</p>
                <button className="bg-gold text-white py-3 px-8 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-gold-light">
                  Add Address
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-charcoal mb-3">Email Preferences</h3>
                  <label className="flex items-center gap-2.5 py-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-gold cursor-pointer" defaultChecked />
                    <span className="text-[13px] text-text-secondary">Receive promotional emails</span>
                  </label>
                  <label className="flex items-center gap-2.5 py-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-gold cursor-pointer" defaultChecked />
                    <span className="text-[13px] text-text-secondary">Order updates and shipping notifications</span>
                  </label>
                </div>
                <button className="bg-charcoal text-white py-3 px-8 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-dark-brown">
                  Save Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
