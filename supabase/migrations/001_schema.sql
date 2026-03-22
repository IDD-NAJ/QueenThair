-- ============================================================
--  QUEENTHAIR – Migration 001: Full Schema
--  Run: supabase db push  (or paste into SQL editor)
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";   -- for full-text search

-- ── Utility: updated_at auto-trigger ────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── ENUMS ───────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type address_type as enum ('shipping', 'billing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_type as enum ('wig', 'accessory');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cart_status as enum ('active', 'converted', 'abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'pending', 'paid', 'processing', 'shipped',
    'delivered', 'cancelled', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum (
    'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type fulfillment_status as enum (
    'unfulfilled', 'partial', 'fulfilled', 'returned'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_status as enum ('new', 'read', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

-- ============================================================
--  TABLE: profiles
-- ============================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text,
  last_name       text,
  phone           text,
  avatar_url      text,
  role            user_role not null default 'customer',
  marketing_opt_in boolean  not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: addresses
-- ============================================================
create table if not exists public.addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            address_type not null default 'shipping',
  full_name       text not null,
  phone           text,
  line1           text not null,
  line2           text,
  city            text not null,
  state_region    text not null,
  postal_code     text not null,
  country         char(2) not null default 'US',
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_addresses_user_id on public.addresses(user_id);
create trigger trg_addresses_updated_at
  before update on public.addresses
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: categories
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_categories_slug on public.categories(slug);
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: collections
-- ============================================================
create table if not exists public.collections (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  banner_url      text,
  seo_title       text,
  seo_description text,
  featured        boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_collections_slug    on public.collections(slug);
create index if not exists idx_collections_featured on public.collections(featured);
create trigger trg_collections_updated_at
  before update on public.collections
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: products
-- ============================================================
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  description       text,
  short_description text,
  product_type      product_type not null default 'wig',
  category_id       uuid references public.categories(id) on delete set null,
  base_price        numeric(10,2) not null,
  compare_at_price  numeric(10,2),
  featured          boolean not null default false,
  new_arrival       boolean not null default false,
  best_seller       boolean not null default false,
  on_sale           boolean not null default false,
  badge             text,
  rating_average    numeric(3,2) not null default 0,
  review_count      int          not null default 0,
  seo_title         text,
  seo_description   text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_products_slug         on public.products(slug);
create index if not exists idx_products_type         on public.products(product_type);
create index if not exists idx_products_category     on public.products(category_id);
create index if not exists idx_products_featured     on public.products(featured)    where featured = true;
create index if not exists idx_products_new_arrival  on public.products(new_arrival) where new_arrival = true;
create index if not exists idx_products_best_seller  on public.products(best_seller) where best_seller = true;
create index if not exists idx_products_on_sale      on public.products(on_sale)     where on_sale = true;
create index if not exists idx_products_active       on public.products(is_active)   where is_active = true;
create index if not exists idx_products_rating       on public.products(rating_average desc);
-- Full-text search index
create index if not exists idx_products_fts on public.products
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(short_description,'')));
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: product_images
-- ============================================================
create table if not exists public.product_images (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  image_url         text not null,
  alt_text          text,
  sort_order        int  not null default 0,
  is_primary        boolean not null default false,
  source            text,
  photographer_name text,
  photographer_url  text,
  created_at        timestamptz not null default now()
);
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_product_images_primary    on public.product_images(product_id, is_primary) where is_primary = true;

-- ============================================================
--  TABLE: product_variants
-- ============================================================
create table if not exists public.product_variants (
  id                          uuid primary key default gen_random_uuid(),
  product_id                  uuid not null references public.products(id) on delete cascade,
  sku                         text unique,
  color                       text,
  length                      text,
  density                     text,
  size                        text,
  material                    text,
  option_label                text,
  price_override              numeric(10,2),
  compare_at_price_override   numeric(10,2),
  is_active                   boolean not null default true,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists idx_variants_product_id on public.product_variants(product_id);
create index if not exists idx_variants_sku        on public.product_variants(sku);
create trigger trg_variants_updated_at
  before update on public.product_variants
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: inventory
-- ============================================================
create table if not exists public.inventory (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products(id) on delete cascade,
  variant_id          uuid references public.product_variants(id) on delete cascade,
  sku                 text,
  quantity_available  int  not null default 0,
  quantity_reserved   int  not null default 0,
  low_stock_threshold int  not null default 5,
  track_inventory     boolean not null default true,
  allow_backorder     boolean not null default false,
  updated_at          timestamptz not null default now(),
  unique(product_id, variant_id)
);
create index if not exists idx_inventory_product_id on public.inventory(product_id);
create index if not exists idx_inventory_variant_id on public.inventory(variant_id);
create trigger trg_inventory_updated_at
  before update on public.inventory
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: collection_products  (join)
-- ============================================================
create table if not exists public.collection_products (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id    uuid not null references public.products(id)    on delete cascade,
  sort_order    int  not null default 0,
  unique(collection_id, product_id)
);
create index if not exists idx_col_products_collection on public.collection_products(collection_id);
create index if not exists idx_col_products_product    on public.collection_products(product_id);

-- ============================================================
--  TABLE: wishlists
-- ============================================================
create table if not exists public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_wishlists_updated_at
  before update on public.wishlists
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: wishlist_items
-- ============================================================
create table if not exists public.wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id  uuid not null references public.products(id)  on delete cascade,
  variant_id  uuid references public.product_variants(id)   on delete set null,
  created_at  timestamptz not null default now(),
  unique(wishlist_id, product_id, variant_id)
);
create index if not exists idx_wishlist_items_wishlist on public.wishlist_items(wishlist_id);

-- ============================================================
--  TABLE: carts
-- ============================================================
create table if not exists public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  session_id text,
  status     cart_status not null default 'active',
  currency   char(3)     not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (user_id is not null or session_id is not null)
);
create index if not exists idx_carts_user_id    on public.carts(user_id)    where user_id is not null;
create index if not exists idx_carts_session_id on public.carts(session_id) where session_id is not null;
create index if not exists idx_carts_status     on public.carts(status);
create trigger trg_carts_updated_at
  before update on public.carts
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: cart_items
-- ============================================================
create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts(id)               on delete cascade,
  product_id uuid not null references public.products(id)            on delete cascade,
  variant_id uuid references public.product_variants(id)             on delete set null,
  quantity   int  not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, product_id, variant_id)
);
create index if not exists idx_cart_items_cart_id on public.cart_items(cart_id);
create trigger trg_cart_items_updated_at
  before update on public.cart_items
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: orders
-- ============================================================
create table if not exists public.orders (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references public.profiles(id) on delete set null,
  order_number             text not null unique,
  email                    text not null,
  phone                    text,
  status                   order_status       not null default 'pending',
  payment_status           payment_status     not null default 'pending',
  fulfillment_status       fulfillment_status not null default 'unfulfilled',
  currency                 char(3) not null default 'USD',
  subtotal                 numeric(10,2) not null default 0,
  discount_total           numeric(10,2) not null default 0,
  shipping_total           numeric(10,2) not null default 0,
  tax_total                numeric(10,2) not null default 0,
  grand_total              numeric(10,2) not null default 0,
  shipping_address_json    jsonb,
  billing_address_json     jsonb,
  cart_snapshot_json       jsonb,
  stripe_payment_intent_id text unique,
  promo_code               text,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists idx_orders_user_id       on public.orders(user_id)       where user_id is not null;
create index if not exists idx_orders_order_number  on public.orders(order_number);
create index if not exists idx_orders_email         on public.orders(email);
create index if not exists idx_orders_status        on public.orders(status);
create index if not exists idx_orders_payment_int   on public.orders(stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function set_updated_at();

-- ── Auto-generate order numbers ─────────────────────────────
create sequence if not exists order_number_seq start 10000;

create or replace function generate_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'QTH-' || lpad(nextval('order_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_orders_order_number
  before insert on public.orders
  for each row execute function generate_order_number();

-- ============================================================
--  TABLE: order_items
-- ============================================================
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  variant_id   uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku          text,
  unit_price   numeric(10,2) not null,
  quantity     int not null,
  line_total   numeric(10,2) not null,
  snapshot_json jsonb
);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- ============================================================
--  TABLE: order_status_events
-- ============================================================
create table if not exists public.order_status_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     order_status not null,
  message    text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_status_events_order on public.order_status_events(order_id);

-- ============================================================
--  TABLE: reviews
-- ============================================================
create table if not exists public.reviews (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products(id) on delete cascade,
  user_id              uuid references public.profiles(id) on delete set null,
  order_id             uuid references public.orders(id)   on delete set null,
  rating               int  not null check (rating between 1 and 5),
  title                text,
  body                 text,
  reviewer_name        text,
  is_verified_purchase boolean not null default false,
  is_approved          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_approved   on public.reviews(product_id, is_approved) where is_approved = true;
create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function set_updated_at();

-- ── Auto-update product rating when review is approved ───────
create or replace function refresh_product_rating()
returns trigger language plpgsql as $$
begin
  update public.products p
  set
    rating_average = (
      select round(avg(r.rating)::numeric, 2)
      from public.reviews r
      where r.product_id = coalesce(new.product_id, old.product_id)
        and r.is_approved = true
    ),
    review_count = (
      select count(*)
      from public.reviews r
      where r.product_id = coalesce(new.product_id, old.product_id)
        and r.is_approved = true
    )
  where p.id = coalesce(new.product_id, old.product_id);
  return coalesce(new, old);
end;
$$;

create trigger trg_reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function refresh_product_rating();

-- ============================================================
--  TABLE: newsletter_subscribers
-- ============================================================
create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  source        text,
  is_active     boolean not null default true,
  subscribed_at timestamptz not null default now()
);
create index if not exists idx_newsletter_email on public.newsletter_subscribers(email);

-- ============================================================
--  TABLE: contact_messages
-- ============================================================
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  status     contact_status not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists idx_contact_status on public.contact_messages(status);

-- ============================================================
--  TABLE: promo_codes
-- ============================================================
create table if not exists public.promo_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  description     text,
  discount_type   discount_type not null default 'percentage',
  discount_value  numeric(10,2) not null,
  min_order_total numeric(10,2),
  is_active       boolean not null default true,
  starts_at       timestamptz,
  ends_at         timestamptz,
  usage_limit     int,
  used_count      int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_promo_codes_code on public.promo_codes(code);

-- ============================================================
--  TABLE: admin_settings
-- ============================================================
create table if not exists public.admin_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value_json jsonb,
  updated_at timestamptz not null default now()
);
create trigger trg_admin_settings_updated_at
  before update on public.admin_settings
  for each row execute function set_updated_at();
