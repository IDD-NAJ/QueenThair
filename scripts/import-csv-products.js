/**
 * Import CSV Products Script
 * Imports product data from queenThair_products.csv to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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

// Parse CSV
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

// Convert CSV boolean strings to actual booleans
function parseBoolean(value) {
  if (!value) return false;
  const normalized = value.toString().toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

// Convert CSV number strings to numbers
function parseNumber(value) {
  if (!value || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

async function importCSVProducts() {
  console.log('🌱 Starting CSV product import...\n');

  try {
    // Read CSV file
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
        // Create category if it doesn't exist
        const categoryName = slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        const { data: newCat, error: createError } = await supabase
          .from('categories')
          .insert({
            slug: slug,
            name: categoryName,
            description: `${categoryName} collection`,
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

    // Import products
    console.log('\n👑 Importing products...');
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

        const productPayload = {
          name: row.name,
          slug: row.slug,
          product_type: row.product_type || 'wig',
          category_id: categoryId || null,
          base_price: parseNumber(row.base_price) || 0,
          compare_at_price: parseNumber(row.compare_at_price),
          short_description: row.short_description || '',
          description: row.description || '',
          featured: parseBoolean(row.featured),
          new_arrival: parseBoolean(row.new_arrival),
          best_seller: parseBoolean(row.best_seller),
          on_sale: parseBoolean(row.on_sale),
          is_active: parseBoolean(row.is_active),
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

        // Add product image if image_url is provided
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

        // Add inventory if stock_quantity is provided
        const stockQty = parseNumber(row.stock_quantity);
        if (stockQty !== null) {
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
        }

        successCount++;
        console.log(`✅ ${successCount}. ${row.name} (${row.slug})`);

      } catch (err) {
        console.error(`❌ Unexpected error importing ${row.name}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Import complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Total in CSV: ${products.length}`);
    console.log(`   - Successfully imported: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Categories processed: ${categoryMap.size}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importCSVProducts();
