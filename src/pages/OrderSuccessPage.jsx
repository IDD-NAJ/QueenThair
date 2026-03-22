import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Button from '../components/common/Button';
import useStore from '../store/useStore';
import { lookupGuestOrder } from '../services/orderService';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useStore(state => state.clearCart);
  const user = useStore(state => state.user);
  
  const [orderNumber, setOrderNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrderInfo = async () => {
      try {
        const orderParam = searchParams.get('order');
        if (!orderParam) {
          setError('Order number not found');
          setLoading(false);
          return;
        }

        setOrderNumber(orderParam);
        
        // Optional: Verify order exists and get details
        if (user) {
          // For logged-in users, we could fetch full order details
          // For now, we just display the order number
        } else {
          // For guests, we could verify with email if needed
          // For now, we just display the order number
        }
        
        clearCart();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrderInfo();
  }, [searchParams, user, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading order information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <h1 className="font-serif text-2xl text-charcoal mb-4">Order Confirmation</h1>
          <p className="text-text-secondary mb-6">
            Thank you for your order! Your order has been placed successfully.
          </p>
          <div className="space-y-3">
            <Button to="/account/orders" variant="secondary" size="lg" className="w-full">
              View My Orders
            </Button>
            <Button to="/shop" variant="outline" size="lg" className="w-full">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mb-3">
          Order Placed Successfully!
        </h1>
        <p className="text-base sm:text-lg text-text-secondary mb-2">
          Thank you for your purchase. Your order number is{' '}
          <strong className="text-charcoal">{orderNumber}</strong>
        </p>
        <p className="text-sm text-text-muted mb-8">
          A confirmation email has been sent to your inbox.
        </p>
        
        <div className="bg-white border border-border rounded-lg p-6 sm:p-8 mb-8">
          <h2 className="text-xs tracking-wider uppercase font-semibold text-text-muted mb-4">
            What's Next?
          </h2>
          <div className="space-y-3 text-sm text-text-secondary text-left">
            <div className="flex gap-3">
              <span className="text-gold flex-shrink-0">1.</span>
              <span>You'll receive an email confirmation shortly</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gold flex-shrink-0">2.</span>
              <span>We'll send you tracking information once your order ships</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gold flex-shrink-0">3.</span>
              <span>Expected delivery: 5-7 business days</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button to={`/account/orders?order=${orderNumber}`} variant="secondary" size="lg">
            View Order Details
          </Button>
          <Button to="/shop" variant="outline" size="lg">
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
