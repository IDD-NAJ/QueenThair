export const CSV_HEADERS = [
  'product_id',
  'product_slug',
  'product_name',
  'short_description',
  'description',
  'product_type',
  'category_slug',
  'category_name',
  'base_price',
  'compare_at_price',
  'featured',
  'new_arrival',
  'best_seller',
  'on_sale',
  'badge',
  'seo_title',
  'seo_description',
  'is_active',
  'variant_id',
  'sku',
  'color',
  'length',
  'density',
  'size',
  'material',
  'option_label',
  'price_override',
  'compare_at_price_override',
  'variant_active',
  'quantity_available',
  'quantity_reserved',
  'low_stock_threshold',
  'track_inventory',
  'allow_backorder',
  'primary_image_url',
  'image_urls',
  'alt_texts',
  'collection_slugs',
  'collection_names',
  'sort_order',
  'tags',
  'metadata_json',
];

export const SAMPLE_ROWS = [
  {
    product_id: '',
    product_slug: 'brazilian-body-wave-22',
    product_name: 'Brazilian Body Wave 22"',
    short_description: 'Luxurious Brazilian body wave hair',
    description: 'Premium quality Brazilian body wave hair extensions with natural bounce and shine.',
    product_type: 'extension',
    category_slug: 'brazilian-hair',
    category_name: 'Brazilian Hair',
    base_price: '299.99',
    compare_at_price: '399.99',
    featured: 'true',
    new_arrival: 'false',
    best_seller: 'true',
    on_sale: 'true',
    badge: 'Best Seller',
    seo_title: 'Brazilian Body Wave 22" - Premium Hair Extensions',
    seo_description: 'Shop premium Brazilian body wave hair extensions',
    is_active: 'true',
    variant_id: '',
    sku: 'BBW-22-1B-150',
    color: '1B',
    length: '22',
    density: '150%',
    size: '',
    material: '100% Human Hair',
    option_label: '22" 1B 150%',
    price_override: '',
    compare_at_price_override: '',
    variant_active: 'true',
    quantity_available: '50',
    quantity_reserved: '0',
    low_stock_threshold: '5',
    track_inventory: 'true',
    allow_backorder: 'false',
    primary_image_url: 'https://example.com/images/bbw-22-1b.jpg',
    image_urls: 'https://example.com/images/bbw-22-1b-2.jpg|https://example.com/images/bbw-22-1b-3.jpg',
    alt_texts: 'Brazilian Body Wave front view|Brazilian Body Wave side view',
    collection_slugs: 'summer-collection|best-sellers',
    collection_names: 'Summer Collection|Best Sellers',
    sort_order: '1',
    tags: 'brazilian,body-wave,premium',
    metadata_json: '{"texture":"body wave","origin":"brazil"}',
  },
  {
    product_id: '',
    product_slug: 'brazilian-body-wave-22',
    product_name: 'Brazilian Body Wave 22"',
    short_description: '',
    description: '',
    product_type: '',
    category_slug: '',
    category_name: '',
    base_price: '',
    compare_at_price: '',
    featured: '',
    new_arrival: '',
    best_seller: '',
    on_sale: '',
    badge: '',
    seo_title: '',
    seo_description: '',
    is_active: '',
    variant_id: '',
    sku: 'BBW-22-2-180',
    color: '2',
    length: '22',
    density: '180%',
    size: '',
    material: '100% Human Hair',
    option_label: '22" 2 180%',
    price_override: '329.99',
    compare_at_price_override: '',
    variant_active: 'true',
    quantity_available: '30',
    quantity_reserved: '0',
    low_stock_threshold: '5',
    track_inventory: 'true',
    allow_backorder: 'false',
    primary_image_url: '',
    image_urls: '',
    alt_texts: '',
    collection_slugs: '',
    collection_names: '',
    sort_order: '',
    tags: '',
    metadata_json: '',
  },
];

export const FIELD_DESCRIPTIONS = {
  product_id: 'Optional - Leave empty for new products, provide UUID for updates',
  product_slug: 'Required - Unique URL-friendly identifier (lowercase, hyphens only)',
  product_name: 'Required - Display name of the product',
  short_description: 'Optional - Brief product summary',
  description: 'Optional - Full product description',
  product_type: 'Optional - One of: bundle, wig, extension, accessory (default: extension)',
  category_slug: 'Optional - Category identifier',
  category_name: 'Optional - Category display name (used if category_slug not found)',
  base_price: 'Optional - Base price in decimal format',
  compare_at_price: 'Optional - Original price for sale comparison',
  featured: 'Optional - true/false',
  new_arrival: 'Optional - true/false',
  best_seller: 'Optional - true/false',
  on_sale: 'Optional - true/false',
  badge: 'Optional - Badge text to display',
  seo_title: 'Optional - SEO meta title',
  seo_description: 'Optional - SEO meta description',
  is_active: 'Optional - true/false (default: true)',
  variant_id: 'Optional - Leave empty for new variants, provide UUID for updates',
  sku: 'Optional - Stock keeping unit (must be unique)',
  color: 'Optional - Color option',
  length: 'Optional - Length option',
  density: 'Optional - Density option',
  size: 'Optional - Size option',
  material: 'Optional - Material description',
  option_label: 'Optional - Display label for variant',
  price_override: 'Optional - Override product base price for this variant',
  compare_at_price_override: 'Optional - Override compare price for this variant',
  variant_active: 'Optional - true/false (default: true)',
  quantity_available: 'Optional - Available stock quantity',
  quantity_reserved: 'Optional - Reserved stock quantity',
  low_stock_threshold: 'Optional - Alert threshold (default: 5)',
  track_inventory: 'Optional - true/false (default: true)',
  allow_backorder: 'Optional - true/false (default: false)',
  primary_image_url: 'Optional - Main product image URL',
  image_urls: 'Optional - Additional image URLs separated by |',
  alt_texts: 'Optional - Alt texts for images separated by | (must match image count)',
  collection_slugs: 'Optional - Collection identifiers separated by |',
  collection_names: 'Optional - Collection names separated by | (must match slug count)',
  sort_order: 'Optional - Display order',
  tags: 'Optional - Comma-separated tags',
  metadata_json: 'Optional - Additional metadata in JSON format',
};

