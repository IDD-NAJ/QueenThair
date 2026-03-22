import supabase from '../lib/supabaseClient';

export async function getCollections({ activeOnly = true, featuredOnly = false } = {}) {
  let query = supabase.from('collections').select('*').order('name');
  if (activeOnly)   query = query.eq('is_active', true);
  if (featuredOnly) query = query.eq('featured', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCollectionBySlug(slug) {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
}

export async function getCollectionWithProducts(slug, { limit = 20, offset = 0 } = {}) {
  const collection = await getCollectionBySlug(slug);

  const { data, error } = await supabase
    .from('collection_products')
    .select(`
      sort_order,
      product:products (
        id, name, slug, product_type, base_price, compare_at_price,
        featured, new_arrival, best_seller, on_sale, badge,
        rating_average, review_count, short_description,
        category:categories(id, name, slug),
        images:product_images(image_url, alt_text, is_primary)
      )
    `)
    .eq('collection_id', collection.id)
    .order('sort_order')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return {
    collection,
    products: data.map(row => row.product),
  };
}

// Export as object for admin pages
export const collectionService = {
  getCollections,
  getCollectionBySlug,
  getCollectionWithProducts
};
