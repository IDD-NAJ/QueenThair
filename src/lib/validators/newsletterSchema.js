import { z } from 'zod';

export const newsletterSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((email) => email.trim().toLowerCase()),
});

export const newsletterSchemaWithNames = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((email) => email.trim().toLowerCase()),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});
