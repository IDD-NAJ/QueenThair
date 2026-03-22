// Central error formatting for service layer results.

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN', statusCode = 500) {
    super(message);
    this.name  = 'AppError';
    this.code  = code;
    this.statusCode = statusCode;
  }
}

// Wrap a service call and return { data, error } instead of throwing
export async function safeCall(fn) {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    const message = err?.message || 'An unexpected error occurred';
    console.error('[safeCall]', message, err);
    return { data: null, error: message };
  }
}

// Format Supabase error messages for display
export function formatSupabaseError(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return 'This record already exists.';
  }
  if (msg.includes('violates foreign key')) {
    return 'A related record was not found.';
  }
  if (msg.includes('JWT')) {
    return 'Your session has expired. Please sign in again.';
  }
  return msg;
}
