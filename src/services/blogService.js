import supabase from '../lib/supabaseClient';

export const blogService = {
  async getBlogs(filters = {}) {
    let query = supabase
      .from('blogs')
      .select(`
        *,
        author:profiles(first_name, last_name, email)
      `);

    if (filters.published) {
      query = query.eq('is_published', true);
    }
    if (filters.featured) {
      query = query.eq('is_featured', true);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getBlog(slug) {
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        *,
        author:profiles(first_name, last_name, email)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase
      .from('blogs')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    return data;
  },

  async createBlog(blogData) {
    const { data, error } = await supabase
      .from('blogs')
      .insert({
        ...blogData,
        author_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBlog(id, updates) {
    const { data, error } = await supabase
      .from('blogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBlog(id) {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async publishBlog(id) {
    const { data, error } = await supabase
      .from('blogs')
      .update({ 
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unpublishBlog(id) {
    const { data, error } = await supabase
      .from('blogs')
      .update({ is_published: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default blogService;
