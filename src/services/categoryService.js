import supabase from '../lib/supabaseClient';

export async function getCategories({ activeOnly = true } = {}) {
  let query = supabase.from('categories').select('*').order('sort_order');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
}

// Export as object for admin pages
export const categoryService = {
  getCategories,
  getCategoryBySlug
};
