export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage: ${key}`, error);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }
};

export const STORAGE_KEYS = {
  CART: 'QUEENTHAIR_cart',
  WISHLIST: 'QUEENTHAIR_wishlist',
  RECENTLY_VIEWED: 'QUEENTHAIR_recently_viewed',
  USER: 'QUEENTHAIR_user',
  FILTERS: 'QUEENTHAIR_filters',
};
