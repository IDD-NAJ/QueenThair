import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product, opts = {}) => {
    setCart(prev => {
      const key = `${product.id}-${JSON.stringify(opts)}`;
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, opts, key }];
    });
    showToast('Added to cart');
    setCartOpen(true);
  };

  const removeFromCart = (key) => {
    setCart(prev => prev.filter(i => i.key !== key));
  };

  const updateQty = (key, delta) => {
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const isInWishlist = prev.includes(id);
      showToast(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
      return isInWishlist ? prev.filter(i => i !== id) : [...prev, id];
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <AppContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      wishlist,
      toggleWishlist,
      cartOpen,
      setCartOpen,
      cartTotal,
      cartCount,
      searchOpen,
      setSearchOpen,
      toast,
      showToast,
      scrolled
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
