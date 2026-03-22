/**
 * Test Database Connection and Data Fetching
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');

  try {
    // Test 1: Fetch categories
    console.log('1️⃣ Testing categories table...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(5);
    
    if (catError) throw catError;
    console.log(`✅ Categories: ${categories.length} rows fetched`);
    console.log('   Sample:', categories.slice(0, 2).map(c => c.name).join(', '));

    // Test 2: Fetch collections
    console.log('\n2️⃣ Testing collections table...');
    const { data: collections, error: collError } = await supabase
      .from('collections')
      .select('id, name, slug')
      .limit(5);
    
    if (collError) throw collError;
    console.log(`✅ Collections: ${collections.length} rows fetched`);
    console.log('   Sample:', collections.map(c => c.name).join(', '));

    // Test 3: Fetch products
    console.log('\n3️⃣ Testing products table...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, slug, base_price, product_type')
      .eq('is_active', true)
      .limit(5);
    
    if (prodError) throw prodError;
    console.log(`✅ Products: ${products.length} rows fetched`);
    console.log('   Sample:', products.slice(0, 2).map(p => `${p.name} ($${p.base_price})`).join(', '));

    // Test 4: Fetch products with relations
    console.log('\n4️⃣ Testing products with relations (category, images, variants)...');
    const { data: productWithRelations, error: relError } = await supabase
      .from('products')
      .select(`
        id, name, slug, base_price,
        category:categories(id, name, slug),
        images:product_images(image_url, is_primary),
        variants:product_variants(id, color, length, price_override)
      `)
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (relError) throw relError;
    console.log(`✅ Product with relations fetched: ${productWithRelations.name}`);
    console.log(`   Category: ${productWithRelations.category?.name || 'N/A'}`);
    console.log(`   Images: ${productWithRelations.images?.length || 0}`);
    console.log(`   Variants: ${productWithRelations.variants?.length || 0}`);

    // Test 5: Test inventory table
    console.log('\n5️⃣ Testing inventory table...');
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('product_id, variant_id, quantity_available')
      .limit(5);
    
    if (invError) throw invError;
    console.log(`✅ Inventory: ${inventory.length} rows fetched`);

    console.log('\n✅ All database tests passed! Database is fully operational.');
    console.log('\n📊 Summary:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Collections: ${collections.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Inventory records: ${inventory.length}`);

  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testDatabaseConnection();
