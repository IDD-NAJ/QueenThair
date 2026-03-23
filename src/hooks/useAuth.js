import { useEffect } from 'react';
import useStore from '../store/useStore';
import supabase from '../lib/supabaseClient';
import * as authService from '../services/authService';
import { mergeGuestCart } from '../services/cartService';
import { getProfile } from '../services/profileService';

// Initializes the auth listener once at app startup.
// Place <AuthProvider /> at the root of your component tree.

export function useAuthInit() {
  useEffect(() => {
    const { setUserAndProfile, setAuthLoading, setAuthInitialized } = useStore.getState();

    let mounted = true;
    let bootstrapCompleted = false;
    let safetyTimeoutId;

    const finishBootstrap = () => {
      if (bootstrapCompleted) return;
      bootstrapCompleted = true;
      clearTimeout(safetyTimeoutId);
    };

    // If onAuthStateChange never fires (rare), unblock the UI — do NOT clear session (that was wiping users when getSession hung)
    safetyTimeoutId = setTimeout(() => {
      if (!bootstrapCompleted) {
        console.warn('[auth] SAFETY TIMEOUT - unblocking UI (no auth event yet)');
        setAuthLoading(false);
        setAuthInitialized(true);
        bootstrapCompleted = true;
      }
    }, 15000);

    // Rely on INITIAL_SESSION / SIGNED_IN from the client — avoid awaiting getSession() which can hang on slow networks and kept bootstrapCompleted false until the safety timeout fired.
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] state change:', event);

      if (!mounted) return;

      finishBootstrap();

      if (!session) {
        setUserAndProfile(null, null);
        setAuthLoading(false);
        setAuthInitialized(true);
        return;
      }

      const user = session.user;
      const stateSnap = useStore.getState();
      const prev = stateSnap.user;

      // Unblock routes immediately. Keep existing profile for same user (e.g. TOKEN_REFRESHED) to avoid role flicker.
      // Do NOT await mergeGuestCart here — it can hang on network/RLS and left GuestRoute stuck (same as LoginPage).
      // On refresh, pass user as profile so role can be extracted from user_metadata while profile loads.
      const keepProfile =
        prev?.id === user.id && stateSnap.profile?.id === user.id ? stateSnap.profile : user;
      setUserAndProfile(user, keepProfile);
      setAuthLoading(false);
      setAuthInitialized(true);

      if (user && !prev) {
        const sessionId = stateSnap.sessionId;
        if (sessionId) {
          mergeGuestCart(sessionId, user.id).catch((err) => {
            console.error('[auth] cart merge error:', err);
          });
        }
      }

      let profile = null;
      try {
        profile = await getProfile(user.id);
        console.log('[auth] profile loaded:', !!profile, 'role:', profile?.role);
      } catch (err) {
        console.error('[auth] profile fetch error:', err);
      }

      if (!mounted) return;

      setUserAndProfile(user, profile);

      setTimeout(() => {
        window.dispatchEvent(new Event('authStateChanged'));
      }, 100);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeoutId);
      data.subscription?.unsubscribe?.();
    };
  }, []);
}

export function useSignIn() {
  const showToast = useStore(s => s.showToast);
  return async (email, password) => {
    const data = await authService.signIn({ email, password });
    showToast('Signed in successfully');
    window.dispatchEvent(new Event('authStateChanged'));
    return data;
  };
}

export function useSignUp() {
  const showToast = useStore(s => s.showToast);
  return async (data) => {
    await authService.signUp(data);
    showToast('Account created – check your email to confirm');
  };
}

export function useSignOut() {
  const clearAuthState = useStore(s => s.clearAuthState);
  const showToast      = useStore(s => s.showToast);
  return async () => {
    await authService.signOut();
    clearAuthState();
    showToast('Signed out');
  };
}
