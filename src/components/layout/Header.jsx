import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Search, Menu, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import useStore from '../../store/useStore';
import { useIsMobile, useIsDesktop } from '../../hooks/useMediaQuery';
import MegaMenu from './MegaMenu';
import { signOut } from '../../services/authService';

const NAV = [
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'Best Sellers', href: '/collections/best-sellers' },
  { label: 'Hair Accessories', href: '/hair-accessories' },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const headerRef = useRef(null);
  const profileDropdownRef = useRef(null);
  
  const scrolled = useStore(state => state.scrolled);
  const cartCount = useStore(state => state.getCartCount());
  const wishlist = useStore(state => state.wishlist);
  const setCartOpen = useStore(state => state.setCartOpen);
  const setSearchOpen = useStore(state => state.setSearchOpen);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  const profile = useStore(state => state.profile);
  const clearAuthState = useStore(state => state.clearAuthState);
  const showToast = useStore(state => state.showToast);
  
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email?.endsWith('@Queenthair.com');

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setProfileDropdownOpen(!profileDropdownOpen);
    } else {
      navigate('/login');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      clearAuthState();
      showToast('Signed out successfully');
      setProfileDropdownOpen(false);
      navigate('/');
    } catch (error) {
      showToast('Failed to sign out');
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    if (activeMenu !== null || profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeMenu, profileDropdownOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    if (activeMenu !== null) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [activeMenu]);

  // Close dropdown on route change
  useEffect(() => {
    setActiveMenu(null);
  }, [location.pathname]);

  // Check if nav item is active
  const isNavActive = (item) => {
    if (item.href && location.pathname === item.href) return true;
    if (item.href && location.pathname.startsWith(item.href + '/')) return true;
    if (item.submenu) {
      return item.submenu.some(sub => location.pathname === sub.href);
    }
    return false;
  };

  return (
    <header ref={headerRef} className={`bg-white border-b border-border sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-4 h-16 lg:h-[68px]">
          {/* Mobile Menu Button */}
          {!isDesktop && (
            <button
              onClick={() => {
                const event = new CustomEvent('openMobileMenu');
                window.dispatchEvent(event);
              }}
              className="w-9 h-9 flex items-center justify-center rounded text-text-secondary hover:bg-neutral-100 hover:text-charcoal transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}

          {/* Logo */}
          <Link 
            to="/" 
            className="font-serif text-xl sm:text-2xl font-medium tracking-[0.12em] text-charcoal whitespace-nowrap"
          >
            QUEEN<span className="text-gold">THAIR</span>
          </Link>

          {/* Desktop Navigation */}
          {isDesktop && (
            <nav className="hidden lg:flex items-center gap-0 flex-1 justify-center">
              {NAV.map((item, i) => (
                <div 
                  key={i} 
                  className="relative group"
                  onMouseEnter={() => setActiveMenu(i)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <Link
                    to={item.href || item.submenu?.[0]?.href || '/shop'}
                    className={`text-xs tracking-[0.1em] uppercase font-medium px-4 py-2 transition-colors hover:text-charcoal flex items-center gap-1 whitespace-nowrap relative ${
                      isNavActive(item) ? 'text-charcoal' : 'text-text-secondary'
                    }`}
                  >
                    {item.label}
                    {(item.cols || item.submenu) && (
                      <span className="text-[9px] transition-transform group-hover:rotate-180">▾</span>
                    )}
                    <span className="absolute bottom-0 left-4 right-4 h-px bg-gold transform scale-x-0 transition-transform group-hover:scale-x-100"></span>
                  </Link>

                  {activeMenu === i && (item.cols || item.submenu) && (
                    <MegaMenu item={item} onClose={() => setActiveMenu(null)} />
                  )}
                </div>
              ))}
            </nav>
          )}

          {/* Search Bar - Desktop */}
          {isDesktop && (
            <div className="hidden lg:block flex-1 max-w-[340px]">
              <div className="relative">
                <input 
                  className="w-full bg-neutral-100 border border-border rounded px-3.5 py-2 pr-9 text-sm text-text-primary transition-all outline-none focus:bg-white focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)]"
                  placeholder="Search styles, textures..."
                  onClick={() => setSearchOpen(true)}
                  readOnly
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                  <Search className="w-4 h-4" strokeWidth={1.5} />
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Search - Mobile/Tablet */}
            {!isDesktop && (
              <button 
                className="w-9 h-9 flex items-center justify-center rounded text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            )}

            {/* Account / Profile */}
            <div className="relative" ref={profileDropdownRef}>
              <button 
                className="w-9 h-9 flex items-center justify-center rounded text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal"
                onClick={handleAccountClick}
                aria-label="Account"
              >
                <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>

              {isAuthenticated && profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border py-2">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-charcoal">
                      {profile?.first_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-text-muted">{user?.email}</p>
                  </div>

                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-neutral-50"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
                  </Link>

                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-neutral-50"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button 
              className="w-9 h-9 flex items-center justify-center rounded text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal relative"
              onClick={() => navigate('/wishlist')}
              aria-label="Wishlist"
            >
              <Heart className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-gold text-white text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button 
              className="w-9 h-9 flex items-center justify-center rounded text-text-secondary transition-all hover:bg-neutral-100 hover:text-charcoal relative"
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
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
      </div>

    </header>
  );
}
