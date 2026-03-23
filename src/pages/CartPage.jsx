import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import Img from '../components/common/Img';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import EmptyState from '../components/common/EmptyState';
import { CURRENCY_SYMBOL, TAX_RATE } from '../constants';

export default function CartPage() {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const cart = useStore(state => state.cart);
  const removeFromCart = useStore(state => state.removeFromCart);
  const updateCartQty = useStore(state => state.updateCartQty);
  const cartTotal = useStore(state => state.getCartTotal());
  const cartCount = useStore(state => state.getCartCount());
  
  const tax = cartTotal * TAX_RATE;
  const total = cartTotal + tax;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-warm-white"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-border"
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Shopping Cart' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            Shopping Cart
          </h1>
          <p className="text-sm text-text-muted mt-2">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12"
      >
        {cart.length === 0 ? (
          <EmptyState
            icon="🛍"
            title="Your cart is empty"
            description="Add items to get started"
            action={{
              label: 'Start Shopping',
              href: '/shop',
              variant: 'secondary'
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-10 items-start">
            <div>
              <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 pb-3 border-b-2 border-border text-xs tracking-wider uppercase text-text-muted">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>
              {cart.map(item => (
                <div key={item.key} className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-3 lg:gap-4 py-4 lg:py-5 border-b border-border">
                  <div className="flex gap-3 lg:gap-3.5 items-start lg:items-center">
                    <Img 
                      src={item.image || item.images?.[0]?.url || item.images?.[0]?.image_url}
                      alt={item.name}
                      className="w-20 h-24 lg:w-[72px] lg:h-[90px] rounded flex-shrink-0" 
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-charcoal mb-1 line-clamp-2">{item.name}</div>
                      {item.options?.length && <div className="text-xs text-text-muted">Length: {item.options.length}</div>}
                      <div className="lg:hidden text-sm text-charcoal mt-2">{CURRENCY_SYMBOL}{item.price}</div>
                      <button
                        className="text-xs text-text-muted uppercase tracking-wider transition-colors hover:text-red-600 mt-2"
                        onClick={() => removeFromCart(item.key)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="hidden lg:block text-sm text-charcoal">{CURRENCY_SYMBOL}{item.price}</div>
                  <div className="flex items-center gap-3 lg:gap-0">
                    <div className="flex items-center border border-border rounded overflow-hidden">
                      <button
                        className="w-9 h-10 flex items-center justify-center text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal"
                        onClick={() => updateCartQty(item.key, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <div className="w-11 text-center text-sm font-medium text-charcoal border-x border-border h-10 flex items-center justify-center">
                        {item.qty}
                      </div>
                      <button
                        className="w-9 h-10 flex items-center justify-center text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal"
                        onClick={() => updateCartQty(item.key, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="lg:hidden text-sm font-semibold text-charcoal ml-auto">{CURRENCY_SYMBOL}{(item.price * item.qty).toFixed(2)}</div>
                  </div>
                  <div className="hidden lg:block text-sm font-semibold text-charcoal">{CURRENCY_SYMBOL}{(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="max-w-full sm:max-w-[200px]"
                />
                <Button variant="primary" size="md">
                  Apply Code
                </Button>
              </div>
            </div>

            <div>
              <div className="bg-neutral-100 rounded p-5 sm:p-6 lg:sticky lg:top-24">
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-charcoal mb-5">Order Summary</h2>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-text-secondary mb-2">
                    <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                    <span>{CURRENCY_SYMBOL}{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-secondary mb-2">
                    <span>Shipping</span>
                    <span className="text-gold font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-secondary mb-2">
                    <span>Estimated Tax</span>
                    <span>{CURRENCY_SYMBOL}{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-semibold text-charcoal border-t border-border-dark pt-3 mt-3">
                    <span>Total</span>
                    <span>{CURRENCY_SYMBOL}{total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/checkout')}
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="mb-2 mt-5"
                >
                  Proceed to Checkout
                </Button>
                <Button
                  onClick={() => navigate('/shop')}
                  variant="outline"
                  fullWidth
                  size="md"
                >
                  Continue Shopping
                </Button>
                <div className="flex gap-1.5 justify-center mt-4 flex-wrap">
                  {['VISA', 'MC', 'AMEX', 'PAYPAL'].map(p => (
                    <div key={p} className="bg-white/80 rounded px-2 py-1 text-[10px] text-neutral-400 tracking-wider font-semibold">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
