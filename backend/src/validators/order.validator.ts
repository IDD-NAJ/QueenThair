import { z } from 'zod';

/**
 * Order creation validation schema.
 */
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string()
      .uuid('Invalid product ID'),
    
    variantId: z.string()
      .uuid('Invalid variant ID')
      .optional(),
    
    quantity: z.number()
      .int('Quantity must be an integer')
      .positive('Quantity must be at least 1')
      .max(100, 'Quantity must not exceed 100'),
    
    price: z.number()
      .positive('Price must be a positive number'),
  })).min(1, 'At least one item is required'),
  
  shippingAddress: z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .trim(),
    
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .trim(),
    
    address1: z.string()
      .min(1, 'Address is required')
      .max(200, 'Address must not exceed 200 characters')
      .trim(),
    
    address2: z.string()
      .max(200, 'Address line 2 must not exceed 200 characters')
      .optional(),
    
    city: z.string()
      .min(1, 'City is required')
      .max(100, 'City must not exceed 100 characters')
      .trim(),
    
    state: z.string()
      .min(1, 'State is required')
      .max(100, 'State must not exceed 100 characters')
      .trim(),
    
    postalCode: z.string()
      .min(1, 'Postal code is required')
      .max(20, 'Postal code must not exceed 20 characters')
      .regex(/^[A-Za-z0-9\s-]+$/, 'Invalid postal code format')
      .trim(),
    
    country: z.string()
      .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
      .toUpperCase(),
    
    phone: z.string()
      .max(20, 'Phone number must not exceed 20 characters')
      .regex(/^\+?[0-9\s-()]+$/, 'Invalid phone number format')
      .optional(),
  }),
  
  billingAddress: z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .trim(),
    
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .trim(),
    
    address1: z.string()
      .min(1, 'Address is required')
      .max(200, 'Address must not exceed 200 characters')
      .trim(),
    
    address2: z.string()
      .max(200, 'Address line 2 must not exceed 200 characters')
      .optional(),
    
    city: z.string()
      .min(1, 'City is required')
      .max(100, 'City must not exceed 100 characters')
      .trim(),
    
    state: z.string()
      .min(1, 'State is required')
      .max(100, 'State must not exceed 100 characters')
      .trim(),
    
    postalCode: z.string()
      .min(1, 'Postal code is required')
      .max(20, 'Postal code must not exceed 20 characters')
      .regex(/^[A-Za-z0-9\s-]+$/, 'Invalid postal code format')
      .trim(),
    
    country: z.string()
      .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
      .toUpperCase(),
    
    phone: z.string()
      .max(20, 'Phone number must not exceed 20 characters')
      .regex(/^\+?[0-9\s-()]+$/, 'Invalid phone number format')
      .optional(),
  }),
  
  couponCode: z.string()
    .max(50, 'Coupon code must not exceed 50 characters')
    .optional(),
  
  notes: z.string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
});

/**
 * Order status update validation schema (admin only).
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  
  trackingNumber: z.string()
    .max(100, 'Tracking number must not exceed 100 characters')
    .optional(),
  
  trackingUrl: z.string()
    .url('Invalid tracking URL')
    .optional(),
  
  notes: z.string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
});

/**
 * Shipping address validation schema.
 */
export const shippingAddressSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .trim(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .trim(),
  
  address1: z.string()
    .min(1, 'Address is required')
    .max(200, 'Address must not exceed 200 characters')
    .trim(),
  
  address2: z.string()
    .max(200, 'Address line 2 must not exceed 200 characters')
    .optional(),
  
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City must not exceed 100 characters')
    .trim(),
  
  state: z.string()
    .min(1, 'State is required')
    .max(100, 'State must not exceed 100 characters')
    .trim(),
  
  postalCode: z.string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code must not exceed 20 characters')
    .regex(/^[A-Za-z0-9\s-]+$/, 'Invalid postal code format')
    .trim(),
  
  country: z.string()
    .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
    .toUpperCase(),
  
  phone: z.string()
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[0-9\s-()]+$/, 'Invalid phone number format')
    .optional(),
  
  isDefault: z.boolean()
    .default(false),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
