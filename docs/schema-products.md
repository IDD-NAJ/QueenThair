## Product Domain Schema (Supabase / Postgres)

This document summarizes the core product-related tables defined in `supabase/migrations/001_schema.sql`. It is the canonical reference for the product domain schema.

> Source: `supabase/migrations/001_schema.sql`

---

## Tables Overview

- `public.categories`
- `public.collections`
- `public.products`
- `public.product_images`
- `public.product_variants`
- `public.inventory`
- `public.collection_products`
- `public.reviews`
- `public.wishlists`
- `public.wishlist_items`
- `public.carts`
- `public.cart_items`
- `public.orders`
- `public.order_items`

---

## Table: `public.categories`

**Purpose**: Top-level product categories used for navigation and filtering.

| Column       | Type      | Null | Default              | Constraints                         |
|-------------|-----------|------|----------------------|-------------------------------------|
| `id`        | `uuid`    | NO   | `gen_random_uuid()` | **PK**                              |
| `name`      | `text`    | NO   |                      |                                     |
| `slug`      | `text`    | NO   |                      | **UNIQUE**                          |
| `description` | `text`  | YES  |                      |                                     |
| `image_url` | `text`    | YES  |                      |                                     |
| `sort_order`| `int`     | NO   | `0`                  |                                     |
| `is_active` | `boolean` | NO   | `true`               |                                     |
| `created_at`| `timestamptz` | NO | `now()`            |                                     |
| `updated_at`| `timestamptz` | NO | `now()`            | trigger `trg_categories_updated_at` |

**Indexes**
- `idx_categories_slug` on (`slug`)

---

## Table: `public.collections`

**Purpose**: Marketing collections such as “New Arrivals”, “Best Sellers”, “Sale”.

| Column           | Type        | Null | Default              | Constraints                         |
|------------------|-------------|------|----------------------|-------------------------------------|
| `id`             | `uuid`      | NO   | `gen_random_uuid()` | **PK**                              |
| `name`           | `text`      | NO   |                      |                                     |
| `slug`           | `text`      | NO   |                      | **UNIQUE**                          |
| `description`    | `text`      | YES  |                      |                                     |
| `image_url`      | `text`      | YES  |                      |                                     |
| `banner_url`     | `text`      | YES  |                      |                                     |
| `seo_title`      | `text`      | YES  |                      |                                     |
| `seo_description`| `text`      | YES  |                      |                                     |
| `featured`       | `boolean`   | NO   | `false`              |                                     |
| `is_active`      | `boolean`   | NO   | `true`               |                                     |
| `created_at`     | `timestamptz` | NO | `now()`             |                                     |
| `updated_at`     | `timestamptz` | NO | `now()`             | trigger `trg_collections_updated_at`|

**Indexes**
- `idx_collections_slug` on (`slug`)
- `idx_collections_featured` on (`featured`)

---

## Table: `public.products`

**Purpose**: Core product catalog records.

| Column             | Type                | Null | Default              | Constraints                                                   |
|--------------------|---------------------|------|----------------------|---------------------------------------------------------------|
| `id`               | `uuid`              | NO   | `gen_random_uuid()` | **PK**                                                        |
| `name`             | `text`              | NO   |                      |                                                               |
| `slug`             | `text`              | NO   |                      | **UNIQUE**                                                    |
| `description`      | `text`              | YES  |                      |                                                               |
| `short_description`| `text`              | YES  |                      |                                                               |
| `product_type`     | `product_type` enum | NO   | `'wig'`              | values: `'wig'`, `'accessory'`                               |
| `category_id`      | `uuid`              | YES  |                      | FK → `categories(id)` `ON DELETE SET NULL`                    |
| `base_price`       | `numeric(10,2)`     | NO   |                      |                                                               |
| `compare_at_price` | `numeric(10,2)`     | YES  |                      |                                                               |
| `featured`         | `boolean`           | NO   | `false`              |                                                               |
| `new_arrival`      | `boolean`           | NO   | `false`              |                                                               |
| `best_seller`      | `boolean`           | NO   | `false`              |                                                               |
| `on_sale`          | `boolean`           | NO   | `false`              |                                                               |
| `badge`            | `text`              | YES  |                      |                                                               |
| `rating_average`   | `numeric(3,2)`      | NO   | `0`                  | auto-maintained by `refresh_product_rating()` trigger         |
| `review_count`     | `int`               | NO   | `0`                  | auto-maintained by `refresh_product_rating()` trigger         |
| `seo_title`        | `text`              | YES  |                      |                                                               |
| `seo_description`  | `text`              | YES  |                      |                                                               |
| `is_active`        | `boolean`           | NO   | `true`               |                                                               |
| `created_at`       | `timestamptz`       | NO   | `now()`              |                                                               |
| `updated_at`       | `timestamptz`       | NO   | `now()`              | trigger `trg_products_updated_at`                             |

