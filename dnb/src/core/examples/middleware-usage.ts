/**
 * Examples of how to use the middleware components in Next.js API routes
 * 
 * This file demonstrates various patterns and combinations of middleware usage.
 * Copy these examples to your actual API route files.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  withRole,
  withRateLimit,
  withValidation,
  withErrorHandler,
  rateLimitConfigs,
  commonSchemas,
} from '@/core/middleware';
import { successResponse, errorResponse } from '@/core/handlers';

// Example 1: Simple authenticated endpoint
export const authenticatedEndpoint = withAuth(async (req) => {
  const user = (req as any).user; // User is automatically available after authentication
  
  return successResponse(200, 'Success', { user });
});

// Example 2: Role-based endpoint (only business owners can access)
export const businessOwnerEndpoint = withRole(['business_owner'])(async (req) => {
  const user = (req as any).user;
  
  return successResponse(200, 'Business owner data', { user });
});

// Example 3: Rate limited endpoint
export const rateLimitedEndpoint = withRateLimit(rateLimitConfigs.api)(async (req) => {
  return successResponse(200, 'Rate limited response');
});

// Example 4: Validated endpoint with custom schema
const createUserSchema = {
  body: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['business_owner', 'buyer']),
  }),
};

export const validatedEndpoint = withValidation(createUserSchema)(async (req) => {
  const { email, password, firstName, lastName, role } = (req as any).validatedBody;
  
  // Data is automatically validated and available in req.validatedBody
  return successResponse(201, 'User created', {
    email,
    firstName,
    lastName,
    role,
  });
});

// Example 5: Combined middleware (authentication + validation + rate limiting)
const updateProfileSchema = {
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    businessName: z.string().min(1).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const combinedMiddlewareEndpoint = withErrorHandler(
  withAuth(
    withValidation(updateProfileSchema)(
      withRateLimit(rateLimitConfigs.api)(async (req, { params }) => {
        const user = (req as any).user;
        const updateData = (req as any).validatedBody;
        const { id } = (req as any).validatedParams;
        
        // Check if user can update this profile
        if (user.id !== id && user.userRole !== 'super_admin') {
          return errorResponse(403, 'Cannot update another user\'s profile');
        }
        
        // Update logic here...
        return successResponse(200, 'Profile updated', { id, updateData });
      })
    )
  )
);

// Example 6: Error handling with custom errors
import { NotFoundError, ValidationError } from '@/core/middleware';

export const errorHandlingExample = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    throw new ValidationError('User ID is required');
  }
  
  // Simulate user lookup
  const user = null; // Simulate user not found
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  return successResponse(200, 'User found', { user });
});

// Example 7: Complete CRUD endpoint with all middleware
const productSchema = {
  body: z.object({
    productName: z.string().min(1, 'Product name is required'),
    species: z.array(z.string()).min(1, 'At least one species is required'),
    code: z.string().min(1, 'Product code is required'),
    sku: z.string().optional(),
  }),
};

// POST /api/products - Create product
export const createProduct = withErrorHandler(
  withRole(['business_owner'])(
    withValidation(productSchema)(
      withRateLimit(rateLimitConfigs.api)(async (req) => {
        const user = (req as any).user;
        const productData = (req as any).validatedBody;
        
        // Create product logic here...
        const newProduct = {
          id: 'generated-id',
          ...productData,
          ownerId: user.id,
          createdAt: new Date(),
        };
        
        return successResponse(201, 'Product created successfully', newProduct);
      })
    )
  )
);

// GET /api/products - List products with pagination
const listProductsSchema = {
  query: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    species: z.string().optional(),
  }),
};

export const listProducts = withErrorHandler(
  withAuth(
    withValidation(listProductsSchema)(
      withRateLimit(rateLimitConfigs.general)(async (req) => {
        const user = (req as any).user;
        const { page, limit, search, species } = (req as any).validatedQuery;
        
        // List products logic here...
        const products: any[] = []; // Fetch from database
        const total = 0; // Total count
        
        return successResponse(200, 'Products retrieved successfully', {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      })
    )
  )
);

// Example 8: File upload endpoint with validation
const uploadSchema = {
  query: z.object({
    type: z.enum(['avatar', 'document', 'product-image']),
  }),
};

export const uploadFile = withErrorHandler(
  withAuth(
    withValidation(uploadSchema)(
      withRateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10, // 10 uploads per 15 minutes
        message: 'Too many upload attempts',
      })(async (req) => {
        const user = (req as any).user;
        const { type } = (req as any).validatedQuery;
        
        // File upload logic here...
        return successResponse(200, 'File uploaded successfully', {
          type,
          url: 'https://example.com/uploaded-file.jpg',
        });
      })
    )
  )
);

/**
 * Usage in actual API route files:
 * 
 * // app/api/products/route.ts
 * export { createProduct as POST, listProducts as GET } from '@/core/examples/middleware-usage';
 * 
 * // app/api/upload/route.ts
 * export { uploadFile as POST } from '@/core/examples/middleware-usage';
 * 
 * // app/api/users/[id]/route.ts
 * export { combinedMiddlewareEndpoint as PUT } from '@/core/examples/middleware-usage';
 */