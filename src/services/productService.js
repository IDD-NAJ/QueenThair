import supabase from '../lib/supabaseClient';

const PRODUCT_SELECT = `
  id, name, slug, product_type, base_price, compare_at_price,
  featured, new_arrival, best_seller, on_sale, badge,
  rating_average, review_count, short_description, description,
  seo_title, seo_description, is_active,
  category:categories(id, name, slug),
  images:product_images(image_url, alt_text, sort_order, is_primary),
  variants:product_variants(id, sku, color, length, density, size, option_label, price_override, is_active),
  inventory(quantity_available, quantity_reserved, low_stock_threshold, track_inventory, allow_backorder)
`;

// ─── Fetch a single product by slug ──────────────────────────────────────────
export async function getProductBySlug(slug) {
  // Fetch product with basic info
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      id, name, slug, product_type, base_price, compare_at_price,
      featured, new_arrival, best_seller, on_sale, badge,
      rating_average, review_count, short_description, description,
      seo_title, seo_description, is_active, category_id
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  
  if (productError) throw productError;
  if (!product) throw new Error('Product not found');

  // Fetch category separately
  let category = null;
  if (product.category_id) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('id', product.category_id)
      .single();
    category = cat;
  }

  // Fetch images
  const { data: images } = await supabase
    .from('product_images')
    .select('id, image_url, alt_text, sort_order, is_primary')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true });

  // Fetch variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, sku, color, length, density, size, option_label, price_override, is_active')
    .eq('product_id', product.id)
    .eq('is_active', true);

  // Fetch inventory
  const { data: inventory } = await supabase
    .from('inventory')
    .select('quantity_available, quantity_reserved, low_stock_threshold, track_inventory, allow_backorder')
    .eq('product_id', product.id)
    .maybeSingle();

  // Combine all data
  const fullProduct = {
    ...product,
    category,
    images: images || [],
    variants: variants || [],
    inventory: inventory || {
      quantity_available: 0,
      quantity_reserved: 0,
      low_stock_threshold: 5,
      track_inventory: true,
      allow_backorder: false
    }
  };

  return normalizeProduct(fullProduct);
}

// ─── Fetch a single product by id ────────────────────────────────────────────
export async function getProductById(id) {
  console.log('[productService] getProductById called:', id);
  
  // Fetch product with basic info
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      id, name, slug, product_type, base_price, compare_at_price,
      featured, new_arrival, best_seller, on_sale, badge,
      rating_average, review_count, short_description, description,
      seo_title, seo_description, is_active, category_id
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();
  
  if (productError) {
    console.error('[productService] Product fetch error:', productError);
    throw productError;
  }
  if (!product) throw new Error('Product not found');

  console.log('[productService] Product fetched:', product.name);

  // Fetch images
  console.log('[productService] Fetching images for product_id:', id);
  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('id, image_url, alt_text, sort_order, is_primary')
    .eq('product_id', id)
    .order('sort_order', { ascending: true });
  
  if (imagesError) {
    console.error('[productService] Images fetch error:', imagesError);
  }
  console.log('[productService] Images fetched:', images?.length || 0, images);

  // Fetch variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, sku, color, length, density, size, option_label, price_override, is_active')
    .eq('product_id', id)
    .eq('is_active', true);

  // Fetch inventory
  const { data: inventory } = await supabase
    .from('inventory')
    .select('quantity_available, quantity_reserved, low_stock_threshold, track_inventory, allow_backorder')
    .eq('product_id', id)
    .maybeSingle();

  // Combine all data
  const fullProduct = {
    ...product,
    images: images || [],
    variants: variants || [],
    inventory: inventory || {
      quantity_available: 0,
      quantity_reserved: 0,
      low_stock_threshold: 5,
      track_inventory: true,
      allow_backorder: false
    }
  };

  console.log('[productService] Full product with images:', fullProduct.images.length);
  const normalized = normalizeProduct(fullProduct);
  console.log('[productService] Normalized images:', normalized.images.length, normalized.images[0]?.image_url);
  return normalized;
}

