# Apply Newsletter RLS Fix

## Quick Fix

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Fix Newsletter RLS - Allow Public Insert
alter table public.newsletter_subscribers enable row level security;

-- Drop existing policies
drop policy if exists "Public insert newsletter" on public.newsletter_subscribers;
drop policy if exists "Admin manage newsletter" on public.newsletter_subscribers;

-- Allow anyone (anon + authenticated) to insert
create policy "public_can_insert_newsletter"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

-- Admin can manage all
create policy "admin_manage_newsletter"
  on public.newsletter_subscribers
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

## Dashboard Link
https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/sql/new

After running, test newsletter signup on homepage or footer.
