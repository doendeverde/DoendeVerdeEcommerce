/**
 * API Response Types
 * 
 * Standardized response format for all API endpoints.
 * All APIs should use these types for consistent responses.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Base Response Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Success response with data
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

/**
 * Error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: Record<string, string[]>;
}

/**
 * Union type for API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Response metadata (for pagination, etc.)
 */
export interface ApiResponseMeta {
  pagination?: PaginationMeta;
  timestamp?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponseMeta
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  errorCode?: string,
  details?: Record<string, string[]>
): ApiErrorResponse {
  return {
    success: false,
    error,
    ...(errorCode && { errorCode }),
    ...(details && { details }),
  };
}

/**
 * Create a paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta
): ApiSuccessResponse<T[]> {
  return {
    success: true,
    data,
    meta: { pagination },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Builders (for Next.js API Routes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a JSON Response with success data
 */
export function jsonSuccess<T>(data: T, meta?: ApiResponseMeta, status = 200): Response {
  return Response.json(successResponse(data, meta), { status });
}

/**
 * Build a JSON Response with error
 */
export function jsonError(
  error: string,
  status = 400,
  errorCode?: string,
  details?: Record<string, string[]>
): Response {
  return Response.json(errorResponse(error, errorCode, details), { status });
}

/**
 * Build a JSON Response for paginated data
 */
export function jsonPaginated<T>(
  data: T[],
  pagination: PaginationMeta,
  status = 200
): Response {
  return Response.json(paginatedResponse(data, pagination), { status });
}

// ─────────────────────────────────────────────────────────────────────────────
// Common Error Codes
// ─────────────────────────────────────────────────────────────────────────────

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_BLOCKED: "USER_BLOCKED",
  
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  
  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",
  
  // Business logic errors
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  CART_EMPTY: "CART_EMPTY",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  SUBSCRIPTION_ACTIVE: "SUBSCRIPTION_ACTIVE",
  
  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
