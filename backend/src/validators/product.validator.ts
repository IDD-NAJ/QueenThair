import { z } from 'zod';

/**
 * Product creation/update validation schema.
 */
export const productSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must not exceed 200 characters')
    .trim(),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(200, 'Slug must not exceed 200 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  
  description: z.string()
    .max(5000, 'Description must not exceed 5000 characters')
    .optional(),
  
  shortDescription: z.string()
    .max(500, 'Short description must not exceed 500 characters')
    .optional(),
  
  price: z.number()
    .positive('Price must be a positive number')
    .max(999999.99, 'Price must not exceed 999,999.99'),
  
  compareAtPrice: z.number()
    .positive('Compare at price must be a positive number')
    .optional(),
  
  categoryId: z.string()
    .uuid('Invalid category ID')
    .optional(),
  
  sku: z.string()
    .max(100, 'SKU must not exceed 100 characters')
    .optional(),
  
  inventoryQuantity: z.number()
    .int('Inventory quantity must be an integer')
    .min(0, 'Inventory quantity must be at least 0')
    .optional(),
  
  weight: z.number()
    .positive('Weight must be a positive number')
    .optional(),
  
  isActive: z.boolean()
    .default(true),
});

/**
 * Product variant validation schema.
 */
export const productVariantSchema = z.object({
  productId: z.string()
    .uuid('Invalid product ID'),
  
  title: z.string()
    .min(1, 'Variant title is required')
    .max(100, 'Variant title must not exceed 100 characters')
    .trim(),
  
  price: z.number()
    .positive('Price must be a positive number')
    .optional(),
  
  sku: z.string()
    .max(100, 'SKU must not exceed 100 characters')
    .optional(),
  
  inventoryQuantity: z.number()
    .int('Inventory quantity must be an integer')
    .min(0, 'Inventory quantity must be at least 0')
    .optional(),
  
  options: z.record(z.string())
    .optional(), // e.g., { color: "Red", size: "Large" }
});

/**
 * Product review validation schema.
 */
export const productReviewSchema = z.object({
  productId: z.string()
    .uuid('Invalid product ID'),
  
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  
  title: z.string()
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  
  body: z.string()
    .min(10, 'Review body must be at least 10 characters')
    .max(2000, 'Review body must not exceed 2000 characters')
    .trim(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductReviewInput = z.infer<typeof productReviewSchema>;
