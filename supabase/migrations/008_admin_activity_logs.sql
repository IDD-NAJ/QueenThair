-- ============================================================
--  Admin Activity Logs Table
-- ============================================================

create table if not exists public.admin_activity_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references public.profiles(id) on delete cascade,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  details     jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_admin_logs_admin_id on public.admin_activity_logs(admin_id);
create index if not exists idx_admin_logs_entity on public.admin_activity_logs(entity_type, entity_id);
create index if not exists idx_admin_logs_created on public.admin_activity_logs(created_at desc);

-- Function to log admin activity
create or replace function log_admin_activity(
  p_admin_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_details jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_log_id uuid;
begin
  insert into public.admin_activity_logs (
    admin_id, action, entity_type, entity_id, details
  ) values (
    p_admin_id, p_action, p_entity_type, p_entity_id, p_details
  )
  returning id into v_log_id;
  
  return v_log_id;
end;
$$;
