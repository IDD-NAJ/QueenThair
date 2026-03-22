import supabase from '../lib/supabaseClient';

export const bannerService = {
  async getBanners(activeOnly = false) {
    let query = supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
      const now = new Date().toISOString();
      query = query.or(`start_date.is.null,start_date.lte.${now}`)
                   .or(`end_date.is.null,end_date.gte.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getBanner(id) {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createBanner(bannerData) {
    const { data, error } = await supabase
      .from('banners')
      .insert(bannerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBanner(id, updates) {
    const { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBanner(id) {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateBannerOrder(id, sortOrder) {
    const { data, error } = await supabase
      .from('banners')
      .update({ sort_order: sortOrder })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default bannerService;
