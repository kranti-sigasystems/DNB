# Comprehensive Middleware System

This document outlines the robust middleware system implemented across the application for enhanced security, validation, error handling, and performance.

## 🚀 Implementation Summary

### **Middleware Architecture**

The middleware system supports both **Next.js App Router** patterns and **Express.js compatibility** for legacy code integration.

#### **Next.js Style Middleware**
- Modern async/await patterns
- NextRequest/NextResponse integration
- Composable middleware chains
- TypeScript-first design

#### **Express Style Middleware**
- Legacy Express.js compatibility
- (req, res, next) pattern support
- Backward compatibility for existing code
- Easy migration path

### **Core Middleware Components**

#### 1. **Authentication & Authorization**
```typescript
// Next.js style
withAuth(handler)
withRole(['business_owner', 'super_admin'])(handler)

// Express style
expressAuthenticateJWT(req, res, next)
requireRole(['business_owner'])(req, res, next)
```

#### 2. **Rate Limiting**
```typescript
// Next.js style
withRateLimit(rateLimitConfigs.auth)(handler)

// Express style
rateLimiter(req, res, next)
expressRateLimit({ windowMs: 15 * 60 * 1000, max: 5 })
```

#### 3. **Input Validation**
```typescript
// Next.js style with Zod
withValidation({
  body: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
  })
})(handler)

// Express style
validateRequest(schema)(req, res, next)
```

#### 4. **Error Handling**
```typescript
// Next.js style
withErrorHandler(handler)

// Express style
asyncHandler(async (req, res, next) => {
  // Your logic here
})
```

#### 5. **Plan & Subscription Management**
```typescript
// Check plan validity
withPlanValidity(handler)

// Check plan limits
withPlanLimit({ feature: 'exports', limit: 100 })(handler)
```

### **Enhanced API Routes**

#### 1. **Authentication API** (`/api/auth/login`)
- ✅ **Rate Limiting**: 5 attempts per 15 minutes
- ✅ **Input Validation**: Email format, required fields
- ✅ **Error Handling**: Standardized error responses
- ✅ **Security**: Prevents brute force attacks

#### 2. **Products API** (`/api/products`)
- ✅ **Authentication**: JWT token validation
- ✅ **Authorization**: Role-based access (business_owner, super_admin)
- ✅ **Rate Limiting**: API rate limits
- ✅ **Input Validation**: Product creation and search validation
- ✅ **Pagination**: Built-in pagination support

#### 3. **Users API** (`/api/users`)
- ✅ **Authentication**: JWT token validation
- ✅ **Authorization**: Role-based access with granular permissions
- ✅ **Rate Limiting**: API rate limits
- ✅ **Input Validation**: User creation and search validation
- ✅ **Data Filtering**: Users only see data they're authorized to see

#### 4. **Webhook API** (`/api/webhook`)
- ✅ **Rate Limiting**: 1000 requests per 5 minutes (high for webhooks)
- ✅ **Error Handling**: Structured webhook event handling
- ✅ **Security**: Stripe signature verification
- ✅ **Reliability**: Separated event handlers for maintainability

## 🔒 Security Features

### **Multi-Layer Rate Limiting**
```typescript
export const rateLimitConfigs = {
  // Strict for authentication
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  
  // Moderate for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests, please try again later.',
  },
  
  // Lenient for general endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Rate limit exceeded, please try again later.',
  },
};
```

### **JWT Authentication**
- **Token validation** with configurable secrets
- **Expiration handling** with refresh token support
- **Role-based authorization** with granular permissions
- **User context injection** for downstream handlers

### **Input Validation & Sanitization**
- **Schema-based validation** using Zod
- **Type safety** with TypeScript
- **Sanitization** of user inputs
- **Detailed validation error messages**

## 🛡️ Advanced Error Handling

### **Custom Error Classes**
```typescript
// Validation errors
throw new ValidationError('Invalid input data');

// Authentication errors
throw new UnauthorizedError('Access token required');

// Authorization errors
throw new ForbiddenError('Insufficient permissions');

// Resource errors
throw new NotFoundError('Resource not found');

// Conflict errors
throw new ConflictError('Resource already exists');

// Rate limiting errors
throw new TooManyRequestsError('Rate limit exceeded');
```

### **Error Response Standardization**
```typescript
// Success responses
return successResponse(200, 'Operation successful', data);

// Error responses
return errorResponse(400, 'Validation failed', validationErrors);

// Legacy Express responses
legacySuccessResponse(res, 200, 'Success', data);
legacyErrorResponse(res, 400, 'Error', error);
```

## 📊 Performance & Monitoring

### **Request/Response Logging**
```typescript
// Automatic request logging
requestLogger(req, res, next);

// Performance monitoring
const startTime = Date.now();
// ... operation ...
console.log(`Operation took ${Date.now() - startTime}ms`);
```

### **Caching Strategy**
- **In-memory rate limit storage** with automatic cleanup
- **Token validation caching** for performance
- **Response headers** for client-side caching

