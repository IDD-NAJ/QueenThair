import supabase from '../lib/supabaseClient';

// Cache to prevent duplicate requests
const requestCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Helper to get cache key
function getCacheKey(userId, operation) {
  return `${userId}-${operation}`;
}

// Helper to check if request is cached
function isCached(key) {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

// Helper to set cache
function setCache(key, data) {
  requestCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Get all notifications for the current user with caching
 */
export async function getNotifications(userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');

  const cacheKey = getCacheKey(id, 'notifications');
  const cached = isCached(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        setCache(cacheKey, []);
        return [];
      }
      throw error;
    }

    const result = data || [];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('getNotifications error:', error);
    // Return empty array on error to prevent frontend crashes
    // Handle various error formats including empty messages
    const errorMessage = error?.message || '';
    const isTableMissing = !errorMessage || 
                          error.code === 'PGRST205' || 
                          errorMessage.includes('schema cache') ||
                          errorMessage.includes('does not exist') ||
                          errorMessage.includes('relation');
    
    if (isTableMissing) {
      setCache(cacheKey, []);
      return [];
    }
    
    setCache(cacheKey, []);
    return [];
  }
}

/**
 * Get unread notification count with caching
 */
export async function getUnreadCount(userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');

  const cacheKey = getCacheKey(id, 'unread-count');
  const cached = isCached(cacheKey);
  if (cached !== null) return cached;

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('read', false);

    if (error) {
      // If table doesn't exist, return 0
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        setCache(cacheKey, 0);
        return 0;
      }
      throw error;
    }

    const result = count || 0;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    const nested = error?.error;
    const errorMessage =
      error?.message || nested?.message || (typeof error === 'string' ? error : '') || '';
    const errorCode = error?.code ?? nested?.code;

    if (import.meta.env.DEV) {
      console.warn('getUnreadCount:', errorCode || errorMessage || error);
    }

    // Return 0 on error to prevent frontend crashes
    const isTableMissing =
      !errorMessage ||
      errorCode === 'PGRST205' ||
      errorMessage.includes('schema cache') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('permission denied') ||
      errorMessage.includes('column') && errorMessage.includes('does not exist');
    
    if (isTableMissing) {
      setCache(cacheKey, 0);
      return 0;
    }
    
    setCache(cacheKey, 0);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    
    // Clear cache for this user
    clearUserCache(notificationId);
    return data;
  } catch (error) {
    console.error('markAsRead error:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllAsRead(userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', id)
      .eq('read', false)
      .select();

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return [];
      }
      throw error;
    }
    
    // Clear cache for this user
    clearUserCache(id);
    return data || [];
  } catch (error) {
    console.error('markAllAsRead error:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      // If table doesn't exist, just return
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return;
      }
      throw error;
    }
    
    // Clear cache for this user
    clearUserCache(notificationId);
  } catch (error) {
    console.error('deleteNotification error:', error);
    throw error;
  }
}

/**
 * Create a notification (admin only)
 */
export async function createNotification({ userId, type, title, message, link = null }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return null
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return null;
      }
      throw error;
    }
    
    // Clear cache for this user
    clearUserCache(userId);
    return data;
  } catch (error) {
    console.error('createNotification error:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(userId, callback) {
  if (!userId) return () => {};

  try {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Clear cache when data changes
          clearUserCache(userId);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('subscribeToNotifications error:', error);
    return () => {};
  }
}

/**
 * Clear cache for a specific user
 */
function clearUserCache(userId) {
  const keysToDelete = [];
  for (const key of requestCache.keys()) {
    if (key.startsWith(userId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => requestCache.delete(key));
}

/**
 * Clear all cache (useful for logout)
 */
export function clearNotificationCache() {
  requestCache.clear();
}
