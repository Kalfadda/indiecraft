/**
 * Error Handler Utility
 * Sanitizes error messages to prevent information leakage
 * Addresses vulnerabilities #5 and #11: Error Message Information Leakage
 */

// Map of internal error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // Supabase Auth errors
  'invalid_credentials': 'Invalid email or password',
  'email_not_confirmed': 'Please verify your email address',
  'user_not_found': 'Account not found',
  'too_many_requests': 'Too many attempts. Please try again later.',
  'invalid_grant': 'Session expired. Please sign in again.',
  'user_already_exists': 'An account with this email already exists',
  'weak_password': 'Password is too weak. Use at least 8 characters.',
  'same_password': 'New password must be different from current password',
  'otp_expired': 'Verification code has expired. Please request a new one.',
  'invalid_otp': 'Invalid verification code',

  // PostgREST errors
  'PGRST301': 'You do not have permission to perform this action',
  'PGRST116': 'Resource not found',
  'PGRST204': 'No content returned',

  // PostgreSQL errors
  '23505': 'This item already exists',
  '23503': 'Cannot complete action - item is referenced elsewhere',
  '23502': 'Required field is missing',
  '22001': 'Text is too long',
  '42501': 'Permission denied',
  '42P01': 'Resource not found',

  // Network errors
  'NETWORK_ERROR': 'Network error. Please check your connection.',
  'TIMEOUT': 'Request timed out. Please try again.',
};

// Patterns that might leak sensitive info - these errors get fully sanitized
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /api.?key/i,
  /token/i,
  /credential/i,
  /authorization/i,
  /bearer/i,
  /session/i,
  /postgres/i,
  /supabase/i,
  /sql/i,
  /query failed/i,
  /syntax error/i,
  /table\s+["']?\w+["']?/i,
  /column\s+["']?\w+["']?/i,
  /schema/i,
  /database/i,
  /connection\s+(refused|reset|failed)/i,
  /host/i,
  /port\s*[:=]\s*\d+/i,
  /role\s+["']?\w+["']?/i,
  /permission denied for/i,
  /stack trace/i,
  /at\s+\w+\s+\(/i, // Stack trace lines
  /\.ts:\d+/i, // TypeScript file references
  /\.js:\d+/i, // JavaScript file references
  /node_modules/i,
  /internal server error/i,
  /undefined/i,
  /null pointer/i,
];

// Generic fallback message
const GENERIC_ERROR = 'An error occurred. Please try again.';

interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  statusCode?: number;
  error?: string;
  error_description?: string;
}

/**
 * Sanitizes an error message to prevent information leakage
 * @param error - The error object or message
 * @returns A safe, user-friendly error message
 */
export function sanitizeError(error: unknown): string {
  if (!error) return GENERIC_ERROR;

  // Handle string errors
  if (typeof error === 'string') {
    return sanitizeMessage(error);
  }

  const errorObj = error as SupabaseError;

  // Extract error code
  const code = errorObj.code || errorObj.error || '';

  // Check for known error codes first (most specific)
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Check status codes
  if (errorObj.status === 401 || errorObj.statusCode === 401) {
    return 'Please sign in to continue';
  }
  if (errorObj.status === 403 || errorObj.statusCode === 403) {
    return 'You do not have permission to perform this action';
  }
  if (errorObj.status === 404 || errorObj.statusCode === 404) {
    return 'Resource not found';
  }
  if (errorObj.status === 429 || errorObj.statusCode === 429) {
    return ERROR_MESSAGES['too_many_requests'];
  }
  if (errorObj.status === 500 || errorObj.statusCode === 500) {
    console.error('[Security] Server error sanitized:', error);
    return GENERIC_ERROR;
  }

  // Get the message to analyze
  const message = errorObj.message || errorObj.error_description || '';

  // Check for Postgres/PostgREST error codes in message
  for (const [pattern, friendly] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(pattern) || code.includes(pattern)) {
      return friendly;
    }
  }

  return sanitizeMessage(message);
}

/**
 * Sanitizes a message string
 */
function sanitizeMessage(message: string): string {
  if (!message) return GENERIC_ERROR;

  // Check if message contains sensitive information
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      // Log the full error for debugging (server-side only in production)
      console.error('[Security] Sensitive error sanitized:', message);
      return GENERIC_ERROR;
    }
  }

  // If message seems safe, return a truncated version
  const cleanMessage = message.trim();
  if (cleanMessage.length > 150) {
    return cleanMessage.substring(0, 150) + '...';
  }

  // Final check: if it looks like a technical error, sanitize it
  if (/^[A-Z_]+:/.test(cleanMessage) || /^\d+:/.test(cleanMessage)) {
    return GENERIC_ERROR;
  }

  return cleanMessage || GENERIC_ERROR;
}

/**
 * Logs an error securely (full details to console, sanitized to user)
 * @param context - Where the error occurred
 * @param error - The error object
 * @returns Sanitized error message
 */
export function logAndSanitizeError(context: string, error: unknown): string {
  // Always log full error for debugging
  console.error(`[${context}] Error:`, error);

  // Return sanitized message for user
  return sanitizeError(error);
}

/**
 * Type guard to check if error is a Supabase error
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'code' in error || 'error' in error)
  );
}
