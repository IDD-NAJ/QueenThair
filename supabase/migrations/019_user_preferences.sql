-- ============================================================
--  User Preferences and Notifications Table
-- ============================================================

create table if not exists public.user_preferences (
  id                      uuid primary key references public.profiles(id) on delete cascade,
  email_notifications     boolean not null default true,
  sms_notifications       boolean not null default false,
  order_updates           boolean not null default true,
  promotional_emails      boolean not null default true,
  newsletter              boolean not null default false,
  theme                   text not null default 'light',
  language                text not null default 'en',
  currency                char(3) not null default 'USD',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function set_updated_at();

-- Auto-create preferences when profile is created
create or replace function create_user_preferences()
returns trigger language plpgsql as $$
begin
  insert into public.user_preferences (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_create_user_preferences
  after insert on public.profiles
  for each row execute function create_user_preferences();
