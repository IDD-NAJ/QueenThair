-- ============================================================
--  QUEENTHAIR – Migration 010: Fix Notifications RLS Policies
--  This fixes the 404 errors by properly enabling RLS on notifications
-- ============================================================

-- Enable RLS on notifications table (was missing from enhanced RLS)
alter table public.notifications enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Admins can create notifications" on public.notifications;
drop policy if exists "Admins can delete notifications" on public.notifications;

-- Create proper RLS policies for notifications
-- Users can read their own notifications
create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Users can insert their own notifications (for system-generated ones)
create policy "Users can insert own notifications"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);

-- Admins can manage all notifications
create policy "Admins can manage all notifications"
on public.notifications
for all
to service_role
using (true)
with check (true);

-- Add missing columns if they don't exist (for compatibility)
do $$
begin
    -- Add data column if it doesn't exist
    if not exists (
        select 1 from information_schema.columns 
        where table_name = 'notifications' 
        and column_name = 'data'
    ) then
        alter table public.notifications 
        add column data jsonb not null default '{}'::jsonb;
    end if;

    -- Add message column if it doesn't exist
    if not exists (
        select 1 from information_schema.columns 
        where table_name = 'notifications' 
        and column_name = 'message'
    ) then
        alter table public.notifications 
        add column message text;
    end if;

    -- Add link column if it doesn't exist
    if not exists (
        select 1 from information_schema.columns 
        where table_name = 'notifications' 
        and column_name = 'link'
    ) then
        alter table public.notifications 
        add column link text;
    end if;
end $$;

-- Create indexes for better performance
create index if not exists idx_notifications_user_id_read 
on public.notifications(user_id, read);

create index if not exists idx_notifications_user_id_created_at 
on public.notifications(user_id, created_at desc);

-- Test notification removed - will be created via seed data instead
