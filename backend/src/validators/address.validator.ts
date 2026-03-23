import { z } from 'zod';

/**
 * User profile update validation schema.
 */
export const updateProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .trim()
    .optional(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .trim()
    .optional(),
  
  phone: z.string()
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[0-9\s-()]+$/, 'Invalid phone number format')
    .optional(),
  
  avatar: z.string()
    .url('Invalid avatar URL')
    .optional(),
});

/**
 * Address validation schema.
 */
export const addressSchema = z.object({
  name: z.string()
    .min(1, 'Address name is required')
    .max(50, 'Address name must not exceed 50 characters')
    .trim(), // e.g., "Home", "Work"
  
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

/**
 * Email update validation schema.
 */
export const updateEmailSchema = z.object({
  newEmail: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email must not exceed 254 characters')
    .trim()
    .toLowerCase(),
  
  password: z.string()
    .min(1, 'Current password is required'),
});

/**
 * Account deletion validation schema.
 */
export const deleteAccountSchema = z.object({
  password: z.string()
    .min(1, 'Password is required'),
  
  reason: z.string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
