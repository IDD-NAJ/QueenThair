-- ============================================================
--  QUEENTHAIR – Seed 001: Categories
-- ============================================================

insert into public.categories (id, name, slug, description, sort_order, is_active) values
  ('cat-lace-front',  'Lace Front Wigs',   'lace-front-wigs',  'Natural-looking hairline with versatile styling options', 1,  true),
  ('cat-360-lace',    '360 Lace Wigs',     '360-lace-wigs',    'Complete coverage with lace all around the perimeter',   2,  true),
  ('cat-full-lace',   'Full Lace Wigs',    'full-lace-wigs',   'Maximum versatility with full lace construction',        3,  true),
  ('cat-headband',    'Headband Wigs',     'headband-wigs',    'Easy to wear with built-in headband',                    4,  true),
  ('cat-closure',     'Closure Wigs',      'closure-wigs',     'Natural parting with closure piece',                     5,  true),
  ('cat-u-part',      'U-Part Wigs',       'u-part-wigs',      'Blend with your natural hair',                           6,  true),
  -- Accessory categories
  ('cat-wig-caps',    'Wig Caps',          'wig-caps',         'Essential wig caps for a secure and comfortable fit',    10, true),
  ('cat-adhesives',   'Adhesives & Glue',  'adhesives',        'Strong hold adhesives for secure wig application',      11, true),
  ('cat-removers',    'Glue Removers',     'glue-removers',    'Safe and effective adhesive removers',                  12, true),
  ('cat-brushes',     'Brushes',           'brushes',          'Professional brushes for styling and edge control',     13, true),
  ('cat-combs',       'Combs',             'combs',            'Detangling and styling combs',                          14, true),
  ('cat-bonnets',     'Bonnets & Wraps',   'bonnets-wraps',    'Protect your wig while you sleep',                      15, true),
  ('cat-bands',       'Bands & Clips',     'bands-clips',      'Secure your wig with bands and clips',                  16, true),
  ('cat-tint',        'Lace Tint & Melting','lace-tint',       'Customize your lace color for a natural look',          17, true),
  ('cat-tools',       'Styling Tools',     'styling-tools',    'Professional tools for wig styling',                    18, true),
  ('cat-care',        'Care Products',     'care-products',    'Keep your wig looking fresh and beautiful',             19, true),
  ('cat-storage',     'Storage & Stands',  'storage-stands',   'Store and display your wigs properly',                  20, true)
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  sort_order  = excluded.sort_order;
