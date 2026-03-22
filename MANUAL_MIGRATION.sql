-- ============================================================
--  Admin Dashboard Migration - Manual Execution
--  Copy and paste this into your Supabase SQL Editor
--  URL: https://app.supabase.com/project/YOUR_PROJECT_ID/sql
-- ============================================================

-- ── Admin Dashboard Stats ─────────────────────────────────────
create or replace function get_admin_dashboard_stats()
returns table (
  total_revenue numeric,
  total_orders bigint,
  pending_orders bigint,
  total_customers bigint,
  total_products bigint,
  active_users bigint,
  processing_orders bigint,
  shipped_orders bigint,
  delivered_orders bigint,
  cancelled_orders bigint,
  revenue_today numeric,
  revenue_this_week numeric,
  revenue_this_month numeric,
  orders_today bigint,
  orders_this_week bigint,
  orders_this_month bigint,
  new_customers_today bigint,
  new_customers_this_week bigint,
  new_customers_this_month bigint,
  low_stock_products bigint,
  out_of_stock_products bigint,
  avg_order_value numeric,
  total_reviews bigint,
  pending_reviews bigint,
  approved_reviews bigint
) language plpgsql as $$
begin
  return query
  with 
  -- Revenue calculations
  revenue_stats as (
    select
      coalesce(sum(grand_total), 0) as total_revenue,
      coalesce(sum(case when date(created_at) = current_date then grand_total end), 0) as revenue_today,
      coalesce(sum(case when created_at >= date_trunc('week', current_date) then grand_total end), 0) as revenue_this_week,
      coalesce(sum(case when created_at >= date_trunc('month', current_date) then grand_total end), 0) as revenue_this_month,
      coalesce(avg(grand_total), 0) as avg_order_value
    from orders
    where status != 'cancelled'
  ),
  -- Order statistics
  order_stats as (
    select
      count(*) as total_orders,
      count(*) filter (where status = 'pending') as pending_orders,
      count(*) filter (where status = 'processing') as processing_orders,
      count(*) filter (where status = 'shipped') as shipped_orders,
      count(*) filter (where status = 'delivered') as delivered_orders,
      count(*) filter (where status = 'cancelled') as cancelled_orders,
      count(*) filter (where date(created_at) = current_date) as orders_today,
      count(*) filter (where created_at >= date_trunc('week', current_date)) as orders_this_week,
      count(*) filter (where created_at >= date_trunc('month', current_date)) as orders_this_month
    from orders
  ),
  -- Customer statistics
  customer_stats as (
    select
      count(distinct o.user_id) as total_customers,
      count(distinct o.user_id) filter (where date(p.created_at) = current_date) as new_customers_today,
      count(distinct o.user_id) filter (where p.created_at >= date_trunc('week', current_date)) as new_customers_this_week,
      count(distinct o.user_id) filter (where p.created_at >= date_trunc('month', current_date)) as new_customers_this_month,
      count(*) filter (where p.role = 'admin') as active_users
    from profiles p
    left join orders o on o.user_id = p.id
  ),
  -- Product statistics
  product_stats as (
    select
      count(*) as total_products,
      count(*) filter (where i.quantity_available = 0) as out_of_stock_products,
      count(*) filter (where i.quantity_available <= i.low_stock_threshold and i.quantity_available > 0) as low_stock_products
    from products p
    left join inventory i on i.product_id = p.id
  ),
  -- Review statistics
  review_stats as (
    select
      count(*) as total_reviews,
      count(*) filter (where not is_approved) as pending_reviews,
      count(*) filter (where is_approved) as approved_reviews
    from reviews
  )
  select
    rs.total_revenue,
    os.total_orders,
    os.pending_orders,
    cs.total_customers,
    ps.total_products,
    cs.active_users,
    os.processing_orders,
    os.shipped_orders,
    os.delivered_orders,
    os.cancelled_orders,
    rs.revenue_today,
    rs.revenue_this_week,
    rs.revenue_this_month,
    os.orders_today,
    os.orders_this_week,
    os.orders_this_month,
    cs.new_customers_today,
    cs.new_customers_this_week,
    cs.new_customers_this_month,
    ps.low_stock_products,
    ps.out_of_stock_products,
    rs.avg_order_value,
    rvs.total_reviews,
    rvs.pending_reviews,
    rvs.approved_reviews
  from revenue_stats rs, order_stats os, customer_stats cs, product_stats ps, review_stats rvs;
end;
$$;

