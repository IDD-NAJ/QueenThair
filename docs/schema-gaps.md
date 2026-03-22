## Product Schema Constraint & Index Gaps

Source: `supabase/migrations/001_schema.sql`

This document tracks potential integrity and performance improvements for the product domain. Each item should eventually be addressed by a follow-up migration.

### 1. `product_images` ordering and primary image guarantees

- **Table**: `public.product_images`
- **Current state**:
  - No uniqueness constraint on (`product_id`, `sort_order`).
  - No constraint enforcing at most one `is_primary = true` per `product_id`.
- **Potential issues**:
  - Duplicate `sort_order` values can make ordering ambiguous.
  - Multiple `is_primary` images for a single product could break UI assumptions.
- **Proposed fix**:
  - Add a unique constraint on (`product_id`, `sort_order`).
  - Add a partial unique index on (`product_id`) `WHERE is_primary = true`.

### 2. `inventory.sku` uniqueness

- **Table**: `public.inventory`
- **Current state**:
  - `sku` is nullable and not constrained to be unique.
  - Business logic is likely to treat SKU as a unique identifier when present.
- **Potential issues**:
  - Multiple inventory rows could share the same `sku`, making lookups ambiguous.
- **Proposed fix**:
  - If SKU is expected to be unique when present, add a partial unique index on `sku` `WHERE sku IS NOT NULL`.

### 3. Derived product flags and secondary indexes

- **Table**: `public.products`
- **Current state**:
  - Helpful partial indexes already exist for `featured`, `new_arrival`, `best_seller`, `on_sale`, and `is_active`.
- **Potential additional needs**:
  - If listing pages filter heavily on combinations of flags (e.g., featured + active, on_sale + category), composite indexes could be considered after observing real query patterns.
- **Action**:
  - Defer until query patterns are measured; document any concrete needs as they arise.

### 4. `wishlist_items` and `cart_items` composite uniqueness

- **Tables**: `public.wishlist_items`, `public.cart_items`
- **Current state**:
  - `wishlist_items` has a unique constraint on (`wishlist_id`, `product_id`, `variant_id`) — OK.
  - `cart_items` has a unique constraint on (`cart_id`, `product_id`, `variant_id`) — OK.
- **Potential issues**:
  - None identified from the current schema; no extra constraints required.

### 5. Foreign key index completeness

- **Summary**:
  - `products.category_id`, `product_images.product_id`, `product_variants.product_id`, `inventory.product_id`, `inventory.variant_id`, `collection_products.collection_id`, `collection_products.product_id`, `reviews.product_id`, and other FK columns all have supporting indexes in `001_schema.sql`.
- **Potential issues**:
  - If future queries introduce frequent filters or joins on new FK columns, they should be indexed in follow-up migrations.

