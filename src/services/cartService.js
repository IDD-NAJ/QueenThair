import supabase from '../lib/supabaseClient';
import { checkInventory } from './productService';

const CART_ITEMS_SELECT = `
  id, quantity, unit_price,
  product:products(id, name, slug, base_price, product_type,
    images:product_images(image_url, alt_text, is_primary)),
  variant:product_variants(id, color, length, density, size, option_label, price_override)
`;

// ─── Get or create active cart ────────────────────────────────────────────────
export async function getOrCreateCart({ userId = null, sessionId = null } = {}) {
  if (!userId && !sessionId) throw new Error('userId or sessionId required');

  let query = supabase
    .from('carts')
    .select('id, status, currency')
    .eq('status', 'active');

  if (userId) query = query.eq('user_id', userId);
  else        query = query.eq('session_id', sessionId);

  const { data: existing } = await query.maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('carts')
    .insert({ user_id: userId, session_id: sessionId, status: 'active', currency: 'USD' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Fetch cart with items ────────────────────────────────────────────────────
export async function getCartWithItems({ userId = null, sessionId = null } = {}) {
  const cart = await getOrCreateCart({ userId, sessionId });

  const { data: items, error } = await supabase
    .from('cart_items')
    .select(CART_ITEMS_SELECT)
    .eq('cart_id', cart.id);
  if (error) throw error;

  const normalized = (items || []).map(normalizeItem);
  return { cart, items: normalized, subtotal: calcSubtotal(normalized) };
}

// ─── Add item ────────────────────────────────────────────────────────────────
export async function addToCart({ userId, sessionId, productId, variantId = null, quantity = 1, unitPrice }) {
  const cart = await getOrCreateCart({ userId, sessionId });

  const inv = await checkInventory(productId, variantId);
  if (inv?.track_inventory && !inv?.allow_backorder && inv.available < quantity) {
    throw new Error(`Only ${inv.available} units available`);
  }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .is('variant_id', variantId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select(CART_ITEMS_SELECT)
      .single();
    if (error) throw error;
    return normalizeItem(data);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({ cart_id: cart.id, product_id: productId, variant_id: variantId, quantity, unit_price: unitPrice })
    .select(CART_ITEMS_SELECT)
    .single();
  if (error) throw error;
  return normalizeItem(data);
}

// ─── Update quantity ──────────────────────────────────────────────────────────
export async function updateCartItemQty(cartItemId, quantity) {
  if (quantity < 1) return removeCartItem(cartItemId);
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select(CART_ITEMS_SELECT)
    .single();
  if (error) throw error;
  return normalizeItem(data);
}

// ─── Remove item ─────────────────────────────────────────────────────────────
export async function removeCartItem(cartItemId) {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
  if (error) throw error;
}

// ─── Clear cart ───────────────────────────────────────────────────────────────
export async function clearCart(cartId) {
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
  if (error) throw error;
}

// ─── Mark cart as converted ───────────────────────────────────────────────────
export async function convertCart(cartId) {
  const { error } = await supabase
    .from('carts')
    .update({ status: 'converted' })
    .eq('id', cartId);
  if (error) throw error;
}

// ─── Merge guest cart into user cart on login ─────────────────────────────────
export async function mergeGuestCart(sessionId, userId) {
  const { data: guestCart } = await supabase
    .from('carts')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'active')
    .maybeSingle();
  if (!guestCart) return;

  const { data: guestItems } = await supabase
    .from('cart_items')
    .select('product_id, variant_id, quantity, unit_price')
    .eq('cart_id', guestCart.id);
  if (!guestItems?.length) return;

  const userCart = await getOrCreateCart({ userId });

  for (const item of guestItems) {
    await addToCart({
      userId,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    });
  }

  // Abandon guest cart
  await supabase.from('carts').update({ status: 'abandoned' }).eq('id', guestCart.id);
}

// ─── Validate cart for checkout ───────────────────────────────────────────────
export async function validateCartForCheckout(cartId) {
  const { data: items, error } = await supabase
    .from('cart_items')
    .select('id, quantity, product_id, variant_id, product:products(name, is_active)')
    .eq('cart_id', cartId);
  if (error) throw error;
  if (!items?.length) throw new Error('Cart is empty');

  const issues = [];
  for (const item of items) {
    if (!item.product?.is_active) {
      issues.push(`"${item.product?.name}" is no longer available`);
      continue;
    }
    const inv = await checkInventory(item.product_id, item.variant_id);
    if (inv?.track_inventory && !inv?.allow_backorder && inv.available < item.quantity) {
      issues.push(`"${item.product?.name}" has only ${inv.available} units available`);
    }
  }

  if (issues.length) throw new Error(issues.join('; '));
  return items;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcSubtotal(items) {
  return items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
}

function normalizeItem(item) {
  if (!item) return item;
  const effectivePrice = item.variant?.price_override ?? item.unit_price;
  const images = item.product?.images || [];
  const primaryImage = images.find(i => i.is_primary) || images[0];
  return { ...item, effectivePrice, primaryImage };
}
