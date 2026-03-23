import { env } from '../lib/env';
import { ApiError } from './errors';

const BASE_URL = `${env.supabaseUrl}/functions/v1`;
const USE_V2 = env.productApiV2;

async function request(path, params = {}) {
  const url = new URL(`${BASE_URL}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      url.searchParams.set(key, value.join(','));
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json().catch(() => null);

  if (!body || typeof body !== 'object' || !('data' in body) || !('meta' in body) || !('error' in body)) {
    throw new ApiError('INVALID_ENVELOPE', 'Unexpected response shape from product API', { status: res.status, body });
  }

  if (body.error) {
    throw new ApiError(body.error.code || 'API_ERROR', body.error.message || 'Product API error', {
      status: res.status,
      details: body.error.details,
    });
  }

  return body;
}

// ---- Public API --------------------------------------------------------------

/**
 * @param {string} id
 * @param {{ include?: string[] }} options
 * @returns {Promise<import('../types/product').ProductDetail>}
 */
export async function getProduct(id, options = {}) {
  // ALWAYS use legacy path - V2 edge functions don't exist
  const { getProductById } = await import('../services/productService');
  const product = await getProductById(id);
  return /** @type {import('../types/product').ProductDetail} */ (product);
}

/**
 * @param {{ productType?: 'wig'|'accessory'; categorySlug?: string; featured?: boolean; newArrival?: boolean; bestSeller?: boolean; onSale?: boolean; minPrice?: number; maxPrice?: number }} filters
 * @param {{ page?: number; pageSize?: number }} pagination
 * @param {{ include?: string[] }} options
 * @returns {Promise<{ items: import('../types/product').ProductListItem[]; total: number; page: number; pageSize: number }>}
 */
export async function listProducts(filters = {}, pagination = {}, options = {}) {
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 20;

  // Legacy path: use `productService.getProducts` directly
  if (!USE_V2) {
    const { getProducts } = await import('../services/productService');

    const { products, total } = await getProducts({
      productType: filters.productType,
      categorySlug: filters.categorySlug,
      featured: filters.featured,
      newArrival: filters.newArrival,
      bestSeller: filters.bestSeller,
      onSale: filters.onSale,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      items: /** @type {import('../types/product').ProductListItem[]} */ (products || []),
      total: total || 0,
      page,
      pageSize,
    };
  }

  const include = options.include || ['images', 'category'];
  const { data, meta } = await request('list-products', {
    ...filters,
    include,
    page,
    pageSize,
  });

  return {
    items: /** @type {import('../types/product').ProductListItem[]} */ (data || []),
    total: meta.total || 0,
    page: meta.page || 1,
    pageSize: meta.pageSize || 20,
  };
}

/**
 * @param {string} query
 * @param {{ productType?: 'wig'|'accessory' }} filters
 * @param {{ page?: number; pageSize?: number }} pagination
 * @returns {Promise<{ items: import('../types/product').ProductListItem[]; total: number; page: number; pageSize: number }>}
 */
export async function searchProducts(query, filters = {}, pagination = {}) {
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 20;

  // Legacy path: use `searchService.searchProducts`
  if (!USE_V2) {
    const { searchProducts: legacySearch } = await import('../services/searchService');
    const { products, total } = await legacySearch(query, {
      productType: filters.productType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      items: /** @type {import('../types/product').ProductListItem[]} */ (products || []),
      total: total || 0,
      page,
      pageSize,
    };
  }

  const { data, meta } = await request('search-products', {
    q: query,
    productType: filters.productType,
    page,
    pageSize,
    include: ['images', 'category'],
  });

  return {
    items: /** @type {import('../types/product').ProductListItem[]} */ (data || []),
    total: meta.total || 0,
    page: meta.page || 1,
    pageSize: meta.pageSize || 20,
  };
}

