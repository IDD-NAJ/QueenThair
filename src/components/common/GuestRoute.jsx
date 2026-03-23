import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';
import { getPostLoginPath } from '../../services/authService';

const MAX_AUTH_WAIT_MS = 20000; // Max 20 seconds to wait for auth init

/**
 * GuestRoute - Redirects authenticated users away from login/register pages
 * Prevents authenticated users from accessing guest-only pages
 */
export default function GuestRoute({ children }) {
  const location = useLocation();
  const user = useStore(state => state.user);
  const profile = useStore(state => state.profile);
  const role = useStore(state => state.role);
  const authLoading = useStore(state => state.authLoading);
  const authInitialized = useStore(state => state.authInitialized);
  const [waitTimeExceeded, setWaitTimeExceeded] = useState(false);

  // Safety timeout: if auth takes too long, allow proceeding
  useEffect(() => {
    if (!authInitialized && !waitTimeExceeded) {
      const timer = setTimeout(() => {
        console.warn('[GuestRoute] Auth wait timeout exceeded, proceeding...');
        setWaitTimeExceeded(true);
      }, MAX_AUTH_WAIT_MS);
      return () => clearTimeout(timer);
    }
  }, [authInitialized, waitTimeExceeded]);

  console.log('[GuestRoute] state:', { initialized: authInitialized, loading: authLoading, user: !!user, role, waitTimeExceeded });

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

  // If authenticated, redirect by role (and safe return URL for customers)
  if (user) {
    const redirectTo = getPostLoginPath(profile ?? { role }, location.state);
    console.log('[GuestRoute] authenticated, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Show page for unauthenticated users
  return children;
}
