# Debug Product Creation Issue

## Problem
Product creation fails with: "Cannot coerce the result to a single JSON object" - PGRST116 (0 rows returned)

## Root Cause
The RLS policy on the `products` table requires `is_admin()` to return true, but:
1. User might not be logged in
2. User might not have 'admin' role in their profile
3. The insert is being blocked by RLS before it can return data

## Solution Steps

### Step 1: Verify User is Admin
Check in Supabase Table Editor:
- Go to `profiles` table
- Find your user record
- Ensure `role` column = 'admin' (not 'customer')

### Step 2: If User Role is Wrong
Run this SQL in Supabase SQL Editor:
```sql
-- Replace YOUR_EMAIL with your actual email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL';
```

### Step 3: Verify RLS Policy
The policy in `002_rls.sql` is:
```sql
create policy "Admin manage products"
  on public.products for all
  using (is_admin())
  with check (is_admin());
```

This requires the `is_admin()` function to return true, which checks:
```sql
select exists (
  select 1 from public.profiles
  where id = auth.uid() and role = 'admin'
);
```

### Step 4: Test Admin Status
Run this in Supabase SQL Editor while logged in:
```sql
SELECT is_admin();
```
Should return `true` if you're an admin.

### Step 5: Check Auth Status
In browser console, run:
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('Profile:', profile);
```

## Quick Fix
If you need to bypass RLS temporarily for testing, you can disable it:
```sql
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
```

**WARNING**: Don't leave RLS disabled in production!

## Permanent Fix
Ensure your user account has the admin role set correctly in the database.
