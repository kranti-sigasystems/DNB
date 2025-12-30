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