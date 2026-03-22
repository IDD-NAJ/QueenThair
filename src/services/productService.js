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
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return normalizeProduct(data);
}

// ─── Fetch a single product by id ────────────────────────────────────────────
export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return normalizeProduct(data);
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
  // If filtering by collection, use a different query approach
  if (collectionId) {
    const { data: collectionProducts, error: cpError } = await supabase
      .from('collection_products')
      .select('product_id')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true });
    
    if (cpError) throw cpError;
    
    const productIds = (collectionProducts || []).map(cp => cp.product_id);
    
    if (productIds.length === 0) {
      return { products: [], total: 0 };
    }
    
    let query = supabase
      .from('products')
      .select(PRODUCT_SELECT, { count: 'exact' })
      .in('id', productIds)
      .eq('is_active', true);
    
    if (productType)  query = query.eq('product_type', productType);
    if (minPrice)     query = query.gte('base_price', minPrice);
    if (maxPrice)     query = query.lte('base_price', maxPrice);
    
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    if (error) throw error;
    
    return { products: (data || []).map(normalizeProduct), total: count || 0 };
  }
  
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_active', true);

  if (productType)  query = query.eq('product_type', productType);
  if (featured)     query = query.eq('featured', true);
  if (newArrival)   query = query.eq('new_arrival', true);
  if (bestSeller)   query = query.eq('best_seller', true);
  if (onSale)       query = query.eq('on_sale', true);
  if (minPrice)     query = query.gte('base_price', minPrice);
  if (maxPrice)     query = query.lte('base_price', maxPrice);

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (search) {
    query = query.textSearch('name', search, { type: 'websearch' });
  }

  switch (sortBy) {
    case 'newest':     query = query.order('created_at', { ascending: false }); break;
    case 'price-low':  query = query.order('base_price',  { ascending: true  }); break;
    case 'price-high': query = query.order('base_price',  { ascending: false }); break;
    case 'rating':     query = query.order('rating_average', { ascending: false }); break;
    case 'reviews':    query = query.order('review_count',   { ascending: false }); break;
    default:           query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  let products = (data || []).map(normalizeProduct);

  // Client-side variant filter (color / length / density)
  if (color || length || density) {
    products = products.filter(p =>
      p.variants?.some(v =>
        (!color   || v.color   === color) &&
        (!length  || v.length  === length) &&
        (!density || v.density === density)
      )
    );
  }

  return { products, total: count || 0 };
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

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .eq('category_id', src.category_id)
    .neq('id', productId)
    .limit(limit);
  if (error) return [];
  return (data || []).map(normalizeProduct);
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
  return {
    ...p,
    images: images.map(img => ({
      url: img.image_url,
      alt: img.alt_text,
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
    variants: {
      colors: p.variants ? [...new Set(p.variants.map(v => v.color).filter(Boolean))] : [],
      all: p.variants || [],
    },
  };
}
