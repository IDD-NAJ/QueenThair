import supabase from '../lib/supabaseClient';

const WISHLIST_ITEMS_SELECT = `
  id, created_at,
  product:products(
    id, name, slug, base_price, compare_at_price, on_sale, badge,
    rating_average, review_count, short_description,
    images:product_images(image_url, alt_text, is_primary)
  ),
  variant:product_variants(id, color, length, density, option_label)
`;

// ─── Get or create wishlist for user ─────────────────────────────────────────
async function getOrCreateWishlist(userId) {
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return existing;

  // Use upsert to avoid 409 conflict if wishlist was created concurrently
  const { data, error } = await supabase
    .from('wishlists')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
    .select()
    .single();
  
  if (error) {
    // If upsert failed, try to fetch again (might have been created by another request)
    const { data: retry } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (retry) return retry;
    throw error;
  }
  return data;
}

// ─── Fetch wishlist items ─────────────────────────────────────────────────────
export async function getWishlist(userId) {
  const wishlist = await getOrCreateWishlist(userId);

  const { data, error } = await supabase
    .from('wishlist_items')
    .select(WISHLIST_ITEMS_SELECT)
    .eq('wishlist_id', wishlist.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return { wishlist, items: data || [] };
}

// ─── Add to wishlist ──────────────────────────────────────────────────────────
export async function addToWishlist(userId, productId, variantId = null) {
  const wishlist = await getOrCreateWishlist(userId);

  const { data, error } = await supabase
    .from('wishlist_items')
    .upsert(
      { wishlist_id: wishlist.id, product_id: productId, variant_id: variantId },
      { onConflict: 'wishlist_id,product_id,variant_id' }
    )
    .select(WISHLIST_ITEMS_SELECT)
    .single();
  if (error) throw error;
  return data;
}

// ─── Remove from wishlist ─────────────────────────────────────────────────────
export async function removeFromWishlist(userId, productId, variantId = null) {
  const wishlist = await getOrCreateWishlist(userId);

  let query = supabase
    .from('wishlist_items')
    .delete()
    .eq('wishlist_id', wishlist.id)
    .eq('product_id', productId);

  query = variantId ? query.eq('variant_id', variantId) : query.is('variant_id', null);

  const { error } = await query;
  if (error) throw error;
}

// ─── Toggle (add if missing, remove if present) ───────────────────────────────
export async function toggleWishlist(userId, productId, variantId = null) {
  const wishlist = await getOrCreateWishlist(userId);

  let query = supabase
    .from('wishlist_items')
    .select('id')
    .eq('wishlist_id', wishlist.id)
    .eq('product_id', productId);
  query = variantId ? query.eq('variant_id', variantId) : query.is('variant_id', null);

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    await removeFromWishlist(userId, productId, variantId);
    return { added: false };
  }
  await addToWishlist(userId, productId, variantId);
  return { added: true };
}

// ─── Check if in wishlist ─────────────────────────────────────────────────────
export async function isInWishlist(userId, productId) {
  const wishlist = await getOrCreateWishlist(userId);
  const { data } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('wishlist_id', wishlist.id)
    .eq('product_id', productId)
    .maybeSingle();
  return !!data;
}
