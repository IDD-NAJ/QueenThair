import supabase from '../lib/supabaseClient';

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export async function signUp({ email, password, firstName, lastName, marketingOptIn = false }) {
  // Validate inputs
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  if (import.meta.env.DEV) {
    console.log('[authService] Attempting signup for:', email);
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, marketing_opt_in: marketingOptIn },
    },
  });
  
  if (error) {
    console.error('[authService] Signup error:', error);
    
    // Provide user-friendly error messages
    if (error.status === 401) {
      throw new Error('Authentication failed. Please check your Supabase configuration.');
    }
    if (error.message.includes('Email')) {
      throw new Error(error.message);
    }
    throw error;
  }
  
  if (import.meta.env.DEV) {
    console.log('[authService] Signup successful:', data);
  }
  
  return data;
}

// ─── Sign In ─────────────────────────────────────────────────────────────────
export async function signIn({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  if (import.meta.env.DEV) {
    console.log('[authService] Attempting signin for:', email);
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.error('[authService] Signin error:', error);
    
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password');
    }
    if (error.status === 401) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
    throw error;
  }
  
  if (import.meta.env.DEV) {
    console.log('[authService] Signin successful');
  }
  
  return data;
}

/**
 * Where to send a user after login (or when hitting guest-only routes while authenticated).
 * Admins → /admin; others → prior protected URL if safe, else /dashboard.
 */
export function getPostLoginPath(profile, redirectState) {
  if (profile?.role === 'admin') return '/admin';
  const from = redirectState?.from?.pathname;
  if (
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !from.startsWith('/admin') &&
    from !== '/login' &&
    from !== '/register'
  ) {
    return from;
  }
  return '/dashboard';
}

// ─── Sign Out ────────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── Get Current Session ─────────────────────────────────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ─── Get Current User ────────────────────────────────────────────────────────
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

// ─── Forgot Password ─────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

// ─── Reset Password (after clicking email link) ───────────────────────────────
export async function updatePasswordForReset(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

// ─── Update Password ─────────────────────────────────────────────────────────
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
}

// ─── Auth State Change Listener ───────────────────────────────────────────────
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
  return data.subscription;
}

// ─── Refresh Session ─────────────────────────────────────────────────────────
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data.session;
}