export function generateCSVTemplate(includeSamples = true) {
  const rows = [CSV_HEADERS];
  
  if (includeSamples) {
    SAMPLE_ROWS.forEach(sample => {
      rows.push(CSV_HEADERS.map(header => sample[header] || ''));
    });
  }
  
  return rows.map(row => 
    row.map(cell => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
}

export function downloadCSVTemplate(includeSamples = true) {
  const csv = generateCSVTemplate(includeSamples);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `product-import-template${includeSamples ? '-with-samples' : ''}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateInstructionsHTML() {
  return `
    <div class="space-y-4">
      <div>
        <h3 class="font-semibold text-lg mb-2">CSV Import Instructions</h3>
        <p class="text-sm text-gray-600 mb-4">
          Upload a CSV file to create or update products in bulk. All related tables will be synchronized automatically.
        </p>
      </div>

      <div>
        <h4 class="font-semibold mb-2">Import Modes</h4>
        <ul class="text-sm space-y-1 text-gray-700">
          <li><strong>Upsert:</strong> Create new products and update existing ones (default)</li>
          <li><strong>Full Sync:</strong> Replace all data for imported products</li>
          <li><strong>Inventory Only:</strong> Update only inventory quantities</li>
          <li><strong>Pricing Only:</strong> Update only pricing information</li>
        </ul>
      </div>

      <div>
        <h4 class="font-semibold mb-2">Required Fields</h4>
        <ul class="text-sm space-y-1 text-gray-700">
          <li><code class="bg-gray-100 px-1 rounded">product_slug</code> - Unique identifier</li>
          <li><code class="bg-gray-100 px-1 rounded">product_name</code> - Product display name</li>
        </ul>
      </div>

      <div>
        <h4 class="font-semibold mb-2">Multi-Value Fields</h4>
        <p class="text-sm text-gray-700 mb-2">Separate multiple values with the pipe character (|):</p>
        <ul class="text-sm space-y-1 text-gray-700">
          <li><code class="bg-gray-100 px-1 rounded">image_urls</code> - Multiple image URLs</li>
          <li><code class="bg-gray-100 px-1 rounded">alt_texts</code> - Alt texts (must match image count)</li>
          <li><code class="bg-gray-100 px-1 rounded">collection_slugs</code> - Collection identifiers</li>
          <li><code class="bg-gray-100 px-1 rounded">collection_names</code> - Collection names</li>
        </ul>
      </div>

      <div>
        <h4 class="font-semibold mb-2">Multiple Variants</h4>
        <p class="text-sm text-gray-700">
          To add multiple variants to a product, create multiple rows with the same <code class="bg-gray-100 px-1 rounded">product_slug</code>.
          Fill product details in the first row, and only variant/inventory fields in subsequent rows.
        </p>
      </div>

      <div>
        <h4 class="font-semibold mb-2">Boolean Values</h4>
        <p class="text-sm text-gray-700">
          Use: <code class="bg-gray-100 px-1 rounded">true</code>, <code class="bg-gray-100 px-1 rounded">false</code>, 
          <code class="bg-gray-100 px-1 rounded">1</code>, <code class="bg-gray-100 px-1 rounded">0</code>, 
          <code class="bg-gray-100 px-1 rounded">yes</code>, or <code class="bg-gray-100 px-1 rounded">no</code>
        </p>
      </div>

      <div>
        <h4 class="font-semibold mb-2">Best Practices</h4>
        <ul class="text-sm space-y-1 text-gray-700">
          <li>Always use dry run mode first to validate your data</li>
          <li>Keep SKUs unique across all variants</li>
          <li>Use valid URLs for images</li>
          <li>Match image_urls and alt_texts counts</li>
          <li>Enable auto-create options for new categories/collections</li>
        </ul>
      </div>
    </div>
  `;
}

export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = parseCSVText(text);
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function parseCSVText(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map(v => v.replace(/^"|"$/g, ''));
}

export function exportFailedRows(failedRows) {
  if (!failedRows || failedRows.length === 0) return;

  const rows = [
    [...CSV_HEADERS, 'error_message'],
    ...failedRows.map(failed => [
      ...CSV_HEADERS.map(header => failed.data[header] || ''),
      failed.error,
    ]),
  ];

  const csv = rows.map(row => 
    row.map(cell => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `failed-imports-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
