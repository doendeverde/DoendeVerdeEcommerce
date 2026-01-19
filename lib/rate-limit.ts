/**
 * Rate Limiter
 * 
 * Simple in-memory rate limiter for critical API routes.
 * For production with multiple instances, use Redis (Upstash) instead.
 * 
 * @example
 * ```ts
 * import { rateLimiter, RateLimitConfig } from '@/lib/rate-limit';
 * 
 * const limiter = rateLimiter({
 *   interval: 60 * 1000, // 1 minute
 *   maxRequests: 10,
 * });
 * 
 * // In API route
 * const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
 * const { success, remaining, reset } = limiter.check(identifier);
 * 
 * if (!success) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 * ```
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number;
  /** Maximum requests allowed in the interval */
  maxRequests: number;
  /** Unique identifier for this limiter (for multiple limiters) */
  uniqueTokenPerInterval?: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Timestamp when the window resets */
  reset: number;
  /** Total limit */
  limit: number;
}

interface TokenBucket {
  count: number;
  lastReset: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Store
// ─────────────────────────────────────────────────────────────────────────────

const store = new Map<string, TokenBucket>();

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store.entries()) {
      // Remove entries older than 10 minutes
      if (now - bucket.lastReset > 10 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiter Factory
// ─────────────────────────────────────────────────────────────────────────────

export function rateLimiter(config: RateLimitConfig) {
  const { interval, maxRequests } = config;

  return {
    /**
     * Check if the identifier is within rate limits
     */
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const key = identifier;

      let bucket = store.get(key);

      // Create new bucket if it doesn't exist or window has passed
      if (!bucket || now - bucket.lastReset >= interval) {
        bucket = {
          count: 0,
          lastReset: now,
        };
        store.set(key, bucket);
      }

      // Calculate reset time
      const reset = bucket.lastReset + interval;

      // Check if limit exceeded
      if (bucket.count >= maxRequests) {
        return {
          success: false,
          remaining: 0,
          reset,
          limit: maxRequests,
        };
      }

      // Increment counter
      bucket.count++;

      return {
        success: true,
        remaining: maxRequests - bucket.count,
        reset,
        limit: maxRequests,
      };
    },

    /**
     * Reset the counter for an identifier
     */
    reset(identifier: string): void {
      store.delete(identifier);
    },

    /**
     * Get current state for an identifier (for debugging)
     */
    getState(identifier: string): TokenBucket | undefined {
      return store.get(identifier);
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-configured Limiters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auth rate limiter: 10 requests per minute per IP
 * Used for login, register, password reset
 */
export const authLimiter = rateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 10,
});

/**
 * Checkout rate limiter: 5 requests per minute per user
 * Prevents payment abuse
 */
export const checkoutLimiter = rateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5,
});

/**
 * Cart rate limiter: 30 requests per minute per user
 * Allows normal cart operations
 */
export const cartLimiter = rateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 30,
});

/**
 * General API rate limiter: 60 requests per minute per IP
 * For general API endpoints
 */
export const apiLimiter = rateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 60,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'
  );
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());
  return headers;
}

/**
 * Check rate limit and return response if exceeded
 */
export function checkRateLimit(
  request: Request,
  limiter: ReturnType<typeof rateLimiter>,
  identifier?: string
): { success: true } | { success: false; response: Response } {
  const ip = identifier || getClientIp(request);
  const result = limiter.check(ip);

  if (!result.success) {
    const headers = rateLimitHeaders(result);
    headers.set('Retry-After', Math.ceil((result.reset - Date.now()) / 1000).toString());

    return {
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: 'Muitas requisições. Por favor, aguarde um momento.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers,
        }
      ),
    };
  }

  return { success: true };
}
