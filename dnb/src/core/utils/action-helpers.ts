/**
 * Helper utilities for server actions with robust error handling
 */

import { 
  handleError, 
  ValidationError, 
  UnauthorizedError, 
  NotFoundError,
  ConflictError 
} from '@/core/middleware';

/**
 * Wrapper for server actions with error handling
 */
export function withActionErrorHandler<T extends any[], R>(
  action: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | { success: false; error: string }> => {
    try {
      return await action(...args);
    } catch (error) {
      console.error('Server action error:', error);
      
      // Handle custom errors
      if (error instanceof ValidationError) {
        return { success: false, error: error.message };
      }
      
      if (error instanceof UnauthorizedError) {
        return { success: false, error: error.message };
      }
      
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message };
      }
      
      if (error instanceof ConflictError) {
        return { success: false, error: error.message };
      }
      
      // Handle Prisma errors
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any;
        
        switch (prismaError.code) {
          case 'P2002':
            return { success: false, error: 'A record with this information already exists' };
          case 'P2025':
            return { success: false, error: 'Record not found' };
          case 'P2003':
            return { success: false, error: 'Foreign key constraint failed' };
          case 'P2014':
            return { success: false, error: 'Invalid ID provided' };
          default:
            console.error('Unhandled Prisma error:', prismaError);
            return { success: false, error: 'Database error occurred' };
        }
      }
      
      // Handle standard errors
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'An unknown error occurred' };
    }
  };
}

/**
 * Validate required fields in form data
 */
export function validateFormData(formData: FormData, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !formData.get(field));
  
  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
  }
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, message: string = 'Success') {
  return {
    success: true as const,
    data,
    message,
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: string, code?: string) {
  return {
    success: false as const,
    error,
    code,
  };
}

/**
 * Rate limiting for server actions (simple in-memory implementation)
 */
const actionRateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkActionRateLimit(
  identifier: string, 
  maxAttempts: number = 5, 
  windowMs: number = 15 * 60 * 1000
): void {
  const now = Date.now();
  const key = `action:${identifier}`;
  
  // Clean up expired entries
  if (Math.random() < 0.01) {
    for (const [k, v] of actionRateLimit.entries()) {
      if (v.resetTime <= now) {
        actionRateLimit.delete(k);
      }
    }
  }
  
  const current = actionRateLimit.get(key);
  
  if (!current || current.resetTime <= now) {
    actionRateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }
  
  if (current.count >= maxAttempts) {
    const remainingTime = Math.ceil((current.resetTime - now) / 1000 / 60);
    throw new ValidationError(`Too many attempts. Please try again in ${remainingTime} minutes.`);
  }
  
  current.count++;
}

/**
 * Log action for audit purposes
 */
export function logAction(
  action: string, 
  userId: string, 
  details?: Record<string, any>
): void {
  console.log(`[ACTION] ${action}`, {
    userId,
    timestamp: new Date().toISOString(),
    details,
  });
  
  // In production, you might want to send this to a logging service
  // or store in database for audit trails
}