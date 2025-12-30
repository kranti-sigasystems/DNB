/**
 * Express-style middleware collection for compatibility with legacy Express applications
 * These middleware functions follow the Express.js pattern: (req, res, next) => void
 */

import jwt from "jsonwebtoken";
import { legacyErrorResponse, legacySuccessResponse, expressAsyncHandler, expressErrorHandler, expressNotFoundHandler } from "../handlers/responseHandler";
import { expressRateLimit } from "./rate-limit.middleware";

// Express-style interfaces
interface ExpressRequest {
  headers: { [key: string]: string | undefined };
  user?: any;
  ip?: string;
  originalUrl?: string;
}

interface ExpressResponse {
  status: (code: number) => ExpressResponse;
  json: (data: any) => ExpressResponse;
  statusCode?: number;
}

type ExpressNext = (error?: any) => void;

/**
 * Wrap async controller functions to avoid repetitive try/catch
 */
export const asyncHandler = (fn: Function) => (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global Error Handler middleware
 */
export const errorHandler = (err: any, req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  console.error("Error Handler:", err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

/**
 * Handle 404 Not Found
 */
export const notFoundHandler = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  return res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
};

/**
 * Send success response
 */
export const successResponse = (
  res: ExpressResponse, 
  status: number = 200, 
  message: string = "Success", 
  data?: any
) => {
  return res.status(status).json({
    statusCode: status,
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 */
export const errorResponse = (
  res: ExpressResponse, 
  status: number = 500, 
  message: string = "Internal Server Error", 
  error?: any
) => {
  if (!res) {
    console.error("Express response object is undefined in errorResponse:", message, error);
    return;
  }

  return res.status(status).json({
    statusCode: status,
    success: false,
    message,
    error,
  });
};

/**
 * JWT Authentication middleware
 */
export const authenticateAccessToken = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Unauthorized: No access token provided");
    }

    const token = authHeader.split(" ")[1];
    
    if (!process.env.ACCESS_TOKEN_SECRET) {
      console.error('ACCESS_TOKEN_SECRET is not defined');
      return errorResponse(res, 500, "Server configuration error");
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err: any, decoded: any) => {
      if (err) {
        return errorResponse(res, 403, "Invalid or expired access token", err.message);
      }

      req.user = decoded;
      next();
    });
  } catch (err: any) {
    return errorResponse(res, 500, "Internal Server Error", err.message);
  }
};

/**
 * JWT Authentication middleware (alias)
 */
export const authenticateJWT = authenticateAccessToken;

/**
 * Rate limiter middleware
 */
export const rateLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    statusCode: 429,
    status: "error",
    message: "Too many attempts, please try again after 15 minutes.",
  },
});

/**
 * Validation middleware factory
 */
export const validateRequest = (schema: any) => {
  return (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
    try {
      // This would typically use a validation library like Joi or Zod
      // For now, we'll just pass through
      next();
    } catch (error: any) {
      return errorResponse(res, 400, "Validation Error", error.message);
    }
  };
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
    if (!req.user) {
      return errorResponse(res, 401, "Authentication required");
    }

    const userRole = req.user.userRole || req.user.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return errorResponse(res, 403, "Insufficient permissions");
    }

    next();
  };
};

/**
 * CORS middleware
 */
export const corsMiddleware = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  // This would typically set CORS headers
  // For Next.js, CORS is usually handled differently
  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  const timestamp = new Date().toISOString();
  const method = (req as any).method || 'UNKNOWN';
  const url = req.originalUrl || 'unknown';
  const ip = req.ip || 'unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  // This would typically set security headers
  // For Next.js, security headers are usually handled in next.config.js
  next();
};

// Export all middleware for easy importing
export {
  // Re-export from other files for convenience
  expressAsyncHandler,
  expressErrorHandler,
  expressNotFoundHandler,
  legacySuccessResponse,
  legacyErrorResponse,
};

// Default export with all middleware
export default {
  asyncHandler,
  errorHandler,
  notFoundHandler,
  successResponse,
  errorResponse,
  authenticateAccessToken,
  authenticateJWT,
  rateLimiter,
  validateRequest,
  requireRole,
  corsMiddleware,
  requestLogger,
  securityHeaders,
};