**Indexes**
- `idx_products_slug` on (`slug`)
- `idx_products_type` on (`product_type`)
- `idx_products_category` on (`category_id`)
- `idx_products_featured` on (`featured`) `WHERE featured = true`
- `idx_products_new_arrival` on (`new_arrival`) `WHERE new_arrival = true`
- `idx_products_best_seller` on (`best_seller`) `WHERE best_seller = true`
- `idx_products_on_sale` on (`on_sale`) `WHERE on_sale = true`
- `idx_products_active` on (`is_active`) `WHERE is_active = true`
- `idx_products_rating` on (`rating_average DESC`)  
- `idx_products_fts` GIN index on `to_tsvector('english', name + short_description)` for full-text search

---

## Table: `public.product_images`

**Purpose**: Store product gallery and primary images.

| Column            | Type        | Null | Default              | Constraints                                      |
|-------------------|-------------|------|----------------------|--------------------------------------------------|
| `id`              | `uuid`      | NO   | `gen_random_uuid()` | **PK**                                           |
| `product_id`      | `uuid`      | NO   |                      | FK → `products(id)` `ON DELETE CASCADE`          |
| `image_url`       | `text`      | NO   |                      |                                                  |
| `alt_text`        | `text`      | YES  |                      |                                                  |
| `sort_order`      | `int`       | NO   | `0`                  |                                                  |
| `is_primary`      | `boolean`   | NO   | `false`              |                                                  |
| `source`          | `text`      | YES  |                      |                                                  |
| `photographer_name` | `text`    | YES  |                      |                                                  |
| `photographer_url`  | `text`    | YES  |                      |                                                  |
| `created_at`      | `timestamptz` | NO | `now()`             |                                                  |

**Indexes**
- `idx_product_images_product_id` on (`product_id`)
- `idx_product_images_primary` on (`product_id`, `is_primary`) `WHERE is_primary = true`

---

## Table: `public.product_variants`

**Purpose**: Store purchasable variants/options for a product.

| Column                     | Type            | Null | Default              | Constraints                                      |
|----------------------------|-----------------|------|----------------------|--------------------------------------------------|
| `id`                       | `uuid`          | NO   | `gen_random_uuid()` | **PK**                                           |
| `product_id`               | `uuid`          | NO   |                      | FK → `products(id)` `ON DELETE CASCADE`          |
| `sku`                      | `text`          | YES  |                      | **UNIQUE**                                       |
| `color`                    | `text`          | YES  |                      |                                                  |
| `length`                   | `text`          | YES  |                      |                                                  |
| `density`                  | `text`          | YES  |                      |                                                  |
| `size`                     | `text`          | YES  |                      |                                                  |
| `material`                 | `text`          | YES  |                      |                                                  |
| `option_label`             | `text`          | YES  |                      |                                                  |
| `price_override`           | `numeric(10,2)` | YES  |                      |                                                  |
| `compare_at_price_override`| `numeric(10,2)` | YES  |                      |                                                  |
| `is_active`                | `boolean`       | NO   | `true`               |                                                  |
| `created_at`               | `timestamptz`   | NO   | `now()`              |                                                  |
| `updated_at`               | `timestamptz`   | NO   | `now()`              | trigger `trg_variants_updated_at`                |

**Indexes**
- `idx_variants_product_id` on (`product_id`)
- `idx_variants_sku` on (`sku`)

---

## Table: `public.inventory`

