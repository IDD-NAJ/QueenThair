-- ============================================================
--  QUEENTHAIR – Migration 002: Row Level Security Policies
-- ============================================================

-- ── Enable RLS on all user-owned and sensitive tables ────────
alter table public.profiles              enable row level security;
alter table public.addresses             enable row level security;
alter table public.categories            enable row level security;
alter table public.collections           enable row level security;
alter table public.products              enable row level security;
alter table public.product_images        enable row level security;
alter table public.product_variants      enable row level security;
alter table public.inventory             enable row level security;
alter table public.collection_products   enable row level security;
alter table public.wishlists             enable row level security;
alter table public.wishlist_items        enable row level security;
alter table public.carts                 enable row level security;
alter table public.cart_items            enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_status_events   enable row level security;
alter table public.reviews               enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages      enable row level security;
alter table public.promo_codes           enable row level security;
alter table public.admin_settings        enable row level security;

-- ── Helper: is the current user an admin? ────────────────────
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
--  PROFILES
-- ============================================================
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin read all profiles"
  on public.profiles for select
  using (is_admin());

-- profiles are auto-inserted via trigger; no public insert policy needed
create policy "Service role insert profile"
  on public.profiles for insert
  with check (true);   -- service_role bypasses RLS; this covers trigger inserts

-- ============================================================
--  ADDRESSES
-- ============================================================
create policy "Users manage own addresses"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin read all addresses"
  on public.addresses for select
  using (is_admin());

-- ============================================================
--  CATEGORIES  (public read, admin write)
-- ============================================================
create policy "Public read active categories"
  on public.categories for select
  using (is_active = true);

create policy "Admin manage categories"
  on public.categories for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  COLLECTIONS  (public read, admin write)
-- ============================================================
create policy "Public read active collections"
  on public.collections for select
  using (is_active = true);

create policy "Admin manage collections"
  on public.collections for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  PRODUCTS  (public read, admin write)
-- ============================================================
create policy "Public read active products"
  on public.products for select
  using (is_active = true);

create policy "Admin manage products"
  on public.products for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  PRODUCT IMAGES  (public read, admin write)
-- ============================================================
create policy "Public read product images"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
  );

create policy "Admin manage product images"
  on public.product_images for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  PRODUCT VARIANTS  (public read, admin write)
-- ============================================================
create policy "Public read active variants"
  on public.product_variants for select
  using (is_active = true);

create policy "Admin manage variants"
  on public.product_variants for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  INVENTORY  (admin only write; service role for checkout)
-- ============================================================
create policy "Public read inventory"
  on public.inventory for select
  using (true);

create policy "Admin manage inventory"
  on public.inventory for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  COLLECTION_PRODUCTS  (public read, admin write)
-- ============================================================
create policy "Public read collection products"
  on public.collection_products for select
  using (true);

create policy "Admin manage collection products"
  on public.collection_products for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  WISHLISTS
-- ============================================================
create policy "Users manage own wishlist"
  on public.wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin read wishlists"
  on public.wishlists for select
  using (is_admin());

-- ============================================================
--  WISHLIST_ITEMS
-- ============================================================
create policy "Users manage own wishlist items"
  on public.wishlist_items for all
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and w.user_id = auth.uid()
    )
  );

-- ============================================================
--  CARTS
-- ============================================================
create policy "Users read own cart"
  on public.carts for select
  using (auth.uid() = user_id or session_id is not null);

create policy "Users insert cart"
  on public.carts for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users update own cart"
  on public.carts for update
  using (auth.uid() = user_id or (user_id is null and session_id is not null));

create policy "Admin read all carts"
  on public.carts for select
  using (is_admin());

-- ============================================================
--  CART_ITEMS
-- ============================================================
create policy "Users manage own cart items"
  on public.cart_items for all
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id
        and (c.user_id = auth.uid() or c.session_id is not null)
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_id
        and (c.user_id = auth.uid() or c.session_id is not null)
    )
  );

-- ============================================================
--  ORDERS
-- ============================================================
create policy "Users read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Guest order lookup by email"
  on public.orders for select
  using (
    user_id is null
    and email = current_setting('request.jwt.claims', true)::json->>'email'
  );

create policy "Service role insert orders"
  on public.orders for insert
  with check (true);   -- edge functions use service_role key

create policy "Admin manage orders"
  on public.orders for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  ORDER_ITEMS
-- ============================================================
create policy "Users read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Service role insert order items"
  on public.order_items for insert
  with check (true);

create policy "Admin manage order items"
  on public.order_items for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  ORDER_STATUS_EVENTS
-- ============================================================
create policy "Users read own order events"
  on public.order_status_events for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Service role insert order events"
  on public.order_status_events for insert
  with check (true);

create policy "Admin manage order events"
  on public.order_status_events for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  REVIEWS
-- ============================================================
create policy "Public read approved reviews"
  on public.reviews for select
  using (is_approved = true);

create policy "Users read own unapproved reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

create policy "Users insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id and is_approved = false);

create policy "Admin manage reviews"
  on public.reviews for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  NEWSLETTER_SUBSCRIBERS
-- ============================================================
create policy "Public insert newsletter"
  on public.newsletter_subscribers for insert
  with check (true);

create policy "Admin manage newsletter"
  on public.newsletter_subscribers for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  CONTACT_MESSAGES
-- ============================================================
create policy "Public insert contact"
  on public.contact_messages for insert
  with check (true);

create policy "Admin manage contact messages"
  on public.contact_messages for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  PROMO_CODES  (public active read; admin write)
-- ============================================================
create policy "Public read active promo codes"
  on public.promo_codes for select
  using (is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));

create policy "Admin manage promo codes"
  on public.promo_codes for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
--  ADMIN_SETTINGS
-- ============================================================
create policy "Admin manage settings"
  on public.admin_settings for all
  using (is_admin())
  with check (is_admin());
