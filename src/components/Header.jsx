import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, User, Search, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Img from './Img';

const NAV = [
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'Best Sellers', href: '/collections/best-sellers' },
  { label: 'Hair Accessories', href: '/hair-accessories' },
];

export default function Header() {
  const navigate = useNavigate();
  const { scrolled, cartCount, wishlist, setCartOpen, setSearchOpen } = useApp();
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <header className={`bg-warm-white border-b border-border sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-[1440px] mx-auto px-10 flex items-center gap-8 h-[68px]">
        <div 
          className="font-serif text-2xl font-medium tracking-[0.12em] text-charcoal whitespace-nowrap cursor-pointer"
          onClick={() => navigate('/')}
        >
          LUXE<span className="text-gold">HAIR</span>
        </div>

        <nav className="flex-1 flex items-center gap-0">
          {NAV.map((item, i) => (
            <div 
              key={i} 
              className="relative group"
              onMouseEnter={() => setActiveMenu(i)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <div 
                className="text-[12.5px] tracking-[0.1em] uppercase font-medium text-text-secondary px-4 py-2 cursor-pointer transition-colors hover:text-charcoal flex items-center gap-1 whitespace-nowrap relative"
                onClick={() => navigate('/catalog')}
              >
                {item.label}
                <span className="text-[9px] transition-transform group-hover:rotate-180">▾</span>
                <span className="absolute bottom-0 left-4 right-4 h-px bg-gold transform scale-x-0 transition-transform group-hover:scale-x-100"></span>
              </div>

              {activeMenu === i && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-warm-white border border-border border-t-2 border-t-gold shadow-lg min-w-[720px] p-7 flex gap-8 slide-down z-50">
                  {item.cols.map((col, j) => (
                    <div key={j} className="min-w-[160px]">
                      {col.feature ? (
                        <div className="bg-neutral-100 p-4 rounded min-w-[180px]">
                          <Img seed={i * 10 + j} className="w-full h-[120px] mb-2.5 rounded" />
                          <div className="text-[13px] font-medium text-charcoal mb-1">{col.title2}</div>
                          <div className="text-[11px] text-text-muted">{col.sub}</div>
                        </div>
                      ) : (
                        <>
                          <div className="text-[10px] tracking-[0.14em] uppercase font-semibold text-text-muted mb-3 pb-2 border-b border-border">
                            {col.title}
                          </div>
                          {col.links.map((link, k) => (
                            <div 
                              key={k} 
                              className="block text-[13px] text-text-secondary py-1 transition-colors hover:text-charcoal cursor-pointer"
                              onClick={() => {
                                navigate('/catalog');
                                setActiveMenu(null);
                              }}
                            >
                              {link}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex-1 max-w-[340px] relative">
          <input 
            className="w-full bg-neutral-100 border border-border rounded px-3.5 py-2 pr-9 text-[13px] text-text-primary transition-all outline-none focus:bg-white focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)]"
            placeholder="Search styles, textures..."
            onClick={() => setSearchOpen(true)}
            readOnly
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
            <Search className="w-4 h-4" strokeWidth={1.5} />
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            className="w-[38px] h-[38px] flex items-center justify-center rounded text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal"
            onClick={() => navigate('/account')}
            title="Account"
          >
            <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
          <button 
            className="w-[38px] h-[38px] flex items-center justify-center rounded text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal relative"
            onClick={() => navigate('/wishlist')}
            title="Wishlist"
          >
            <Heart className="w-[18px] h-[18px]" strokeWidth={1.5} />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 bg-gold text-white text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>
          <button 
            className="w-[38px] h-[38px] flex items-center justify-center rounded text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal relative"
            onClick={() => setCartOpen(true)}
            title="Cart"
          >
            <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-gold text-white text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
