import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import { errorResponse } from '../handlers/responseHandler';

interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

interface ValidatedRequest extends NextRequest {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
}

/**
 * Parse and validate request body
 */
const parseBody = async (req: NextRequest): Promise<any> => {
  try {
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await req.json();
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const body: Record<string, any> = {};
      
      for (const [key, value] of formData.entries()) {
        body[key] = value;
      }
      
      return body;
    }
    
    return {};
  } catch (error) {
    throw new Error('Invalid request body format');
  }
};

/**
 * Parse query parameters from URL
 */
const parseQuery = (req: NextRequest): Record<string, any> => {
  const { searchParams } = new URL(req.url);
  const query: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    // Try to parse numbers and booleans
    if (value === 'true') {
      query[key] = true;
    } else if (value === 'false') {
      query[key] = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      query[key] = Number(value);
    } else {
      query[key] = value;
    }
  }
  
  return query;
};

/**
 * Format Zod validation errors
 */
const formatZodError = (error: ZodError): string => {
  return error.issues
    .map((err: any) => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
};

/**
 * Validation middleware for Next.js API routes
 */
export const validate = (config: ValidationConfig) => {
  return async (req: ValidatedRequest, params?: any): Promise<NextResponse | null> => {
    try {
      // Validate request body
      if (config.body) {
        const body = await parseBody(req);
        
        try {
          req.validatedBody = config.body.parse(body);
        } catch (error) {
          if (error instanceof ZodError) {
            return errorResponse(400, `Body validation failed: ${formatZodError(error)}`);
          }
          throw error;
        }
      }
      
      // Validate query parameters
      if (config.query) {
        const query = parseQuery(req);
        
        try {
          req.validatedQuery = config.query.parse(query);
        } catch (error) {
          if (error instanceof ZodError) {
            return errorResponse(400, `Query validation failed: ${formatZodError(error)}`);
          }
          throw error;
        }
      }
      
      // Validate route parameters
      if (config.params && params) {
        try {
          req.validatedParams = config.params.parse(params);
        } catch (error) {
          if (error instanceof ZodError) {
            return errorResponse(400, `Params validation failed: ${formatZodError(error)}`);
          }
          throw error;
        }
      }
      
      return null; // Validation passed
    } catch (error) {
      console.error('Validation middleware error:', error);
      return errorResponse(500, 'Validation error occurred');
    }
  };
};

/**
 * Wrapper for API routes with validation
 */
export const withValidation = (config: ValidationConfig) => {
  return <T extends any[]>(
    handler: (req: ValidatedRequest, ...args: T) => Promise<NextResponse>
  ) => {
    return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      const validationError = await validate(config)(req as ValidatedRequest, args[0]);
      
      if (validationError) {
        return validationError;
      }
      
      return handler(req as ValidatedRequest, ...args);
    };
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
  }),
  
  // ID parameter
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  
  // Search query
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    sort: z.enum(['asc', 'desc']).default('desc'),
    sortBy: z.string().optional(),
  }),
  
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Phone number validation
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  
  // Date validation
  date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ),
};

/**
 * Validation middleware specifically for authentication routes
 */
export const authValidation = {
  login: withValidation({
    body: z.object({
      email: commonSchemas.email,
      password: z.string().min(1, 'Password is required'),
    }),
  }),
  
  register: withValidation({
    body: z.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
    }),
  }),
  
  resetPassword: withValidation({
    body: z.object({
      email: commonSchemas.email,
    }),
  }),
};