// ─── List products with flexible filters + pagination ────────────────────────
export async function getProducts({
  productType,
  categorySlug,
  collectionId,
  featured,
  newArrival,
  bestSeller,
  onSale,
  minPrice,
  maxPrice,
  color,
  length,
  density,
  search,
  sortBy = 'featured',
  limit = 20,
  offset = 0,
} = {}) {
  // Build base query for products
  let productQuery = supabase
    .from('products')
    .select('id, name, slug, product_type, base_price, compare_at_price, featured, new_arrival, best_seller, on_sale, badge, rating_average, review_count, short_description, category_id', { count: 'exact' })
    .eq('is_active', true);

  // Handle collection filter
  let productIds = null;
  if (collectionId) {
    const { data: collectionProducts, error: cpError } = await supabase
      .from('collection_products')
      .select('product_id')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true });
    
    if (cpError) throw cpError;
    productIds = (collectionProducts || []).map(cp => cp.product_id);
    if (productIds.length === 0) return { products: [], total: 0 };
    productQuery = productQuery.in('id', productIds);
  }

  // Apply filters
  if (productType)  productQuery = productQuery.eq('product_type', productType);
  if (featured)     productQuery = productQuery.eq('featured', true);
  if (newArrival)   productQuery = productQuery.eq('new_arrival', true);
  if (bestSeller)   productQuery = productQuery.eq('best_seller', true);
  if (onSale)       productQuery = productQuery.eq('on_sale', true);
  if (minPrice)     productQuery = productQuery.gte('base_price', minPrice);
  if (maxPrice)     productQuery = productQuery.lte('base_price', maxPrice);

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (cat) productQuery = productQuery.eq('category_id', cat.id);
  }

  if (search) {
    productQuery = productQuery.textSearch('name', search, { type: 'websearch' });
  }

  // Apply sorting
  switch (sortBy) {
    case 'newest':     productQuery = productQuery.order('created_at', { ascending: false }); break;
    case 'price-low':  productQuery = productQuery.order('base_price',  { ascending: true  }); break;
    case 'price-high': productQuery = productQuery.order('base_price',  { ascending: false }); break;
    case 'rating':     productQuery = productQuery.order('rating_average', { ascending: false }); break;
    case 'reviews':    productQuery = productQuery.order('review_count',   { ascending: false }); break;
    default:           productQuery = productQuery.order('featured', { ascending: false }).order('created_at', { ascending: false });
  }

  productQuery = productQuery.range(offset, offset + limit - 1);

  const { data: products, error, count } = await productQuery;
  if (error) throw error;
  if (!products || products.length === 0) return { products: [], total: 0 };

  // Fetch related data separately
  const productIdsList = products.map(p => p.id);
  const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];

  // Batch fetch images, variants, inventory
  const [imagesRes, variantsRes, inventoryRes, categoriesRes] = await Promise.all([
    supabase.from('product_images').select('id, product_id, image_url, alt_text, sort_order, is_primary').in('product_id', productIdsList).order('sort_order', { ascending: true }),
    supabase.from('product_variants').select('id, product_id, sku, color, length, density, size, option_label, price_override, is_active').in('product_id', productIdsList).eq('is_active', true),
    supabase.from('inventory').select('product_id, quantity_available, quantity_reserved, low_stock_threshold, track_inventory, allow_backorder').in('product_id', productIdsList),
    categoryIds.length > 0 ? supabase.from('categories').select('id, name, slug').in('id', categoryIds) : Promise.resolve({ data: [] })
  ]);

  // Group related data by product_id
  const imagesByProduct = groupBy(imagesRes.data || [], 'product_id');
  const variantsByProduct = groupBy(variantsRes.data || [], 'product_id');
  const inventoryByProduct = groupBy(inventoryRes.data || [], 'product_id');
  const categoriesById = keyBy(categoriesRes.data || [], 'id');

  // Combine all data
  const fullProducts = products.map(p => ({
    ...p,
    category: categoriesById[p.category_id] || null,
    images: imagesByProduct[p.id] || [],
    variants: variantsByProduct[p.id] || [],
    inventory: inventoryByProduct[p.id]?.[0] || {
      quantity_available: 0,
      quantity_reserved: 0,
      low_stock_threshold: 5,
      track_inventory: true,
      allow_backorder: false
    }
  }));

  let normalizedProducts = fullProducts.map(normalizeProduct);

  // Client-side variant filter
  if (color || length || density) {
    normalizedProducts = normalizedProducts.filter(p =>
      p.variants?.some(v =>
        (!color   || v.color   === color) &&
        (!length  || v.length  === length) &&
        (!density || v.density === density)
      )
    );
  }

  return { products: normalizedProducts, total: count || 0 };
}

// Helper functions
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const val = item[key];
    if (!acc[val]) acc[val] = [];
    acc[val].push(item);
    return acc;
  }, {});
}

function keyBy(arr, key) {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item;
    return acc;
  }, {});
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────
export const getFeaturedProducts   = (opts) => getProducts({ featured:   true, ...opts });
export const getNewArrivals        = (opts) => getProducts({ newArrival: true, ...opts });
export const getBestSellers        = (opts) => getProducts({ bestSeller: true, ...opts });
export const getSaleProducts       = (opts) => getProducts({ onSale:     true, ...opts });
export const getWigs               = (opts) => getProducts({ productType: 'wig',       ...opts });
export const getAccessories        = (opts) => getProducts({ productType: 'accessory', ...opts });
export const getProductsByCategory = (categorySlug, opts) => getProducts({ categorySlug, ...opts });

