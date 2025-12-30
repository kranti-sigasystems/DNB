/**
 * Comprehensive middleware usage examples
 * This file demonstrates how to use all the middleware components in different scenarios
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  // Next.js style middleware
  withAuth,
  withRole,
  withRateLimit,
  withValidation,
  withErrorHandler,
  rateLimitConfigs,
  commonSchemas,
  
  // Express-style middleware
  legacyAsyncHandler,
  legacyErrorHandler,
  legacyAuthenticateJWT,
  legacyRateLimiter,
  requireRole,
  
  // Plan checking middleware
  withPlanLimit,
  withPlanValidity,
  
  // Response helpers
  successResponse,
  errorResponse,
} from '../middleware';

// ============================================================================
// NEXT.JS API ROUTE EXAMPLES
// ============================================================================

/**
 * Example 1: Simple authenticated API route
 */
export const GET_SimpleAuth = withErrorHandler(
  withAuth(async (req: NextRequest) => {
    const user = (req as any).user;
    return successResponse(200, 'User data retrieved', { user });
  })
);

/**
 * Example 2: Role-based protected route with rate limiting
 */
export const POST_AdminOnly = withErrorHandler(
  withRateLimit(rateLimitConfigs.api)(
    withRole(['super_admin', 'business_owner'])(async (req: NextRequest) => {
      const body = await req.json();
      // Process admin-only operation
      return successResponse(200, 'Admin operation completed', body);
    })
  )
);

/**
 * Example 3: Validation + Authentication + Rate Limiting
 */
const createUserSchema = {
  body: commonSchemas.createUser, // Assuming this exists
};

export const POST_CreateUser = withErrorHandler(
  withRateLimit(rateLimitConfigs.auth)(
    withValidation(createUserSchema)(
      withAuth(async (req: NextRequest) => {
        const { validatedBody } = req as any;
        // Create user with validated data
        return successResponse(201, 'User created successfully', validatedBody);
      })
    )
  )
);

/**
 * Example 4: Plan checking middleware
 */
export const POST_PremiumFeature = withErrorHandler(
  withAuth(
    withPlanValidity(
      withPlanLimit({ feature: 'premium_exports', limit: 100 })(
        async (req: NextRequest) => {
          // Premium feature logic
          return successResponse(200, 'Premium feature executed');
        }
      )
    )
  )
);

/**
 * Example 5: Complex middleware chain
 */
export const POST_ComplexRoute = withErrorHandler(
  withRateLimit(rateLimitConfigs.api)(
    withValidation({
      body: commonSchemas.complexOperation,
    })(
      withAuth(
        withRole(['business_owner'])(
          withPlanValidity(async (req: NextRequest) => {
            const user = (req as any).user;
            const { validatedBody } = req as any;
            
            // Complex business logic here
            return successResponse(200, 'Complex operation completed', {
              user: user.id,
              operation: validatedBody,
            });
          })
        )
      )
    )
  )
);

// ============================================================================
// EXPRESS-STYLE MIDDLEWARE EXAMPLES (for compatibility)
// ============================================================================

/**
 * Example 6: Express-style route handler
 */
export const expressStyleHandler = legacyAsyncHandler(async (req: any, res: any, next: any) => {
  try {
    // Your Express-style logic here
    const data = { message: 'Express-style handler working' };
    
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Example 7: Express middleware chain
 */
export const expressMiddlewareChain = [
  legacyRateLimiter,
  legacyAuthenticateJWT,
  requireRole(['business_owner']),
  legacyAsyncHandler(async (req: any, res: any) => {
    // Protected Express-style handler
    res.status(200).json({
      success: true,
      message: 'Protected Express route',
      user: req.user,
    });
  }),
];

// ============================================================================
// MIDDLEWARE CONFIGURATION EXAMPLES
// ============================================================================

/**
 * Custom rate limit configurations
 */
export const customRateLimits = {
  // Very strict for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many password reset attempts. Please try again in 1 hour.',
  },
  
  // Moderate for file uploads
  fileUpload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per 15 minutes
    message: 'Upload limit exceeded. Please try again later.',
  },
  
  // Lenient for public API
  publicApi: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'API rate limit exceeded.',
  },
};

