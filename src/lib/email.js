// Email provider config – Resend is called only from Edge Functions / server.
// This module exports helpers that call the Supabase Edge Function endpoints
// so no API key is ever in the browser bundle.

import supabase from './supabaseClient';

export const emailProvider = 'resend';

/**
 * Trigger a transactional email via Edge Function.
 * @param {'order_confirmation'|'shipping_update'|'contact_ack'|'newsletter_welcome'} template
 * @param {object} payload  – template-specific data
 */
export async function sendTransactionalEmail(template, payload) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { template, payload },
  });
  if (error) throw error;
  return data;
}
