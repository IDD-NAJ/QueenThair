/**
 * Enhanced CSV Products Import Script
 * Imports product data with full details including variants, colors, and descriptions
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Common wig colors with hex values
const WIG_COLORS = {
  'natural-black': { name: 'Natural Black', hex: '#1A1A1A' },
  'dark-brown': { name: 'Dark Brown', hex: '#5C3A1E' },
  'chestnut-brown': { name: 'Chestnut Brown', hex: '#6B3A2A' },
  'light-brown': { name: 'Light Brown', hex: '#8B6F47' },
  'honey-blonde': { name: 'Honey Blonde', hex: '#E8C97A' },
  'platinum-blonde': { name: 'Platinum Blonde', hex: '#F5E6D3' },
  'ash-blonde': { name: 'Ash Blonde', hex: '#D4C5B0' },
  'auburn': { name: 'Auburn', hex: '#922B21' },
  'burgundy': { name: 'Burgundy', hex: '#800020' },
  'ash-gray': { name: 'Ash Gray', hex: '#9E9E9E' },
  'silver-gray': { name: 'Silver Gray', hex: '#C0C0C0' },
  'rose-gold': { name: 'Rose Gold', hex: '#D4A5A5' },
  'caramel': { name: 'Caramel', hex: '#C19A6B' },
  'copper': { name: 'Copper', hex: '#B87333' },
  'red': { name: 'Red', hex: '#DC143C' },
};

const WIG_LENGTHS = ['8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"'];
const WIG_DENSITIES = ['130%', '150%', '180%', '200%'];

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || '';
    });
    return row;
  });
}

function parseBoolean(value) {
  if (!value) return false;
  const normalized = value.toString().toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function parseNumber(value) {
  if (!value || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function generateDescription(productName, categorySlug) {
  const isPixie = productName.toLowerCase().includes('pixie');
  const isBob = productName.toLowerCase().includes('bob');
  const isWave = productName.toLowerCase().includes('wave');
  const isCurly = productName.toLowerCase().includes('curly');
  const isStraight = productName.toLowerCase().includes('straight');
  
  let style = 'versatile';
  if (isPixie) style = 'short and chic pixie';
  else if (isBob) style = 'classic bob';
  else if (isWave) style = 'flowing wave';
  else if (isCurly) style = 'bouncy curly';
  else if (isStraight) style = 'sleek straight';
  
  const descriptions = [
    `Experience luxury with our ${productName} wig. This ${style} style features premium construction and natural-looking fibers for a flawless, undetectable finish.`,
    `The ${productName} offers exceptional quality and comfort. Designed with precision, this wig provides a natural hairline and breathable cap construction for all-day wear.`,
    `Elevate your look with the ${productName}. Crafted with attention to detail, this premium wig delivers stunning style and confidence with every wear.`,
    `Discover the beauty of the ${productName}. This expertly designed wig combines comfort, style, and durability for a truly luxurious hair experience.`,
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateShortDescription(productName) {
  const isPixie = productName.toLowerCase().includes('pixie');
  const isBob = productName.toLowerCase().includes('bob');
  const isWave = productName.toLowerCase().includes('wave');
  const isLace = productName.toLowerCase().includes('lace');
  const isMono = productName.toLowerCase().includes('mono');
  
  let features = [];
  if (isLace) features.push('lace front');
  if (isMono) features.push('monofilament');
  if (isPixie) features.push('short pixie cut');
  else if (isBob) features.push('bob style');
  else if (isWave) features.push('wavy texture');
  
  if (features.length === 0) features.push('premium quality');
  
  return `Luxury wig with ${features.join(', ')} for a natural, comfortable fit`;
}

async function importEnhancedProducts() {
  console.log('🌱 Starting enhanced CSV product import...\n');

  try {
    const csvPath = join(__dirname, '..', 'public', 'images', 'categories', 'queenThair_products.csv');
    console.log(`📄 Reading CSV from: ${csvPath}`);
    
    const csvContent = readFileSync(csvPath, 'utf-8');
    const products = parseCSV(csvContent);
    
    console.log(`📊 Found ${products.length} products in CSV\n`);

    // Get or create categories
    const categoryMap = new Map();
    const uniqueCategorySlugs = [...new Set(products.map(p => p.category_slug).filter(Boolean))];
    
    console.log('📁 Processing categories...');
    for (const slug of uniqueCategorySlugs) {
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(`❌ Error fetching category ${slug}:`, error.message);
        continue;
      }

      if (data) {
        categoryMap.set(slug, data.id);
        console.log(`✅ Found category: ${data.name} (${slug})`);
      } else {
        const categoryName = slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        const { data: newCat, error: createError } = await supabase
          .from('categories')
          .insert({
            slug: slug,
            name: categoryName,
            description: `Premium ${categoryName} collection`,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error(`❌ Error creating category ${slug}:`, createError.message);
        } else {
          categoryMap.set(slug, newCat.id);
          console.log(`✅ Created category: ${categoryName} (${slug})`);
        }
      }
    }

    // Import products with full details
    console.log('\n👑 Importing products with enhanced details...');
    let successCount = 0;
    let errorCount = 0;

    for (const row of products) {
      try {
        const categoryId = categoryMap.get(row.category_slug);
        
        if (!categoryId && row.category_slug) {
          console.warn(`⚠️  Category not found for slug: ${row.category_slug}, skipping ${row.name}`);
          errorCount++;
          continue;
        }

        // Generate descriptions if missing
        const description = row.description || generateDescription(row.name, row.category_slug);
        const shortDescription = row.short_description || generateShortDescription(row.name);

        const productPayload = {
          name: row.name,
          slug: row.slug,
          product_type: row.product_type || 'wig',
          category_id: categoryId || null,
          base_price: parseNumber(row.base_price) || 0,
          compare_at_price: parseNumber(row.compare_at_price),
          short_description: shortDescription,
          description: description,
          featured: parseBoolean(row.featured),
          new_arrival: parseBoolean(row.new_arrival),
          best_seller: parseBoolean(row.best_seller),
          on_sale: parseBoolean(row.on_sale),
          is_active: parseBoolean(row.is_active),
          rating_average: 4.5 + Math.random() * 0.5,
          review_count: Math.floor(Math.random() * 80) + 20,
        };

        // Upsert product
        const { data: product, error: prodError } = await supabase
          .from('products')
          .upsert(productPayload, { onConflict: 'slug' })
          .select()
          .single();

        if (prodError) {
          console.error(`❌ Error importing ${row.name}:`, prodError.message);
          errorCount++;
          continue;
        }

        // Add product image
        if (row.image_url && row.image_url.trim()) {
          await supabase
            .from('product_images')
            .upsert({
              product_id: product.id,
              image_url: row.image_url,
              alt_text: row.name,
              sort_order: 0,
              is_primary: true,
            }, { onConflict: 'product_id,sort_order' });
        }

        // Create color variants for wigs
        if (product.product_type === 'wig') {
          const availableColors = ['natural-black', 'dark-brown', 'honey-blonde', 'ash-blonde', 'auburn'];
          const availableLengths = ['12"', '14"', '16"', '18"', '20"'];
          
          for (const colorKey of availableColors) {
            for (const length of availableLengths) {
              const colorData = WIG_COLORS[colorKey];
              const variantSku = `${row.slug}-${colorKey}-${length}`.toUpperCase().replace(/"/g, '').replace(/-/g, '_');
              
              const variantPayload = {
                product_id: product.id,
                sku: variantSku,
                color: colorData.name,
                length: length,
                density: '150%',
                is_active: true,
              };

              await supabase
                .from('product_variants')
                .upsert(variantPayload, { onConflict: 'sku' });
            }
          }
        }

        // Add inventory
        const stockQty = parseNumber(row.stock_quantity) || Math.floor(Math.random() * 50) + 10;
        await supabase
          .from('inventory')
          .upsert({
            product_id: product.id,
            sku: row.sku || null,
            quantity_available: stockQty,
            quantity_reserved: 0,
            low_stock_threshold: 5,
            track_inventory: true,
            allow_backorder: false,
          }, { onConflict: 'product_id,variant_id' });

        successCount++;
        console.log(`✅ ${successCount}. ${row.name} (${availableColors.length * availableLengths.length} variants)`);

      } catch (err) {
        console.error(`❌ Unexpected error importing ${row.name}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Enhanced import complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Total in CSV: ${products.length}`);
    console.log(`   - Successfully imported: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Categories processed: ${categoryMap.size}`);
    console.log(`   - Variants per product: 25 (5 colors × 5 lengths)`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importEnhancedProducts();
