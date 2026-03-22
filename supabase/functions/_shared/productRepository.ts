import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export type ProductInclude =
  | 'images'
  | 'variants'
  | 'inventory'
  | 'category'
  | 'reviews'
  | 'collections';

export interface FindOptions {
  include?: ProductInclude[];
}

export interface Pagination {
  page?: number;
  pageSize?: number;
}

export interface ProductFilters {
  productType?: 'wig' | 'accessory';
  categorySlug?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

const PRODUCT_BASE_SELECT = `
  id, name, slug, product_type, base_price, compare_at_price,
  featured, new_arrival, best_seller, on_sale, badge,
  rating_average, review_count, short_description, description,
  seo_title, seo_description, is_active,
  category:categories(id, name, slug)
`;

function buildSelect(include: ProductInclude[] = []): string {
  const relations: string[] = [];
  if (include.includes('images')) {
    relations.push('images:product_images(id, image_url, alt_text, sort_order, is_primary)');
  }
  if (include.includes('variants')) {
    relations.push(
      'variants:product_variants(id, sku, color, length, density, size, option_label, price_override, is_active)'
    );
  }
  if (include.includes('inventory')) {
    relations.push(
      'inventory:inventory(quantity_available, quantity_reserved, low_stock_threshold, track_inventory, allow_backorder)'
    );
  }
  // `reviews` and `collections` can be added later as needed.
  return [PRODUCT_BASE_SELECT, ...relations].join(', ');
}

function applyVisibilityFilter(query: any) {
  return query.eq('is_active', true);
}

export async function findById(id: string, options: FindOptions = {}) {
  const select = buildSelect(options.include);
  let query = supabase.from('products').select(select).eq('id', id);
  query = applyVisibilityFilter(query);
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

export async function findMany(
  filters: ProductFilters = {},
  pagination: Pagination = {},
  options: FindOptions = {}
) {
  const { page = 1, pageSize = 20 } = pagination;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const select = buildSelect(options.include);
  let query = supabase
    .from('products')
    .select(select, { count: 'exact' });

  query = applyVisibilityFilter(query);

  if (filters.productType) query = query.eq('product_type', filters.productType);
  if (filters.featured) query = query.eq('featured', true);
  if (filters.newArrival) query = query.eq('new_arrival', true);
  if (filters.bestSeller) query = query.eq('best_seller', true);
  if (filters.onSale) query = query.eq('on_sale', true);
  if (filters.minPrice != null) query = query.gte('base_price', filters.minPrice);
  if (filters.maxPrice != null) query = query.lte('base_price', filters.maxPrice);

  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.categorySlug)
      .maybeSingle();
    if (cat) {
      query = query.eq('category_id', cat.id);
    }
  }

  query = query
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0, page, pageSize };
}

export async function search(
  q: string,
  filters: ProductFilters = {},
  pagination: Pagination = {},
  options: FindOptions = {}
) {
  const { page = 1, pageSize = 20 } = pagination;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const select = buildSelect(options.include);
  let query = supabase
    .from('products')
    .select(select, { count: 'exact' });

  query = applyVisibilityFilter(query);
  query = query.textSearch('name', q, { type: 'websearch' });

  if (filters.productType) query = query.eq('product_type', filters.productType);

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0, page, pageSize };
}

