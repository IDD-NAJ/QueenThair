/**
 * Product domain models are framework- and persistence-agnostic.
 * They map 1:1 to DB schema in `supabase/migrations/001_schema.sql` plus a small
 * set of deterministic derived fields (documented below).
 */

/**
 * @typedef {Object} Category
 * @property {string} id - `categories.id`
 * @property {string} name - `categories.name`
 * @property {string} slug - `categories.slug`
 * @property {string|null|undefined} description - `categories.description`
 * @property {string|null|undefined} image_url - `categories.image_url`
 * @property {number} sort_order - `categories.sort_order`
 * @property {boolean} is_active - `categories.is_active`
 * @property {string} created_at - `categories.created_at` (timestamptz ISO string)
 * @property {string} updated_at - `categories.updated_at` (timestamptz ISO string)
 */

/**
 * @typedef {Object} ProductImage
 * @property {string} id - `product_images.id`
 * @property {string} product_id - `product_images.product_id`
 * @property {string} image_url - `product_images.image_url`
 * @property {string|null|undefined} alt_text - `product_images.alt_text`
 * @property {number} sort_order - `product_images.sort_order`
 * @property {boolean} is_primary - `product_images.is_primary`
 * @property {string|null|undefined} source - `product_images.source`
 * @property {string|null|undefined} photographer_name - `product_images.photographer_name`
 * @property {string|null|undefined} photographer_url - `product_images.photographer_url`
 * @property {string} created_at - `product_images.created_at` (timestamptz ISO string)
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} id - `product_variants.id`
 * @property {string} product_id - `product_variants.product_id`
 * @property {string|null|undefined} sku - `product_variants.sku`
 * @property {string|null|undefined} color - `product_variants.color`
 * @property {string|null|undefined} length - `product_variants.length`
 * @property {string|null|undefined} density - `product_variants.density`
 * @property {string|null|undefined} size - `product_variants.size`
 * @property {string|null|undefined} material - `product_variants.material`
 * @property {string|null|undefined} option_label - `product_variants.option_label`
 * @property {number|null|undefined} price_override - `product_variants.price_override`
 * @property {number|null|undefined} compare_at_price_override - `product_variants.compare_at_price_override`
 * @property {boolean} is_active - `product_variants.is_active`
 * @property {string} created_at - `product_variants.created_at` (timestamptz ISO string)
 * @property {string} updated_at - `product_variants.updated_at` (timestamptz ISO string)
 */

/**
 * @typedef {Object} Inventory
 * @property {string} id - `inventory.id`
 * @property {string} product_id - `inventory.product_id`
 * @property {string|null|undefined} variant_id - `inventory.variant_id`
 * @property {string|null|undefined} sku - `inventory.sku`
 * @property {number} quantity_available - `inventory.quantity_available`
 * @property {number} quantity_reserved - `inventory.quantity_reserved`
 * @property {number} low_stock_threshold - `inventory.low_stock_threshold`
 * @property {boolean} track_inventory - `inventory.track_inventory`
 * @property {boolean} allow_backorder - `inventory.allow_backorder`
 * @property {string} updated_at - `inventory.updated_at` (timestamptz ISO string)
 *
 * @property {number} available - Derived: `quantity_available - quantity_reserved` (never < 0 is not enforced by DB).
 * @property {boolean} inStock - Derived: `!track_inventory || allow_backorder || available > 0`.
 * @property {boolean} isLowStock - Derived: `available <= low_stock_threshold` when `track_inventory = true`.
 */

/**
 * @typedef {Object} Product
 * @property {string} id - `products.id`
 * @property {string} name - `products.name`
 * @property {string} slug - `products.slug`
 * @property {'wig'|'accessory'} product_type - `products.product_type`
 * @property {string|null|undefined} description - `products.description`
 * @property {string|null|undefined} short_description - `products.short_description`
 * @property {string|null|undefined} category_id - `products.category_id`
 * @property {number} base_price - `products.base_price`
 * @property {number|null|undefined} compare_at_price - `products.compare_at_price`
 * @property {boolean} featured - `products.featured`
 * @property {boolean} new_arrival - `products.new_arrival`
 * @property {boolean} best_seller - `products.best_seller`
 * @property {boolean} on_sale - `products.on_sale`
 * @property {string|null|undefined} badge - `products.badge`
 * @property {number} rating_average - `products.rating_average` (maintained by DB trigger)
 * @property {number} review_count - `products.review_count` (maintained by DB trigger)
 * @property {string|null|undefined} seo_title - `products.seo_title`
 * @property {string|null|undefined} seo_description - `products.seo_description`
 * @property {boolean} is_active - `products.is_active`
 * @property {string} created_at - `products.created_at` (timestamptz ISO string)
 * @property {string} updated_at - `products.updated_at` (timestamptz ISO string)
 *
 * @property {Category|null|undefined} category - Joined from `categories` (nullable since `category_id` is nullable)
 * @property {ProductImage[]} images - Joined from `product_images`, sorted by `sort_order`.
 * @property {ProductVariant[]} variants - Joined from `product_variants` (may be empty).
 * @property {Inventory|null|undefined} inventory - Joined from `inventory` where `variant_id IS NULL` for product-level inventory.
 *
 * @property {ProductImage|null} primaryImage - Derived: `images.find(is_primary) || images[0] || null`.
 * @property {number} imageCount - Derived: `images.length`.
 * @property {number} priceEffective - Derived: `base_price` (variant price overrides are applied at cart/selection time).
 */

export {};

