## Canonical Product API Contracts

This document defines the canonical product DTOs, response envelope, and `include=` contract used by **all** product-related endpoints going forward.

> Sources: DB schema in `supabase/migrations/001_schema.sql` and canonical DTO schemas in `src/domain/product-dtos.js`.

---

## Canonical Response Envelope

All product endpoints must respond with:

```json
{
  "data": {},
  "meta": { "total": 100, "page": 1, "pageSize": 20 },
  "error": null
}
```

- **`data`**: DTO payload (object or array)
- **`meta`**: pagination/aux info; omit fields that do not apply
- **`error`**: `null` on success, otherwise:
  - `{ "code": "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "INTERNAL", "message": "…", "details": any }`

---

## `include=` Contract

Endpoints that return products accept an optional query parameter:

- **`include`**: comma-separated list of relations  
  Example: `include=images,variants,inventory,category`

Supported values:

- `images`
- `variants`
- `inventory`
- `category`
- `reviews` (summary fields only; does not include full review bodies)
- `collections`

### Always-present vs gated fields

- **Always present (public list/detail)**:
  - Core product fields from `products`
  - Rating summary: `rating_average`, `review_count`
  - Badge/flags: `featured`, `new_arrival`, `best_seller`, `on_sale`, `badge`
  - `category` is **optional** by default; if not included, may be omitted or `null` depending on endpoint.
- **Gated behind `include=`**:
  - `images`: `images[]`, `primaryImage`
  - `variants`: `variants[]`
  - `inventory`: `inventory` (product-level inventory where `variant_id IS NULL`)
  - `category`: `category`
  - `collections`: `collections[]` (when implemented)

---

## DTO Definitions

### `ProductListItemDTO`

Used for catalog/grid/listing views only.

Fields (canonical):

- `id`, `name`, `slug`, `product_type`
- `base_price`, `compare_at_price?`
- `featured`, `new_arrival`, `best_seller`, `on_sale`, `badge?`
- `rating_average`, `review_count`
- `short_description?`
- `is_active`
- `category?` (optional, when `include=category`)
- `primaryImage?` (optional, when `include=images`)

### `ProductDetailDTO`

Used for product detail pages.

Extends `ProductListItemDTO` with:

- `description?`
- `seo_title?`, `seo_description?`
- `images?` (when `include=images`)
- `variants?` (when `include=variants`)
- `inventory?` (when `include=inventory`)

### `ProductAdminDTO`

Used for admin pages.

Extends `ProductDetailDTO` with:

- `category_id?`
- `created_at?`, `updated_at?`

---

## Field Mapping Notes

### Price fields

- DB fields are snake_case (`base_price`, `compare_at_price`).
- **Canonical DTOs remain snake_case** to match DB schema and current Supabase query shapes.
- Frontend models may add convenience aliases (e.g., `price`) but must remain mapped explicitly in the centralized API client.

### Image fields

- Canonical `ProductImageDTO` uses DB names (`image_url`, `alt_text`, `sort_order`, `is_primary`).
- `primaryImage` is derived deterministically as:
  - first image where `is_primary = true`, else first by `sort_order`, else `null`.

