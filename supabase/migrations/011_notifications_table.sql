-- ============================================================
--  QUEENTHAIR – Migration 006: Notifications Table
-- ============================================================

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null, -- 'order', 'promotion', 'system', 'review'
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

create trigger trg_notifications_updated_at
  before update on public.notifications
  for each row execute function set_updated_at();

-- ── RLS Policies ──────────────────────────────────────────────

alter table public.notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Only admins can create notifications
create policy "Admins can create notifications"
  on public.notifications for insert
  with check (is_admin());

-- Only admins can delete notifications
create policy "Admins can delete notifications"
  on public.notifications for delete
  using (is_admin());
