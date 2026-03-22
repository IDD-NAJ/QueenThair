# Profile Photo & Save Changes - Setup & Troubleshooting

## Current Status

The profile photo upload and save changes functionality is **fully implemented** in the code. If it's not working, the issue is likely with **Supabase database setup**.

---

## ✅ What's Already Implemented

### Profile Photo Upload
- File input with validation (image types only, max 5MB)
- Upload to Supabase storage (`avatars` bucket)
- Update profile with public URL
- Display uploaded photo or default icon
- Remove photo functionality

### Save Changes
- Form validation (first name, last name required)
- Phone number format validation
- Update profile in database
- Sync with global state
- Success/error toast notifications

---

## 🔧 Required Supabase Setup

### 1. Apply Database Migrations

**Run these commands in your terminal:**

```bash
cd c:\Users\DANE\Documents\website\QueenTEE

# Initialize Supabase (if not done)
supabase init

# Link to your project
supabase link --project-ref jvrrqxaagjykrswelvno

# Apply all migrations
supabase db push
```

**Or manually in Supabase SQL Editor:**

1. Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/sql/new
2. Run each migration file in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_auth_trigger.sql`
   - `supabase/migrations/004_storage.sql`
   - `supabase/migrations/005_inventory_rpc.sql`

### 2. Verify Storage Bucket

Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/storage/buckets

**Check that `avatars` bucket exists with:**
- **Public**: No (private)
- **File size limit**: 2MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

**If bucket doesn't exist, create it:**
1. Click "New bucket"
2. Name: `avatars`
3. Public: OFF
4. File size limit: 2097152 (2MB)
5. Allowed MIME types: `image/jpeg,image/png,image/webp`

### 3. Verify Storage Policies

Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/storage/policies

**Required policies for `avatars` bucket:**
- ✅ Users read own avatar
- ✅ Users upload own avatar
- ✅ Users update own avatar
- ✅ Users delete own avatar

**If policies are missing, run this SQL:**

```sql
-- Users read own avatar
create policy "Users read own avatar"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users upload own avatar
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users update own avatar
create policy "Users update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users delete own avatar
create policy "Users delete own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Verify Profiles Table

Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/editor

**Check `profiles` table has these columns:**
- `id` (uuid, primary key)
- `first_name` (text)
- `last_name` (text)
- `phone` (text)
- `avatar_url` (text) ← **Important for photo upload**
- `role` (user_role)
- `marketing_opt_in` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**If `avatar_url` column is missing, run this SQL:**

```sql
alter table public.profiles add column if not exists avatar_url text;
```

### 5. Verify RLS Policies on Profiles

Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/auth/policies

**Required policies for `profiles` table:**
- ✅ Users can view own profile
- ✅ Users can update own profile

**If policies are missing, run this SQL:**

```sql
-- Enable RLS
alter table public.profiles enable row level security;

-- Users can view own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
```

---

## 🧪 Testing

### Test Profile Photo Upload

1. Log in to dashboard
2. Go to Profile Settings
3. Click camera icon or "Change Photo"
4. Select an image file (JPG, PNG, or WebP)
5. Should see:
   - "Profile photo updated successfully" toast
   - Photo appears in avatar circle
   - "Remove" button appears

### Test Profile Photo Removal

1. With photo uploaded
2. Click "Remove" button
3. Should see:
   - "Profile photo removed" toast
   - Default user icon appears
   - "Remove" button disappears

### Test Save Changes

1. Edit First Name, Last Name, or Phone
2. Click "Save Changes"
3. Should see:
   - "Profile updated successfully" toast
   - Button shows "Saving..." during save
   - Changes persist after page reload

---

## 🐛 Troubleshooting

### Error: "Failed to upload photo"

**Possible causes:**
1. Storage bucket not created
2. Storage policies not set
3. File too large (>2MB)
4. Invalid file type

**Check browser console for specific error**

### Error: "Failed to update profile"

**Possible causes:**
1. Profiles table missing columns
2. RLS policies not set
3. User not authenticated

**Check browser console for specific error**

### Photo uploads but doesn't display

**Possible causes:**
1. `avatar_url` column missing in profiles table
2. Storage bucket is private but policies not set
3. URL not being saved to database

**Check:**
```sql
select id, first_name, last_name, avatar_url 
from public.profiles 
where id = auth.uid();
```

### Changes don't save

**Possible causes:**
1. Form validation failing (check for red borders)
2. RLS policies blocking update
3. Network error

**Check browser console for validation errors**

---

## 📊 Verify Database State

### Check if profile exists

```sql
select * from public.profiles where id = auth.uid();
```

### Check if avatar uploaded

```sql
select * from storage.objects where bucket_id = 'avatars';
```

### Check storage policies

```sql
select * from pg_policies where tablename = 'objects' and schemaname = 'storage';
```

---

## ✅ Expected Behavior After Setup

1. **Profile Photo Upload**
   - Click camera icon → file picker opens
   - Select image → uploads to Supabase
   - Photo appears in circle
   - URL saved to `profiles.avatar_url`

2. **Profile Photo Removal**
   - Click "Remove" → deletes from storage
   - Default icon appears
   - `profiles.avatar_url` set to null

3. **Save Changes**
   - Edit fields → click "Save Changes"
   - Validates required fields
   - Updates `profiles` table
   - Shows success toast

---

## 🆘 Still Not Working?

1. **Check browser console** for specific errors
2. **Check Supabase logs**: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/logs/explorer
3. **Verify you're logged in** (check if user icon shows in header)
4. **Hard refresh browser** (Ctrl+Shift+R)
5. **Check network tab** for failed API requests

---

**All functionality is implemented. Issues are likely Supabase configuration.**
