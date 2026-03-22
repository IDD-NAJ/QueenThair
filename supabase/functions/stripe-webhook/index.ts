// Supabase Edge Function – stripe-webhook
// Handles Stripe webhook events to update order state after payment.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

serve(async (req) => {
  const sig     = req.headers.get('stripe-signature');
  const secret  = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, secret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        // Acknowledge but ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  // Idempotency: skip if order already paid
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, cart_snapshot_json')
    .eq('stripe_payment_intent_id', pi.id)
    .maybeSingle();

  if (!order || order.status === 'paid') return;

  // ── Update order status ───────────────────────────────────────────────────
  await supabase
    .from('orders')
    .update({ status: 'paid', payment_status: 'paid' })
    .eq('id', order.id);

  // ── Write status event ────────────────────────────────────────────────────
  await supabase.from('order_status_events').insert({
    order_id: order.id,
    status:   'paid',
    message:  `Payment confirmed via Stripe (${pi.id})`,
  });

  // ── Decrement inventory (convert reserved → deducted) ─────────────────────
  const snapshot = order.cart_snapshot_json as Array<{ product: { id: string }; variant: { id: string } | null; quantity: number }>;
  if (snapshot?.length) {
    for (const item of snapshot) {
      await supabase.rpc('confirm_inventory_deduct', {
        p_product_id: item.product.id,
        p_variant_id: item.variant?.id ?? null,
        p_quantity:   item.quantity,
      });
    }
  }

  // ── Mark cart as converted ────────────────────────────────────────────────
  const cartId = pi.metadata?.cart_id;
  if (cartId) {
    await supabase.from('carts').update({ status: 'converted' }).eq('id', cartId);
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
  }

  // ── Trigger order confirmation email ─────────────────────────────────────
  try {
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', order.id)
      .single();

    await supabase.functions.invoke('send-email', {
      body: { template: 'order_confirmation', payload: { order: fullOrder } },
    });
  } catch (emailErr) {
    // Non-fatal: log but don't fail webhook
    console.error('[stripe-webhook] Email send failed:', emailErr);
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent_id', pi.id)
    .maybeSingle();

  if (!order) return;

  await supabase
    .from('orders')
    .update({ status: 'pending', payment_status: 'failed' })
    .eq('id', order.id);

  await supabase.from('order_status_events').insert({
    order_id: order.id,
    status:   'pending',
    message:  `Payment failed: ${pi.last_payment_error?.message ?? 'Unknown error'}`,
  });

  // Release reserved inventory
  const { data: orderData } = await supabase
    .from('orders')
    .select('cart_snapshot_json')
    .eq('id', order.id)
    .single();

  const snapshot = orderData?.cart_snapshot_json as Array<{ product: { id: string }; variant: { id: string } | null; quantity: number }>;
  if (snapshot?.length) {
    for (const item of snapshot) {
      await supabase.rpc('release_inventory_reservation', {
        p_product_id: item.product.id,
        p_variant_id: item.variant?.id ?? null,
        p_quantity:   item.quantity,
      });
    }
  }
}
