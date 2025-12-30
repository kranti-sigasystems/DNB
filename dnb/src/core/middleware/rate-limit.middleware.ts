import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '../handlers/responseHandler';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {};

/**
 * Clean up expired entries from the store
 */
const cleanupStore = () => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime <= now) {
      delete store[key];
    }
  });
};

/**
 * Get client identifier from request
 */
const getClientId = (req: NextRequest): string => {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // You can also include user ID if authenticated
  const userId = req.headers.get('x-user-id');
  
  return userId ? `user:${userId}` : `ip:${clientIp}`;
};

/**
 * Rate limiting middleware for Next.js API routes
 */
export const rateLimit = (config: RateLimitConfig) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later.',
  } = config;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      // Clean up expired entries periodically
      if (Math.random() < 0.01) { // 1% chance to cleanup
        cleanupStore();
      }

      const clientId = getClientId(req);
      const now = Date.now();
      const resetTime = now + windowMs;

      // Get or create client record
      if (!store[clientId] || store[clientId].resetTime <= now) {
        store[clientId] = {
          count: 1,
          resetTime,
        };
        return null; // Allow request
      }

      // Increment count
      store[clientId].count++;

      // Check if limit exceeded
      if (store[clientId].count > max) {
        const retryAfter = Math.ceil((store[clientId].resetTime - now) / 1000);
        
        return NextResponse.json(
          {
            statusCode: 429,
            success: false,
            message,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': max.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': store[clientId].resetTime.toString(),
            },
          }
        );
      }

      // Add rate limit headers to successful requests
      const remaining = Math.max(0, max - store[clientId].count);
      
      // Return null to indicate success, but we'll add headers in the wrapper
      return null;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Don't block requests if rate limiting fails
      return null;
    }
  };
};

/**
 * Wrapper for API routes with rate limiting
 */
export const withRateLimit = (config: RateLimitConfig) => {
  return <T extends any[]>(
    handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
  ) => {
    return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      const rateLimitResponse = await rateLimit(config)(req);
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
      
      const response = await handler(req, ...args);
      
      // Add rate limit headers to successful responses
      const clientId = getClientId(req);
      const clientData = store[clientId];
      
      if (clientData) {
        const remaining = Math.max(0, config.max - clientData.count);
        response.headers.set('X-RateLimit-Limit', config.max.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', clientData.resetTime.toString());
      }
      
      return response;
    };
  };
};

/**
 * Predefined rate limit configurations for common use cases
 */
export const rateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  
  // General API rate limiting
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests, please try again later.',
  },
  
  // Lenient rate limiting for general endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Rate limit exceeded, please try again later.',
  },
};

/**
 * Predefined rate limiters for common use cases (legacy - use rateLimitConfigs with withRateLimit instead)
 */
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: rateLimit(rateLimitConfigs.auth),
  
  // General API rate limiting
  api: rateLimit(rateLimitConfigs.api),
  
  // Lenient rate limiting for general endpoints
  general: rateLimit(rateLimitConfigs.general),
};