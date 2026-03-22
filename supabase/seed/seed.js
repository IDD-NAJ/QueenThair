/**
 * QUEENTHAIR – Database Seed Script
 * Run: node supabase/seed/seed.js
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 * Install deps first:  npm install @supabase/supabase-js dotenv
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function upsert(table, rows, conflictColumn = 'id') {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictColumn });
  if (error) {
    console.error(`[seed] Error upserting ${table}:`, error.message);
    throw error;
  }
  console.log(`[seed] ✓ ${table} – ${rows.length} rows`);
}

// ─── Categories (no explicit id – DB generates UUIDs) ────────────────────────

const categories = [
  { name: 'Lace Front Wigs',    slug: 'lace-front-wigs',  description: 'Natural-looking hairline with versatile styling options', sort_order: 1  },
  { name: '360 Lace Wigs',      slug: '360-lace-wigs',    description: 'Complete coverage with lace all around the perimeter',   sort_order: 2  },
  { name: 'Full Lace Wigs',     slug: 'full-lace-wigs',   description: 'Maximum versatility with full lace construction',        sort_order: 3  },
  { name: 'Headband Wigs',      slug: 'headband-wigs',    description: 'Easy to wear with built-in headband',                    sort_order: 4  },
  { name: 'Closure Wigs',       slug: 'closure-wigs',     description: 'Natural parting with closure piece',                     sort_order: 5  },
  { name: 'U-Part Wigs',        slug: 'u-part-wigs',      description: 'Blend with your natural hair',                           sort_order: 6  },
  { name: 'Wig Caps',           slug: 'wig-caps',         description: 'Essential wig caps for a secure and comfortable fit',    sort_order: 10 },
  { name: 'Adhesives & Glue',   slug: 'adhesives',        description: 'Strong hold adhesives for secure wig application',      sort_order: 11 },
  { name: 'Glue Removers',      slug: 'glue-removers',    description: 'Safe and effective adhesive removers',                  sort_order: 12 },
  { name: 'Brushes',            slug: 'brushes',          description: 'Professional brushes for styling and edge control',     sort_order: 13 },
  { name: 'Combs',              slug: 'combs',            description: 'Detangling and styling combs',                          sort_order: 14 },
  { name: 'Bonnets & Wraps',    slug: 'bonnets-wraps',    description: 'Protect your wig while you sleep',                      sort_order: 15 },
  { name: 'Bands & Clips',      slug: 'bands-clips',      description: 'Secure your wig with bands and clips',                  sort_order: 16 },
  { name: 'Lace Tint & Melting',slug: 'lace-tint',        description: 'Customize your lace color for a natural look',          sort_order: 17 },
  { name: 'Styling Tools',      slug: 'styling-tools',    description: 'Professional tools for wig styling',                    sort_order: 18 },
  { name: 'Care Products',      slug: 'care-products',    description: 'Keep your wig looking fresh and beautiful',             sort_order: 19 },
  { name: 'Storage & Stands',   slug: 'storage-stands',   description: 'Store and display your wigs properly',                  sort_order: 20 },
];

// ─── Collections (no explicit id) ────────────────────────────────────────────

const collections = [
  { name: 'New Arrivals', slug: 'new-arrivals', description: 'Discover our latest premium hair collections', featured: true  },
  { name: 'Best Sellers', slug: 'best-sellers', description: 'Our most popular wigs loved by thousands',    featured: true  },
  { name: 'Sale',         slug: 'sale',         description: 'Premium quality at unbeatable prices',         featured: false },
  { name: 'Accessories',  slug: 'accessories',  description: 'Professional-grade wig accessories',          featured: false },
];

// ─── Wig product raw data (mirrors src/data/products.js) ─────────────────────

// Maps raw category key → category slug (used for slug→UUID lookup after DB insert)
const categoryMap = {
  'lace-front': 'lace-front-wigs',
  '360-lace':   '360-lace-wigs',
  'full-lace':  'full-lace-wigs',
  headband:     'headband-wigs',
  closure:      'closure-wigs',
  closures:     'closure-wigs',
  'u-part':     'u-part-wigs',
};

const wigRaw = [
  { name: 'Silky Straight Full Lace Wig',   category: 'full-lace',   texture: 'straight',      price: 329, collections: ['new-arrivals', 'best-sellers'] },
  { name: 'Brazilian Body Wave Lace Front', category: 'lace-front',  texture: 'body-wave',      price: 269, collections: ['best-sellers'] },
  { name: 'Deep Wave 360 Lace Wig',         category: '360-lace',    texture: 'deep-wave',      price: 299, collections: ['new-arrivals'] },
  { name: 'Kinky Curly U-Part Wig',         category: 'u-part',      texture: 'kinky-curly',    price: 219, collections: [] },
  { name: 'Loose Wave Headband Wig',        category: 'headband',    texture: 'loose-wave',     price: 179, collections: ['sale'] },
  { name: 'Straight Bob Lace Front',        category: 'lace-front',  texture: 'straight',       price: 249, collections: ['new-arrivals'] },
  { name: 'Water Wave 13x4 Lace Wig',       category: 'lace-front',  texture: 'water-wave',     price: 289, collections: [] },
  { name: 'Highlight Colored T-Part Wig',   category: 'lace-front',  texture: 'straight',       price: 349, collections: ['new-arrivals'] },
  { name: 'Pixie Cut Short Wig',            category: 'lace-front',  texture: 'straight',       price: 199, collections: [] },
  { name: 'HD Transparent Lace Frontal',    category: 'closures',    texture: 'straight',       price: 149, collections: [] },
  { name: 'Closure Wig Natural Black',      category: 'closure',     texture: 'straight',       price: 229, collections: ['best-sellers'] },
  { name: 'Glueless Full Lace Wig',         category: 'full-lace',   texture: 'body-wave',      price: 399, collections: ['new-arrivals', 'best-sellers'] },
  { name: 'Yaki Straight Lace Front',       category: 'lace-front',  texture: 'yaki-straight',  price: 279, collections: [] },
  { name: 'Italian Curly Human Hair',       category: 'lace-front',  texture: 'curly',          price: 319, collections: [] },
  { name: 'Coily Afro Textured Wig',        category: 'full-lace',   texture: 'afro',           price: 289, collections: [] },
  { name: 'Burgundy Ombre Lace Wig',        category: 'lace-front',  texture: 'body-wave',      price: 339, collections: ['new-arrivals'] },
  { name: 'Honey Blonde Highlight Wig',     category: '360-lace',    texture: 'straight',       price: 359, collections: ['new-arrivals'] },
  { name: 'Dark Brown Wavy Bob',            category: 'lace-front',  texture: 'body-wave',      price: 239, collections: [] },
  { name: 'Premium Silky Straight',         category: 'full-lace',   texture: 'straight',       price: 449, collections: ['best-sellers'] },
  { name: 'Deep Curly 360 Lace',            category: '360-lace',    texture: 'deep-wave',      price: 329, collections: [] },
  { name: 'Natural Wave Headband',          category: 'headband',    texture: 'body-wave',      price: 189, collections: ['sale'] },
  { name: 'HD Lace Frontal Wig',            category: 'lace-front',  texture: 'straight',       price: 369, collections: ['new-arrivals'] },
  { name: 'Loose Deep Wave Wig',            category: 'lace-front',  texture: 'deep-wave',      price: 299, collections: [] },
  { name: 'Kinky Straight Full Lace',       category: 'full-lace',   texture: 'kinky-straight', price: 349, collections: [] },
  { name: 'Bob Cut Lace Front',             category: 'lace-front',  texture: 'straight',       price: 259, collections: ['best-sellers'] },
  { name: 'Ombre Blonde Lace Wig',          category: 'lace-front',  texture: 'body-wave',      price: 379, collections: ['new-arrivals'] },
  { name: 'Curly 13x6 Lace Frontal',        category: 'lace-front',  texture: 'curly',          price: 339, collections: [] },
  { name: 'Straight U-Part Wig',            category: 'u-part',      texture: 'straight',       price: 229, collections: [] },
  { name: 'Body Wave Closure Wig',          category: 'closure',     texture: 'body-wave',      price: 249, collections: [] },
  { name: 'Platinum Blonde Wig',            category: 'lace-front',  texture: 'straight',       price: 399, collections: ['new-arrivals'] },
  { name: 'Auburn Highlight Wig',           category: '360-lace',    texture: 'body-wave',      price: 359, collections: [] },
  { name: 'Natural Black Straight',         category: 'lace-front',  texture: 'straight',       price: 269, collections: ['best-sellers'] },
  { name: 'Caramel Balayage Wig',           category: 'lace-front',  texture: 'body-wave',      price: 389, collections: ['new-arrivals'] },
  { name: 'Deep Wave Full Lace',            category: 'full-lace',   texture: 'deep-wave',      price: 369, collections: [] },
  { name: 'Short Pixie Lace Front',         category: 'lace-front',  texture: 'straight',       price: 209, collections: [] },
  { name: 'Long Silky Straight Wig',        category: 'lace-front',  texture: 'straight',       price: 349, collections: ['best-sellers'] },
  { name: 'Burgundy Red Lace Wig',          category: 'lace-front',  texture: 'body-wave',      price: 359, collections: [] },
  { name: 'Ash Blonde Highlight',           category: '360-lace',    texture: 'straight',       price: 379, collections: ['new-arrivals'] },
  { name: 'Kinky Curly Full Lace',          category: 'full-lace',   texture: 'kinky-curly',    price: 339, collections: [] },
  { name: 'Water Wave 360 Wig',             category: '360-lace',    texture: 'water-wave',     price: 319, collections: [] },
];

// Fixed rating/review/stock values (no Math.random)
const fixedRatings   = [4.8,4.7,4.6,4.5,4.4,4.7,4.6,4.8,4.3,4.5,4.7,4.9,4.5,4.6,4.7,4.8,4.7,4.5,4.9,4.6,4.4,4.7,4.6,4.5,4.6,4.7,4.5,4.6,4.7,4.8,4.6,4.7,4.8,4.6,4.4,4.7,4.6,4.8,4.7,4.5];
const fixedReviews   = [212,198,143,87,76,165,132,94,58,72,189,267,103,118,94,156,128,89,245,112,68,137,109,95,148,173,101,88,132,178,123,167,184,98,62,143,127,159,112,84];
const fixedStock     = [28,35,22,41,18,30,25,15,40,32,38,20,27,33,16,24,29,42,12,36,45,19,31,26,37,21,23,44,34,17,39,28,14,43,50,25,33,18,29,41];

function buildWigProducts(catSlugToId) {
  return wigRaw.map((p, i) => {
    const numId   = i + 1;
    const onSale  = p.collections.includes('sale');
    const hasComp = i % 3 === 0 && !onSale;
    const slug    = `${slugify(p.name)}-${numId}`;
    const catSlug = categoryMap[p.category] || 'lace-front-wigs';
    const catId   = catSlugToId[catSlug] || null;
    const capType = p.category.includes('360') ? '360 Lace' : p.category.includes('full') ? 'Full Lace' : '13x4 Lace Front';

    return {
      // No explicit id – DB generates UUID
      name:             p.name,
      slug,
      product_type:     'wig',
      category_id:      catId,
      base_price:       p.price,
      compare_at_price: onSale  ? +(p.price * 1.25).toFixed(2) : hasComp ? +(p.price * 1.25).toFixed(2) : null,
      featured:         p.collections.includes('new-arrivals') || p.collections.includes('best-sellers'),
      new_arrival:      p.collections.includes('new-arrivals'),
      best_seller:      p.collections.includes('best-sellers'),
      on_sale:          onSale,
      badge:            p.collections.includes('new-arrivals') ? 'New' : p.collections.includes('best-sellers') ? 'Best Seller' : onSale ? 'Sale' : null,
      rating_average:   fixedRatings[i] || 4.5,
      review_count:     fixedReviews[i] || 100,
      short_description:`100% virgin human hair ${p.texture.replace(/-/g,' ')} wig with ${capType} construction.`,
      description:      `Experience luxury with our ${p.name}. Crafted from 100% virgin human hair, this premium wig features a meticulously constructed cap that ensures comfort and durability. Each strand is carefully selected for uniformity and natural movement.`,
      seo_title:        `${p.name} | Premium Human Hair Wig`,
      seo_description:  `Shop ${p.name} - 100% virgin human hair, free shipping, 30-day returns. ${p.texture.replace(/-/g,' ')} texture available in multiple lengths.`,
      is_active:        true,
    };
  });
}

// ─── Accessory product raw data (mirrors src/data/accessories.js) ────────────

const accCategoryMap = {
  'wig-caps':       'wig-caps',
  adhesives:        'adhesives',
  removers:         'glue-removers',
  'edge-control':   'brushes',
  brushes:          'brushes',
  combs:            'combs',
  bonnets:          'bonnets-wraps',
  storage:          'storage-stands',
  bands:            'bands-clips',
  clips:            'bands-clips',
  tint:             'lace-tint',
  melting:          'lace-tint',
  'hot-tools':      'styling-tools',
  'care-products':  'care-products',
};

const accRaw = [
  { name: 'Premium Wig Cap - Beige',          category: 'wig-caps',       price: 12.99 },
  { name: 'Premium Wig Cap - Brown',          category: 'wig-caps',       price: 12.99 },
  { name: 'Premium Wig Cap - Black',          category: 'wig-caps',       price: 12.99 },
  { name: 'Deluxe Mesh Wig Cap',              category: 'wig-caps',       price: 14.99 },
  { name: 'Bamboo Wig Cap Liner',             category: 'wig-caps',       price: 16.99 },
  { name: 'Ultra Hold Wig Adhesive',          category: 'adhesives',      price: 24.99 },
  { name: 'Ghost Bond XL Glue',              category: 'adhesives',      price: 29.99 },
  { name: 'Lace Wig Tape Strips',             category: 'adhesives',      price: 18.99 },
  { name: 'Got2b Glued Spray',               category: 'adhesives',      price: 15.99 },
  { name: 'Walker Tape No Shine Bonding',    category: 'adhesives',      price: 22.99 },
  { name: 'C-22 Citrus Solvent Remover',     category: 'removers',       price: 19.99 },
  { name: 'Lace Release Adhesive Remover',   category: 'removers',       price: 17.99 },
  { name: 'Ultra Cleanse Remover Spray',     category: 'removers',       price: 21.99 },
  { name: 'Edge Control Gel - Extra Hold',   category: 'edge-control',   price: 13.99 },
  { name: 'Baby Hair Styling Brush',         category: 'brushes',        price: 9.99  },
  { name: 'Double-Sided Edge Brush',         category: 'brushes',        price: 11.99 },
  { name: 'Boar Bristle Edge Brush',         category: 'brushes',        price: 14.99 },
  { name: 'Wide Tooth Detangling Comb',      category: 'combs',          price: 8.99  },
  { name: 'Rat Tail Comb Set (3pc)',         category: 'combs',          price: 12.99 },
  { name: 'Wig Styling Comb Kit',            category: 'combs',          price: 16.99 },
  { name: 'Professional Teasing Comb',       category: 'combs',          price: 10.99 },
  { name: 'Luxury Satin Bonnet - Black',     category: 'bonnets',        price: 18.99 },
  { name: 'Luxury Satin Bonnet - Gold',      category: 'bonnets',        price: 18.99 },
  { name: 'Silk Sleep Cap',                  category: 'bonnets',        price: 22.99 },
  { name: 'Adjustable Satin Bonnet',         category: 'bonnets',        price: 19.99 },
  { name: 'Wig Storage Bag',                 category: 'storage',        price: 15.99 },
  { name: 'Adjustable Wig Band',             category: 'bands',          price: 11.99 },
  { name: 'Velvet Wig Grip Band',            category: 'bands',          price: 13.99 },
  { name: 'Silicone Wig Clips (6pc)',        category: 'clips',          price: 9.99  },
  { name: 'Metal Wig Clips (12pc)',          category: 'clips',          price: 12.99 },
  { name: 'Snap Clips Set (20pc)',           category: 'clips',          price: 14.99 },
  { name: 'Lace Tint Spray - Light',         category: 'tint',           price: 16.99 },
  { name: 'Lace Tint Spray - Medium',        category: 'tint',           price: 16.99 },
  { name: 'Lace Tint Spray - Dark',          category: 'tint',           price: 16.99 },
  { name: 'HD Lace Melting Spray',           category: 'melting',        price: 19.99 },
  { name: 'Lace Melting Band',               category: 'melting',        price: 14.99 },
  { name: 'Mini Hot Comb',                   category: 'hot-tools',      price: 24.99 },
  { name: 'Ceramic Flat Iron',               category: 'hot-tools',      price: 49.99 },
  { name: 'Curling Wand Set',                category: 'hot-tools',      price: 59.99 },
  { name: 'Wig Shampoo & Conditioner Set',   category: 'care-products',  price: 29.99 },
  { name: 'Leave-In Conditioner Spray',      category: 'care-products',  price: 17.99 },
  { name: 'Argan Oil Hair Serum',            category: 'care-products',  price: 21.99 },
  { name: 'Wig Detangler Spray',             category: 'care-products',  price: 15.99 },
  { name: 'Heat Protectant Spray',           category: 'care-products',  price: 18.99 },
  { name: 'Folding Wig Stand',               category: 'storage',        price: 19.99 },
  { name: 'Canvas Mannequin Head',           category: 'storage',        price: 34.99 },
  { name: 'Tripod Wig Stand',                category: 'storage',        price: 29.99 },
  { name: 'Wig Brush - Paddle',              category: 'brushes',        price: 13.99 },
  { name: 'Wig Brush - Round',               category: 'brushes',        price: 15.99 },
  { name: 'Styling Mousse',                  category: 'care-products',  price: 16.99 },
  { name: 'Wig Shine Spray',                 category: 'care-products',  price: 14.99 },
];

const accFixedRatings = [4.5,4.6,4.7,4.8,4.4,4.6,4.7,4.5,4.3,4.6,4.7,4.5,4.6,4.7,4.4,4.6,4.8,4.5,4.6,4.7,4.4,4.8,4.9,4.7,4.6,4.4,4.7,4.8,4.5,4.6,4.7,4.5,4.6,4.7,4.8,4.5,4.6,4.7,4.8,4.5,4.6,4.7,4.5,4.6,4.7,4.8,4.5,4.6,4.5,4.7];
const accFixedReviews = [85,92,78,103,67,145,132,89,72,118,94,88,76,137,65,79,112,58,103,127,71,188,176,143,159,82,134,167,93,108,121,89,97,94,138,73,95,142,159,167,84,119,76,92,108,143,87,96,72,88];
const accFixedStock   = [85,92,68,103,77,45,38,62,89,54,72,68,81,95,110,88,73,120,104,87,115,65,59,78,83,92,107,88,124,96,111,72,68,76,54,88,42,35,28,67,84,93,109,78,56,43,37,76,88,94];

function buildAccessoryProducts(catSlugToId) {
  return accRaw.map((p, i) => {
    const numId   = 1000 + i;
    const onSale  = i % 5 === 0;
    const isNew   = i < 8;
    const isBest  = [0, 5, 10, 15, 20, 25].includes(i);
    const catSlug = accCategoryMap[p.category] || 'care-products';
    const catId   = catSlugToId[catSlug] || null;

    return {
      // No explicit id
      name:             p.name,
      slug:             `${slugify(p.name)}-${numId}`,
      product_type:     'accessory',
      category_id:      catId,
      base_price:       p.price,
      compare_at_price: onSale ? +(p.price * 1.3).toFixed(2) : null,
      featured:         isBest,
      new_arrival:      isNew,
      best_seller:      isBest,
      on_sale:          onSale,
      badge:            isNew ? 'New' : isBest ? 'Best Seller' : onSale ? 'Sale' : null,
      rating_average:   accFixedRatings[i] || 4.5,
      review_count:     accFixedReviews[i] || 80,
      short_description:`Premium quality ${p.name.toLowerCase()} for professional wig styling and maintenance.`,
      description:      `Our ${p.name} is an essential accessory for maintaining and styling your premium wigs. Crafted with professional-grade materials, this product ensures your wig looks flawless every time.`,
      seo_title:        `${p.name} | Premium Wig Accessories`,
      seo_description:  `Shop ${p.name} - Professional quality wig accessory with fast shipping. Essential for wig care and styling.`,
      is_active:        true,
    };
  });
}

// ─── Wig Variants ────────────────────────────────────────────────────────────

const colors = [
  'natural-black','dark-brown','chestnut-brown','honey-blonde',
  'platinum-blonde','auburn','burgundy','ash-gray','rose-gold','caramel',
];
const densities = ['130%','150%','180%','200%'];

function buildWigVariants(products) {
  const variants = [];
  products.forEach((prod, pi) => {
    const productColors = colors.slice(pi % 5, (pi % 5) + 3);
    productColors.forEach(color => {
      densities.forEach(density => {
        variants.push({
          // No explicit id
          product_id:   prod.id,
          sku:          `WIG${pi+1}-${color.substring(0,3).toUpperCase()}-${density.replace('%','D')}`,
          color,
          density,
          option_label: `${color.replace(/-/g,' ')} / ${density}`,
          is_active:    true,
        });
      });
    });
  });
  return variants;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

function buildInventory(products, fixedStockArr) {
  return products.map((prod, i) => ({
    product_id:         prod.id,
    variant_id:         null,
    sku:                prod.slug,
    quantity_available: fixedStockArr[i % fixedStockArr.length] || 25,
    quantity_reserved:  0,
    low_stock_threshold: 5,
    track_inventory:    true,
    allow_backorder:    false,
  }));
}

// ─── Collection memberships ───────────────────────────────────────────────────

function buildCollectionProducts(wigProducts, accProducts, colSlugToId) {
  const rows = [];

  wigRaw.forEach((raw, i) => {
    const prodId = wigProducts[i].id;
    raw.collections.forEach(col => {
      const colId = colSlugToId[col];
      if (colId) rows.push({ collection_id: colId, product_id: prodId, sort_order: i });
    });
  });

  const accColId = colSlugToId['accessories'];
  if (accColId) {
    accProducts.forEach((prod, i) => {
      rows.push({ collection_id: accColId, product_id: prod.id, sort_order: i });
    });
  }

  return rows;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[seed] Starting QUEENTHAIR database seed…\n');

  // ── 1. Insert categories & collections (DB generates UUIDs) ───────────────
  await upsert('categories', categories, 'slug');
  await upsert('collections', collections, 'slug');

  // ── 2. Fetch real UUIDs by slug ────────────────────────────────────────────
  const { data: catRows } = await supabase.from('categories').select('id, slug');
  const catSlugToId = Object.fromEntries((catRows || []).map(r => [r.slug, r.id]));

  const { data: colRows } = await supabase.from('collections').select('id, slug');
  const colSlugToId = Object.fromEntries((colRows || []).map(r => [r.slug, r.id]));

  console.log(`[seed] fetched ${catRows?.length} categories, ${colRows?.length} collections`);

  // ── 3. Build & insert products ─────────────────────────────────────────────
  const wigProductDefs = buildWigProducts(catSlugToId);
  const accProductDefs = buildAccessoryProducts(catSlugToId);
  const allProductDefs = [...wigProductDefs, ...accProductDefs];

  for (let i = 0; i < allProductDefs.length; i += 50) {
    await upsert('products', allProductDefs.slice(i, i + 50), 'slug');
  }

  // ── 4. Fetch inserted products to get real UUIDs ───────────────────────────
  const { data: prodRows } = await supabase
    .from('products')
    .select('id, slug, product_type')
    .order('created_at');

  const wigProducts = (prodRows || []).filter(p => p.product_type === 'wig');
  const accProducts = (prodRows || []).filter(p => p.product_type === 'accessory');
  console.log(`[seed] fetched ${wigProducts.length} wigs, ${accProducts.length} accessories`);

  // ── 5. Wig variants ────────────────────────────────────────────────────────
  const wigVariants = buildWigVariants(wigProducts);
  for (let i = 0; i < wigVariants.length; i += 100) {
    const { error } = await supabase.from('product_variants').insert(wigVariants.slice(i, i + 100));
    if (error) console.error('[seed] variants error:', error.message);
  }
  console.log(`[seed] ✓ product_variants – ${wigVariants.length} rows`);

  // ── 6. Inventory ───────────────────────────────────────────────────────────
  const wigInventory = buildInventory(wigProducts, fixedStock);
  const accInventory = buildInventory(accProducts, accFixedStock);
  const allInventory = [...wigInventory, ...accInventory];

  for (let i = 0; i < allInventory.length; i += 100) {
    const { error } = await supabase
      .from('inventory')
      .upsert(allInventory.slice(i, i + 100), { onConflict: 'product_id,variant_id' });
    if (error) console.error('[seed] inventory error:', error.message);
  }
  console.log(`[seed] ✓ inventory – ${allInventory.length} rows`);

  // ── 7. Collection memberships ──────────────────────────────────────────────
  const colProducts = buildCollectionProducts(wigProducts, accProducts, colSlugToId);
  for (let i = 0; i < colProducts.length; i += 100) {
    const { error } = await supabase
      .from('collection_products')
      .upsert(colProducts.slice(i, i + 100), { onConflict: 'collection_id,product_id' });
    if (error) console.error('[seed] collection_products error:', error.message);
  }
  console.log(`[seed] ✓ collection_products – ${colProducts.length} rows`);

  console.log('\n[seed] ✅ Seed complete!');
}

main().catch(err => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
