import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportOptions {
  dryRun: boolean;
  autoCreateCategories: boolean;
  autoCreateCollections: boolean;
  replaceImages: boolean;
  replaceCollections: boolean;
  archiveMissing: boolean;
  mode: 'upsert' | 'full_sync' | 'inventory_only' | 'pricing_only';
}

interface CSVRow {
  product_id?: string;
  product_slug: string;
  product_name: string;
  short_description?: string;
  description?: string;
  product_type?: string;
  category_slug?: string;
  category_name?: string;
  base_price?: string;
  compare_at_price?: string;
  featured?: string;
  new_arrival?: string;
  best_seller?: string;
  on_sale?: string;
  badge?: string;
  seo_title?: string;
  seo_description?: string;
  is_active?: string;
  variant_id?: string;
  sku?: string;
  color?: string;
  length?: string;
  density?: string;
  size?: string;
  material?: string;
  option_label?: string;
  price_override?: string;
  compare_at_price_override?: string;
  variant_active?: string;
  quantity_available?: string;
  quantity_reserved?: string;
  low_stock_threshold?: string;
  track_inventory?: string;
  allow_backorder?: string;
  primary_image_url?: string;
  image_urls?: string;
  alt_texts?: string;
  collection_slugs?: string;
  collection_names?: string;
  sort_order?: string;
  tags?: string;
  metadata_json?: string;
}

interface ValidationError {
  row: number;
  field?: string;
  message: string;
}

