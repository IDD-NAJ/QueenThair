-- ============================================================
--  Admin Dashboard RPC Functions
--  Run: supabase db push  (or paste into SQL editor)
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
      count(*) filter (where role = 'customer') as total_customers,
      count(*) filter (where role = 'customer' and date(created_at) = current_date) as new_customers_today,
      count(*) filter (where role = 'customer' and created_at >= date_trunc('week', current_date)) as new_customers_this_week,
      count(*) filter (where role = 'customer' and created_at >= date_trunc('month', current_date)) as new_customers_this_month,
      count(*) filter (where role = 'admin') as active_users
    from profiles
  ),
  -- Product statistics
  product_stats as (
    select
      count(*) as total_products
    from products
    where is_active = true
  ),
  -- Inventory statistics
  inventory_stats as (
    select
      count(*) filter (where quantity_available <= low_stock_threshold and quantity_available > 0) as low_stock_products,
      count(*) filter (where quantity_available = 0) as out_of_stock_products
    from inventory
    join products on products.id = inventory.product_id
    where products.is_active = true
  ),
  -- Review statistics
  review_stats as (
    select
      count(*) as total_reviews,
      count(*) filter (where is_approved = false) as pending_reviews,
      count(*) filter (where is_approved = true) as approved_reviews
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
    invs.low_stock_products,
    invs.out_of_stock_products,
    rs.avg_order_value,
    revs.total_reviews,
    revs.pending_reviews,
    revs.approved_reviews
  from revenue_stats rs, order_stats os, customer_stats cs, 
       product_stats ps, inventory_stats invs, review_stats revs;
end;
$$;

-- ── Revenue Analytics ───────────────────────────────────────────
create or replace function get_revenue_analytics(days int default 30)
returns table (
  date date,
  revenue numeric,
  orders_count bigint,
  avg_order_value numeric,
  unique_customers bigint
) language plpgsql as $$
begin
  return query
  select 
    date(o.created_at) as date,
    coalesce(sum(o.grand_total), 0) as revenue,
    count(*) as orders_count,
    coalesce(avg(o.grand_total), 0) as avg_order_value,
    count(distinct o.user_id) as unique_customers
  from orders o
  where o.created_at >= current_date - interval '1 day' * days
    and o.status != 'cancelled'
  group by date(o.created_at)
  order by date;
end;
$$;

-- ── Top Products Analytics ───────────────────────────────────────
create or replace function get_top_products(days int default 30, limit_count int default 10)
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
  left join order_items oi on p.id = oi.product_id
  left join orders o on oi.order_id = o.id
  left join categories c on p.category_id = c.id
  where o.created_at >= current_date - interval '1 day' * days
    and o.status != 'cancelled'
    and p.is_active = true
  group by p.id, p.name, p.slug, c.name
  order by total_sold desc
  limit limit_count;
end;
$$;

-- ── Customer Analytics ───────────────────────────────────────────
create or replace function get_customer_analytics(days int default 30)
returns table (
  date date,
  new_customers bigint,
  total_customers bigint,
  repeat_customers bigint,
  customer_retention_rate numeric
) language plpgsql as $$
begin
  return query
  with daily_customers as (
    select 
      date(created_at) as date,
      count(*) as new_customers
    from profiles
    where role = 'customer'
      and created_at >= current_date - interval '1 day' * days
    group by date(created_at)
  ),
  cumulative_customers as (
    select 
      date,
      count(*) over (order by date) as total_customers
    from (
      select distinct date(created_at) as date
      from profiles
      where role = 'customer'
        and created_at >= current_date - interval '1 day' * days
    ) distinct_dates
  ),
  repeat_customers_daily as (
    select 
      date(o.created_at) as date,
      count(distinct o.user_id) as repeat_customers
    from orders o
    where o.created_at >= current_date - interval '1 day' * days
      and o.status != 'cancelled'
      and o.user_id in (
        select user_id
        from orders
        where created_at < o.created_at
      )
    group by date(o.created_at)
  )
  select 
    dc.date,
    dc.new_customers,
    cc.total_customers,
    coalesce(rc.repeat_customers, 0) as repeat_customers,
    case 
      when cc.total_customers > 0 then 
        round((coalesce(rc.repeat_customers, 0)::numeric / cc.total_customers) * 100, 2)
      else 0
    end as customer_retention_rate
  from daily_customers dc
  left join cumulative_customers cc on dc.date = cc.date
  left join repeat_customers_daily rc on dc.date = rc.date
  order by dc.date;
end;
$$;

-- ── Category Performance Analytics ───────────────────────────────
create or replace function get_category_analytics(days int default 30)
returns table (
  category_id uuid,
  category_name text,
  total_sold bigint,
  revenue numeric,
  orders_count bigint,
  avg_order_value numeric,
  top_product text
) language plpgsql as $$
begin
  return query
  with category_sales as (
    select 
      c.id as category_id,
      c.name as category_name,
      coalesce(sum(oi.quantity), 0) as total_sold,
      coalesce(sum(oi.quantity * oi.unit_price), 0) as revenue,
      count(distinct o.id) as orders_count,
      coalesce(avg(o.grand_total), 0) as avg_order_value
    from categories c
    left join products p on c.id = p.category_id
    left join order_items oi on p.id = oi.product_id
    left join orders o on oi.order_id = o.id
    where o.created_at >= current_date - interval '1 day' * days
      and o.status != 'cancelled'
      and p.is_active = true
      and c.is_active = true
    group by c.id, c.name
  ),
  top_products_by_category as (
    select 
      c.id as category_id,
      p.name as top_product
    from categories c
    left join products p on c.id = p.category_id
    left join order_items oi on p.id = oi.product_id
    left join orders o on oi.order_id = o.id
    where o.created_at >= current_date - interval '1 day' * days
      and o.status != 'cancelled'
      and p.is_active = true
    group by c.id, p.name
    order by c.id, sum(oi.quantity) desc
  )
  select 
    cs.category_id,
    cs.category_name,
    cs.total_sold,
    cs.revenue,
    cs.orders_count,
    cs.avg_order_value,
    tp.top_product
  from category_sales cs
  left join lateral (
    select top_product
    from top_products_by_category tpbc
    where tpbc.category_id = cs.category_id
    limit 1
  ) tp on true
  order by cs.revenue desc;
end;
$$;

-- ── Create missing tables if they don't exist ───────────────────
do $$ begin
  create table if not exists public.admin_activities (
    id uuid primary key default gen_random_uuid(),
    admin_user_id uuid not null references public.profiles(id) on delete cascade,
    action_type text not null check (action_type in ('create', 'update', 'delete', 'view', 'export')),
    entity_type text not null check (entity_type in ('product', 'order', 'customer', 'category', 'review', 'coupon', 'announcement')),
    entity_id uuid,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz not null default now()
  );
  
  create index if not exists idx_admin_activities_admin_user_id on public.admin_activities(admin_user_id);
  create index if not exists idx_admin_activities_entity on public.admin_activities(entity_type, entity_id);
  create index if not exists idx_admin_activities_created_at on public.admin_activities(created_at desc);
  
exception when duplicate_object then null; end $$;
