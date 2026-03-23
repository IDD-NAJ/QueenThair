import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createValidationError } from '../utils/AppError';

/**
 * Validation middleware factory using Zod schemas.
 * Validates request body against the provided schema.
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * router.post('/users', validate(userSchema), createUser);
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Format Zod errors into structured field-level errors
      const errors = formatZodErrors(result.error);
      const error = createValidationError('Validation failed', 'VALIDATION_ERROR');
      
      // Attach field-level errors to the error object
      (error as any).errors = errors;
      
      next(error);
      return;
    }

    // Replace req.body with parsed data (includes transformations like .trim())
    req.body = result.data;
    next();
  };
};

/**
 * Format Zod errors into structured field-level errors.
 */
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return errors;
};

/**
 * Query parameter validation middleware.
 * Validates and sanitizes query parameters: page, limit, sort, order.
 * 
 * @param allowedSortFields - Array of allowed sort column names
 * @returns Express middleware function
 */
export const validateQueryParams = (allowedSortFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate page
      let page = parseInt(req.query.page as string, 10);
      if (isNaN(page) || page < 1) {
        page = 1;
      }

      // Parse and validate limit (max 100)
      let limit = parseInt(req.query.limit as string, 10);
      if (isNaN(limit) || limit < 1) {
        limit = 20;
      } else if (limit > 100) {
        limit = 100;
      }

      // Validate sort field against allowlist
      let sort = req.query.sort as string;
      if (!sort || !allowedSortFields.includes(sort)) {
        sort = allowedSortFields[0] || 'created_at';
      }

      // Validate order (asc or desc)
      let order = (req.query.order as string)?.toLowerCase();
      if (order !== 'asc' && order !== 'desc') {
        order = 'desc';
      }

      // Attach validated params to request
      (req as any).queryParams = {
        page,
        limit,
        sort,
        order,
        offset: (page - 1) * limit,
      };

      next();
    } catch (error) {
      next(createValidationError('Invalid query parameters', 'INVALID_QUERY_PARAMS'));
    }
  };
};

/**
 * Sanitize HTML content using DOMPurify.
 * Should be applied to fields that may contain HTML.
 */
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'target'],
  });
};

/**
 * Pick only allowed fields from an object.
 * Used for mass assignment prevention.
 * 
 * @param obj - Source object
 * @param allowedFields - Array of allowed field names
 * @returns Object with only allowed fields
 * 
 * @example
 * const data = pick(req.body, ['name', 'email', 'phone']);
 */
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  allowedFields: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  
  allowedFields.forEach((field) => {
    if (field in obj) {
      result[field] = obj[field];
    }
  });

  return result;
};

/**
 * Pick allowed fields middleware.
 * Prevents mass assignment by only allowing specified fields.
 * 
 * @param allowedFields - Array of allowed field names
 * @returns Express middleware function
 */
export const pickFields = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.body = pick(req.body, allowedFields);
    next();
  };
};