interface ImportReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  inventoryUpdated: number;
  categoriesCreated: number;
  collectionsCreated: number;
  imagesCreated: number;
  imagesUpdated: number;
  errors: ValidationError[];
  warnings: string[];
  failedRows: Array<{ row: number; data: CSVRow; error: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const csvFile = formData.get('file') as File;
    const optionsJson = formData.get('options') as string;
    const options: ImportOptions = JSON.parse(optionsJson || '{}');

    if (!csvFile) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const csvText = await csvFile.text();
    const rows = parseCSV(csvText);

    const report: ImportReport = {
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
      productsCreated: 0,
      productsUpdated: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      inventoryUpdated: 0,
      categoriesCreated: 0,
      collectionsCreated: 0,
      imagesCreated: 0,
      imagesUpdated: 0,
      errors: [],
      warnings: [],
      failedRows: [],
    };

    const validationErrors = validateRows(rows, options);
    report.errors = validationErrors;
    report.invalidRows = validationErrors.length;
    report.validRows = rows.length - validationErrors.filter((e, i, arr) => 
      arr.findIndex(x => x.row === e.row) === i
    ).length;

    if (options.dryRun || validationErrors.length > 0) {
      return new Response(JSON.stringify({ report, preview: rows.slice(0, 10) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await processImport(supabaseAdmin, rows, options, report);

    await supabaseAdmin.from('product_import_logs').insert({
      admin_user_id: user.id,
      filename: csvFile.name,
      import_mode: options.mode,
      total_rows: report.totalRows,
      success_count: report.validRows - report.failedRows.length,
      failure_count: report.failedRows.length,
      products_created: report.productsCreated,
      products_updated: report.productsUpdated,
      variants_created: report.variantsCreated,
      variants_updated: report.variantsUpdated,
      inventory_updated: report.inventoryUpdated,
      categories_created: report.categoriesCreated,
      collections_created: report.collectionsCreated,
      images_created: report.imagesCreated,
      images_updated: report.imagesUpdated,
      report_json: report,
    });

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row as CSVRow);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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

function validateRows(rows: CSVRow[], options: ImportOptions): ValidationError[] {
  const errors: ValidationError[] = [];
  const slugsSeen = new Set<string>();
  const skusSeen = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    if (!row.product_slug) {
      errors.push({ row: rowNum, field: 'product_slug', message: 'Product slug is required' });
    } else if (!/^[a-z0-9-]+$/.test(row.product_slug)) {
      errors.push({ row: rowNum, field: 'product_slug', message: 'Invalid slug format' });
    } else if (slugsSeen.has(row.product_slug)) {
      errors.push({ row: rowNum, field: 'product_slug', message: 'Duplicate slug in file' });
    } else {
      slugsSeen.add(row.product_slug);
    }

    if (!row.product_name) {
      errors.push({ row: rowNum, field: 'product_name', message: 'Product name is required' });
    }

    if (row.base_price && isNaN(parseFloat(row.base_price))) {
      errors.push({ row: rowNum, field: 'base_price', message: 'Invalid price format' });
    }

    if (row.compare_at_price && isNaN(parseFloat(row.compare_at_price))) {
      errors.push({ row: rowNum, field: 'compare_at_price', message: 'Invalid price format' });
    }

    if (row.sku) {
      if (skusSeen.has(row.sku)) {
        errors.push({ row: rowNum, field: 'sku', message: 'Duplicate SKU in file' });
      } else {
        skusSeen.add(row.sku);
      }
    }

    if (row.image_urls && row.alt_texts) {
      const urls = row.image_urls.split('|').filter(u => u.trim());
      const alts = row.alt_texts.split('|').filter(a => a.trim());
      if (urls.length !== alts.length) {
        errors.push({ row: rowNum, field: 'image_urls', message: 'Image URLs and alt texts count mismatch' });
      }
    }

    if (row.collection_slugs && row.collection_names) {
      const slugs = row.collection_slugs.split('|').filter(s => s.trim());
      const names = row.collection_names.split('|').filter(n => n.trim());
      if (slugs.length !== names.length) {
        errors.push({ row: rowNum, field: 'collection_slugs', message: 'Collection slugs and names count mismatch' });
      }
    }

    if (row.product_type && !['bundle', 'wig', 'extension', 'accessory'].includes(row.product_type)) {
      errors.push({ row: rowNum, field: 'product_type', message: 'Invalid product type' });
    }
  });

  return errors;
}

async function processImport(
  supabase: any,
  rows: CSVRow[],
  options: ImportOptions,
  report: ImportReport
) {
  const productsBySlug = new Map<string, CSVRow[]>();
  
  rows.forEach(row => {
    if (!productsBySlug.has(row.product_slug)) {
      productsBySlug.set(row.product_slug, []);
    }
    productsBySlug.get(row.product_slug)!.push(row);
  });

  for (const [slug, productRows] of productsBySlug) {
    try {
      await processProduct(supabase, productRows, options, report);
    } catch (error) {
      report.failedRows.push({
        row: rows.indexOf(productRows[0]) + 2,
        data: productRows[0],
        error: error.message,
      });
    }
  }
}

async function processProduct(
  supabase: any,
  productRows: CSVRow[],
  options: ImportOptions,
  report: ImportReport
) {
  const firstRow = productRows[0];
  
  let categoryId: string | null = null;
  if (firstRow.category_slug || firstRow.category_name) {
    categoryId = await ensureCategory(supabase, firstRow, options, report);
  }

  let product: any;
  const { data: existingProduct } = await supabase
    .from('products')
    .select('*')
    .eq('slug', firstRow.product_slug)
    .single();

  const productData: any = {
    slug: firstRow.product_slug,
    name: firstRow.product_name,
    short_description: firstRow.short_description || null,
    description: firstRow.description || null,
    product_type: firstRow.product_type || 'extension',
    category_id: categoryId,
    base_price: firstRow.base_price ? parseFloat(firstRow.base_price) : 0,
    compare_at_price: firstRow.compare_at_price ? parseFloat(firstRow.compare_at_price) : null,
    featured: parseBool(firstRow.featured),
    new_arrival: parseBool(firstRow.new_arrival),
    best_seller: parseBool(firstRow.best_seller),
    on_sale: parseBool(firstRow.on_sale),
    badge: firstRow.badge || null,
    seo_title: firstRow.seo_title || null,
    seo_description: firstRow.seo_description || null,
    is_active: firstRow.is_active !== undefined ? parseBool(firstRow.is_active) : true,
  };

  if (options.mode === 'inventory_only' || options.mode === 'pricing_only') {
    if (!existingProduct) {
      throw new Error('Product does not exist for inventory/pricing update');
    }
    product = existingProduct;
    
    if (options.mode === 'pricing_only') {
      await supabase
        .from('products')
        .update({
          base_price: productData.base_price,
          compare_at_price: productData.compare_at_price,
        })
        .eq('id', product.id);
      report.productsUpdated++;
    }
  } else {
    if (existingProduct) {
      const { data: updated } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existingProduct.id)
        .select()
        .single();
      product = updated;
      report.productsUpdated++;
    } else {
      const { data: created } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      product = created;
      report.productsCreated++;
    }
  }

  if (options.mode !== 'pricing_only') {
    for (const row of productRows) {
      if (row.sku || row.color || row.length) {
        await processVariant(supabase, product.id, row, options, report);
      }
    }
  }

  if (options.mode === 'upsert' || options.mode === 'full_sync') {
    if (firstRow.image_urls || firstRow.primary_image_url) {
      await processImages(supabase, product.id, firstRow, options, report);
    }

    if (firstRow.collection_slugs || firstRow.collection_names) {
      await processCollections(supabase, product.id, firstRow, options, report);
    }
  }
}

async function ensureCategory(
  supabase: any,
  row: CSVRow,
  options: ImportOptions,
  report: ImportReport
): Promise<string> {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', row.category_slug)
    .single();

  if (existing) {
    return existing.id;
  }

  if (!options.autoCreateCategories) {
    throw new Error(`Category ${row.category_slug} does not exist`);
  }

  const { data: created } = await supabase
    .from('categories')
    .insert({
      slug: row.category_slug,
      name: row.category_name || row.category_slug,
      description: `Auto-created from CSV import`,
      is_active: true,
    })
    .select('id')
    .single();

  report.categoriesCreated++;
  return created.id;
}

async function processVariant(
  supabase: any,
  productId: string,
  row: CSVRow,
  options: ImportOptions,
  report: ImportReport
) {
  const { data: existingVariant } = row.variant_id
    ? await supabase.from('product_variants').select('*').eq('id', row.variant_id).single()
    : row.sku
    ? await supabase.from('product_variants').select('*').eq('sku', row.sku).single()
    : { data: null };

  const variantData: any = {
    product_id: productId,
    sku: row.sku || `${row.product_slug}-${Date.now()}`,
    color: row.color || null,
    length: row.length || null,
    density: row.density || null,
    size: row.size || null,
    material: row.material || null,
    option_label: row.option_label || null,
    price_override: row.price_override ? parseFloat(row.price_override) : null,
    compare_at_price_override: row.compare_at_price_override ? parseFloat(row.compare_at_price_override) : null,
    is_active: row.variant_active !== undefined ? parseBool(row.variant_active) : true,
  };

  let variant: any;
  if (existingVariant) {
    const { data: updated } = await supabase
      .from('product_variants')
      .update(variantData)
      .eq('id', existingVariant.id)
      .select()
      .single();
    variant = updated;
    report.variantsUpdated++;
  } else {
    const { data: created } = await supabase
      .from('product_variants')
      .insert(variantData)
      .select()
      .single();
    variant = created;
    report.variantsCreated++;
  }

  if (row.quantity_available !== undefined || row.low_stock_threshold !== undefined) {
    await processInventory(supabase, variant.id, row, report);
  }
}

async function processInventory(
  supabase: any,
  variantId: string,
  row: CSVRow,
  report: ImportReport
) {
  const { data: existing } = await supabase
    .from('inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();

  const inventoryData: any = {
    variant_id: variantId,
    quantity_available: row.quantity_available ? parseInt(row.quantity_available) : 0,
    quantity_reserved: row.quantity_reserved ? parseInt(row.quantity_reserved) : 0,
    low_stock_threshold: row.low_stock_threshold ? parseInt(row.low_stock_threshold) : 5,
    track_inventory: row.track_inventory !== undefined ? parseBool(row.track_inventory) : true,
    allow_backorder: row.allow_backorder !== undefined ? parseBool(row.allow_backorder) : false,
  };

  if (existing) {
    await supabase
      .from('inventory')
      .update(inventoryData)
      .eq('variant_id', variantId);
  } else {
    await supabase
      .from('inventory')
      .insert(inventoryData);
  }
  
  report.inventoryUpdated++;
}

async function processImages(
  supabase: any,
  productId: string,
  row: CSVRow,
  options: ImportOptions,
  report: ImportReport
) {
  if (options.replaceImages) {
    await supabase.from('product_images').delete().eq('product_id', productId);
  }

  const imageUrls: string[] = [];
  const altTexts: string[] = [];

  if (row.primary_image_url) {
    imageUrls.push(row.primary_image_url);
    altTexts.push(row.product_name);
  }

  if (row.image_urls) {
    const urls = row.image_urls.split('|').map(u => u.trim()).filter(u => u);
    const alts = row.alt_texts ? row.alt_texts.split('|').map(a => a.trim()).filter(a => a) : [];
    imageUrls.push(...urls);
    altTexts.push(...alts);
  }

  for (let i = 0; i < imageUrls.length; i++) {
    const { data: existing } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .eq('image_url', imageUrls[i])
      .single();

    if (existing) {
      await supabase
        .from('product_images')
        .update({
          alt_text: altTexts[i] || row.product_name,
          is_primary: i === 0,
          sort_order: i,
        })
        .eq('id', existing.id);
      report.imagesUpdated++;
    } else {
      await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrls[i],
          alt_text: altTexts[i] || row.product_name,
          is_primary: i === 0,
          sort_order: i,
        });
      report.imagesCreated++;
    }
  }
}

async function processCollections(
  supabase: any,
  productId: string,
  row: CSVRow,
  options: ImportOptions,
  report: ImportReport
) {
  if (options.replaceCollections) {
    await supabase.from('collection_products').delete().eq('product_id', productId);
  }

  const slugs = row.collection_slugs ? row.collection_slugs.split('|').map(s => s.trim()).filter(s => s) : [];
  const names = row.collection_names ? row.collection_names.split('|').map(n => n.trim()).filter(n => n) : [];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const name = names[i] || slug;

    let collectionId: string;
    const { data: existing } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      collectionId = existing.id;
    } else if (options.autoCreateCollections) {
      const { data: created } = await supabase
        .from('collections')
        .insert({
          slug,
          name,
          description: `Auto-created from CSV import`,
          is_active: true,
        })
        .select('id')
        .single();
      collectionId = created.id;
      report.collectionsCreated++;
    } else {
      throw new Error(`Collection ${slug} does not exist`);
    }

    const { data: existingLink } = await supabase
      .from('collection_products')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('product_id', productId)
      .single();

    if (!existingLink) {
      await supabase
        .from('collection_products')
        .insert({
          collection_id: collectionId,
          product_id: productId,
        });
    }
  }
}

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'y';
}
