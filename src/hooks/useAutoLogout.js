import { useEffect, useRef, useState, useCallback } from 'react';
import { signOut } from '../services/authService';
import useStore from '../store/useStore';

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = 30 * 1000; // 30 seconds
const DEBOUNCE_DELAY = 500; // 500ms debounce for activity

export function useAutoLogout() {
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const debounceRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const isAuthenticated = useStore(state => state.isAuthenticated);
  const clearAuthState = useStore(state => state.clearAuthState);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      clearAuthState();
      window.location.href = '/login';
    } catch (error) {
      console.error('Auto-logout error:', error);
      // Force redirect even if signOut fails
      clearAuthState();
      window.location.href = '/login';
    }
  }, [clearAuthState]);

  const resetTimer = useCallback(() => {
    // Clear all existing timers
    clearTimeout(timeoutRef.current);
    clearTimeout(warningTimeoutRef.current);
    clearInterval(intervalRef.current);

    // Reset warning state
    setShowWarning(false);
    setCountdown(30);

    // Update last activity timestamp
    lastActivityRef.current = Date.now();

    // Set warning timeout (triggers at 4:30)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);

      let timeLeft = 30;
      setCountdown(timeLeft);

      // Start countdown interval
      intervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);

        if (timeLeft <= 0) {
          clearInterval(intervalRef.current);
        }
      }, 1000);
    }, INACTIVITY_LIMIT - WARNING_TIME);

    // Set logout timeout (triggers at 5:00)
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_LIMIT);
  }, [handleLogout]);

  const handleActivity = useCallback(() => {
    // Debounce activity updates to avoid excessive resets
    clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Only reset if enough time has passed (avoid rapid resets)
      if (timeSinceLastActivity > DEBOUNCE_DELAY) {
        resetTimer();
      }
    }, DEBOUNCE_DELAY);
  }, [resetTimer]);

  useEffect(() => {
    // Only run if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

    // Add event listeners
    events.forEach(event =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    // Start initial timer
    resetTimer();

    // Cleanup on unmount
    return () => {
      events.forEach(event =>
        window.removeEventListener(event, handleActivity)
      );
      clearTimeout(timeoutRef.current);
      clearTimeout(warningTimeoutRef.current);
      clearInterval(intervalRef.current);
      clearTimeout(debounceRef.current);
    };
  }, [isAuthenticated, handleActivity, resetTimer]);

  // Sync activity across tabs using localStorage
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleStorageChange = (e) => {
      if (e.key === 'lastActivity' && e.newValue) {
        const lastActivity = parseInt(e.newValue, 10);
        const timeSinceActivity = Date.now() - lastActivity;
        
        // If activity in another tab, reset timer
        if (timeSinceActivity < 1000) {
          resetTimer();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, resetTimer]);

  // Update localStorage on activity for cross-tab sync
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateStorage = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    events.forEach(event =>
      window.addEventListener(event, updateStorage, { passive: true })
    );

    return () => {
      events.forEach(event =>
        window.removeEventListener(event, updateStorage)
      );
    };
  }, [isAuthenticated]);

  return { 
    showWarning, 
    countdown, 
    resetTimer,
    isActive: isAuthenticated 
  };
}