/**
 * Example 8: Custom rate limited route
 */
export const POST_FileUpload = withErrorHandler(
  withRateLimit(customRateLimits.fileUpload)(
    withAuth(async (req: NextRequest) => {
      // File upload logic
      return successResponse(200, 'File uploaded successfully');
    })
  )
);

/**
 * Example 9: Password reset with strict rate limiting
 */
export const POST_PasswordReset = withErrorHandler(
  withRateLimit(customRateLimits.passwordReset)(
    withValidation({
      body: commonSchemas.passwordReset,
    })(async (req: NextRequest) => {
      const { validatedBody } = req as any;
      // Password reset logic
      return successResponse(200, 'Password reset email sent');
    })
  )
);

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

/**
 * Example 10: Manual error handling
 */
export const GET_ManualErrorHandling = async (req: NextRequest) => {
  try {
    // Some operation that might fail
    const riskyOperation = () => {
      throw new Error('Something went wrong');
    };
    
    riskyOperation();
    
    return successResponse(200, 'Operation successful');
  } catch (error) {
    console.error('Manual error handling:', error);
    return errorResponse(500, 'Operation failed', error);
  }
};

/**
 * Example 11: Automatic error handling with withErrorHandler
 */
export const GET_AutoErrorHandling = withErrorHandler(async (req: NextRequest) => {
  // This will automatically catch and handle any errors
  throw new Error('This error will be caught automatically');
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper function to create a standard CRUD API with all middleware
 */
export const createProtectedCRUDRoute = (
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    roles?: string[];
    rateLimit?: any;
    validation?: any;
    requirePlan?: boolean;
  } = {}
) => {
  const {
    roles = ['business_owner'],
    rateLimit = rateLimitConfigs.api,
    validation,
    requirePlan = false,
  } = options;

  let middlewareChain = withErrorHandler(
    withRateLimit(rateLimit)(
      withAuth(
        withRole(roles)(handler)
      )
    )
  );

  // Add validation if provided
  if (validation) {
    middlewareChain = withErrorHandler(
      withRateLimit(rateLimit)(
        withValidation(validation)(
          withAuth(
            withRole(roles)(handler)
          )
        )
      )
    );
  }

  // Add plan validation if required
  if (requirePlan) {
    middlewareChain = withErrorHandler(
      withRateLimit(rateLimit)(
        withAuth(
          withRole(roles)(
            withPlanValidity(handler)
          )
        )
      )
    );
  }

  return middlewareChain;
};

/**
 * Example 12: Using the CRUD helper
 */
export const POST_CreateProduct = createProtectedCRUDRoute(
  async (req: NextRequest) => {
    const body = await req.json();
    // Create product logic
    return successResponse(201, 'Product created', body);
  },
  {
    roles: ['business_owner'],
    rateLimit: rateLimitConfigs.api,
    validation: {
      body: commonSchemas.createProduct, // Assuming this exists
    },
    requirePlan: true,
  }
);

// ============================================================================
// TESTING HELPERS
// ============================================================================

/**
 * Mock request helper for testing
 */
export const createMockRequest = (options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  url?: string;
}) => {
  const { method = 'GET', headers = {}, body, url = '/api/test' } = options;
  
  return new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * Test authenticated request
 */
export const createAuthenticatedRequest = (token: string, options: any = {}) => {
  return createMockRequest({
    ...options,
    headers: {
      ...options.headers,
      authorization: `Bearer ${token}`,
    },
  });
};

// Export all examples for easy importing
export default {
  nextjsExamples: {
    GET_SimpleAuth,
    POST_AdminOnly,
    POST_CreateUser,
    POST_PremiumFeature,
    POST_ComplexRoute,
    POST_FileUpload,
    POST_PasswordReset,
    GET_ManualErrorHandling,
    GET_AutoErrorHandling,
    POST_CreateProduct,
  },
  expressExamples: {
    expressStyleHandler,
    expressMiddlewareChain,
  },
  utilities: {
    createProtectedCRUDRoute,
    createMockRequest,
    createAuthenticatedRequest,
  },
  configurations: {
    customRateLimits,
  },
};