-- ── Revenue Analytics ───────────────────────────────────────────
create or replace function get_revenue_analytics(days integer default 30)
returns table (
  date date,
  revenue numeric,
  orders_count bigint,
  unique_customers bigint,
  avg_order_value numeric
) language plpgsql as $$
begin
  return query
  select
    date(o.created_at) as date,
    coalesce(sum(o.grand_total), 0) as revenue,
    count(*) as orders_count,
    count(distinct o.user_id) as unique_customers,
    coalesce(avg(o.grand_total), 0) as avg_order_value
  from orders o
  where o.created_at >= current_date - interval '1 day' * days
    and o.status != 'cancelled'
  group by date(o.created_at)
  order by date;
end;
$$;

-- ── Top Products ───────────────────────────────────────────────
create or replace function get_top_products(days integer default 30, limit_count integer default 10)
returns table (
  product_id uuid,
  product_name text,
  product_slug text,
  total_sold bigint,
  revenue numeric,
  avg_price numeric,
  category_name text
) language plpgsql as $$
begin
  return query
  select
    p.id as product_id,
    p.name as product_name,
    p.slug as product_slug,
    coalesce(sum(oi.quantity), 0) as total_sold,
    coalesce(sum(oi.quantity * oi.unit_price), 0) as revenue,
    coalesce(avg(oi.unit_price), 0) as avg_price,
    c.name as category_name
  from products p
  left join categories c on c.id = p.category_id
  left join order_items oi on oi.product_id = p.id
  left join orders o on o.id = oi.order_id
  where o.created_at >= current_date - interval '1 day' * days
    and o.status != 'cancelled'
  group by p.id, p.name, p.slug, c.name
  order by total_sold desc
  limit limit_count;
end;
$$;

-- ── Customer Analytics ───────────────────────────────────────────
create or replace function get_customer_analytics(days integer default 30)
returns table (
  date date,
  new_customers bigint,
  total_customers bigint,
  repeat_customers bigint,
  customer_retention_rate numeric
) language plpgsql as $$
begin
  return query
  with daily_stats as (
    select
      date(p.created_at) as date,
      count(*) as new_customers,
      count(*) over (order by date(p.created_at) rows unbounded preceding) as total_customers
    from profiles p
    where p.role = 'customer'
      and p.created_at >= current_date - interval '1 day' * days
    group by date(p.created_at)
  ),
  repeat_stats as (
    select
      date(o.created_at) as date,
      count(distinct o.user_id) as repeat_customers
    from orders o
    where o.created_at >= current_date - interval '1 day' * days
      and o.status != 'cancelled'
      and exists (
        select 1 from orders o2 
        where o2.user_id = o.user_id 
          and o2.created_at < o.created_at
      )
    group by date(o.created_at)
  )
  select
    ds.date,
    ds.new_customers,
    ds.total_customers,
    coalesce(rs.repeat_customers, 0) as repeat_customers,
    case 
      when ds.total_customers > 0 then 
        round((coalesce(rs.repeat_customers, 0) * 100.0 / ds.total_customers), 2)
      else 0 
    end as customer_retention_rate
  from daily_stats ds
  left join repeat_stats rs on rs.date = ds.date
  order by ds.date;
end;
$$;

-- ── Category Analytics ───────────────────────────────────────────
create or replace function get_category_analytics(days integer default 30)
returns table (
  category_id uuid,
  category_name text,
  total_sold bigint,
  revenue numeric,
  orders_count bigint,
  avg_order_value numeric,
  top_product uuid
) language plpgsql as $$
begin
  return query
  select
    c.id as category_id,
    c.name as category_name,
    coalesce(sum(oi.quantity), 0) as total_sold,
    coalesce(sum(oi.quantity * oi.unit_price), 0) as revenue,
    count(distinct o.id) as orders_count,
    coalesce(avg(o.grand_total), 0) as avg_order_value,
    (select oi2.product_id from order_items oi2 join orders o2 on o2.id = oi2.order_id join products p2 on p2.id = oi2.product_id where p2.category_id = c.id and o2.created_at >= current_date - interval '1 day' * days and o2.status != 'cancelled' group by oi2.product_id order by sum(oi2.quantity) desc limit 1) as top_product
  from categories c
  left join products p on p.category_id = c.id
  left join order_items oi on oi.product_id = p.id
  left join orders o on o.id = oi.order_id
  where o.created_at >= current_date - interval '1 day' * days
    and o.status != 'cancelled'
  group by c.id, c.name
  order by revenue desc;
end;
$$;

