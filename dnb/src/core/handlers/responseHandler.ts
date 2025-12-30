import { NextResponse } from 'next/server';

/**
 * Send success response for Next.js API routes
 */
export const successResponse = (
  status: number = 200,
  message: string = 'Success',
  data?: any
): NextResponse => {
  return NextResponse.json(
    {
      statusCode: status,
      success: true,
      message,
      data,
    },
    { status }
  );
};

/**
 * Send error response for Next.js API routes
 */
export const errorResponse = (
  status: number = 500,
  message: string = 'Internal Server Error',
  error?: any
): NextResponse => {
  console.error('API Error:', { status, message, error });
  
  return NextResponse.json(
    {
      statusCode: status,
      success: false,
      message,
      error: process.env.NODE_ENV === 'production' ? undefined : error,
    },
    { status }
  );
};

/**
 * Handle 404 Not Found for Next.js API routes
 */
export const notFoundResponse = (path?: string): NextResponse => {
  return NextResponse.json(
    {
      statusCode: 404,
      success: false,
      message: `Not Found${path ? ` - ${path}` : ''}`,
    },
    { status: 404 }
  );
};

/**
 * Async handler wrapper for Next.js API routes
 * Catches errors and returns proper error responses
 */
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Async Handler Error:', error);
      
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      const stack = error instanceof Error ? error.stack : undefined;
      
      return NextResponse.json(
        {
          statusCode: 500,
          success: false,
          message,
          stack: process.env.NODE_ENV === 'production' ? undefined : stack,
        },
        { status: 500 }
      );
    }
  };
};

/**
 * Global error handler for Next.js API routes
 */
export const handleApiError = (error: unknown): NextResponse => {
  console.error('API Error Handler:', error);
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return errorResponse(400, 'Validation Error', error.message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return errorResponse(401, 'Unauthorized', error.message);
    }
    
    if (error.name === 'ForbiddenError') {
      return errorResponse(403, 'Forbidden', error.message);
    }
    
    if (error.name === 'NotFoundError') {
      return errorResponse(404, 'Not Found', error.message);
    }
    
    return errorResponse(500, error.message, error.stack);
  }
  
  return errorResponse(500, 'Unknown error occurred');
};

/**
 * Legacy Express-style response helpers for compatibility
 * These are used by middleware that was originally designed for Express
 */
export const legacySuccessResponse = (
  res: any, 
  status: number = 200, 
  message: string = "Success", 
  data?: any
) => {
  if (!res || typeof res.status !== 'function') {
    console.error("Invalid response object in legacySuccessResponse");
    return;
  }
  
  return res.status(status).json({
    statusCode: status,
    success: true,
    message,
    data,
  });
};

/**
 * Legacy Express-style error response for compatibility
 */
export const legacyErrorResponse = (
  res: any, 
  status: number = 500, 
  message: string = "Internal Server Error", 
  error?: any
) => {
  if (!res || typeof res.status !== 'function') {
    console.error("Invalid response object in legacyErrorResponse:", message, error);
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
 * Express-style async handler wrapper
 */
export const expressAsyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Express-style global error handler middleware
 */
export const expressErrorHandler = (err: any, req: any, res: any, next: any) => {
  console.error("Express Error Handler:", err);
  
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

/**
 * Express-style 404 handler
 */
export const expressNotFoundHandler = (req: any, res: any, next: any) => {
  return res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
};