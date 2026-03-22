// Supabase Edge Function – create-checkout-session
// Creates a Stripe Payment Intent + pending order record atomically.
// Uses service_role key so it can bypass RLS to write orders.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CORS = {
  'Access-Control-Allow-Origin':  Deno.env.get('SITE_URL') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const {
      cartId,
      userId,         // null for guests
      email,
      phone,
      shippingAddress,
      billingAddress,
      shippingOption,  // { id, name, price }
      promoCode,
      currency = 'USD',
    } = await req.json();

    // ── 1. Load cart items ────────────────────────────────────────────────
    const { data: cartItems, error: ciErr } = await supabase
      .from('cart_items')
      .select(`
        id, quantity, unit_price,
        product:products(id, name, slug, is_active),
        variant:product_variants(id, sku, color, length, density, price_override)
      `)
      .eq('cart_id', cartId);

    if (ciErr || !cartItems?.length) throw new Error('Cart is empty or not found');

    // ── 2. Validate each item ─────────────────────────────────────────────
    for (const item of cartItems) {
      if (!item.product?.is_active) throw new Error(`Product "${item.product?.name}" is no longer available`);

      const { data: inv } = await supabase
        .from('inventory')
        .select('quantity_available, quantity_reserved, track_inventory, allow_backorder')
        .eq('product_id', item.product.id)
        .is('variant_id', item.variant?.id ?? null)
        .maybeSingle();

      if (inv?.track_inventory && !inv?.allow_backorder) {
        const avail = inv.quantity_available - inv.quantity_reserved;
        if (avail < item.quantity) throw new Error(`"${item.product.name}" has only ${avail} in stock`);
      }
    }

    // ── 3. Calculate totals ───────────────────────────────────────────────
    const subtotal = cartItems.reduce((s, i) => {
      const price = i.variant?.price_override ?? i.unit_price;
      return s + price * i.quantity;
    }, 0);

    let discountTotal = 0;
    let appliedPromo  = null;

    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (promo && (!promo.min_order_total || subtotal >= promo.min_order_total)) {
        discountTotal = promo.discount_type === 'percentage'
          ? +(subtotal * promo.discount_value / 100).toFixed(2)
          : Math.min(promo.discount_value, subtotal);
        appliedPromo = promo;
      }
    }

    const shippingTotal = shippingOption?.price ?? 0;
    const TAX_RATE      = 0.08;
    const taxableAmount = subtotal - discountTotal + shippingTotal;
    const taxTotal      = +(taxableAmount * TAX_RATE).toFixed(2);
    const grandTotal    = +(taxableAmount + taxTotal).toFixed(2);

    // ── 4. Create Stripe Payment Intent ───────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(grandTotal * 100), // cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { cart_id: cartId, user_id: userId ?? 'guest', email },
    });

    // ── 5. Create pending order ───────────────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:                  userId ?? null,
        email:                    email.toLowerCase(),
        phone:                    phone ?? null,
        status:                   'pending',
        payment_status:           'pending',
        fulfillment_status:       'unfulfilled',
        currency,
        subtotal:                 +subtotal.toFixed(2),
        discount_total:           discountTotal,
        shipping_total:           shippingTotal,
        tax_total:                taxTotal,
        grand_total:              grandTotal,
        shipping_address_json:    shippingAddress,
        billing_address_json:     billingAddress ?? shippingAddress,
        stripe_payment_intent_id: paymentIntent.id,
        promo_code:               appliedPromo?.code ?? null,
        cart_snapshot_json:       cartItems,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    // ── 6. Create order items ─────────────────────────────────────────────
    const orderItems = cartItems.map(item => ({
      order_id:     order.id,
      product_id:   item.product.id,
      variant_id:   item.variant?.id ?? null,
      product_name: item.product.name,
      sku:          item.variant?.sku ?? item.product.id,
      unit_price:   item.variant?.price_override ?? item.unit_price,
      quantity:     item.quantity,
      line_total:   +((item.variant?.price_override ?? item.unit_price) * item.quantity).toFixed(2),
      snapshot_json: { product: item.product, variant: item.variant },
    }));

    await supabase.from('order_items').insert(orderItems);

    // ── 7. Write initial status event ────────────────────────────────────
    await supabase.from('order_status_events').insert({
      order_id: order.id,
      status:   'pending',
      message:  'Order created, awaiting payment',
    });

    // ── 8. Reserve inventory ─────────────────────────────────────────────
    for (const item of cartItems) {
      await supabase.rpc('reserve_inventory', {
        p_product_id: item.product.id,
        p_variant_id: item.variant?.id ?? null,
        p_quantity:   item.quantity,
      });
    }

    // ── 9. Increment promo usage ──────────────────────────────────────────
    if (appliedPromo) {
      await supabase
        .from('promo_codes')
        .update({ used_count: appliedPromo.used_count + 1 })
        .eq('id', appliedPromo.id);
    }

    return new Response(
      JSON.stringify({
        clientSecret:  paymentIntent.client_secret,
        orderId:       order.id,
        orderNumber:   order.order_number,
        grandTotal,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('[create-checkout-session]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Checkout failed' }),
      { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
