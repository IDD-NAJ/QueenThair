import supabase from '../lib/supabaseClient';

// ─── Fetch approved reviews for a product ────────────────────────────────────
export async function getProductReviews(productId, { limit = 20, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from('reviews')
    .select('id, rating, title, body, reviewer_name, is_verified_purchase, created_at', { count: 'exact' })
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { reviews: data || [], total: count || 0 };
}

// ─── Submit a review ─────────────────────────────────────────────────────────
export async function submitReview({ productId, userId, orderId = null, rating, title, body, reviewerName }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id:    productId,
      user_id:       userId,
      order_id:      orderId,
      rating,
      title,
      body,
      reviewer_name: reviewerName,
      is_approved:   false, // requires admin approval
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Get rating summary for a product ────────────────────────────────────────
export async function getRatingSummary(productId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_approved', true);
  if (error) throw error;

  if (!data?.length) return { average: 0, count: 0, distribution: {} };

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
  const average = +(data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1);

  return { average, count: data.length, distribution: dist };
}

// ─── Admin: approve a review ──────────────────────────────────────────────────
export async function approveReview(reviewId) {
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_approved: true })
    .eq('id', reviewId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
