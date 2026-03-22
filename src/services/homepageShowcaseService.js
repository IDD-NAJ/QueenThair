import supabase from '../lib/supabaseClient';

const KEY = 'homepage_category_section';

/**
 * Public read of homepage category showcase (RLS allows SELECT only for this key).
 * @returns {Promise<{ active: boolean, title: string, subtitle: string, items: Array } | null>}
 */
export async function getHomepageCategoryShowcase() {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value_json')
    .eq('key', KEY)
    .maybeSingle();

  if (error) {
    console.warn('Homepage showcase fetch:', error.message, error.code || '');
    return null;
  }
  const json = data?.value_json;
  if (json != null && typeof json === 'object') {
    return json;
  }
  return null;
}
