import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import useStore from '../../store/useStore';
import Drawer from '../common/Drawer';
import Button from '../common/Button';
import Img from '../common/Img';
import { CURRENCY_SYMBOL } from '../../constants';

export default function CartDrawer() {
  const navigate = useNavigate();
  const cart = useStore(state => state.cart);
  const cartOpen = useStore(state => state.cartOpen);
  const setCartOpen = useStore(state => state.setCartOpen);
  const removeFromCart = useStore(state => state.removeFromCart);
  const updateCartQty = useStore(state => state.updateCartQty);
  const cartTotal = useStore(state => state.getCartTotal());
  const cartCount = useStore(state => state.getCartCount());

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  const handleViewCart = () => {
    setCartOpen(false);
    navigate('/cart');
  };

  return (
    <Drawer
      isOpen={cartOpen}
      onClose={() => setCartOpen(false)}
      title={`Your Cart (${cartCount})`}
      position="right"
      size="md"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <div className="text-5xl mb-4 opacity-30">🛍</div>
              <div className="font-serif text-xl mb-2 text-text-secondary">Your cart is empty</div>
              <p className="text-sm text-text-muted">Add items to get started</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.key} className="flex gap-3.5 py-3.5 border-b border-border">
                <Img 
                  src={item.images?.[0]?.url || item.image}
                  alt={item.name}
                  className="w-20 h-[100px] rounded flex-shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-charcoal mb-1 leading-tight line-clamp-2">
                    {item.name}
                  </div>
                  {item.options?.length && (
                    <div className="text-xs text-text-muted mb-2">
                      Length: {item.options.length}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <button
                        onClick={() => updateCartQty(item.key, -1)}
                        className="w-[22px] h-[22px] border border-border rounded flex items-center justify-center transition-all hover:bg-neutral-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.key, 1)}
                        className="w-[22px] h-[22px] border border-border rounded flex items-center justify-center transition-all hover:bg-neutral-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-charcoal">
                      {CURRENCY_SYMBOL}{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.key)}
                    className="text-[10px] text-text-muted uppercase tracking-wider transition-colors hover:text-red-600 mt-1.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-border bg-neutral-50">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-text-secondary mb-1.5">
                <span>Subtotal</span>
                <span>{CURRENCY_SYMBOL}{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary mb-1.5">
                <span>Shipping</span>
                <span className="text-gold">FREE</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-charcoal border-t border-border pt-2.5 mt-2.5">
                <span>Total</span>
                <span>{CURRENCY_SYMBOL}{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={handleCheckout}
              variant="primary"
              fullWidth
              className="mb-2"
            >
              Proceed to Checkout
            </Button>
            <Button
              onClick={handleViewCart}
              variant="outline"
              fullWidth
            >
              View Cart
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
