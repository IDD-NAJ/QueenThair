export class ApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {any} details
   */
  constructor(code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

