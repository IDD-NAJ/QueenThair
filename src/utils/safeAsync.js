/**
 * Safe async utilities to prevent infinite loading states
 */

/**
 * Wraps an async function with timeout and error handling
 * @param {Function} fn - Async function to execute
 * @param {number} timeoutMs - Timeout in milliseconds (default 30s)
 * @returns {Promise} - Result or error
 */
export async function withTimeout(fn, timeoutMs = 30000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Standard async handler pattern that always resolves loading state
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Configuration options
 * @returns {Promise<{data, error}>}
 */
export async function safeAsync(asyncFn, options = {}) {
  const {
    onStart,
    onSuccess,
    onError,
    onFinally,
    timeout = 30000,
    defaultValue = null,
  } = options;

  try {
    onStart?.();
    const result = await withTimeout(asyncFn, timeout);
    onSuccess?.(result);
    return { data: result, error: null };
  } catch (error) {
    console.error('[safeAsync] Error:', error);
    onError?.(error);
    return { data: defaultValue, error };
  } finally {
    onFinally?.();
  }
}

/**
 * Creates a safe async state handler for React components
 * @param {Function} setLoading
 * @param {Function} setError
 * @param {Function} setData
 * @returns {Function} - Async executor
 */
export function createAsyncHandler(setLoading, setError, setData) {
  return async (asyncFn, defaultValue = null) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (error) {
      console.error('[AsyncHandler] Error:', error);
      setError(error);
      setData(defaultValue);
      return defaultValue;
    } finally {
      setLoading(false);
    }
  };
}

/**
 * Retry an async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delayMs - Initial delay in milliseconds
 * @returns {Promise}
 */
export async function retryAsync(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}
