import supabase from '../lib/supabaseClient';

/**
 * Parse CSV file and convert to array of objects
 */
export function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must contain headers and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

/**
 * Validate product data from CSV
 */
export function validateProductRow(row, index, categories) {
  const errors = [];
  const rowNum = index + 2; // +2 because index is 0-based and we skip header

  // Required fields
  if (!row.name || !row.name.trim()) {
    errors.push(`Row ${rowNum}: Product name is required`);
  }

  if (!row.slug || !row.slug.trim()) {
    errors.push(`Row ${rowNum}: Slug is required`);
  }

  if (!row.category_slug) {
    errors.push(`Row ${rowNum}: Category slug is required`);
  } else {
    const category = categories.find(c => c.slug === row.category_slug);
    if (!category) {
      errors.push(`Row ${rowNum}: Category '${row.category_slug}' not found`);
    }
  }

  // Price validation
  if (row.base_price) {
    const price = parseFloat(row.base_price);
    if (isNaN(price) || price < 0) {
      errors.push(`Row ${rowNum}: Invalid base_price`);
    }
  } else {
    errors.push(`Row ${rowNum}: base_price is required`);
  }

  if (row.compare_at_price) {
    const comparePrice = parseFloat(row.compare_at_price);
    if (isNaN(comparePrice) || comparePrice < 0) {
      errors.push(`Row ${rowNum}: Invalid compare_at_price`);
    }
  }

  // Product type validation
  const validTypes = ['wig', 'bundle', 'closure', 'frontal', 'accessory'];
  if (row.product_type && !validTypes.includes(row.product_type.toLowerCase())) {
    errors.push(`Row ${rowNum}: Invalid product_type. Must be one of: ${validTypes.join(', ')}`);
  }

  return errors;
}

/**
 * Convert CSV row to product object
 */
export function csvRowToProduct(row, categories) {
  const category = categories.find(c => c.slug === row.category_slug);
  
  return {
    name: row.name.trim(),
    slug: row.slug.trim(),
    product_type: row.product_type?.toLowerCase() || 'wig',
    category_id: category?.id || null,
    base_price: parseFloat(row.base_price) || 0,
    compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
    short_description: row.short_description || '',
    description: row.description || '',
    is_active: row.is_active?.toLowerCase() === 'true' || row.is_active === '1',
    featured: row.featured?.toLowerCase() === 'true' || row.featured === '1',
    new_arrival: row.new_arrival?.toLowerCase() === 'true' || row.new_arrival === '1',
    best_seller: row.best_seller?.toLowerCase() === 'true' || row.best_seller === '1',
    on_sale: row.on_sale?.toLowerCase() === 'true' || row.on_sale === '1'
  };
}

/**
 * Generate CSV template for product upload
 */
export function generateProductTemplate() {
  const headers = [
    'name',
    'slug',
    'product_type',
    'category_slug',
    'base_price',
    'compare_at_price',
    'short_description',
    'description',
    'is_active',
    'featured',
    'new_arrival',
    'best_seller',
    'on_sale'
  ];

  const exampleRow = [
    'Brazilian Body Wave 22"',
    'brazilian-body-wave-22',
    'wig',
    'lace-front-wigs',
    '299.99',
    '399.99',
    'Premium Brazilian body wave wig',
    'High-quality Brazilian body wave human hair wig with natural texture and shine',
    'true',
    'false',
    'true',
    'false',
    'true'
  ];

  return headers.join(',') + '\n' + exampleRow.join(',');
}

/**
 * Download CSV template
 */
export function downloadTemplate() {
  const csv = generateProductTemplate();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'product_upload_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Bulk insert products
 */
export async function bulkInsertProducts(products) {
  const { data, error } = await supabase
    .from('products')
    .insert(products)
    .select();

  if (error) throw error;
  return data;
}
