import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import { getOrCreateCart, validateCartForCheckout } from '../services/cartService';
import { createPendingOrder, validatePromoCode } from '../services/orderService';
import { getStripe } from '../lib/stripe';
import Img from '../components/Img';

// Helper functions for safe data handling
const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;
const safeString = (value) => typeof value === 'string' ? value : '';
const safeNumber = (value, defaultValue = 0) => Number.isFinite(Number(value)) ? Number(value) : defaultValue;
const safeCurrency = (value) => safeNumber(value).toFixed(2);

const normalizeCartItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  
  // Handle multiple possible image structures
  const images = isNonEmptyArray(item.images) ? item.images : 
                isNonEmptyArray(item.product?.images) ? item.product.images : 
                item.image ? [item.image] : 
                item.product?.image_url ? [item.product.image_url] : 
                [];
  
  // Handle options/selectedOptions
  const opts = isNonEmptyArray(item.opts) ? item.opts : 
               isNonEmptyArray(item.selectedOptions) ? item.selectedOptions : 
               isNonEmptyArray(item.options) ? item.options : 
               [];
  
  // Handle variant information
  const variant = item.variant || item.selectedVariant || {};
  
  return {
    id: safeString(item.id || item.key),
    key: safeString(item.key || item.id),
    productId: safeString(item.productId || item.product_id),
    name: safeString(item.name || item.product?.name || 'Unknown Product'),
    slug: safeString(item.slug || item.product?.slug),
    quantity: safeNumber(item.quantity || item.qty, 1),
    price: safeNumber(item.price || item.unit_price),
    compareAtPrice: safeNumber(item.compareAtPrice || item.compare_at_price),
    image: images[0] || null,
    images: images,
    variant: variant,
    color: safeString(item.color || variant?.color),
    length: safeString(item.length || variant?.length),
    density: safeString(item.density || variant?.density),
    size: safeString(item.size || variant?.size),
    sku: safeString(item.sku || variant?.sku),
    selectedOptions: opts,
    opts: opts, // for backward compatibility
    stock: safeNumber(item.stock || variant?.stock, 0),
    subtotal: safeNumber(item.price || item.unit_price, 0) * safeNumber(item.quantity || item.qty, 1)
  };
};

const getCartItemImage = (item) => {
  if (!item) return null;
  const normalized = normalizeCartItem(item);
  return normalized?.image || normalized?.images?.[0] || null;
};

