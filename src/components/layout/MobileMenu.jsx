import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useIsMobile } from '../../hooks/useMediaQuery';

const NAV = [
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'Best Sellers', href: '/collections/best-sellers' },
  { label: 'Hair Accessories', href: '/hair-accessories' },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAuthenticated = useStore(state => state.isAuthenticated);

  useLockBodyScroll(isOpen);

  // Listen for mobile menu trigger from Header
  useEffect(() => {
    const handleOpenMenu = () => setIsOpen(true);
    window.addEventListener('openMobileMenu', handleOpenMenu);
    return () => window.removeEventListener('openMobileMenu', handleOpenMenu);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
    setExpandedItems([]);
  }, [navigate]);

  const toggleExpanded = (index) => {
    setExpandedItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleLinkClick = (href) => {
    setIsOpen(false);
    navigate(href);
  };

  // Don't render on desktop, but always render the component structure
  // so event listeners are active

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[90]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white z-[91] shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <Link
                to="/"
                className="font-serif text-xl font-medium tracking-[0.12em] text-charcoal"
                onClick={() => setIsOpen(false)}
              >
                QUEEN<span className="text-gold">THAIR</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded text-text-secondary hover:bg-neutral-100 hover:text-charcoal transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV.map((item, i) => (
                <div key={i} className="border-b border-border">
                  {item.submenu || item.cols ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(i)}
                        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-text-primary hover:bg-neutral-100 transition-colors"
                      >
                        <span>{item.label}</span>
                        {expandedItems.includes(i) ? (
                          <ChevronDown className="w-4 h-4 text-text-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-muted" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedItems.includes(i) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-neutral-50"
                          >
                            {item.submenu && item.submenu.map((link, j) => (
                              <button
                                key={j}
                                onClick={() => handleLinkClick(link.href)}
                                className="block w-full text-left px-5 py-2.5 pl-10 text-sm text-text-secondary hover:bg-neutral-100 transition-colors"
                              >
                                {link.label}
                              </button>
                            ))}
                            
                            {item.cols && item.cols.map((col, j) => (
                              <div key={j} className="px-5 py-3">
                                {!col.feature && (
                                  <>
                                    <div className="text-xs tracking-wider uppercase font-semibold text-text-muted mb-2 pl-5">
                                      {col.title}
                                    </div>
                                    {col.links?.map((link, k) => (
                                      <button
                                        key={k}
                                        onClick={() => handleLinkClick(link.href)}
                                        className="block w-full text-left px-5 py-1.5 text-sm text-text-secondary hover:bg-neutral-100 transition-colors rounded"
                                      >
                                        {link.label}
                                      </button>
                                    ))}
                                  </>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <button
                      onClick={() => handleLinkClick(item.href || '/shop')}
                      className="w-full text-left px-5 py-3.5 text-sm font-medium text-text-primary hover:bg-neutral-100 transition-colors"
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
            </nav>

            {/* Footer Links */}
            <div className="border-t border-border p-5 space-y-2">
              <button
                onClick={() => handleLinkClick('/about')}
                className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-100 rounded transition-colors"
              >
                About
              </button>
              <button
                onClick={() => handleLinkClick('/contact')}
                className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-100 rounded transition-colors"
              >
                Contact
              </button>
              <button
                onClick={() => handleLinkClick('/track-order')}
                className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-100 rounded transition-colors"
              >
                Track Order
              </button>
              <button
                onClick={() => handleLinkClick('/wishlist')}
                className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-100 rounded transition-colors"
              >
                Wishlist
              </button>
              <button
                onClick={() => handleLinkClick(isAuthenticated ? '/account' : '/login')}
                className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-neutral-100 rounded transition-colors"
              >
                {isAuthenticated ? 'My Account' : 'Sign In'}
              </button>
              <button
                onClick={() => handleLinkClick('/cart')}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-neutral-100 rounded transition-colors"
              >
                Cart
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

