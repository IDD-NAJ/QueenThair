import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useStore from '../../store/useStore';

const MAX_AUTH_WAIT_MS = 5000; // Shorter timeout - just wait for Supabase session restore

export default function AdminRoute({ children }) {
  const user = useStore(state => state.user);
  const role = useStore(state => state.role);
  const authInitialized = useStore(state => state.authInitialized);
  const [waitTimeExceeded, setWaitTimeExceeded] = useState(false);

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

  // Calculate isAdmin from all available sources
  const isAdmin = role === 'admin' || 
                  user?.user_metadata?.role === 'admin' ||
                  user?.raw_user_meta_data?.role === 'admin' ||
                  user?.email?.endsWith('@Queenthair.com');

  console.log('[AdminRoute] state:', { 
    initialized: authInitialized, 
    user: !!user, 
    role, 
    userMetadataRole: user?.user_metadata?.role,
    waitTimeExceeded,
    isAdmin 
  });

  // Wait for auth initialization (or timeout)
  if (!authInitialized && !waitTimeExceeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If we have a user, check admin status immediately
  if (user) {
    if (!isAdmin) {
      console.log('[AdminRoute] not admin, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    // User is admin - render children
    return children;
  }

  // No user - redirect to login
  console.log('[AdminRoute] not authenticated, redirecting to login');
  return <Navigate to="/login" replace />;
}
