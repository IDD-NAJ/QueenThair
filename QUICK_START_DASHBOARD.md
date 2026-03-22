# 🚀 Quick Start - Dashboard System

Get your QUEENTHAIR dashboards up and running in 5 minutes!

---

## Step 1: Apply Database Migrations

### Option A: Single File (Recommended)
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy entire contents of `supabase/migrations/APPLY_ALL_DASHBOARD_MIGRATIONS.sql`
3. Paste and click **Run**
4. ✅ You should see success message

### Option B: Individual Files
Run these in order in SQL Editor:
1. `007_admin_activity_logs.sql`
2. `008_user_preferences.sql`
3. `009_enhanced_rls.sql`

---

## Step 2: Create Admin User

In **Supabase SQL Editor**, run:

```sql
-- Replace with your email
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'
)
WHERE email = 'your-email@example.com';
```

**Alternative:** Any email ending with `@Queenthair.com` is automatically admin!

---

## Step 3: Start Development Server

```bash
npm run dev
```

---

## Step 4: Test the Dashboards

### Test User Dashboard
1. Sign in with a **customer account**
2. Click the **account icon** in header
3. Should redirect to `/dashboard`
4. Explore all sections:
   - Overview
   - Orders
   - Profile
   - Addresses
   - Wishlist
   - Security
   - Support
   - Preferences

### Test Admin Dashboard
1. Sign in with **admin account** (from Step 2)
2. Click the **account icon** in header
3. Should redirect to `/admin`
4. Explore all sections:
   - Overview
   - Orders
   - Customers
   - Products
   - Reviews
   - Messages
   - Coupons
   - Activity
   - Settings

---

## ✅ Verification Checklist

- [ ] Migrations applied successfully
- [ ] Admin user created
- [ ] Customer can access `/dashboard`
- [ ] Customer **cannot** access `/admin` (redirects)
- [ ] Admin can access `/admin`
- [ ] Admin can access `/dashboard` too
- [ ] Profile data loads correctly
- [ ] Orders display (if any exist)
- [ ] All navigation links work

---

## 🔧 Troubleshooting

### "User not authorized" errors
```sql
-- Check if RLS policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'orders', 'reviews', 'user_preferences', 'admin_activity_logs');

-- Should see multiple policies for each table
```

### Profile not loading
```sql
-- Check if profile exists
SELECT * FROM profiles WHERE id = 'your-user-id';

-- Create profile if missing
INSERT INTO profiles (id, role) 
VALUES ('your-user-id', 'customer')
ON CONFLICT (id) DO NOTHING;
```

### Admin access not working
```sql
-- Verify admin role
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'your-admin@example.com';

-- Should show role = 'admin'
```

### Routes not found
- Clear browser cache
- Restart dev server
- Check console for errors

---

## 📱 Mobile Testing

The dashboards are fully responsive! Test on:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

---

## 🎯 What's Next?

### Add Test Data
```sql
-- Create a test order
INSERT INTO orders (user_id, email, order_number, status, grand_total)
VALUES (
  'your-user-id',
  'your-email@example.com',
  'QTH-TEST01',
  'delivered',
  99.99
);
```

### Customize Branding
- Update colors in `tailwind.config.js`
- Change logo in `DashboardHeader.jsx`
- Modify site name in `AdminSettings.jsx`

### Add More Admins
```sql
-- Add another admin
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'
)
WHERE email = 'another-admin@example.com';
```

---

## 📚 Full Documentation

See `PRODUCTION_DASHBOARD_COMPLETE.md` for:
- Complete feature list
- Detailed architecture
- Security implementation
- API reference
- Advanced customization

---

## 🆘 Need Help?

1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify `.env` variables are set correctly
4. Review `PRODUCTION_DASHBOARD_COMPLETE.md`

---

**🎉 You're all set! Enjoy your production-ready dashboard system!**
