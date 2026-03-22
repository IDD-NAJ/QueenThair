/**
 * Safe localStorage wrapper with error handling and validation
 * Prevents crashes from corrupted storage, quota exceeded, or disabled storage
 */

const STORAGE_PREFIX = 'QUEENTHAIR_';

/**
 * Safely parse JSON with fallback
 */
function safeParse(value, fallback = null) {
  if (!value) return fallback;
  
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[Storage] Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safely stringify JSON
 */
function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('[Storage] Failed to stringify:', error);
    return null;
  }
}

/**
 * Check if localStorage is available and working
 */
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.warn('[Storage] localStorage not available:', error.message);
    return false;
  }
}

/**
 * Get item from localStorage with safe parsing
 */
export function getItem(key, fallback = null) {
  if (!isStorageAvailable()) return fallback;
  
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + key);
    return safeParse(value, fallback);
  } catch (error) {
    console.warn(`[Storage] Failed to get ${key}:`, error);
    return fallback;
  }
}

/**
 * Set item in localStorage with safe stringification
 */
export function setItem(key, value) {
  if (!isStorageAvailable()) return false;
  
  try {
    const stringified = safeStringify(value);
    if (stringified === null) return false;
    
    localStorage.setItem(STORAGE_PREFIX + key, stringified);
    return true;
  } catch (error) {
    // Handle quota exceeded
    if (error.name === 'QuotaExceededError') {
      console.error('[Storage] Quota exceeded, clearing old data');
      clearOldData();
      // Try again
      try {
        localStorage.setItem(STORAGE_PREFIX + key, safeStringify(value));
        return true;
      } catch (retryError) {
        console.error('[Storage] Failed after clearing:', retryError);
        return false;
      }
    }
    console.warn(`[Storage] Failed to set ${key}:`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key) {
  if (!isStorageAvailable()) return;
  
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.warn(`[Storage] Failed to remove ${key}:`, error);
  }
}

/**
 * Clear all app data from localStorage
 */
export function clearAll() {
  if (!isStorageAvailable()) return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[Storage] Failed to clear all:', error);
  }
}

/**
 * Clear old/stale data to free up space
 */
function clearOldData() {
  // Clear any old keys that might exist from previous versions
  const oldKeys = ['cart', 'wishlist', 'recentlyViewed', 'sessionId'];
  oldKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });
}

/**
 * Migrate old storage keys to new format
 */
export function migrateOldStorage() {
  if (!isStorageAvailable()) return;
  
  const migrations = [
    { old: 'cart', new: 'cart' },
    { old: 'wishlist', new: 'wishlist' },
    { old: 'recentlyViewed', new: 'recentlyViewed' },
    { old: 'sessionId', new: 'sessionId' },
  ];
  
  migrations.forEach(({ old, new: newKey }) => {
    try {
      const oldValue = localStorage.getItem(old);
      if (oldValue && !localStorage.getItem(STORAGE_PREFIX + newKey)) {
        localStorage.setItem(STORAGE_PREFIX + newKey, oldValue);
        localStorage.removeItem(old);
      }
    } catch (error) {
      // Ignore migration errors
    }
  });
}

// Run migration on import
migrateOldStorage();
