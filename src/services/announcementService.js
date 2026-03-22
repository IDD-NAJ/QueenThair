import supabase from '../lib/supabaseClient';

// Get all active announcements
export async function getActiveAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// Get all announcements (admin)
export async function getAllAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// Create announcement
export async function createAnnouncement({ title, icon, link, isActive = true, sortOrder = 0 }) {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title,
      icon,
      link,
      is_active: isActive,
      sort_order: sortOrder,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update announcement
export async function updateAnnouncement(id, updates) {
  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.link !== undefined) payload.link = updates.link;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;

  const { data, error } = await supabase
    .from('announcements')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete announcement
export async function deleteAnnouncement(id) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Toggle announcement active status
export async function toggleAnnouncementStatus(id, isActive) {
  return updateAnnouncement(id, { isActive });
}
