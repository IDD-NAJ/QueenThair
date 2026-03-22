/**
 * Seed Products Script
 * Migrates product data from src/data/products.js and accessories.js to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Product data from mock files
const COLORS = {
  'natural-black': { name: 'Natural Black', hex: '#1A1A1A' },
  'dark-brown': { name: 'Dark Brown', hex: '#5C3A1E' },
  'chestnut-brown': { name: 'Chestnut Brown', hex: '#6B3A2A' },
  'honey-blonde': { name: 'Honey Blonde', hex: '#E8C97A' },
  'platinum-blonde': { name: 'Platinum Blonde', hex: '#F5E6D3' },
  'auburn': { name: 'Auburn', hex: '#922B21' },
  'burgundy': { name: 'Burgundy', hex: '#800020' },
  'ash-gray': { name: 'Ash Gray', hex: '#9E9E9E' },
  'rose-gold': { name: 'Rose Gold', hex: '#D4A5A5' },
  'caramel': { name: 'Caramel', hex: '#C19A6B' },
};

const productData = [
  { name: 'Silky Straight Full Lace Wig', category: 'full-lace', texture: 'straight', price: 329, collections: ['new-arrivals', 'best-sellers'] },
  { name: 'Brazilian Body Wave Lace Front', category: 'lace-front', texture: 'body-wave', price: 269, collections: ['best-sellers'] },
  { name: 'Deep Wave 360 Lace Wig', category: '360-lace', texture: 'deep-wave', price: 299, collections: ['new-arrivals'] },
  { name: 'Kinky Curly U-Part Wig', category: 'u-part', texture: 'kinky-curly', price: 219, collections: [] },
  { name: 'Loose Wave Headband Wig', category: 'headband', texture: 'loose-wave', price: 179, collections: ['sale'] },
  { name: 'Straight Bob Lace Front', category: 'lace-front', texture: 'straight', price: 249, collections: ['new-arrivals'] },
  { name: 'Water Wave 13x4 Lace Wig', category: 'lace-front', texture: 'water-wave', price: 289, collections: [] },
  { name: 'Highlight Colored T-Part Wig', category: 'lace-front', texture: 'straight', price: 349, collections: ['new-arrivals'] },
  { name: 'Pixie Cut Short Wig', category: 'lace-front', texture: 'straight', price: 199, collections: [] },
  { name: 'HD Transparent Lace Frontal', category: 'closures', texture: 'straight', price: 149, collections: [] },
  { name: 'Closure Wig Natural Black', category: 'closure', texture: 'straight', price: 229, collections: ['best-sellers'] },
  { name: 'Glueless Full Lace Wig', category: 'full-lace', texture: 'body-wave', price: 399, collections: ['new-arrivals', 'best-sellers'] },
  { name: 'Yaki Straight Lace Front', category: 'lace-front', texture: 'yaki-straight', price: 279, collections: [] },
  { name: 'Italian Curly Human Hair', category: 'lace-front', texture: 'curly', price: 319, collections: [] },
  { name: 'Coily Afro Textured Wig', category: 'full-lace', texture: 'afro', price: 289, collections: [] },
  { name: 'Burgundy Ombre Lace Wig', category: 'lace-front', texture: 'body-wave', price: 339, collections: ['new-arrivals'] },
  { name: 'Honey Blonde Highlight Wig', category: '360-lace', texture: 'straight', price: 359, collections: ['new-arrivals'] },
  { name: 'Dark Brown Wavy Bob', category: 'lace-front', texture: 'body-wave', price: 239, collections: [] },
  { name: 'Premium Silky Straight', category: 'full-lace', texture: 'straight', price: 449, collections: ['best-sellers'] },
  { name: 'Deep Curly 360 Lace', category: '360-lace', texture: 'deep-wave', price: 329, collections: [] },
];

const accessoryData = [
  { name: 'Silk Bonnet - Satin Lined', category: 'bonnets', price: 24.99 },
  { name: 'Wide Tooth Detangling Comb', category: 'combs', price: 12.99 },
  { name: 'Wig Cap - Neutral Beige', category: 'caps', price: 8.99 },
  { name: 'Edge Control Gel - Strong Hold', category: 'styling', price: 15.99 },
  { name: 'Wig Adhesive Spray', category: 'adhesives', price: 18.99 },
  { name: 'Lace Tint Spray - Dark Brown', category: 'styling', price: 16.99 },
  { name: 'Wig Stand - Adjustable', category: 'storage', price: 22.99 },
  { name: 'Satin Pillowcase Set', category: 'care', price: 29.99 },
  { name: 'Wig Brush - Soft Bristle', category: 'brushes', price: 14.99 },
  { name: 'Hair Clips - 12 Pack', category: 'clips', price: 9.99 },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

async function seedProducts() {
  console.log('🌱 Starting product seeding...\n');

  try {
    // Get or create categories
    const categoryMap = new Map();
    const categories = [
      { name: 'Full Lace Wigs', slug: 'full-lace', description: 'Premium full lace wigs for maximum versatility' },
      { name: 'Lace Front Wigs', slug: 'lace-front', description: 'Natural-looking lace front wigs' },
      { name: '360 Lace Wigs', slug: '360-lace', description: '360 degree lace wigs for versatile styling' },
      { name: 'U-Part Wigs', slug: 'u-part', description: 'Leave out wigs for natural blending' },
      { name: 'Headband Wigs', slug: 'headband', description: 'Easy install headband wigs' },
      { name: 'Closures & Frontals', slug: 'closures', description: 'Lace closures and frontals' },
      { name: 'Bonnets & Caps', slug: 'bonnets', description: 'Protective bonnets and wig caps' },
      { name: 'Combs & Brushes', slug: 'combs', description: 'Hair care tools and brushes' },
      { name: 'Wig Caps', slug: 'caps', description: 'Comfortable wig caps' },
      { name: 'Styling Products', slug: 'styling', description: 'Hair styling products and tools' },
      { name: 'Adhesives', slug: 'adhesives', description: 'Wig adhesives and tapes' },
      { name: 'Storage & Care', slug: 'storage', description: 'Wig storage and care products' },
      { name: 'Hair Clips', slug: 'clips', description: 'Hair clips and accessories' },
    ];

    console.log('📁 Creating categories...');
    for (const cat of categories) {
      const { data, error } = await supabase
        .from('categories')
        .upsert({ slug: cat.slug, name: cat.name, description: cat.description, is_active: true }, { onConflict: 'slug' })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating category ${cat.slug}:`, error.message);
      } else {
        categoryMap.set(cat.slug, data.id);
        console.log(`✅ Category: ${cat.name}`);
      }
    }

    // Get or create collections
    const collectionMap = new Map();
    const collections = [
      { name: 'New Arrivals', slug: 'new-arrivals', description: 'Latest additions to our collection' },
      { name: 'Best Sellers', slug: 'best-sellers', description: 'Our most popular products' },
      { name: 'Sale', slug: 'sale', description: 'Special offers and discounts' },
    ];

    console.log('\n📚 Creating collections...');
    for (const col of collections) {
      const { data, error } = await supabase
        .from('collections')
        .upsert({ slug: col.slug, name: col.name, description: col.description, is_active: true }, { onConflict: 'slug' })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating collection ${col.slug}:`, error.message);
      } else {
        collectionMap.set(col.slug, data.id);
        console.log(`✅ Collection: ${col.name}`);
      }
    }

    // Seed products (wigs)
    console.log('\n👑 Seeding wig products...');
    let productCount = 0;

    for (const prod of productData) {
      const slug = slugify(prod.name);
      const categoryId = categoryMap.get(prod.category);

      if (!categoryId) {
        console.warn(`⚠️  Category not found for ${prod.category}, skipping ${prod.name}`);
        continue;
      }

      const productPayload = {
        name: prod.name,
        slug: slug,
        product_type: 'wig',
        category_id: categoryId,
        base_price: prod.price,
        compare_at_price: prod.collections.includes('sale') ? prod.price * 1.2 : null,
        short_description: `Premium ${prod.texture} ${prod.category} wig`,
        description: `Experience luxury with our ${prod.name}. Crafted from 100% human hair with a ${prod.texture} texture. Perfect for any occasion.`,
        featured: prod.collections.includes('best-sellers'),
        new_arrival: prod.collections.includes('new-arrivals'),
        best_seller: prod.collections.includes('best-sellers'),
        on_sale: prod.collections.includes('sale'),
        rating_average: 4.5 + Math.random() * 0.5,
        review_count: Math.floor(Math.random() * 100) + 10,
        is_active: true,
      };

      const { data: product, error: prodError } = await supabase
        .from('products')
        .upsert(productPayload, { onConflict: 'slug' })
        .select()
        .single();

      if (prodError) {
        console.error(`❌ Error creating product ${prod.name}:`, prodError.message);
        continue;
      }

      // Add product to collections
      for (const collSlug of prod.collections) {
        const collectionId = collectionMap.get(collSlug);
        if (collectionId) {
          await supabase
            .from('collection_products')
            .upsert({ collection_id: collectionId, product_id: product.id }, { onConflict: 'collection_id,product_id' });
        }
      }

      // Create variants (colors and lengths)
      const colors = ['natural-black', 'dark-brown', 'honey-blonde'];
      const lengths = ['12"', '16"', '20"', '24"'];

      for (const colorKey of colors) {
        for (const length of lengths) {
          const variantPayload = {
            product_id: product.id,
            sku: `${slug}-${colorKey}-${length}`.toUpperCase().replace(/"/g, ''),
            color: COLORS[colorKey]?.name || colorKey,
            length: length,
            density: '150%',
            price_override: null,
            is_active: true,
          };

          await supabase.from('product_variants').upsert(variantPayload, { onConflict: 'sku' });
        }
      }

      // Add placeholder image
      await supabase
        .from('product_images')
        .upsert({
          product_id: product.id,
          image_url: `https://placehold.co/800x1000/e8d5c4/333333?text=${encodeURIComponent(prod.name)}`,
          alt_text: prod.name,
          sort_order: 0,
          is_primary: true,
        }, { onConflict: 'product_id,sort_order' });

      // Add inventory
      await supabase
        .from('inventory')
        .upsert({
          product_id: product.id,
          quantity_available: Math.floor(Math.random() * 50) + 10,
          quantity_reserved: 0,
          low_stock_threshold: 5,
          track_inventory: true,
          allow_backorder: false,
        }, { onConflict: 'product_id' });

      productCount++;
      console.log(`✅ ${productCount}. ${prod.name}`);
    }

    // Seed accessories
    console.log('\n💎 Seeding accessory products...');
    let accessoryCount = 0;

    for (const acc of accessoryData) {
      const slug = slugify(acc.name);
      const categoryId = categoryMap.get(acc.category);

      if (!categoryId) {
        console.warn(`⚠️  Category not found for ${acc.category}, skipping ${acc.name}`);
        continue;
      }

      const accessoryPayload = {
        name: acc.name,
        slug: slug,
        product_type: 'accessory',
        category_id: categoryId,
        base_price: acc.price,
        short_description: `Essential ${acc.category} accessory`,
        description: `High-quality ${acc.name} for your hair care routine.`,
        featured: false,
        new_arrival: false,
        best_seller: false,
        on_sale: false,
        rating_average: 4.0 + Math.random() * 1,
        review_count: Math.floor(Math.random() * 50) + 5,
        is_active: true,
      };

      const { data: accessory, error: accError } = await supabase
        .from('products')
        .upsert(accessoryPayload, { onConflict: 'slug' })
        .select()
        .single();

      if (accError) {
        console.error(`❌ Error creating accessory ${acc.name}:`, accError.message);
        continue;
      }

      // Add placeholder image
      await supabase
        .from('product_images')
        .upsert({
          product_id: accessory.id,
          image_url: `https://placehold.co/600x600/f5e6d3/333333?text=${encodeURIComponent(acc.name)}`,
          alt_text: acc.name,
          sort_order: 0,
          is_primary: true,
        }, { onConflict: 'product_id,sort_order' });

      // Add inventory
      await supabase
        .from('inventory')
        .upsert({
          product_id: accessory.id,
          quantity_available: Math.floor(Math.random() * 100) + 20,
          quantity_reserved: 0,
          low_stock_threshold: 10,
          track_inventory: true,
          allow_backorder: true,
        }, { onConflict: 'product_id' });

      accessoryCount++;
      console.log(`✅ ${accessoryCount}. ${acc.name}`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categoryMap.size}`);
    console.log(`   - Collections: ${collectionMap.size}`);
    console.log(`   - Wigs: ${productCount}`);
    console.log(`   - Accessories: ${accessoryCount}`);
    console.log(`   - Total Products: ${productCount + accessoryCount}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedProducts();
