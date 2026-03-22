/**
 * Image Service - Unified image sourcing from free stock photo APIs
 * Supports: Unsplash, Pexels, Pixabay
 * Priority: Unsplash → Pexels → Pixabay → Fallback URLs
 */

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'demo';
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || 'demo';
const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || 'demo';

// Fallback image URLs for when APIs are unavailable
const FALLBACK_IMAGES = {
  wig: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  'lace-front': 'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&q=80',
  'body-wave': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80',
  accessory: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80',
  bonnet: 'https://images.unsplash.com/photo-1583003870684-9e5b1e8b4b3f?w=800&q=80',
  brush: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80',
  hero: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=1600&q=80',
  model: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
};

/**
 * Search Unsplash for images
 */
export async function searchUnsplash(query, count = 5) {
  if (UNSPLASH_ACCESS_KEY === 'demo') {
    return null; // Skip if no API key
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    return data.results.map(photo => ({
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      alt: photo.alt_description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      source: 'unsplash',
      width: photo.width,
      height: photo.height,
    }));
  } catch (error) {
    console.warn('Unsplash API error:', error);
    return null;
  }
}

/**
 * Search Pexels for images
 */
export async function searchPexels(query, count = 5) {
  if (PEXELS_API_KEY === 'demo') {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    return data.photos.map(photo => ({
      url: photo.src.large,
      thumbnail: photo.src.medium,
      alt: query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      source: 'pexels',
      width: photo.width,
      height: photo.height,
    }));
  } catch (error) {
    console.warn('Pexels API error:', error);
    return null;
  }
}

/**
 * Search Pixabay for images
 */
export async function searchPixabay(query, count = 5) {
  if (PIXABAY_API_KEY === 'demo') {
    return null;
  }

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${count}&orientation=vertical`
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    return data.hits.map(photo => ({
      url: photo.largeImageURL,
      thumbnail: photo.webformatURL,
      alt: photo.tags,
      photographer: photo.user,
      photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
      source: 'pixabay',
      width: photo.imageWidth,
      height: photo.imageHeight,
    }));
  } catch (error) {
    console.warn('Pixabay API error:', error);
    return null;
  }
}

/**
 * Unified image search with fallback priority
 * Priority: Unsplash → Pexels → Pixabay → Fallback URLs
 */
export async function searchImages(query, count = 5) {
  // Try Unsplash first
  let results = await searchUnsplash(query, count);
  if (results && results.length > 0) {
    return results;
  }

  // Try Pexels
  results = await searchPexels(query, count);
  if (results && results.length > 0) {
    return results;
  }

  // Try Pixabay
  results = await searchPixabay(query, count);
  if (results && results.length > 0) {
    return results;
  }

  // Fallback to curated URLs
  return getFallbackImages(query, count);
}

/**
 * Get fallback images when APIs are unavailable
 */
function getFallbackImages(query, count = 5) {
  const queryLower = query.toLowerCase();
  
  // Match query to fallback category
  let fallbackUrl = FALLBACK_IMAGES.default;
  
  if (queryLower.includes('lace') || queryLower.includes('front')) {
    fallbackUrl = FALLBACK_IMAGES['lace-front'];
  } else if (queryLower.includes('wave') || queryLower.includes('body')) {
    fallbackUrl = FALLBACK_IMAGES['body-wave'];
  } else if (queryLower.includes('wig') || queryLower.includes('hair')) {
    fallbackUrl = FALLBACK_IMAGES.wig;
  } else if (queryLower.includes('bonnet') || queryLower.includes('cap')) {
    fallbackUrl = FALLBACK_IMAGES.bonnet;
  } else if (queryLower.includes('brush') || queryLower.includes('comb')) {
    fallbackUrl = FALLBACK_IMAGES.brush;
  } else if (queryLower.includes('hero') || queryLower.includes('banner')) {
    fallbackUrl = FALLBACK_IMAGES.hero;
  } else if (queryLower.includes('model') || queryLower.includes('portrait')) {
    fallbackUrl = FALLBACK_IMAGES.model;
  } else if (queryLower.includes('accessory') || queryLower.includes('tool')) {
    fallbackUrl = FALLBACK_IMAGES.accessory;
  }

  // Return array of fallback images
  return Array(count).fill(null).map((_, index) => ({
    url: fallbackUrl,
    thumbnail: fallbackUrl,
    alt: query,
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
    source: 'fallback',
    width: 800,
    height: 1200,
  }));
}

/**
 * Category-specific image queries
 */
export const IMAGE_QUERIES = {
  // Wig categories
  'full-lace-wigs': 'luxury lace front wig black woman',
  'lace-front-wigs': 'lace front wig model portrait',
  '360-lace-wigs': '360 lace wig hairstyle',
  'u-part-wigs': 'u part wig natural hair',
  'headband-wigs': 'headband wig casual style',
  'closures-frontals': 'hair closure lace frontal',
  
  // Accessory categories
  'bonnets-caps': 'silk bonnet hair care',
  'combs-brushes': 'hair brush comb styling tools',
  'wig-caps': 'wig cap liner mesh',
  'styling-products': 'hair styling products luxury',
  'adhesives': 'wig adhesive glue spray',
  'storage-care': 'wig stand storage mannequin',
  'hair-clips': 'hair clips accessories styling',
  
  // Collections
  'new-arrivals': 'luxury hair model fashion portrait',
  'best-sellers': 'premium hair wig elegant woman',
  'sale': 'hair sale promotion beauty',
  
  // General
  'hero': 'luxury black woman beauty portrait hair',
  'banner': 'high fashion hair editorial model',
  'default-wig': 'human hair wig natural black',
  'default-accessory': 'hair styling tools accessories',
};

/**
 * Get optimized image URL with size parameters
 */
export function getOptimizedImageUrl(url, width = 800, quality = 80) {
  if (!url) return null;
  
  // Unsplash optimization
  if (url.includes('unsplash.com')) {
    return `${url}&w=${width}&q=${quality}&auto=format&fit=crop`;
  }
  
  // Pexels optimization
  if (url.includes('pexels.com')) {
    return `${url}?auto=compress&cs=tinysrgb&w=${width}`;
  }
  
  // Pixabay - already optimized
  if (url.includes('pixabay.com')) {
    return url;
  }
  
  return url;
}

/**
 * Get images for a specific product category
 */
export async function getProductImages(categorySlug, count = 1) {
  const query = IMAGE_QUERIES[categorySlug] || IMAGE_QUERIES['default-wig'];
  return await searchImages(query, count);
}

/**
 * Get images for accessories
 */
export async function getAccessoryImages(categorySlug, count = 1) {
  const query = IMAGE_QUERIES[categorySlug] || IMAGE_QUERIES['default-accessory'];
  return await searchImages(query, count);
}

/**
 * Get hero/banner images
 */
export async function getHeroImages(count = 3) {
  return await searchImages(IMAGE_QUERIES.hero, count);
}

/**
 * Validate image URL
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get fallback image for broken images
 */
export function getFallbackImage(type = 'default') {
  return FALLBACK_IMAGES[type] || FALLBACK_IMAGES.default;
}

export default {
  searchImages,
  searchUnsplash,
  searchPexels,
  searchPixabay,
  getProductImages,
  getAccessoryImages,
  getHeroImages,
  getOptimizedImageUrl,
  isValidImageUrl,
  getFallbackImage,
  IMAGE_QUERIES,
};
