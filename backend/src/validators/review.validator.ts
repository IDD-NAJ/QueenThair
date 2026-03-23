import { z } from 'zod';

/**
 * Review creation validation schema.
 */
export const createReviewSchema = z.object({
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
  
  images: z.array(z.string().url('Invalid image URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional(),
});

/**
 * Review update validation schema.
 */
export const updateReviewSchema = z.object({
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  
  title: z.string()
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  
  body: z.string()
    .min(10, 'Review body must be at least 10 characters')
    .max(2000, 'Review body must not exceed 2000 characters')
    .trim()
    .optional(),
  
  images: z.array(z.string().url('Invalid image URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional(),
});

/**
 * Review moderation validation schema (admin only).
 */
export const moderateReviewSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  
  moderationNotes: z.string()
    .max(500, 'Moderation notes must not exceed 500 characters')
    .optional(),
});

/**
 * Review helpfulness vote validation schema.
 */
export const reviewVoteSchema = z.object({
  reviewId: z.string()
    .uuid('Invalid review ID'),
  
  isHelpful: z.boolean(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
export type ReviewVoteInput = z.infer<typeof reviewVoteSchema>;
