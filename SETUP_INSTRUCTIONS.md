# Setup Instructions - Fix Database Errors

## Current Errors

### 1. Notifications Table Not Found (404)
**Error:** `Could not find the table 'public.notifications' in the schema cache`

**Fix:** Apply the notifications migration to Supabase

### 2. Contact Messages Forbidden (403)
**Error:** `POST /rest/v1/contact_messages 403 (Forbidden)`

**Fix:** RLS policies exist but may need to be reapplied

---

## Solution: Apply All Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
cd c:\Users\DANE\Documents\website\QueenTEE

# Link to your project (if not already linked)
supabase link --project-ref jvrrqxaagjykrswelvno

# Apply all migrations
supabase db push
```

### Option 2: Manual SQL Execution

Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/sql/new

**Run these migrations in order:**

1. **006_notifications.sql** (NEW - just created)
```sql
-- Copy and paste contents from:
-- supabase/migrations/006_notifications.sql
```

2. **Verify contact_messages RLS** (should already exist from 002_rls.sql)
```sql
-- Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'contact_messages';

-- If missing, run:
create policy "Public insert contact"
  on public.contact_messages for insert
  with check (true);

create policy "Admin manage contact messages"
  on public.contact_messages for all
  using (is_admin())
  with check (is_admin());
```

---

## Verify Tables Exist

Run this query to check which tables are in your database:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables:**
- contact_messages ✓
- notifications ← Should appear after migration
- profiles
- addresses
- products
- orders
- wishlists
- etc.

---

## Test After Setup

### Test Notifications
1. Navigate to dashboard
2. Bell icon should load without errors
3. Console should show: "Failed to load notifications" disappears

### Test Contact Form
1. Go to contact page
2. Submit a message
3. Should succeed without 403 error

---

## Quick Fix Commands

**If you just want to fix the immediate errors:**

```bash
# Navigate to project
cd c:\Users\DANE\Documents\website\QueenTEE

# Apply migrations
supabase db push
```

**Or run this SQL directly in Supabase:**

```sql
-- Create notifications table
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null,
  title           text not null,
  message         text not null,
  link            text,
  read            boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Admins can create notifications"
  on public.notifications for insert
  with check (is_admin());

create policy "Admins can delete notifications"
  on public.notifications for delete
  using (is_admin());
```

---

**After applying migrations, refresh your browser and the errors should be gone.**
