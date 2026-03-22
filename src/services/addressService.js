import supabase from '../lib/supabaseClient';

export async function getAddresses(userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) {
    console.warn('No user ID provided to getAddresses');
    return [];
  }
  
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', id)
    .order('is_default', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAddress(address, userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');
  
  const { data, error } = await supabase
    .from('addresses')
    .insert({ ...address, user_id: id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAddress(addressId, updates, userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');
  
  const { data, error } = await supabase
    .from('addresses')
    .update(updates)
    .eq('id', addressId)
    .eq('user_id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAddress(addressId, userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');
  
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', id);
  if (error) throw error;
}

export async function setDefaultAddress(addressId, userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');
  
  // Get the address to determine its type
  const { data: address } = await supabase
    .from('addresses')
    .select('type')
    .eq('id', addressId)
    .eq('user_id', id)
    .single();
  
  if (!address) throw new Error('Address not found');
  
  const isShipping = address.type === 'shipping';
  const defaultField = isShipping ? 'is_default_shipping' : 'is_default_billing';
  
  // Clear current default for this type
  await supabase
    .from('addresses')
    .update({ [defaultField]: false })
    .eq('user_id', id)
    .eq('type', address.type);

  // Set new default
  const { data, error } = await supabase
    .from('addresses')
    .update({ [defaultField]: true })
    .eq('id', addressId)
    .eq('user_id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
