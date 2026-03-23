import { z } from 'zod';

/**
 * Coupon creation/update validation schema (admin only).
 */
export const couponSchema = z.object({
  code: z.string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code must not exceed 50 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Coupon code must contain only uppercase letters, numbers, underscores, and hyphens')
    .trim()
    .toUpperCase(),
  
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  
  type: z.enum(['percentage', 'fixed_amount']),
  
  value: z.number()
    .positive('Value must be a positive number')
    .refine((val) => {
      // For percentage, max 100%
      return true; // Additional logic handled at service level
    }),
  
  minOrderAmount: z.number()
    .nonnegative('Minimum order amount must be non-negative')
    .optional(),
  
  maxDiscount: z.number()
    .positive('Maximum discount must be positive')
    .optional(),
  
  maxUses: z.number()
    .int('Max uses must be an integer')
    .nonnegative('Max uses must be non-negative')
    .optional(),
  
  maxUsesPerUser: z.number()
    .int('Max uses per user must be an integer')
    .nonnegative('Max uses per user must be non-negative')
    .default(1),
  
  startDate: z.string()
    .datetime('Invalid start date')
    .optional(),
  
  endDate: z.string()
    .datetime('Invalid end date')
    .optional(),
  
  appliesTo: z.enum(['all', 'products', 'categories', 'shipping']),
  
  productIds: z.array(z.string().uuid('Invalid product ID'))
    .optional(),
  
  categoryIds: z.array(z.string().uuid('Invalid category ID'))
    .optional(),
  
  isActive: z.boolean()
    .default(true),
});

/**
 * Coupon application validation schema.
 */
export const applyCouponSchema = z.object({
  code: z.string()
    .min(1, 'Coupon code is required')
    .max(50, 'Coupon code must not exceed 50 characters')
    .trim()
    .toUpperCase(),
  
  cartTotal: z.number()
    .nonnegative('Cart total must be non-negative'),
  
  productIds: z.array(z.string().uuid('Invalid product ID'))
    .optional(),
});

/**
 * Gift card creation validation schema (admin only).
 */
export const giftCardSchema = z.object({
  code: z.string()
    .min(8, 'Gift card code must be at least 8 characters')
    .max(50, 'Gift card code must not exceed 50 characters')
    .trim(),
  
  initialBalance: z.number()
    .positive('Initial balance must be positive')
    .max(10000, 'Initial balance must not exceed 10,000'),
  
  recipientEmail: z.string()
    .email('Invalid recipient email')
    .optional(),
  
  recipientName: z.string()
    .max(100, 'Recipient name must not exceed 100 characters')
    .optional(),
  
  message: z.string()
    .max(500, 'Message must not exceed 500 characters')
    .optional(),
  
  expiryDate: z.string()
    .datetime('Invalid expiry date')
    .optional(),
});

export type CouponInput = z.infer<typeof couponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type GiftCardInput = z.infer<typeof giftCardSchema>;
