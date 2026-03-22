// Convenience wrapper around productService filtered to product_type = 'accessory'
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getSaleProducts,
} from './productService';

export const getAccessories         = (opts) => getProducts({ productType: 'accessory', ...opts });
export const getAccessoryBySlug     = (slug) => getProductBySlug(slug);
export const getAccessoryById       = (id)   => getProductById(id);
export const getFeaturedAccessories = (opts) => getFeaturedProducts({ productType: 'accessory', ...opts });
export const getNewAccessories      = (opts) => getNewArrivals({ productType: 'accessory', ...opts });
export const getBestSellerAccess    = (opts) => getBestSellers({ productType: 'accessory', ...opts });
export const getSaleAccessories     = (opts) => getSaleProducts({ productType: 'accessory', ...opts });
export const getAccessoriesByCat    = (categorySlug, opts) => getProducts({ productType: 'accessory', categorySlug, ...opts });
