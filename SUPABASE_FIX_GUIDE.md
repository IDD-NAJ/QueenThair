# 🚨 Supabase Connection Fix Guide

## Problem Identified
The `net::ERR_NAME_NOT_RESOLVED` error was caused by an **invalid Supabase anon key format** in your `.env` file.

### ❌ Invalid Key (What you had)
```
VITE_SUPABASE_ANON_KEY=sb_publishable_HBneH1As1TNYe8jPCOU9oA_fhxnJkrx
```

### ✅ Valid Key (What you need)
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cnJxeGFhZ2p5a3Jzd2Vsdm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ1MjQ4MDAsImV4cCI6MjA0MDEwMDgwMH0.example
```

## 🔧 Fix Steps

### 1. Get Your Real Supabase Keys

1. **Open your Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/settings/api
   ```

2. **Copy the Anon Key**:
   - Find the "Project API keys" section
   - Copy the **anon** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - This key is safe to use in the browser

3. **Copy the Service Role Key** (for Edge Functions):
   - Find the **service_role** key (also starts with `eyJ...`)
   - This key is for server-side use only

### 2. Update Your .env File

Replace the current content with your real keys:

```bash
# ── Supabase Configuration ──────────────────────────────────
VITE_SUPABASE_URL=https://jvrrqxaagjykrswelvno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_REAL_ANON_KEY_HERE

# Service Role Key (for Edge Functions only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_REAL_SERVICE_ROLE_KEY_HERE
```

### 3. Restart Your Development Server

```bash
npm run dev
```

## 🔍 Validation Added

I've improved the environment validation to catch these issues early:

- ✅ **URL format validation** - Ensures Supabase URL is correct
- ✅ **Key format validation** - Ensures keys start with `eyJ` (JWT format)
- ✅ **Clear error messages** - Tells you exactly what's wrong
- ✅ **Helpful instructions** - Shows where to get the correct keys

## 🧪 Test the Fix

After updating your keys:

1. **Start the dev server**: `npm run dev`
2. **Check browser console** for:
   ```
   [env] ✅ Environment configuration loaded successfully
   [env] 🌐 Supabase URL: https://jvrrqxaagjykrswelvno.supabase.co
   [env] 🔑 Supabase key format: valid
   ```

3. **Test a simple API call** in browser console:
   ```javascript
   // This should work without errors
   supabase.from('profiles').select('count').then(console.log)
   ```

## 🚨 Common Issues

### Issue: "Invalid Supabase anon key format"
**Solution**: Make sure your key starts with `eyJ` and is copied exactly from the Supabase dashboard.

### Issue: "Missing environment variable"
**Solution**: Ensure your `.env` file is in the project root and has the correct variable names.

### Issue: Still getting connection errors
**Solution**: 
1. Verify your project ID is correct: `jvrrqxaagjykrswelvno`
2. Check if your Supabase project is active
3. Ensure you're using the correct region URL

## 📋 Quick Checklist

- [ ] Real Supabase anon key (starts with `eyJ`)
- [ ] Real Supabase service role key (starts with `eyJ`)
- [ ] Correct project ID: `jvrrqxaagjykrswelvno`
- [ ] `.env` file in project root
- [ ] Restarted dev server after changes
- [ ] No console errors about environment variables

## 🆘 Need Help?

If you're still having issues:

1. **Check your Supabase project status**: https://supabase.com/dashboard
2. **Verify project URL**: Should be `https://jvrrqxaagjykrswelvno.supabase.co`
3. **Get fresh keys** from the dashboard
4. **Check browser console** for specific error messages

The validation I added will give you clear, actionable error messages if anything is misconfigured!
