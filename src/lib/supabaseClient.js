import { createClient, processLock } from '@supabase/supabase-js';
import { env } from './env';

// Public client – safe for browser use (anon key, RLS enforced)
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Default navigator.locks + persistSession can warn under React Strict Mode
    // (double mount leaves an exclusive lock until timeout). In-process lock
    // serializes auth ops in this tab without the Web Locks API.
    lock: processLock,
  },
});

// Re-export for convenience
export default supabase;
