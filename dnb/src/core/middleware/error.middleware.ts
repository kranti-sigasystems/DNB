import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { errorResponse, handleApiError } from '../handlers/responseHandler';

/**
 * Custom error classes
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests') {
    super(message, 429);
    this.name = 'TooManyRequestsError';
  }
}

/**
 * Error handler for different error types
 */
export const handleError = (error: unknown): NextResponse => {
  console.error('Error Handler:', error);

  // Handle custom app errors
  if (error instanceof AppError) {
    return errorResponse(
      error.statusCode,
      error.message,
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const message = error.issues
      .map((err: any) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    
    return errorResponse(400, `Validation Error: ${message}`);
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return errorResponse(409, 'A record with this information already exists');
      case 'P2025':
        return errorResponse(404, 'Record not found');
      case 'P2003':
        return errorResponse(400, 'Foreign key constraint failed');
      case 'P2014':
        return errorResponse(400, 'Invalid ID provided');
      default:
        console.error('Unhandled Prisma error:', prismaError);
        return errorResponse(500, 'Database error occurred');
    }
  }

  // Handle JWT errors
  if (error && typeof error === 'object' && 'name' in error) {
    const jwtError = error as any;
    
    if (jwtError.name === 'TokenExpiredError') {
      return errorResponse(401, 'Token has expired');
    }
    
    if (jwtError.name === 'JsonWebTokenError') {
      return errorResponse(401, 'Invalid token');
    }
    
    if (jwtError.name === 'NotBeforeError') {
      return errorResponse(401, 'Token not active');
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return errorResponse(
      500,
      error.message,
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    );
  }

  // Handle unknown errors
  return errorResponse(500, 'An unknown error occurred');
};

/**
 * Global error handling wrapper for API routes
 */
export const withErrorHandler = <T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) => {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return handleError(error);
    }
  };
};

/**
 * Async wrapper that catches and handles errors
 */
export const asyncErrorHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error);
    }
  };
};

/**
 * Log error details for monitoring
 */
export const logError = (error: unknown, context?: string) => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';
  
  console.error(`${timestamp}${contextStr} Error:`, error);
  
  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to logging service
    // logToService(error, context);
  }
};

/**
 * Middleware to handle uncaught errors in API routes
 */
export const errorMiddleware = withErrorHandler;