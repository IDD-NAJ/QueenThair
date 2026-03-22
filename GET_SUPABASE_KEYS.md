# 🔑 How to Get Your Real Supabase Keys

## Current Status
Your app is running in **development mode** with placeholder keys. Auth features (signup/login) **will not work** until you add real Supabase keys.

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase Dashboard
Go to: **https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/settings/api**

### 2. Find Project API Keys Section
Look for the section titled **"Project API keys"**

### 3. Copy the Anon Key
- Find the key labeled **"anon" "public"**
- Click the **copy icon** (📋) next to it
- This key should be **300+ characters long**
- It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cnJxeGFhZ2p5a3Jzd2Vsdm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI5NzYwMDAsImV4cCI6MTk5ODU1MjAwMH0.LONG_SIGNATURE_HERE`

### 4. Update .env File
Open: `c:\Users\DANE\Documents\website\QueenTEE\.env`

**Replace line 4:**
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**With the full key you copied:**
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cnJxeGFhZ2p5a3Jzd2Vsdm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI5NzYwMDAsImV4cCI6MTk5ODU1MjAwMH0.PASTE_YOUR_ACTUAL_SIGNATURE_HERE
```

### 5. (Optional) Copy Service Role Key
- Find the key labeled **"service_role" "secret"**
- Click the copy icon
- Replace line 7 in `.env` with the full key

**⚠️ WARNING:** Service role key has admin privileges. Never expose it in client-side code!

### 6. Restart Dev Server
```bash
# Stop server (Ctrl+C in terminal)
npm run dev
```

### 7. Verify Success
After restart, check browser console:
```
[env] ✅ Environment configuration loaded successfully
[env] 🌐 Supabase URL: https://jvrrqxaagjykrswelvno.supabase.co
[env] 🔑 Supabase key format: valid
```

---

## ✅ What Works Now

### Without Real Keys (Current State)
- ✅ App loads and runs
- ✅ Browse products
- ✅ View pages
- ❌ Signup/Login (will fail)
- ❌ User dashboard
- ❌ Admin dashboard
- ❌ Database operations

### With Real Keys (After Update)
- ✅ Everything above PLUS:
- ✅ User signup/login
- ✅ User dashboard access
- ✅ Admin dashboard access
- ✅ Database operations
- ✅ Profile management
- ✅ Order history
- ✅ All dashboard features

---

## 🔒 Security Notes

### Safe to Use (Frontend)
- ✅ `VITE_SUPABASE_URL` - Public URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Public anon key (RLS protected)

### Never Expose (Backend Only)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Admin key, server-side only
- ❌ Never commit `.env` to git
- ❌ Never share service role key publicly

---

## 🆘 Troubleshooting

### "Key still shows as placeholder"
- Make sure you copied the **entire** key (300+ chars)
- Check for extra spaces or line breaks
- Ensure no quotes around the key value
- Restart dev server after updating

### "Auth still not working"
1. Verify key is correct in Supabase dashboard
2. Check Supabase project is active (not paused)
3. Enable Email provider in Supabase Auth settings
4. Clear browser cache and restart

### "Can't find the keys"
- Make sure you're logged into Supabase
- Verify you have access to project `jvrrqxaagjykrswelvno`
- Try refreshing the Supabase dashboard page

---

## 📞 Need Help?

If you continue having issues:
1. Check browser console for specific errors
2. Verify Supabase project status in dashboard
3. Ensure `.env` file is in project root
4. Confirm dev server restarted after changes

---

**Once you add real keys, all auth features will work! 🎉**
