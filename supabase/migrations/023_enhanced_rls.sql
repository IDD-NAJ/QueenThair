-- ============================================================
--  Enhanced RLS Policies for Production Dashboard
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.user_preferences enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.reviews enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.promo_codes enable row level security;

-- Helper function to check if user is admin
-- Note: is_admin() already exists from migration 006, this migration uses the existing function

-- Helper function to check if user owns resource
create or replace function is_owner(resource_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select resource_user_id = auth.uid();
$$;

-- ============================================================
--  PROFILES - Users can read their own, admins can read all
-- ============================================================
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles" on public.profiles
  for all using (is_admin());

-- ============================================================
--  ADDRESSES - Users manage their own, admins can view all
-- ============================================================
drop policy if exists "Users can manage own addresses" on public.addresses;
create policy "Users can manage own addresses" on public.addresses
  for all using (user_id = auth.uid() or is_admin());

-- ============================================================
--  USER PREFERENCES - Users manage their own
-- ============================================================
drop policy if exists "Users can manage own preferences" on public.user_preferences;
create policy "Users can manage own preferences" on public.user_preferences
  for all using (id = auth.uid());

-- ============================================================
--  WISHLISTS - Users manage their own, admins can view
-- ============================================================
drop policy if exists "Users can manage own wishlist" on public.wishlists;
create policy "Users can manage own wishlist" on public.wishlists
  for all using (user_id = auth.uid() or is_admin());

drop policy if exists "Users can manage own wishlist items" on public.wishlist_items;
create policy "Users can manage own wishlist items" on public.wishlist_items
  for all using (
    exists (
      select 1 from public.wishlists
      where id = wishlist_items.wishlist_id
      and user_id = auth.uid()
    ) or is_admin()
  );

-- ============================================================
--  CARTS - Users manage their own, admins can view
-- ============================================================
drop policy if exists "Users can manage own cart" on public.carts;
create policy "Users can manage own cart" on public.carts
  for all using (
    user_id = auth.uid() 
    or session_id = current_setting('app.session_id', true)
    or is_admin()
  );

drop policy if exists "Users can manage own cart items" on public.cart_items;
create policy "Users can manage own cart items" on public.cart_items
  for all using (
    exists (
      select 1 from public.carts
      where id = cart_items.cart_id
      and (user_id = auth.uid() or session_id = current_setting('app.session_id', true))
    ) or is_admin()
  );

-- ============================================================
--  ORDERS - Users view their own, admins manage all
-- ============================================================
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "Admins can manage all orders" on public.orders;
create policy "Admins can manage all orders" on public.orders
  for all using (is_admin());

drop policy if exists "Users can view own order items" on public.order_items;
create policy "Users can view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where id = order_items.order_id
      and user_id = auth.uid()
    ) or is_admin()
  );

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items" on public.order_items
  for all using (is_admin());

drop policy if exists "Users can view own order status events" on public.order_status_events;
create policy "Users can view own order status events" on public.order_status_events
  for select using (
    exists (
      select 1 from public.orders
      where id = order_status_events.order_id
      and user_id = auth.uid()
    ) or is_admin()
  );

drop policy if exists "Admins can manage order status events" on public.order_status_events;
create policy "Admins can manage order status events" on public.order_status_events
  for all using (is_admin());

-- ============================================================
--  REVIEWS - Users manage their own, admins moderate all
-- ============================================================
drop policy if exists "Anyone can view approved reviews" on public.reviews;
create policy "Anyone can view approved reviews" on public.reviews
  for select using (is_approved = true or user_id = auth.uid() or is_admin());

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews" on public.reviews
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews" on public.reviews
  for update using (user_id = auth.uid() or is_admin());

drop policy if exists "Admins can manage all reviews" on public.reviews;
create policy "Admins can manage all reviews" on public.reviews
  for all using (is_admin());

-- ============================================================
--  ADMIN ACTIVITY LOGS - Admins only
-- ============================================================
drop policy if exists "Admins can view activity logs" on public.admin_activity_logs;
create policy "Admins can view activity logs" on public.admin_activity_logs
  for select using (is_admin());

drop policy if exists "Admins can create activity logs" on public.admin_activity_logs;
create policy "Admins can create activity logs" on public.admin_activity_logs
  for insert with check (is_admin());

-- ============================================================
--  CONTACT MESSAGES - Users create, admins manage
-- ============================================================
drop policy if exists "Anyone can create contact messages" on public.contact_messages;
create policy "Anyone can create contact messages" on public.contact_messages
  for insert with check (true);

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages" on public.contact_messages
  for all using (is_admin());

-- ============================================================
--  NEWSLETTER - Anyone can subscribe, admins manage
-- ============================================================
drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Anyone can subscribe to newsletter" on public.newsletter_subscribers
  for insert with check (true);

drop policy if exists "Admins can manage newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can manage newsletter subscribers" on public.newsletter_subscribers
  for all using (is_admin());

-- ============================================================
--  PROMO CODES - Admins only
-- ============================================================
drop policy if exists "Admins can manage promo codes" on public.promo_codes;
create policy "Admins can manage promo codes" on public.promo_codes
  for all using (is_admin());

drop policy if exists "Anyone can view active promo codes" on public.promo_codes;
create policy "Anyone can view active promo codes" on public.promo_codes
  for select using (is_active = true or is_admin());
