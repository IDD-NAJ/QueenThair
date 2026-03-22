// Central environment config loader.
// All env access goes through here so misconfiguration is caught early.

const required = (key, description = '') => {
  const val = import.meta.env[key];
  if (!val) {
    console.error(`[env] ❌ Missing required environment variable: ${key}`);
    if (description) {
      console.error(`[env] 💡 ${description}`);
    }
    // In development, provide a fallback instead of throwing
    if (import.meta.env.DEV) {
      console.warn(`[env] ⚠️  Using fallback value for ${key} in development`);
      return '';
    }
    throw new Error(`Missing environment variable: ${key}`);
  }
  
  // Validate Supabase-specific variables (only in production)
  if (import.meta.env.PROD) {
    if (key === 'VITE_SUPABASE_URL') {
      if (!val.startsWith('https://') || !val.includes('.supabase.co')) {
        console.error(`[env] ❌ Invalid Supabase URL format: ${val}`);
        console.error(`[env] 💡 Should be: https://your-project-id.supabase.co`);
        throw new Error(`Invalid Supabase URL format`);
      }
    }
    
    if (key === 'VITE_SUPABASE_ANON_KEY') {
      if (!val.startsWith('eyJ')) {
        console.error(`[env] ❌ Invalid Supabase anon key format`);
        console.error(`[env] 💡 Should start with 'eyJ' (JWT format)`);
        console.error(`[env] 💡 Get your key from: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`);
        throw new Error(`Invalid Supabase anon key format`);
      }
    }
  }
  
  // Check for placeholder keys
  if (key === 'VITE_SUPABASE_ANON_KEY' && (val.includes('...') || val.length < 100)) {
    if (import.meta.env.PROD) {
      // In production, fail hard
      console.error(`[env] ❌ PLACEHOLDER SUPABASE KEY DETECTED`);
      console.error(`[env] 💡 You must replace the placeholder key in .env file`);
        console.error(`[env] 📍 Go to: https://supabase.com/dashboard/project/kkgprdyubapozuxhlmok/settings/api`);
        console.error(`[env] 📋 Copy the 'anon' 'public' key (long JWT token)`);
        console.error(`[env] 📝 Replace VITE_SUPABASE_ANON_KEY value in .env file`);
        throw new Error('Cannot use placeholder Supabase anon key. Get real key from Supabase dashboard.');
      } else {
        // In development, warn but allow with mock key
        console.warn(`[env] ⚠️  PLACEHOLDER SUPABASE KEY DETECTED - Using development fallback`);
        console.warn(`[env] 💡 To use real Supabase features, get your key from:`);
        console.warn(`[env] 📍 https://supabase.com/dashboard/project/kkgprdyubapozuxhlmok/settings/api`);
      console.warn(`[env] 🔧 Auth features will not work until you add a real key`);
      // Return a valid-looking but non-functional key for development
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZXYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjQ0MDAwMCwiZXhwIjoxOTU4MDE2MDAwfQ.dev-mode-placeholder-key-replace-with-real-key-from-dashboard';
    }
  }
  
  return val;
};

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', 'Get from Supabase dashboard → Settings → API'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', 'Get from Supabase dashboard → Settings → API'),
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  siteUrl: import.meta.env.VITE_SITE_URL || 'http://localhost:3000',
  gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
  // Feature flags (frontend)
  // Controls whether the app uses the v2 product API (Supabase edge functions)
  // vs the legacy service layer (`productService`/`searchService`).
  // Default is true so new environments get v2 by default.
  productApiV2: (import.meta.env.VITE_FEATURE_PRODUCT_API_V2 || 'true') === 'true',
  isDev: import.meta.env.DEV === true,
  isProd: import.meta.env.PROD === true,
};

// Development helper
if (env.isDev) {
  console.log('[env] ✅ Environment configuration loaded successfully');
  console.log('[env] 🌐 Supabase URL:', env.supabaseUrl);
  console.log('[env] 🔑 Supabase key format: ' + (env.supabaseAnonKey.startsWith('eyJ') ? 'valid' : 'placeholder'));
}
