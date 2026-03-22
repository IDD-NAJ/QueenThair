// Supabase Edge Function – send-email
// Sends transactional emails via Resend.
// Called by other edge functions (stripe-webhook, etc.) – never directly by the browser.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')!;
const DEFAULT_FROM    = Deno.env.get('DEFAULT_FROM_EMAIL') || 'QUEENTHAIR <hello@Queenthair.com>';
const SUPPORT_EMAIL   = Deno.env.get('SUPPORT_EMAIL')      || 'support@Queenthair.com';

const CORS = {
  'Access-Control-Allow-Origin':  Deno.env.get('SITE_URL') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { template, payload } = await req.json();
    const email = buildEmail(template, payload);
    if (!email) throw new Error(`Unknown email template: ${template}`);

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(email),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('[send-email]', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// ─── Template builder ─────────────────────────────────────────────────────────

interface EmailPayload {
  order?: Record<string, unknown>;
  trackingNumber?: string;
  carrier?: string;
  name?: string;
  email?: string;
}

function buildEmail(template: string, payload: EmailPayload) {
  switch (template) {
    case 'order_confirmation':
      return orderConfirmationEmail(payload.order as Record<string, unknown>);
    case 'shipping_update':
      return shippingUpdateEmail(payload.order as Record<string, unknown>, payload.trackingNumber!, payload.carrier!);
    case 'contact_ack':
      return contactAckEmail(payload.name!, payload.email!);
    case 'newsletter_welcome':
      return newsletterWelcomeEmail(payload.email!);
    default:
      return null;
  }
}

function orderConfirmationEmail(order: Record<string, unknown>) {
  const items   = (order.items as Array<Record<string, unknown>>) || [];
  const address = order.shipping_address_json as Record<string, unknown>;

  const itemRows = items.map((i) =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4">${i.product_name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;text-align:center">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;text-align:right">$${Number(i.unit_price).toFixed(2)}</td>
    </tr>`
  ).join('');

  return {
    from:    DEFAULT_FROM,
    to:      [order.email as string],
    subject: `Order Confirmed – ${order.order_number}`,
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf9f7;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#2c2c2c,#5c3a1e);padding:40px;text-align:center">
    <h1 style="color:#d4af7a;margin:0;font-size:24px;letter-spacing:2px">QUEENTHAIR</h1>
    <p style="color:#fff;margin:8px 0 0;font-size:14px">Your order is confirmed</p>
  </div>
  <div style="padding:40px">
    <h2 style="color:#2c2c2c;margin:0 0 8px">Thank you for your order!</h2>
    <p style="color:#6b6b6b;margin:0 0 24px">Order <strong>${order.order_number}</strong></p>

    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;padding:8px 0;border-bottom:2px solid #f0ece4;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888">Item</th>
        <th style="text-align:center;padding:8px 0;border-bottom:2px solid #f0ece4;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888">Qty</th>
        <th style="text-align:right;padding:8px 0;border-bottom:2px solid #f0ece4;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888">Price</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="margin-top:24px;padding-top:16px;border-top:2px solid #f0ece4">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#6b6b6b">Subtotal: $${Number(order.subtotal).toFixed(2)}</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#6b6b6b">Shipping: $${Number(order.shipping_total).toFixed(2)}</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#6b6b6b">Tax: $${Number(order.tax_total).toFixed(2)}</div>
      <div style="font-size:18px;font-weight:bold;color:#2c2c2c;margin-top:8px">Total: $${Number(order.grand_total).toFixed(2)}</div>
    </div>

    ${address ? `
    <div style="margin-top:32px;padding:20px;background:#faf9f7;border-radius:6px">
      <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888">Shipping To</h3>
      <p style="margin:0;color:#2c2c2c;line-height:1.6">${address.full_name}<br>${address.line1}${address.line2 ? ', ' + address.line2 : ''}<br>${address.city}, ${address.state_region} ${address.postal_code}</p>
    </div>` : ''}

    <p style="margin:32px 0 0;font-size:13px;color:#888">Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#d4af7a">${SUPPORT_EMAIL}</a></p>
  </div>
</div></body></html>`,
  };
}

function shippingUpdateEmail(order: Record<string, unknown>, trackingNumber: string, carrier: string) {
  return {
    from:    DEFAULT_FROM,
    to:      [order.email as string],
    subject: `Your order ${order.order_number} has shipped!`,
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf9f7;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#2c2c2c,#5c3a1e);padding:40px;text-align:center">
    <h1 style="color:#d4af7a;margin:0;font-size:24px;letter-spacing:2px">QUEENTHAIR</h1>
    <p style="color:#fff;margin:8px 0 0;font-size:14px">Your order is on its way!</p>
  </div>
  <div style="padding:40px">
    <h2 style="color:#2c2c2c;margin:0 0 8px">Your package is shipping</h2>
    <p style="color:#6b6b6b">Order <strong>${order.order_number}</strong></p>
    <div style="background:#faf9f7;border-radius:6px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px">Tracking Info</p>
      <p style="margin:0;font-size:16px;font-weight:bold;color:#2c2c2c">${carrier}: ${trackingNumber}</p>
    </div>
    <p style="color:#6b6b6b;font-size:14px">Your luxury hair is on its way. Estimated delivery: 5-7 business days.</p>
    <p style="margin:32px 0 0;font-size:13px;color:#888">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#d4af7a">${SUPPORT_EMAIL}</a></p>
  </div>
</div></body></html>`,
  };
}

function contactAckEmail(name: string, email: string) {
  return {
    from:    DEFAULT_FROM,
    to:      [email],
    subject: 'We received your message – QUEENTHAIR',
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf9f7;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#2c2c2c,#5c3a1e);padding:40px;text-align:center">
    <h1 style="color:#d4af7a;margin:0;font-size:24px;letter-spacing:2px">QUEENTHAIR</h1>
  </div>
  <div style="padding:40px">
    <h2 style="color:#2c2c2c">Hi ${name},</h2>
    <p style="color:#6b6b6b;line-height:1.7">Thank you for reaching out! We've received your message and our team will get back to you within 1-2 business days.</p>
    <p style="color:#6b6b6b;font-size:13px">– The QUEENTHAIR Team</p>
  </div>
</div></body></html>`,
  };
}

function newsletterWelcomeEmail(email: string) {
  return {
    from:    DEFAULT_FROM,
    to:      [email],
    subject: 'Welcome to the QUEENTHAIR family!',
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#faf9f7;margin:0;padding:0">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#2c2c2c,#5c3a1e);padding:40px;text-align:center">
    <h1 style="color:#d4af7a;margin:0;font-size:24px;letter-spacing:2px">QUEENTHAIR</h1>
    <p style="color:#fff;margin:8px 0 0">Welcome to the family!</p>
  </div>
  <div style="padding:40px;text-align:center">
    <h2 style="color:#2c2c2c">You're in!</h2>
    <p style="color:#6b6b6b;line-height:1.7">Thank you for subscribing. You'll be the first to know about new arrivals, exclusive offers, and luxury hair inspiration.</p>
    <a href="${Deno.env.get('SITE_URL')}/shop" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#d4af7a;color:#fff;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:1px">SHOP NOW</a>
  </div>
</div></body></html>`,
  };
}
