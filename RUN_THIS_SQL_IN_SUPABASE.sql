-- ============================================================
--  COPY AND RUN THIS IN SUPABASE DASHBOARD SQL EDITOR
--  https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/sql/new
-- ============================================================

alter table public.newsletter_subscribers enable row level security;

-- Drop all existing policies
drop policy if exists "Public insert newsletter" on public.newsletter_subscribers;
drop policy if exists "Admin manage newsletter" on public.newsletter_subscribers;
drop policy if exists "public_can_insert_newsletter" on public.newsletter_subscribers;
drop policy if exists "admin_manage_newsletter" on public.newsletter_subscribers;
drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscribers;
drop policy if exists "Admins can manage newsletter subscribers" on public.newsletter_subscribers;

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

-- ============================================================
-- After running this, newsletter signup will work immediately
-- ============================================================
