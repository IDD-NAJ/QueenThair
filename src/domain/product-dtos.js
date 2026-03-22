import { z } from 'zod';
import { ProductType } from './status';

// ---- Canonical envelope ------------------------------------------------------

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const ApiEnvelopeSchema = z.object({
  data: z.unknown(),
  meta: z
    .object({
      total: z.number().int().nonnegative().optional(),
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
    })
    .default({}),
  error: ApiErrorSchema.nullable(),
});

/**
 * @template T
 * @typedef {{ data: T; meta: { total?: number; page?: number; pageSize?: number }; error: { code: string; message: string; details?: unknown } | null }} ApiEnvelope
 */

// ---- Shared sub-DTOs ---------------------------------------------------------

export const CategoryDTO = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

export const ProductImageDTO = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().url(),
  alt_text: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_primary: z.boolean().optional(),
});

export const ProductVariantDTO = z.object({
  id: z.string().uuid(),
  sku: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  length: z.string().nullable().optional(),
  density: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  option_label: z.string().nullable().optional(),
  price_override: z.number().nullable().optional(),
  is_active: z.boolean(),
});

export const InventoryDTO = z.object({
  quantity_available: z.number().int().nonnegative(),
  quantity_reserved: z.number().int().nonnegative(),
  low_stock_threshold: z.number().int().nonnegative(),
  track_inventory: z.boolean(),
  allow_backorder: z.boolean(),
});

// ---- Product DTOs ------------------------------------------------------------

export const ProductListItemDTO = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  product_type: z.enum([ProductType.Wig, ProductType.Accessory]),
  base_price: z.number(),
  compare_at_price: z.number().nullable().optional(),
  featured: z.boolean(),
  new_arrival: z.boolean(),
  best_seller: z.boolean(),
  on_sale: z.boolean(),
  badge: z.string().nullable().optional(),
  rating_average: z.number(),
  review_count: z.number().int(),
  short_description: z.string().nullable().optional(),
  is_active: z.boolean(),
  category: CategoryDTO.nullable().optional(),
  primaryImage: ProductImageDTO.nullable().optional(),
});

export const ProductDetailDTO = ProductListItemDTO.extend({
  description: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  images: z.array(ProductImageDTO).optional(),
  variants: z.array(ProductVariantDTO).optional(),
  inventory: InventoryDTO.nullable().optional(),
});

export const ProductAdminDTO = ProductDetailDTO.extend({
  // Admin-only/internal fields. Keep minimal until new admin endpoints exist.
  category_id: z.string().uuid().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ---- Include contract --------------------------------------------------------

export const ProductInclude = Object.freeze({
  Images: 'images',
  Variants: 'variants',
  Inventory: 'inventory',
  Category: 'category',
  ReviewsSummary: 'reviews',
  Collections: 'collections',
});

export const ProductIncludeSchema = z.array(
  z.enum([
    ProductInclude.Images,
    ProductInclude.Variants,
    ProductInclude.Inventory,
    ProductInclude.Category,
    ProductInclude.ReviewsSummary,
    ProductInclude.Collections,
  ])
);

