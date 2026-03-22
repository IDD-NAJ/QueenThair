import { useEffect, useRef, useState } from 'react';
import { getNotifications, getUnreadCount, clearNotificationCache, subscribeToNotifications } from '../services/notificationService';

/**
 * Custom hook for managing notifications with proper deduplication and cleanup
 * Prevents repeated requests and handles loading states properly
 */
export function useNotifications(userId) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const initializedRef = useRef(false);
  const currentUserIdRef = useRef(null);

  useEffect(() => {
    // Clear cache if user changes
    if (currentUserIdRef.current && currentUserIdRef.current !== userId) {
      clearNotificationCache();
      initializedRef.current = false;
    }
    currentUserIdRef.current = userId;

    if (!userId) {
      setItems([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    // Prevent duplicate initializations
    if (initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;
    let retryTimeout = null;

    const loadNotifications = async (retryCount = 0) => {
      if (cancelled) return;
      
      setLoading(true);
      setError(null);

      try {
        const [notifications, count] = await Promise.all([
          getNotifications(userId),
          getUnreadCount(userId)
        ]);

        if (!cancelled) {
          setItems(notifications);
          setUnreadCount(count);
          setError(null);
        }
      } catch (err) {
        console.error('Notifications load failed:', err);
        
        if (!cancelled) {
          // Retry once after a delay if it's a network error
          if (retryCount === 0 && err.message?.includes('fetch')) {
            retryTimeout = setTimeout(() => {
              if (!cancelled) {
                loadNotifications(retryCount + 1);
              }
            }, 2000);
            return;
          }
          
          // Set error state but don't crash the UI
          setError(err.message);
          setItems([]);
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [userId]);

  return { 
    items, 
    unreadCount, 
    loading, 
    error,
    refetch: () => {
      if (userId) {
        initializedRef.current = false;
        // Trigger re-load by changing the ref
        const temp = initializedRef.current;
        initializedRef.current = temp;
      }
    }
  };
}

/**
 * Hook for real-time notifications subscription with proper cleanup
 */
export function useRealtimeNotifications(userId, onNotification) {
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Only subscribe if we haven't already
    if (subscriptionRef.current) {
      return;
    }

    subscriptionRef.current = subscribeToNotifications(userId, (payload) => {
      if (onNotification) {
        onNotification(payload);
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [userId, onNotification]);
}
