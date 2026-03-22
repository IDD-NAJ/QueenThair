/** Slug segment from a storefront path like `/shop/lace-front-wigs`. */
export function slugFromShopHref(href) {
  if (!href || typeof href !== 'string') return '';
  const path = href.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const m = path.match(/\/shop\/([^/]+)$/i);
  return m ? decodeURIComponent(m[1]).trim().toLowerCase() : '';
}

export function isLikelyHttpUrl(s) {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim();
  if (!t) return false;
  return (
    t.startsWith('https://') ||
    t.startsWith('http://') ||
    t.startsWith('/') ||
    t.startsWith('data:')
  );
}

/**
 * Merge admin card fields with live `categories` row (image) when the card links to `/shop/:slug`.
 */
export function resolveShowcaseTileMedia(item, categories) {
  const slug = ((item.slug || slugFromShopHref(item.href || '')) || '').toLowerCase();
  const cat =
    slug && Array.isArray(categories)
      ? categories.find((c) => (c.slug || '').toLowerCase() === slug)
      : null;

  const image =
    (typeof item.image_url === 'string' && item.image_url.trim()) ||
    (cat?.image_url && String(cat.image_url).trim()) ||
    '';

  const video = typeof item.video_url === 'string' ? item.video_url.trim() : '';

  return { imageUrl: image, videoUrl: video, slug };
}