export default function CheckoutPage() {
  const navigate   = useNavigate();
  const cart       = useStore(s => s.cart);
  const cartTotal  = useStore(s => s.getCartTotal());
  const user       = useStore(s => s.user);
  const sessionId  = useStore(s => s.sessionId);
  const clearCart  = useStore(s => s.clearCart);
  const showToast  = useStore(s => s.showToast);

  // Normalize cart data to prevent crashes
  const rawCartItems = isNonEmptyArray(cart) ? cart : [];
  const normalizedCartItems = rawCartItems.map(normalizeCartItem).filter(Boolean);
  const hasCartItems = normalizedCartItems.length > 0;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [form, setForm] = useState({
    email: user?.email || '', first: '', last: '', address: '', city: '', zip: '', country: 'US', phone: '',
  });
  const [billingForm, setBillingForm] = useState({
    first: '', last: '', address: '', city: '', zip: '', country: 'US', phone: '',
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [selectedShipping, setSelectedShipping] = useState({ id: 'standard', name: 'Standard Shipping', price: 0 });

  useEffect(() => {
    if (user?.email) setForm(f => ({ ...f, email: user.email }));
  }, [user]);

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const updateBilling = (key) => (e) => setBillingForm(f => ({ ...f, [key]: e.target.value }));

  // Sync billing form when same as shipping changes
  useEffect(() => {
    if (sameAsShipping) {
      setBillingForm({
        first: form.first,
        last: form.last,
        address: form.address,
        city: form.city,
        zip: form.zip,
        country: form.country,
        phone: form.phone,
      });
    }
  }, [sameAsShipping, form]);

  // Safe calculations with normalized data
  const subtotal = safeNumber(cartTotal);
  const shippingPrice = safeNumber(selectedShipping?.price);
  const taxable = subtotal - promoDiscount + shippingPrice;
  const taxTotal = safeNumber(taxable * 0.08);
  const grandTotal = safeNumber(taxable + taxTotal);

  const applyPromo = async () => {
    setPromoError('');
    if (!promoInput.trim()) return;
    try {
      const { discount } = await validatePromoCode(promoInput, subtotal);
      setPromoDiscount(safeNumber(discount));
      showToast(`Promo applied – $${safeCurrency(discount)} off`);
    } catch (err) {
      setPromoError(err.message);
      setPromoDiscount(0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!hasCartItems) {
      showToast('Your cart is empty');
      return;
    }
    setSubmitting(true);
    try {
      // Build a temporary DB cart entry if not already backed
      const dbCart = await getOrCreateCart({ userId: user?.id ?? null, sessionId });
      await validateCartForCheckout(dbCart.id);

      const shippingAddress = {
        full_name: `${form.first} ${form.last}`,
        line1: form.address, city: form.city,
        state_region: form.zip, postal_code: form.zip,
        country: form.country,
      };

      const billingAddress = sameAsShipping ? shippingAddress : {
        full_name: `${billingForm.first} ${billingForm.last}`,
        line1: billingForm.address, city: billingForm.city,
        state_region: billingForm.zip, postal_code: billingForm.zip,
        country: billingForm.country,
      };

      const { clientSecret, orderId, orderNumber, grandTotal: orderTotal } = await createPendingOrder({
        cartId: dbCart.id,
        userId: user?.id ?? null,
        email:  form.email,
        phone:  form.phone,
        shippingAddress,
        billingAddress,
        shippingOption: selectedShipping,
        promoCode: promoInput || null,
        currency: 'USD',
      });

      // Redirect to Stripe-hosted payment or use Elements
      const stripe = await getStripe();
      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-success?order=${orderNumber}`,
        },
      });

      if (stripeError) throw new Error(stripeError.message);
    } catch (err) {
      showToast(err.message || 'Checkout failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-charcoal to-dark-brown py-9 px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-7 flex-wrap">
            <span className="cursor-pointer hover:text-white" onClick={() => navigate('/')}>Home</span>
            <span className="text-neutral-300">›</span>
            <span className="cursor-pointer hover:text-white" onClick={() => navigate('/cart')}>Cart</span>
            <span className="text-neutral-300">›</span>
            <span className="text-white">Checkout</span>
          </div>
          <div className="font-serif text-[32px] font-normal text-white">Secure Checkout</div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
        {/* Step Indicator - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-0 mb-6 sm:mb-8">
          {['Information', 'Shipping', 'Payment'].map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2.5 text-xs tracking-wider uppercase pr-6 relative ${step === i + 1 ? 'text-charcoal' : step > i + 1 ? 'text-gold' : 'text-text-muted'}`}>
                <div className={`w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${step > i + 1 ? 'bg-gold border-gold text-white' : 'border-current'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="text-sm sm:text-xs">{s}</span>
              </div>
              {i < 2 && (
                <div className="hidden sm:block flex-1 h-px bg-border mx-2 self-center" />
              )}
              {i < 2 && (
                <div className="sm:hidden w-px h-4 bg-border mx-2 self-center" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Layout - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">
          <div>
            {step === 1 && (
              <div>
                <div className="font-serif text-xl sm:text-2xl font-normal text-charcoal mb-4">Contact Information</div>
                <div className="mb-4">
                  <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Email</label>
                  <input 
                    className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white"
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="you@email.com"
                  />
                </div>
                <div className="font-serif text-xl sm:text-2xl font-normal text-charcoal mb-4 mt-6 sm:mt-7">Shipping Address</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="mb-4">
                    <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">First Name</label>
                    <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" value={form.first} onChange={update('first')} placeholder="Jane" />
                  </div>
                  <div className="mb-4">
                    <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Last Name</label>
                    <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" value={form.last} onChange={update('last')} placeholder="Smith" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Address</label>
                  <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" value={form.address} onChange={update('address')} placeholder="123 Main Street" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="mb-4">
                    <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">City</label>
                    <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" value={form.city} onChange={update('city')} placeholder="New York" />
                  </div>
                  <div className="mb-4">
                    <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">ZIP Code</label>
                    <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" value={form.zip} onChange={update('zip')} placeholder="10001" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Phone</label>
                  <input className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" value={form.phone} onChange={update('phone')} placeholder="+1 (555) 000-0000" />
                </div>
                
                {/* Billing Address Section */}
                <div className="font-serif text-xl sm:text-2xl font-normal text-charcoal mb-4 mt-6 sm:mt-7">Billing Address</div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sameAsShipping}
                      onChange={(e) => setSameAsShipping(e.target.checked)}
                      className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold focus:border-gold"
                    />
                    <span className="text-[13px] text-text-primary">Same as shipping address</span>
                  </label>
                </div>
                
                {!sameAsShipping && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="mb-4">
                        <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">First Name</label>
                        <input 
                          className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" 
                          value={billingForm.first} 
                          onChange={updateBilling('first')} 
                          placeholder="Jane" 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Last Name</label>
                        <input 
                          className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" 
                          value={billingForm.last} 
                          onChange={updateBilling('last')} 
                          placeholder="Smith" 
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Address</label>
                      <input 
                        className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" 
                        value={billingForm.address} 
                        onChange={updateBilling('address')} 
                        placeholder="123 Main Street" 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="mb-4">
                        <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">City</label>
                        <input 
                          className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" 
                          value={billingForm.city} 
                          onChange={updateBilling('city')} 
                          placeholder="New York" 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">ZIP Code</label>
                        <input 
                          className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" 
                          value={billingForm.zip} 
                          onChange={updateBilling('zip')} 
                          placeholder="10001" 
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-[11px] tracking-wider uppercase font-medium text-text-secondary block mb-1.5">Phone</label>
                      <input 
                        className="w-full border border-border rounded px-3.5 py-2.5 text-[13px] text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white" 
                        value={billingForm.phone} 
                        onChange={updateBilling('phone')} 
                        placeholder="+1 (555) 000-0000" 
                      />
                    </div>
                  </>
                )}
                <button 
                  className="w-full sm:w-auto bg-gold text-white py-3 px-6 sm:px-8 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-gold-light mt-5 flex items-center gap-2 justify-center"
                  onClick={() => setStep(2)}
                >
                  Continue to Shipping <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="font-serif text-xl sm:text-2xl font-normal text-charcoal mb-4">Shipping Method</div>
                {[
                  { id: 'standard', name: 'Standard Shipping', time: '5–7 business days', price: 0 },
                  { id: 'express',  name: 'Express Shipping',  time: '2–3 business days', price: 19.99 },
                  { id: 'overnight',name: 'Overnight',         time: 'Next business day',  price: 29.99 },
                ].map((s) => {
                  const active = selectedShipping.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipping(s)}
                      className={`border rounded p-4 mb-2.5 cursor-pointer flex items-center justify-between transition-all ${active ? 'border-gold bg-gold/5' : 'border-border bg-white hover:border-gold/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-[1.5px] ${active ? 'border-gold bg-gold' : 'border-border bg-transparent'}`} />
                        <div>
                          <div className="text-[13px] font-medium text-charcoal">{s.name}</div>
                          <div className="text-xs text-text-muted">{s.time}</div>
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold text-charcoal">
                        {s.price === 0 ? 'Free' : `$${s.price.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button 
                    className="w-full sm:w-auto border border-border py-3 px-5 rounded text-xs tracking-[0.1em] cursor-pointer transition-all hover:border-charcoal"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button 
                    className="w-full sm:w-auto bg-gold text-white py-3 px-6 sm:px-8 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-gold-light flex items-center gap-2 justify-center"
                    onClick={() => setStep(3)}
                  >
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="font-serif text-xl sm:text-2xl font-normal text-charcoal mb-4">Review &amp; Pay</div>
                <div className="bg-neutral-100 border border-border rounded p-3.5 mb-5 text-xs text-text-secondary flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Payment is processed securely via Stripe. Your card details are never stored.
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-3.5 text-xs text-amber-800 mb-5">
                  After clicking "Place Order" you'll be directed to Stripe's secure payment page to enter your card details.
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button
                    className="w-full sm:w-auto border border-border py-3 px-5 rounded text-xs tracking-[0.1em] cursor-pointer transition-all hover:border-charcoal"
                    onClick={() => setStep(2)}
                    disabled={submitting}
                  >
                    ← Back
                  </button>
                  <button
                    className="w-full sm:w-auto bg-gold text-white py-3 px-6 sm:px-8 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-gold-light flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <>Place Order — ${safeCurrency(grandTotal)} <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ORDER SUMMARY - Responsive */}
          <div className="bg-neutral-100 rounded p-4 sm:p-6 lg:sticky lg:top-[88px]">
            <div className="font-serif text-lg font-normal text-charcoal mb-4 pb-3 border-b border-border-dark">Order Summary</div>
            {!hasCartItems ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-[13px] text-text-muted mb-4">Your cart is empty</p>
                <button
                  className="w-full sm:w-auto bg-gold text-white py-2.5 px-4 sm:px-6 text-xs tracking-[0.1em] uppercase font-medium rounded transition-all hover:bg-gold-light"
                  onClick={() => navigate('/shop')}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              normalizedCartItems.map(item => {
                if (!item) return null;
                const itemImage = getCartItemImage(item);
                const itemOpts = isNonEmptyArray(item.opts) ? item.opts : [];
                const lengthDisplay = itemOpts.find(opt => opt.name === 'Length')?.value || item.length || '';
                
                return (
                  <div key={item.key || item.id} className="flex gap-3 py-3 border-b border-border-dark">
                    <div className="relative flex-shrink-0">
                      {itemImage ? (
                        <Img 
                          src={typeof itemImage === 'string' ? itemImage : itemImage.url}
                          alt={item.name}
                          className="w-[50px] sm:w-[60px] h-[65px] sm:h-[75px] rounded" 
                        />
                      ) : (
                        <div className="w-[50px] sm:w-[60px] h-[65px] sm:h-[75px] rounded bg-neutral-200 flex items-center justify-center text-[10px] text-neutral-500">
                          No Image
                        </div>
                      )}
                      <div className="absolute -top-1.5 -right-1.5 bg-neutral-500 text-white text-[10px] font-bold w-[16px] sm:w-[18px] h-[16px] sm:h-[18px] rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-charcoal font-medium mb-0.5 truncate">{item.name}</div>
                      {lengthDisplay && (
                        <div className="text-[11px] text-text-muted truncate">Length: {lengthDisplay}</div>
                      )}
                      <div className="text-[13px] font-semibold text-charcoal mt-1">{safeCurrency(item.subtotal)}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div className="flex flex-col sm:flex-row gap-2 my-4">
              <input
                className="flex-1 border border-border-dark rounded px-3 py-2.5 text-[13px] bg-white outline-none transition-colors focus:border-gold"
                placeholder="Discount code"
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
              />
              <button
                className="w-full sm:w-auto bg-charcoal text-white px-4 py-2.5 rounded text-xs tracking-wider font-medium whitespace-nowrap transition-all hover:bg-dark-brown"
                onClick={applyPromo}
              >
                Apply
              </button>
            </div>
            {promoError && <p className="text-red-500 text-xs mb-3">{promoError}</p>}
            <div>
              <div className="flex justify-between text-[13px] text-text-secondary mb-1.5">
                <span>Subtotal</span><span>${safeCurrency(subtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-[13px] text-green-600 mb-1.5">
                  <span>Discount</span><span>-${safeCurrency(promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px] text-text-secondary mb-1.5">
                <span>Shipping</span>
                <span className={selectedShipping.price === 0 ? 'text-gold' : ''}>
                  {selectedShipping.price === 0 ? 'Free' : `$${safeCurrency(selectedShipping.price)}`}
                </span>
              </div>
              <div className="flex justify-between text-[13px] text-text-secondary mb-1.5">
                <span>Tax (8%)</span><span>${safeCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-charcoal border-t border-border-dark pt-2.5 mt-2.5">
                <span>Total</span><span>${safeCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