-- ── Geographic Distribution ───────────────────────────────────────
create or replace function get_geographic_distribution()
returns table (
  country text,
  state_region text,
  city text,
  customer_count bigint,
  total_orders bigint,
  total_revenue numeric
) language plpgsql as $$
begin
  return query
  select
    a.country,
    a.state_region,
    a.city,
    count(distinct a.user_id) as customer_count,
    count(distinct o.id) as total_orders,
    coalesce(sum(o.grand_total), 0) as total_revenue
  from addresses a
  left join profiles p on p.user_id = a.id
  left join orders o on o.user_id = a.id
  where o.status != 'cancelled' or o.id is null
  group by a.country, a.state_region, a.city
  having count(distinct a.user_id) > 0
  order by customer_count desc;
end;
$$;

-- ── Admin Activity Logging ───────────────────────────────────────────
create or replace function log_admin_activity(
  admin_user_id uuid,
  action_type text,
  entity_type text,
  entity_id uuid,
  details jsonb default null
)
returns void language plpgsql as $$
begin
  insert into admin_activities (
    admin_user_id,
    action_type,
    entity_type,
    entity_id,
    details
  ) values (
    admin_user_id,
    action_type,
    entity_type,
    entity_id,
    details
  );
end;
$$;

-- ── Create Missing Tables ───────────────────────────────────────────

-- Admin Activities Table
create table if not exists admin_activities (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references profiles(id),
  action_type text not null check (action_type in ('create', 'update', 'delete', 'view', 'export')),
  entity_type text not null check (entity_type in ('product', 'order', 'customer', 'coupon', 'review', 'announcement', 'inventory')),
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- Coupons Table
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  minimum_amount numeric check (minimum_amount >= 0),
  usage_limit integer check (usage_limit > 0),
  usage_count integer default 0 check (usage_count >= 0),
  is_active boolean default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Coupon Usage Table
create table if not exists coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references coupons(id) on delete cascade,
  order_id uuid references orders(id),
  user_id uuid references profiles(id),
  discount_amount numeric not null,
  created_at timestamptz default now()
);

-- Reviews Table
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  content text,
  is_approved boolean default false,
  helpful_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Announcements Table
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  type text default 'info' check (type in ('info', 'warning', 'success', 'error')),
  is_active boolean default true,
  sort_order integer default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inventory Movements Table
create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  movement_type text not null check (movement_type in ('sale', 'restock', 'adjustment', 'return', 'damage')),
  quantity_change integer not null,
  reference_id uuid,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ── Add Indexes ───────────────────────────────────────────────────

create index if not exists idx_admin_activities_admin_user_id on admin_activities(admin_user_id);
create index if not exists idx_admin_activities_created_at on admin_activities(created_at);
create index if not exists idx_coupons_code on coupons(code);
create index if not exists idx_coupons_is_active on coupons(is_active);
create index if not exists idx_coupon_usage_coupon_id on coupon_usage(coupon_id);
create index if not exists idx_reviews_product_id on reviews(product_id);
create index if not exists idx_reviews_user_id on reviews(user_id);
create index if not exists idx_reviews_is_approved on reviews(is_approved);
create index if not exists idx_announcements_is_active on announcements(is_active);
create index if not exists idx_inventory_movements_product_id on inventory_movements(product_id);
create index if not exists idx_inventory_movements_created_at on inventory_movements(created_at);

-- ── Enable RLS ─────────────────────────────────────────────────────

alter table admin_activities enable row level security;
alter table coupons enable row level security;
alter table coupon_usage enable row level security;
alter table reviews enable row level security;
alter table announcements enable row level security;
alter table inventory_movements enable row level security;

-- ── RLS Policies ───────────────────────────────────────────────────

-- Admin Activities
create policy "Admins can view all activities" on admin_activities for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Admins can insert activities" on admin_activities for insert with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- Coupons
create policy "Admins can manage coupons" on coupons for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Everyone can view active coupons" on coupons for select using (is_active = true);

-- Coupon Usage
create policy "Admins can view coupon usage" on coupon_usage for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "System can insert coupon usage" on coupon_usage for insert with check (true);

-- Reviews
create policy "Admins can manage reviews" on reviews for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Users can view approved reviews" on reviews for select using (is_approved = true);

create policy "Users can insert own reviews" on reviews for insert with check (user_id = auth.uid());

-- Announcements
create policy "Admins can manage announcements" on announcements for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Everyone can view active announcements" on announcements for select using (is_active = true);

-- Inventory Movements
create policy "Admins can manage inventory movements" on inventory_movements for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ============================================================
--  Migration Complete!
--  Your admin dashboard should now work with real data.
-- ============================================================
