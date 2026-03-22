-- ============================================================
--  QUEENTHAIR – Migration 007: RLS Policies for User Dashboard
-- ============================================================

-- ============================================================
--  RLS: user_notification_preferences
-- ============================================================
alter table public.user_notification_preferences enable row level security;

create policy "Users can view own notification preferences"
  on public.user_notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on public.user_notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.user_notification_preferences for update
  using (auth.uid() = user_id);

-- ============================================================
--  RLS: notifications (already configured in migration 012)
-- ============================================================
-- Notifications RLS policies already exist from migration 012, skipping

-- ============================================================
--  RLS: security_events
-- ============================================================
alter table public.security_events enable row level security;

create policy "Users can view own security events"
  on public.security_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own security events"
  on public.security_events for insert
  with check (auth.uid() = user_id);

-- ============================================================
--  RLS: contact_messages (update to allow user to insert)
-- ============================================================
drop policy if exists "Anyone can insert contact messages" on public.contact_messages;

create policy "Authenticated users can insert contact messages"
  on public.contact_messages for insert
  with check (
    auth.uid() is not null and 
    (user_id is null or user_id = auth.uid())
  );

create policy "Users can view own contact messages"
  on public.contact_messages for select
  using (user_id = auth.uid());
