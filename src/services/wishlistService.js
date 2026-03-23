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

  // Fetch wishlist items
  const { data: items, error } = await supabase
    .from('wishlist_items')
    .select('id, product_id, variant_id, created_at')
    .eq('wishlist_id', wishlist.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  if (!items || items.length === 0) return { wishlist, items: [] };

  // Fetch product IDs and variant IDs
  const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
  const variantIds = [...new Set(items.map(i => i.variant_id).filter(Boolean))];

  // Batch fetch products, variants, and images
  const [productsRes, variantsRes, imagesRes] = await Promise.all([
    productIds.length > 0 ? supabase
      .from('products')
      .select('id, name, slug, base_price, compare_at_price, on_sale, badge, rating_average, review_count, short_description')
      .in('id', productIds) : Promise.resolve({ data: [] }),
    variantIds.length > 0 ? supabase
      .from('product_variants')
      .select('id, color, length, density, option_label')
      .in('id', variantIds) : Promise.resolve({ data: [] }),
    productIds.length > 0 ? supabase
      .from('product_images')
      .select('id, product_id, image_url, alt_text, is_primary')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true }) : Promise.resolve({ data: [] })
  ]);

  // Create lookup maps
  const productsById = (productsRes.data || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
  const variantsById = (variantsRes.data || []).reduce((acc, v) => { acc[v.id] = v; return acc; }, {});
  const imagesByProduct = (imagesRes.data || []).reduce((acc, img) => {
    if (!acc[img.product_id]) acc[img.product_id] = [];
    acc[img.product_id].push(img);
    return acc;
  }, {});

  // Combine data
  const fullItems = items.map(item => ({
    ...item,
    product: productsById[item.product_id] ? {
      ...productsById[item.product_id],
      images: imagesByProduct[item.product_id] || []
    } : null,
    variant: variantsById[item.variant_id] || null
  }));

  return { wishlist, items: fullItems };
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
    .select('id, product_id, variant_id, created_at')
    .single();
  
  if (error) throw error;

  // Fetch full product data
  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, base_price, compare_at_price, on_sale, badge, rating_average, review_count, short_description')
    .eq('id', productId)
    .single();

  const { data: images } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, alt_text, is_primary')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  let variant = null;
  if (variantId) {
    const { data: v } = await supabase
      .from('product_variants')
      .select('id, color, length, density, option_label')
      .eq('id', variantId)
      .single();
    variant = v;
  }

  return {
    ...data,
    product: product ? { ...product, images: images || [] } : null,
    variant
  };
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
