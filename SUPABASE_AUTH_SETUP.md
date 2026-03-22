# Supabase Authentication Setup Required

## Error: 401 Unauthorized on Signup

Your Supabase project has email authentication disabled.

## Fix in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/auth/providers

2. Click on **Email** provider

3. **Enable** the Email provider

4. Under **Email Auth Settings**:
   - Enable "Enable email signup"
   - For testing: Disable "Confirm email" (optional)
   - For production: Keep "Confirm email" enabled

5. Click **Save**

6. Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/auth/url-configuration

7. Set **Site URL** to: `http://localhost:3000` (or your dev server port)

8. Add to **Redirect URLs**:
   - `http://localhost:3000/**`
   - Your production URL when ready

9. Click **Save**

## After Enabling

Restart your dev server and try registration again.