**Purpose**: Track per-product or per-variant stock levels.

| Column              | Type        | Null | Default              | Constraints                                                   |
|---------------------|-------------|------|----------------------|---------------------------------------------------------------|
| `id`                | `uuid`      | NO   | `gen_random_uuid()` | **PK**                                                        |
| `product_id`        | `uuid`      | NO   |                      | FK → `products(id)` `ON DELETE CASCADE`                       |
| `variant_id`        | `uuid`      | YES  |                      | FK → `product_variants(id)` `ON DELETE CASCADE`               |
| `sku`               | `text`      | YES  |                      |                                                               |
| `quantity_available`| `int`       | NO   | `0`                  |                                                               |
| `quantity_reserved` | `int`       | NO   | `0`                  |                                                               |
| `low_stock_threshold`| `int`      | NO   | `5`                  |                                                               |
| `track_inventory`   | `boolean`   | NO   | `true`               |                                                               |
| `allow_backorder`   | `boolean`   | NO   | `false`              |                                                               |
| `updated_at`        | `timestamptz` | NO | `now()`             | trigger `trg_inventory_updated_at`                            |
| *(composite)*       |             |      |                      | **UNIQUE** (`product_id`, `variant_id`)                       |

**Indexes**
- `idx_inventory_product_id` on (`product_id`)
- `idx_inventory_variant_id` on (`variant_id`)

---

## Table: `public.collection_products`

**Purpose**: Join table linking products to collections.

| Column         | Type   | Null | Default              | Constraints                                        |
|----------------|--------|------|----------------------|----------------------------------------------------|
| `id`           | `uuid` | NO   | `gen_random_uuid()` | **PK**                                             |
| `collection_id`| `uuid` | NO   |                      | FK → `collections(id)` `ON DELETE CASCADE`         |
| `product_id`   | `uuid` | NO   |                      | FK → `products(id)` `ON DELETE CASCADE`            |
| `sort_order`   | `int`  | NO   | `0`                  |                                                    |
| *(composite)*  |        |      |                      | **UNIQUE** (`collection_id`, `product_id`)         |

**Indexes**
- `idx_col_products_collection` on (`collection_id`)
- `idx_col_products_product` on (`product_id`)

---

## Table: `public.reviews`

**Purpose**: Customer product reviews feeding rating aggregates on `products`.

| Column               | Type        | Null | Default              | Constraints                                      |
|----------------------|-------------|------|----------------------|--------------------------------------------------|
| `id`                 | `uuid`      | NO   | `gen_random_uuid()` | **PK**                                           |
| `product_id`         | `uuid`      | NO   |                      | FK → `products(id)` `ON DELETE CASCADE`          |
| `user_id`            | `uuid`      | YES  |                      | FK → `profiles(id)` `ON DELETE SET NULL`         |
| `order_id`           | `uuid`      | YES  |                      | FK → `orders(id)` `ON DELETE SET NULL`           |
| `rating`             | `int`       | NO   |                      | `CHECK (rating BETWEEN 1 AND 5)`                 |
| `title`              | `text`      | YES  |                      |                                                  |
| `body`               | `text`      | YES  |                      |                                                  |
| `reviewer_name`      | `text`      | YES  |                      |                                                  |
| `is_verified_purchase`| `boolean`  | NO   | `false`              |                                                  |
| `is_approved`        | `boolean`   | NO   | `false`              |                                                  |
| `created_at`         | `timestamptz` | NO | `now()`             |                                                  |
| `updated_at`         | `timestamptz` | NO | `now()`             | trigger `trg_reviews_updated_at`                 |

**Indexes**
- `idx_reviews_product_id` on (`product_id`)
- `idx_reviews_approved` on (`product_id`, `is_approved`) `WHERE is_approved = true`

---

## Commerce Tables Touching Products (Summary)

The following tables are not strictly part of the catalog but reference products for wishlist, cart, and orders:

- `public.wishlists` / `public.wishlist_items`  
- `public.carts` / `public.cart_items`  
- `public.orders` / `public.order_items`

They are fully defined in `supabase/migrations/001_schema.sql` and are referenced in the ER diagram and integrity checks.