// ─── Related products ─────────────────────────────────────────────────────────
export async function getRelatedProducts(productId, { limit = 4 } = {}) {
  // Fetch the source product's category and type
  const { data: src } = await supabase
    .from('products')
    .select('category_id, product_type')
    .eq('id', productId)
    .single();
  if (!src) return [];

  // Fetch related products (basic info only)
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, product_type, base_price, compare_at_price, featured, new_arrival, best_seller, on_sale, badge, rating_average, review_count, short_description, category_id')
    .eq('is_active', true)
    .eq('category_id', src.category_id)
    .neq('id', productId)
    .limit(limit);
  
  if (error || !products || products.length === 0) return [];

  // Fetch related data
  const productIds = products.map(p => p.id);
  const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];

  const [imagesRes, variantsRes, inventoryRes, categoriesRes] = await Promise.all([
    supabase.from('product_images').select('id, product_id, image_url, alt_text, sort_order, is_primary').in('product_id', productIds).order('sort_order', { ascending: true }),
    supabase.from('product_variants').select('id, product_id, sku, color, length, density, size, option_label, price_override, is_active').in('product_id', productIds).eq('is_active', true),
    supabase.from('inventory').select('product_id, quantity_available, quantity_reserved, low_stock_threshold, track_inventory, allow_backorder').in('product_id', productIds),
    categoryIds.length > 0 ? supabase.from('categories').select('id, name, slug').in('id', categoryIds) : Promise.resolve({ data: [] })
  ]);

  const imagesByProduct = groupBy(imagesRes.data || [], 'product_id');
  const variantsByProduct = groupBy(variantsRes.data || [], 'product_id');
  const inventoryByProduct = groupBy(inventoryRes.data || [], 'product_id');
  const categoriesById = keyBy(categoriesRes.data || [], 'id');

  const fullProducts = products.map(p => ({
    ...p,
    category: categoriesById[p.category_id] || null,
    images: imagesByProduct[p.id] || [],
    variants: variantsByProduct[p.id] || [],
    inventory: inventoryByProduct[p.id]?.[0] || {
      quantity_available: 0,
      quantity_reserved: 0,
      low_stock_threshold: 5,
      track_inventory: true,
      allow_backorder: false
    }
  }));

  return fullProducts.map(normalizeProduct);
}

// ─── Inventory check ─────────────────────────────────────────────────────────
export async function checkInventory(productId, variantId = null) {
  let query = supabase
    .from('inventory')
    .select('quantity_available, quantity_reserved, low_stock_threshold, track_inventory, allow_backorder')
    .eq('product_id', productId);

  query = variantId ? query.eq('variant_id', variantId) : query.is('variant_id', null);

  const { data, error } = await query.single();
  if (error) return null;
  return {
    ...data,
    inStock: !data.track_inventory || data.allow_backorder || data.quantity_available > data.quantity_reserved,
    available: data.quantity_available - data.quantity_reserved,
    isLowStock: data.quantity_available - data.quantity_reserved <= data.low_stock_threshold,
  };
}

// ─── Normalizer ──────────────────────────────────────────────────────────────
function normalizeProduct(p) {
  if (!p) return p;
  const images = (p.images || []).sort((a, b) => a.sort_order - b.sort_order);
  const primaryImage = images.find(i => i.is_primary) || images[0];
  
  // Map database fields to frontend-expected format
  // Keep original fields (image_url, alt_text) for ProductPage compatibility
  // Add mapped fields (url, alt) for components that expect them
  return {
    ...p,
    images: images.map(img => ({
      ...img,  // Keep original fields: id, image_url, alt_text, sort_order, is_primary
      url: img.image_url,      // For components expecting 'url'
      alt: img.alt_text,       // For components expecting 'alt'
      isPrimary: img.is_primary,
      sortOrder: img.sort_order,
    })),
    primaryImage,
    price: p.base_price,
    compareAtPrice: p.compare_at_price,
    rating: p.rating_average || 0,
    reviewCount: p.review_count || 0,
    shortDescription: p.short_description,
    // Map badge fields to nested badges object for ProductCard compatibility
    badges: {
      isNew: p.new_arrival || false,
      isSale: p.on_sale || false,
      isHot: p.featured || false,
      isBestSeller: p.best_seller || false,
    },
    // Map variants for color display
    variants: p.variants || [],
    variantColors: p.variants ? [...new Set(p.variants.map(v => v.color).filter(Boolean))] : [],
  };
}
