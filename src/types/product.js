// Frontend product models (UI-facing).
// These mirror the canonical DTOs but are tailored for React components.

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 */

/**
 * @typedef {Object} ProductImage
 * @property {string|undefined} id
 * @property {string} image_url
 * @property {string|null|undefined} alt_text
 * @property {number|undefined} sort_order
 * @property {boolean|undefined} is_primary
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} id
 * @property {string|null|undefined} sku
 * @property {string|null|undefined} color
 * @property {string|null|undefined} length
 * @property {string|null|undefined} density
 * @property {string|null|undefined} size
 * @property {string|null|undefined} option_label
 * @property {number|null|undefined} price_override
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} Inventory
 * @property {number} quantity_available
 * @property {number} quantity_reserved
 * @property {number} low_stock_threshold
 * @property {boolean} track_inventory
 * @property {boolean} allow_backorder
 * @property {number} available
 * @property {boolean} inStock
 * @property {boolean} isLowStock
 */

/**
 * @typedef {Object} ProductListItem
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {'wig'|'accessory'} product_type
 * @property {number} base_price
 * @property {number|null|undefined} compare_at_price
 * @property {boolean} featured
 * @property {boolean} new_arrival
 * @property {boolean} best_seller
 * @property {boolean} on_sale
 * @property {string|null|undefined} badge
 * @property {number} rating_average
 * @property {number} review_count
 * @property {string|null|undefined} short_description
 * @property {boolean} is_active
 * @property {Category|null|undefined} category
 * @property {ProductImage|null|undefined} primaryImage
 */

/**
 * @typedef {ProductListItem & {
 *   description?: string|null;
 *   seo_title?: string|null;
 *   seo_description?: string|null;
 *   images?: ProductImage[];
 *   variants?: ProductVariant[];
 *   inventory?: Inventory|null;
 * }} ProductDetail
 */

export {};

