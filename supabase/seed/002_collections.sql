-- ============================================================
--  QUEENTHAIR – Seed 002: Collections
-- ============================================================

insert into public.collections (id, name, slug, description, featured, is_active) values
  ('col-new-arrivals', 'New Arrivals',  'new-arrivals',  'Discover our latest premium hair collections',         true,  true),
  ('col-best-sellers', 'Best Sellers',  'best-sellers',  'Our most popular wigs loved by thousands',             true,  true),
  ('col-sale',         'Sale',          'sale',          'Premium quality at unbeatable prices',                 false, true),
  ('col-accessories',  'Accessories',   'accessories',   'Professional-grade wig accessories and care products', false, true)
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  featured    = excluded.featured;
