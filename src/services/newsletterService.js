import supabase from '../lib/supabaseClient';

/**
 * Normalize email address
 * @param {string} email - Raw email address
 * @returns {string} Normalized email (trimmed and lowercase)
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Subscribe to newsletter with comprehensive error handling
 * @param {string} email - Email address to subscribe
 * @param {object} options - Optional parameters
 * @param {string} options.source - Source of subscription (default: 'homepage_vip_list')
 * @param {string} options.userId - User ID if authenticated
 * @param {string} options.firstName - First name (optional)
 * @param {string} options.lastName - Last name (optional)
 * @returns {Promise<{success: boolean, data: object|null, error: string|null, isDuplicate: boolean}>}
 */
export async function subscribeToNewsletter(email, options = {}) {
  try {
    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return {
        success: false,
        data: null,
        error: 'Please enter a valid email address',
        isDuplicate: false,
      };
    }

    const {
      source = 'homepage_vip_list',
    } = options;

    // Build insert payload matching migration 001 schema
    const payload = {
      email: normalizedEmail,
      source,
      is_active: true,
    };

    // Attempt to insert directly - let unique constraint handle duplicates
    // This approach doesn't require SELECT permission on the table
    const { data: newSubscription, error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert(payload)
      .select()
      .single();

    // If the insert fails due to RLS policy issues, try without .select()
    if (insertError && insertError.code === '42501') {
      console.log('[newsletterService] RLS issue detected, trying fallback insert without select');
      const { error: fallbackError } = await supabase
        .from('newsletter_subscribers')
        .insert(payload);

      if (fallbackError) {
        console.log('[newsletterService] Fallback insert failed:', fallbackError);
        // Handle unique constraint violation (duplicate email)
        if (fallbackError.code === '23505') {
          return {
            success: false,
            data: null,
            error: 'This email is already subscribed to our VIP list',
            isDuplicate: true,
          };
        }
        throw fallbackError;
      } else {
        // Fallback insert succeeded, return success without data
        return {
          success: true,
          data: null, // Can't return data without .select()
          error: null,
          isDuplicate: false,
        };
      }
    }

    if (insertError) {
      // Log detailed error for debugging
      console.error('[newsletterService] Insert failed', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      
      // Handle unique constraint violation (duplicate email)
      if (insertError.code === '23505') {
        return {
          success: false,
          data: null,
          error: 'This email is already subscribed to our VIP list',
          isDuplicate: true,
        };
      }

      // Handle RLS policy violation
      if (insertError.code === '42501') {
        console.error('[newsletterService] RLS policy violation - check database policies');
        return {
          success: false,
          data: null,
          error: 'Newsletter signup is currently unavailable. Please try again shortly.',
          isDuplicate: false,
        };
      }

      // Generic error for other cases
      return {
        success: false,
        data: null,
        error: 'Failed to subscribe. Please try again.',
        isDuplicate: false,
      };
    }

    return {
      success: true,
      data: newSubscription,
      error: null,
      isDuplicate: false,
    };
  } catch (err) {
    console.error('[newsletterService] Unexpected error:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred. Please try again.',
      isDuplicate: false,
    };
  }
}

/**
 * Unsubscribe from newsletter
 * @param {string} email - Email address to unsubscribe
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function unsubscribeFromNewsletter(email) {
  try {
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return {
        success: false,
        data: null,
        error: 'Please enter a valid email address',
      };
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: false })
      .eq('email', normalizedEmail)
      .select()
      .single();

    if (error) {
      console.error('[newsletterService] Unsubscribe error:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to unsubscribe. Please try again.',
      };
    }

    return {
      success: true,
      data,
      error: null,
    };
  } catch (err) {
    console.error('[newsletterService] Unexpected unsubscribe error:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Check if an email is subscribed and active
 * @param {string} email - Email address to check
 * @returns {Promise<{success: boolean, isSubscribed: boolean, error: string|null}>}
 */
export async function checkNewsletterSubscription(email) {
  try {
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return {
        success: false,
        isSubscribed: false,
        error: 'Invalid email address',
      };
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('is_active')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('[newsletterService] Check subscription error:', error);
      return {
        success: false,
        isSubscribed: false,
        error: 'Failed to check subscription status',
      };
    }

    return {
      success: true,
      isSubscribed: data?.is_active ?? false,
      error: null,
    };
  } catch (err) {
    console.error('[newsletterService] Unexpected check error:', err);
    return {
      success: false,
      isSubscribed: false,
      error: 'An unexpected error occurred',
    };
  }
}

// Legacy exports for backward compatibility
export const subscribeNewsletter = subscribeToNewsletter;
export const unsubscribeNewsletter = unsubscribeFromNewsletter;
export const isSubscribed = async (email) => {
  const result = await checkNewsletterSubscription(email);
  return result.isSubscribed;
};
