import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Img from './Img';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, cartTotal } = useApp();

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[2000] transition-opacity ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setCartOpen(false)}
      />
      <div className={`fixed right-0 top-0 bottom-0 w-[420px] bg-white z-[2001] shadow-lg flex flex-col transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
          <span className="font-serif text-[22px] font-normal text-charcoal">
            Your Cart ({cart.reduce((s, i) => s + i.qty, 0)})
          </span>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal"
            onClick={() => setCartOpen(false)}
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <div className="text-5xl mb-4 opacity-30">🛍</div>
              <div className="font-serif text-xl mb-2 text-text-secondary">Your cart is empty</div>
              <p className="text-[13px] text-text-muted">Add items to get started</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.key} className="flex gap-3.5 py-3.5 border-b border-border">
                <Img seed={item.id} className="w-20 h-[100px] rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-charcoal mb-1 leading-tight">{item.name}</div>
                  {item.opts.length && <div className="text-[11px] text-text-muted mb-2">Length: {item.opts.length}</div>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <div 
                        className="w-[22px] h-[22px] border border-border rounded flex items-center justify-center cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => updateQty(item.key, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </div>
                      <span>{item.qty}</span>
                      <div 
                        className="w-[22px] h-[22px] border border-border rounded flex items-center justify-center cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => updateQty(item.key, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-charcoal">${item.price * item.qty}</div>
                  </div>
                  <div 
                    className="text-[10px] text-text-muted uppercase tracking-wider cursor-pointer transition-colors hover:text-[#c0392b] mt-1.5"
                    onClick={() => removeFromCart(item.key)}
                  >
                    Remove
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-border">
            <div className="mb-4">
              <div className="flex justify-between text-[13px] text-text-secondary mb-1.5">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-text-secondary mb-1.5">
                <span>Shipping</span>
                <span className="text-gold">FREE</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-charcoal border-t border-border pt-2.5 mt-2.5">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <button 
              className="w-full bg-charcoal text-white py-3.5 text-xs tracking-[0.12em] uppercase font-medium rounded transition-all hover:bg-dark-brown mb-2"
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
            >
              Proceed to Checkout
            </button>
            <button 
              className="w-full border border-border text-text-secondary py-3 text-xs tracking-[0.08em] uppercase rounded transition-all hover:border-charcoal hover:text-charcoal"
              onClick={() => setCartOpen(false)}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