## 🔧 Usage Examples

### **Complete Next.js API Route**
```typescript
import {
  withErrorHandler,
  withAuth,
  withRole,
  withRateLimit,
  withValidation,
  rateLimitConfigs,
  successResponse,
} from '@/core/middleware';

const createProductSchema = {
  body: z.object({
    productName: z.string().min(1),
    species: z.string().min(1),
    price: z.number().positive(),
  }),
};

export const POST = withErrorHandler(
  withRateLimit(rateLimitConfigs.api)(
    withValidation(createProductSchema)(
      withAuth(
        withRole(['business_owner'])(async (req: NextRequest) => {
          const user = (req as any).user;
          const { validatedBody } = req as any;
          
          // Create product with validated data
          const product = await prisma.product.create({
            data: {
              ...validatedBody,
              businessOwnerId: user.businessOwnerId,
            },
          });
          
          return successResponse(201, 'Product created successfully', product);
        })
      )
    )
  )
);
```

### **Express-Style Route (Legacy Compatibility)**
```typescript
import {
  legacyAsyncHandler,
  legacyAuthenticateJWT,
  requireRole,
  legacyRateLimiter,
} from '@/core/middleware';

// Express middleware chain
export const expressRoute = [
  legacyRateLimiter,
  legacyAuthenticateJWT,
  requireRole(['business_owner']),
  legacyAsyncHandler(async (req, res) => {
    // Your Express-style logic here
    const products = await getProducts(req.user.businessOwnerId);
    
    res.status(200).json({
      success: true,
      data: products,
    });
  }),
];
```

### **Plan & Subscription Middleware**
```typescript
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
```

### **Custom Rate Limiting**
```typescript
// Custom rate limit for file uploads
const fileUploadRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: 'Upload limit exceeded. Please try again later.',
};

export const POST_FileUpload = withErrorHandler(
  withRateLimit(fileUploadRateLimit)(
    withAuth(async (req: NextRequest) => {
      // File upload logic
      return successResponse(200, 'File uploaded successfully');
    })
  )
);
```

## 🚀 Helper Utilities

### **CRUD Route Generator**
```typescript
import { createProtectedCRUDRoute } from '@/core/examples/middleware-usage-examples';

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
      body: commonSchemas.createProduct,
    },
    requirePlan: true,
  }
);
```

### **Testing Helpers**
```typescript
import { createMockRequest, createAuthenticatedRequest } from '@/core/examples/middleware-usage-examples';

// Create test request
const mockReq = createMockRequest({
  method: 'POST',
  body: { productName: 'Test Product' },
});

// Create authenticated test request
const authReq = createAuthenticatedRequest('jwt-token', {
  method: 'POST',
  body: { productName: 'Test Product' },
});
```

## 📝 Configuration

### **Environment Variables**
```env
# JWT Configuration
ACCESS_TOKEN_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Database
DATABASE_URL=your-database-url

# External Services
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

### **Middleware Configuration**
```typescript
// Rate limit customization
export const customRateLimits = {
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
  },
  fileUpload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per 15 minutes
  },
};

// Validation schemas
export const customSchemas = {
  createProduct: z.object({
    productName: z.string().min(1).max(100),
    species: z.string().min(1),
    price: z.number().positive(),
  }),
};
```

## 🔄 Migration Guide

### **From Express to Next.js**
```typescript
// Old Express route
app.post('/api/products', 
  rateLimiter,
  authenticateJWT,
  requireRole(['business_owner']),
  asyncHandler(async (req, res) => {
    // Logic here
  })
);

// New Next.js route
export const POST = withErrorHandler(
  withRateLimit(rateLimitConfigs.api)(
    withAuth(
      withRole(['business_owner'])(async (req: NextRequest) => {
        // Same logic here
      })
    )
  )
);
```

## 🚀 Future Enhancements

### **Planned Features**
- [ ] **Redis Integration** - Distributed rate limiting
- [ ] **Metrics Collection** - Performance analytics
- [ ] **Advanced Caching** - Response caching with TTL
- [ ] **Audit Logging** - Complete audit trail system
- [ ] **Health Checks** - API health monitoring endpoints
- [ ] **Circuit Breaker** - Fault tolerance patterns
- [ ] **Request Tracing** - Distributed tracing support

### **Performance Optimizations**
- [ ] **Connection Pooling** - Database connection optimization
- [ ] **Response Compression** - Automatic response compression
- [ ] **CDN Integration** - Static asset optimization
- [ ] **Load Balancing** - Multi-instance support

The middleware system is now production-ready and provides comprehensive protection, validation, and error handling across your entire application! 🎉

## 📚 Additional Resources

- **Examples**: See `src/core/examples/middleware-usage-examples.ts` for comprehensive usage examples
- **Express Compatibility**: Use `src/core/middleware/express-style.middleware.ts` for legacy Express code
- **Response Helpers**: Import from `src/core/handlers/responseHandler.ts` for consistent responses
- **Error Classes**: Import custom error types from `src/core/middleware/error.middleware.ts`