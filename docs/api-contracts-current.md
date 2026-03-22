## Current Product API Contracts (Baseline)

This project currently uses **Supabase client-side queries** (`@supabase/supabase-js`) as the effective API for product data. There are **no product-specific HTTP edge function endpoints** yet; instead, the UI calls Supabase tables directly via `src/services/productService.js` and `src/services/categoryService.js`.

This document captures the *current* shapes and flows so we can preserve compatibility while migrating to canonical DTOs/envelopes.

---

## Current “Endpoints” (Supabase queries)

### `getProductBySlug(slug)`

- **Handler**: `src/services/productService.js` → `getProductBySlug`
- **Supabase query**: `products.select(PRODUCT_SELECT).eq('slug', slug).eq('is_active', true).single()`
- **Select shape**: `PRODUCT_SELECT` (current join graph)
  - product columns: `id, name, slug, product_type, base_price, compare_at_price, featured, new_arrival, best_seller, on_sale, badge, rating_average, review_count, short_description, description, seo_title, seo_description, is_active`
  - category join: `category:categories(id, name, slug)`
  - images join: `images:product_images(image_url, alt_text, sort_order, is_primary)`
  - variants join: `variants:product_variants(id, sku, color, length, density, size, option_label, price_override, is_active)`
  - inventory join: `inventory(quantity_available, quantity_reserved, low_stock_threshold, track_inventory, allow_backorder)`
- **Normalization** (current behavior): `normalizeProduct()` adds:
  - `images` sorted by `sort_order`
  - `primaryImage` derived from `images`
  - `price` alias of `base_price`
  - `compareAtPrice` alias of `compare_at_price`
- **Consumer**: `src/pages/ProductPage.jsx`
  - Uses: `images[].image_url/alt_text`, `variants[]`, `inventory.quantity_available`, `base_price`, `compare_at_price`, `rating_average`, `review_count`, `short_description`, `description`, `category.slug`.
  - Also triggers a second call for “related products” via `getProducts({ categorySlug, limit: 5 })`.

### `getProducts(filters)`

- **Handler**: `src/services/productService.js` → `getProducts`
- **Supabase query**: `products.select(PRODUCT_SELECT, { count: 'exact' }).eq('is_active', true)` plus filters
  - Optional filter: `product_type`, `featured`, `new_arrival`, `best_seller`, `on_sale`
  - Optional price range: `gte('base_price', minPrice)`, `lte('base_price', maxPrice)`
  - Optional category: **extra call** to `categories` by slug, then `eq('category_id', cat.id)`
  - Optional search: `textSearch('name', search, { type: 'websearch' })`
  - Sorting: `created_at`, `base_price`, `rating_average`, `review_count`, or featured+created_at default
  - Pagination: `.range(offset, offset + limit - 1)`
  - Client-side variant filters (color/length/density) after fetch
- **Return shape (today)**: `{ products, total }`
  - **Note**: Call sites are inconsistent: some expect `result.data` (legacy shape), others expect `{ products, total }`.
- **Consumers**:
  - `src/pages/ShopPage.jsx` (expects `result.data || []` today, which is a mismatch)
  - `src/pages/admin/AdminProducts.jsx` (expects `productsData.data || []` today, which is a mismatch)

### `getCategories({ activeOnly })`

- **Handler**: `src/services/categoryService.js` → `getCategories`
- **Supabase query**: `categories.select('*').order('sort_order').eq('is_active', true)` (default)
- **Consumers**: `ShopPage`, `AdminProducts`

---

## Current Write Flows (Admin)

### Create/Update Product (multi-call, non-transactional)

- **Handler**: `src/pages/admin/AdminProducts.jsx`
- **Writes**:
  - `products.insert(...)` or `products.update(...)`
  - Optional `product_images.insert(...)` for uploaded image
  - If editing: `product_variants.delete().eq('product_id', productId)` then `product_variants.insert(...)`
  - If creating: `inventory.insert(...)` (product-level inventory)
- **Issues**:
  - Not wrapped in a DB transaction.
  - Potential partial writes if any step fails.
  - No optimistic locking on updates.

