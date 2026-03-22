import supabase from '../lib/supabaseClient';

const ORDER_SELECT = `
  id, order_number, email, phone, status, payment_status, fulfillment_status,
  currency, subtotal, discount_total, shipping_total, tax_total, grand_total,
  shipping_address_json, billing_address_json, promo_code, notes,
  stripe_payment_intent_id, created_at, updated_at,
  items:order_items(
    id, product_name, sku, unit_price, quantity, line_total, snapshot_json,
    product:products(id, name, slug,
      images:product_images(image_url, alt_text, is_primary))
  ),
  status_events:order_status_events(id, status, message, created_at)
`;

// ─── Get orders for a user ────────────────────────────────────────────────────
export async function getUserOrders(userId, { limit = 20, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from('orders')
    .select(ORDER_SELECT, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { orders: data || [], total: count || 0 };
}

// ─── Get single order by id (for logged-in user) ─────────────────────────────
export async function getOrderById(orderId, userId) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ─── Guest order lookup by order number + email ────────────────────────────────
export async function lookupGuestOrder(orderNumber, email) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('order_number', orderNumber)
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── Get order status timeline ────────────────────────────────────────────────
export async function getOrderTimeline(orderId) {
  const { data, error } = await supabase
    .from('order_status_events')
    .select('id, status, message, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ─── Create pending order from cart (called by checkout Edge Function) ─────────
// This is exposed here as a reference shape — actual creation uses service_role
// via the Edge Function for security.
export async function createPendingOrder(payload) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: payload,
  });
  if (error) throw error;
  return data;
}

// ─── Apply promo code ────────────────────────────────────────────────────────
export async function validatePromoCode(code, subtotal) {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) throw new Error('Invalid or expired promo code');
  if (data.min_order_total && subtotal < data.min_order_total) {
    throw new Error(`Minimum order of $${data.min_order_total} required for this code`);
  }
  if (data.usage_limit && data.used_count >= data.usage_limit) {
    throw new Error('This promo code has reached its usage limit');
  }
  if (data.ends_at && new Date(data.ends_at) < new Date()) {
    throw new Error('This promo code has expired');
  }

  const discount =
    data.discount_type === 'percentage'
      ? +(subtotal * (data.discount_value / 100)).toFixed(2)
      : Math.min(data.discount_value, subtotal);

  return { promo: data, discount };
}
