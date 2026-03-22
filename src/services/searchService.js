import supabase from '../lib/supabaseClient';

const SEARCH_SELECT = `
  id, name, slug, product_type, base_price, compare_at_price,
  on_sale, badge, rating_average, review_count, short_description,
  category:categories(id, name, slug),
  images:product_images(image_url, alt_text, is_primary)
`;

// ─── Full-text + ilike search across products ─────────────────────────────────
export async function searchProducts(query, {
  productType,
  minPrice,
  maxPrice,
  sortBy = 'featured',
  limit = 20,
  offset = 0,
} = {}) {
  const term = query?.trim();
  if (!term) return { products: [], total: 0 };

  let q = supabase
    .from('products')
    .select(SEARCH_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .or(`name.ilike.%${term}%,short_description.ilike.%${term}%`);

  if (productType) q = q.eq('product_type', productType);
  if (minPrice)    q = q.gte('base_price', minPrice);
  if (maxPrice)    q = q.lte('base_price', maxPrice);

  switch (sortBy) {
    case 'price-low':  q = q.order('base_price', { ascending: true });  break;
    case 'price-high': q = q.order('base_price', { ascending: false }); break;
    case 'rating':     q = q.order('rating_average', { ascending: false }); break;
    default:           q = q.order('featured', { ascending: false }).order('created_at', { ascending: false });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  return { products: data || [], total: count || 0 };
}

// ─── Autocomplete suggestions (name only, fast) ───────────────────────────────
export async function getSearchSuggestions(query, { limit = 8 } = {}) {
  const term = query?.trim();
  if (!term || term.length < 2) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, product_type')
    .eq('is_active', true)
    .ilike('name', `%${term}%`)
    .limit(limit);
  if (error) return [];
  return data || [];
}
