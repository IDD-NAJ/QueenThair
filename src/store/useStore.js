import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { analytics } from '../utils/analytics';
import { toggleWishlist as toggleWishlistService, getWishlist } from '../services/wishlistService';
import supabase from '../lib/supabaseClient';

// Generates a stable anonymous session ID for guest cart/tracking
function makeSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const useStore = create(
  persist(
    (set, get) => ({
      // ── Cart state (local UI, mirrors DB) ──────────────────────────────────
      cart: [],
      cartOpen: false,

      addToCart: (product, options = {}) => {
        const { cart } = get();
        const key = `${product.id}-${JSON.stringify(options)}`;
        const existing = cart.find(item => item.key === key);
        if (existing) {
          set({ cart: cart.map(item => item.key === key ? { ...item, qty: item.qty + 1 } : item) });
        } else {
          set({ cart: [...cart, { ...product, qty: 1, options, key }] });
        }
        analytics.addToCart(product, 1);
        get().showToast('Added to cart');
        set({ cartOpen: true });
      },

      removeFromCart: (key) => {
        const item = get().cart.find(i => i.key === key);
        if (item) analytics.removeFromCart(item, item.qty);
        set({ cart: get().cart.filter(item => item.key !== key) });
      },

      updateCartQty: (key, delta) => {
        set({ cart: get().cart.map(item => item.key === key ? { ...item, qty: Math.max(1, item.qty + delta) } : item) });
      },

      clearCart: () => set({ cart: [] }),
      setCartOpen: (open) => set({ cartOpen: open }),

      getCartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.qty, 0),
      getCartCount: () => get().cart.reduce((sum, item) => sum + item.qty, 0),

      // ── Wishlist state (local UI, synced to DB for logged-in users) ─────────
      wishlist: [],
      setWishlist: (wishlist) => set({ wishlist }),
      addToWishlist: (item) => set((state) => ({ wishlist: [...state.wishlist, item] })),
      removeFromWishlist: (itemId) => set((state) => ({ wishlist: state.wishlist.filter(item => item.id !== itemId) })),
      
      loadWishlistFromDB: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { items } = await getWishlist(user.id);
          // Extract product IDs from wishlist items
          const productIds = items.map(item => item.product_id);
          set({ wishlist: productIds });
        } catch (err) {
          console.error('Failed to load wishlist:', err);
        }
      },
      
      toggleWishlist: async (productId, variantId = null) => {
        const { wishlist, user } = get();
        // Create a unique key for product+variant combination
        const wishlistKey = variantId ? `${productId}:${variantId}` : productId;
        const isWishlisted = wishlist.includes(wishlistKey) || wishlist.includes(productId);
        
        // Optimistically update UI
        if (isWishlisted) {
          set({ wishlist: wishlist.filter(id => id !== wishlistKey && id !== productId) });
          get().showToast('Removed from wishlist');
        } else {
          set({ wishlist: [...wishlist, wishlistKey] });
          get().showToast('Added to wishlist');
        }
        
        // Sync to database if user is logged in
        if (user) {
          try {
            await toggleWishlistService(user.id, productId, variantId);
          } catch (err) {
            console.error('Failed to sync wishlist:', err);
            // Revert UI on error
            if (isWishlisted) {
              set({ wishlist: [...wishlist, wishlistKey] });
            } else {
              set({ wishlist: wishlist.filter(id => id !== wishlistKey && id !== productId) });
            }
            get().showToast('Failed to update wishlist');
          }
        }
      },
      isInWishlist: (productId, variantId = null) => {
        const { wishlist } = get();
        const wishlistKey = variantId ? `${productId}:${variantId}` : productId;
        return wishlist.includes(wishlistKey) || wishlist.includes(productId);
      },

      // Notifications
      notifications: [],
      unreadCount: 0,
      setNotifications: (notifications) => set({ notifications }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      addNotification: (notification) => set((state) => ({ 
        notifications: [notification, ...state.notifications],
        unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1
      })),
      markNotificationRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      })),

      // ── Recently viewed ────────────────────────────────────────────────────
      recentlyViewed: [],

      addToRecentlyViewed: (productId) => {
        const filtered = get().recentlyViewed.filter(id => id !== productId);
        set({ recentlyViewed: [productId, ...filtered].slice(0, 10) });
      },

      // ── Search ─────────────────────────────────────────────────────────────
      searchOpen: false,
      searchQuery: '',
      setSearchOpen: (open) => set({ searchOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      // ── UI ─────────────────────────────────────────────────────────────────
      toast: null,
      scrolled: false,

      showToast: (message) => {
        set({ toast: message });
        setTimeout(() => set({ toast: null }), 3000);
      },

      setScrolled: (scrolled) => set({ scrolled }),

      // ── Auth state – driven by Supabase onAuthStateChange ──────────────────
      // user: Supabase User object | null
      // profile: profiles table row | null
      // role: admin | customer | null (derived from profile)
      // CRITICAL: authLoading and authInitialized are NOT persisted - always start fresh
      user: null,
      profile: null,
      role: null,
      isAuthenticated: false,
      authLoading: true,
      authInitialized: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
      }),

      setUserAndProfile: (user, profile) => {
        set({
          user,
          profile,
          role: profile?.role ?? null,
          isAuthenticated: !!user,
        });
        // Load wishlist from DB when user is set
        if (user) {
          get().loadWishlistFromDB();
        }
      },

      setProfile: (profile) => set({ 
        profile,
        role: profile?.role ?? null,
      }),

      setAuthLoading: (authLoading) => set({ authLoading }),

      setAuthInitialized: (authInitialized) => set({ authInitialized }),

      clearAuthState: () => set({
        user: null,
        profile: null,
        role: null,
        isAuthenticated: false,
        authLoading: false,
        authInitialized: true,
        wishlist: [],
      }),

      // ── Guest session ID (persisted for guest cart) ────────────────────────
      sessionId: makeSessionId(),
    }),
    {
      name: 'QUEENTHAIR-storage',
      partialize: (state) => ({
        cart:          state.cart,
        wishlist:      state.wishlist,
        recentlyViewed: state.recentlyViewed,
        sessionId:     state.sessionId,
        // user/profile are NOT persisted – Supabase session handles this
      }),
    }
  )
);

// Named export for auth-specific usage
export const useAuthStore = {
  getState: () => useStore.getState(),
  subscribe: useStore.subscribe,
};

// Add signOut helper
useStore.signOut = async () => {
  const { clearAuthState } = useStore.getState();
  clearAuthState();
};

export default useStore;
