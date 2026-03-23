import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useStore from '../../store/useStore';

const MAX_AUTH_WAIT_MS = 20000; // Max 20 seconds to wait for auth init

export default function AdminRoute({ children }) {
  const user = useStore(state => state.user);
  const role = useStore(state => state.role);
  const authLoading = useStore(state => state.authLoading);
  const authInitialized = useStore(state => state.authInitialized);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [waitTimeExceeded, setWaitTimeExceeded] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, []);

  // Safety timeout: if auth takes too long, allow proceeding
  useEffect(() => {
    if (!authInitialized && !waitTimeExceeded) {
      const timer = setTimeout(() => {
        console.warn('[AdminRoute] Auth wait timeout exceeded, proceeding...');
        setWaitTimeExceeded(true);
      }, MAX_AUTH_WAIT_MS);
      return () => clearTimeout(timer);
    }
  }, [authInitialized, waitTimeExceeded]);

  console.log('[AdminRoute] state:', { initialized: authInitialized, loading: authLoading, user: !!user, role, trigger: updateTrigger, waitTimeExceeded });

  // Wait for auth initialization to complete (or timeout)
  if (!authInitialized && !waitTimeExceeded || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('[AdminRoute] not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check admin role - fallback to email domain if profile missing
  const isAdmin = role === 'admin' || 
                  user.user_metadata?.role === 'admin' || 
                  user.email?.endsWith('@Queenthair.com');
  
  if (!isAdmin) {
    console.log('[AdminRoute] not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
