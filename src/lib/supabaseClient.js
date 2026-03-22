import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Public client – safe for browser use (anon key, RLS enforced)
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Re-export for convenience
export default supabase;
