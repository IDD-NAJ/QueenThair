// Database Schema Check Script
// Run this in browser console to verify table relationships

window.checkDatabaseSchema = async function() {
  console.log('🔍 Checking Database Schema...');
  
  const checks = {
    tables: {},
    relationships: {},
    errors: []
  };

  // Check if key tables exist
  const tables = ['products', 'inventory', 'product_variants', 'categories', 'orders', 'profiles', 'notifications'];
  
  for (const table of tables) {
    try {
      const { data, error } = await window.supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        checks.tables[table] = { exists: false, error: error.message };
        checks.errors.push(`Table ${table}: ${error.message}`);
      } else {
        checks.tables[table] = { exists: true, count: data?.length || 0 };
      }
    } catch (e) {
      checks.tables[table] = { exists: false, error: e.message };
      checks.errors.push(`Table ${table}: ${e.message}`);
    }
  }

  // Check product-inventory relationship
  try {
    console.log('🔗 Testing products-inventory relationship...');
    const { data, error } = await window.supabase
      .from('products')
      .select(`
        id,
        name,
        inventory (
          quantity_available,
          low_stock_threshold
        )
      `)
      .limit(1);
    
    if (error) {
      checks.relationships['products-inventory'] = { works: false, error: error.message };
      checks.errors.push(`Products-Inventory relationship: ${error.message}`);
    } else {
      checks.relationships['products-inventory'] = { works: true, sample: data[0] };
    }
  } catch (e) {
    checks.relationships['products-inventory'] = { works: false, error: e.message };
    checks.errors.push(`Products-Inventory relationship: ${e.message}`);
  }

  // Check product-variants relationship
  try {
    console.log('🔗 Testing products-variants relationship...');
    const { data, error } = await window.supabase
      .from('products')
      .select(`
        id,
        name,
        variants (
          sku,
          color,
          length
        )
      `)
      .limit(1);
    
    if (error) {
      checks.relationships['products-variants'] = { works: false, error: error.message };
      checks.errors.push(`Products-Variants relationship: ${error.message}`);
    } else {
      checks.relationships['products-variants'] = { works: true, sample: data[0] };
    }
  } catch (e) {
    checks.relationships['products-variants'] = { works: false, error: e.message };
    checks.errors.push(`Products-Variants relationship: ${e.message}`);
  }

  // Check product-category relationship
  try {
    console.log('🔗 Testing products-category relationship...');
    const { data, error } = await window.supabase
      .from('products')
      .select(`
        id,
        name,
        category (
          name,
          slug
        )
      `)
      .limit(1);
    
    if (error) {
      checks.relationships['products-category'] = { works: false, error: error.message };
      checks.errors.push(`Products-Category relationship: ${error.message}`);
    } else {
      checks.relationships['products-category'] = { works: true, sample: data[0] };
    }
  } catch (e) {
    checks.relationships['products-category'] = { works: false, error: e.message };
    checks.errors.push(`Products-Category relationship: ${e.message}`);
  }

  // Display results
  console.log('📊 Database Schema Check Results:');
  console.log('Tables:', checks.tables);
  console.log('Relationships:', checks.relationships);
  
  if (checks.errors.length > 0) {
    console.log('❌ Errors found:');
    checks.errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('✅ All checks passed!');
  }

  return checks;
};

// Auto-load the check function
if (typeof window !== 'undefined') {
  console.log('🔍 Database schema checker loaded!');
  console.log('Run: checkDatabaseSchema() to verify table relationships');
}
