# 🔧 Fix: Supabase 401 Unauthorized Error

## Root Cause Identified

**The .env file contains PLACEHOLDER keys instead of real Supabase credentials.**

Your current `.env` file has:
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
```

This is a **placeholder/truncated key** - not a real Supabase anon key.

---

## ✅ Solution: Get Real Supabase Keys

### Step 1: Go to Supabase Dashboard
Open: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/settings/api

### Step 2: Copy the Anon Key
1. Find the section labeled **"Project API keys"**
2. Look for **"anon" "public"** key
3. Click the **copy icon** (📋) next to it
4. The real key is a LONG JWT token (300+ characters)

### Step 3: Update .env File
Open `c:\Users\DANE\Documents\website\QueenTEE\.env` and replace:

**BEFORE (broken):**
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
```

**AFTER (working):**
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cnJxeGFhZ2p5a3Jzd2Vsdm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI5NzYwMDAsImV4cCI6MTk5ODU1MjAwMH0.ACTUAL_SIGNATURE_HERE
```

*(Paste the FULL key you copied - should be 300+ characters)*

### Step 4: Also Get Service Role Key (Optional, for Edge Functions)
1. In same dashboard page, find **"service_role" "secret"** key
2. Copy it
3. Replace in .env:
```env
SUPABASE_SERVICE_ROLE_KEY=<paste full service role key here>
```

### Step 5: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 🔍 What Was Wrong

### Files Affected
1. **`.env`** - Had placeholder keys
2. **`src/lib/env.js`** - Now detects and rejects placeholder keys
3. **`src/services/authService.js`** - Added validation and better error messages

### Changes Made

#### 1. Enhanced Environment Validation (`src/lib/env.js`)
- ✅ Detects placeholder keys (containing `...` or too short)
- ✅ Throws clear error with instructions
- ✅ Prevents app from starting with invalid config

#### 2. Improved Auth Service (`src/services/authService.js`)
- ✅ Input validation for email/password
- ✅ Development logging for debugging
- ✅ User-friendly error messages
- ✅ Specific handling for 401 errors

#### 3. Better Error Handling
- ✅ Production-safe error messages
- ✅ Clear console logs in development
- ✅ Validation before API calls

---

## 🧪 Testing After Fix

### 1. Verify Environment Loads
After updating .env and restarting, check browser console:
```
[env] ✅ Environment configuration loaded successfully
[env] 🌐 Supabase URL: https://jvrrqxaagjykrswelvno.supabase.co
[env] 🔑 Supabase key format: valid
```

### 2. Test Signup
1. Go to `/register`
2. Fill out form
3. Submit
4. Should see success message or specific error (not 401)

### 3. Test Login
1. Go to `/login`
2. Enter credentials
3. Should redirect to dashboard

---

## 🔐 Security Notes

### ✅ Correct Setup
- Frontend uses **VITE_SUPABASE_ANON_KEY** (public, safe)
- Service role key **NEVER** exposed to browser
- Supabase client created once and reused

### ❌ Never Do This
- Don't use service_role key in frontend
- Don't commit .env file to git
- Don't share keys publicly

---

## 📋 Summary of Changes

### Modified Files
1. **`src/lib/env.js`**
   - Added placeholder key detection
   - Better error messages
   - Fails fast on invalid config

2. **`src/services/authService.js`**
   - Added input validation
   - Development logging
   - User-friendly error messages
   - Specific 401 error handling

3. **`FIX_SUPABASE_401_ERROR.md`** (this file)
   - Complete fix documentation

### What Was Broken
- .env file had placeholder/truncated Supabase anon key
- No validation to catch this early
- Generic error messages didn't help debug

### What's Fixed
- Environment validation catches bad keys immediately
- Clear instructions on where to get real keys
- Better error messages throughout auth flow
- Development logging for easier debugging

---

## ✅ Next Steps

1. **Get real Supabase keys** from dashboard
2. **Update .env file** with full keys
3. **Restart dev server**
4. **Test signup/login**
5. **Apply database migrations** (if not done yet)

---

## 🆘 Still Getting 401?

If you still see 401 after updating keys:

### Check Supabase Dashboard Settings
1. Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/auth/providers
2. Ensure **Email** provider is **enabled**
3. Enable "Email signup"
4. Save changes

### Verify Keys Are Correct
```bash
# In browser console after app loads:
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 50))
```

Should show your real URL and start of real key.

---

**After following these steps, signup should work correctly! 🎉**
