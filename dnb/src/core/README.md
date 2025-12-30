# Robust Middleware Implementation

This document outlines the comprehensive middleware system implemented across the application for enhanced security, validation, error handling, and performance.

## 🚀 Implementation Summary

### **API Routes Enhanced**

#### 1. **Authentication API** (`/api/auth/login`)
- ✅ **Rate Limiting**: 5 attempts per 15 minutes
- ✅ **Input Validation**: Email format, required fields
- ✅ **Error Handling**: Standardized error responses
- ✅ **Security**: Prevents brute force attacks

#### 2. **Checkout API** (`/api/checkout`)
- ✅ **Authentication**: JWT token validation
- ✅ **Authorization**: User can only create checkout for themselves
- ✅ **Rate Limiting**: 100 requests per 15 minutes
- ✅ **Input Validation**: Comprehensive business data validation
- ✅ **Error Handling**: Prisma error handling, Stripe error handling

#### 3. **Webhook API** (`/api/webhook`)
- ✅ **Rate Limiting**: 1000 requests per 5 minutes (high for webhooks)
- ✅ **Error Handling**: Structured webhook event handling
- ✅ **Security**: Stripe signature verification
- ✅ **Reliability**: Separated event handlers for maintainability

#### 4. **Products API** (`/api/products`)
- ✅ **Authentication**: JWT token validation
- ✅ **Authorization**: Role-based access (business_owner, super_admin)
- ✅ **Rate Limiting**: API rate limits
- ✅ **Input Validation**: Product creation and search validation
- ✅ **Pagination**: Built-in pagination support

#### 5. **Users API** (`/api/users`)
- ✅ **Authentication**: JWT token validation
- ✅ **Authorization**: Role-based access with granular permissions
- ✅ **Rate Limiting**: API rate limits
- ✅ **Input Validation**: User creation and search validation
- ✅ **Data Filtering**: Users only see data they're authorized to see

### **Middleware Components**

#### **Authentication & Authorization**
```typescript
// JWT Authentication
withAuth(handler)

// Role-based Authorization
withRole(['business_owner', 'super_admin'])(handler)

// Combined
withAuth(withRole(['business_owner'])(handler))
```

#### **Rate Limiting**
```typescript
// Predefined configurations
withRateLimit(rateLimitConfigs.auth)    // 5 req/15min
withRateLimit(rateLimitConfigs.api)     // 100 req/15min
withRateLimit(rateLimitConfigs.general) // 1000 req/15min

// Custom configuration
withRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Custom rate limit message'
})(handler)
```

#### **Input Validation**
```typescript
// Schema validation
const schema = {
  body: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
  }),
  query: z.object({
    page: z.number().min(1).default(1),
  })
};

withValidation(schema)(handler)
```

#### **Error Handling**
```typescript
// Global error wrapper
withErrorHandler(handler)

// Custom error types
throw new ValidationError('Invalid input');
throw new UnauthorizedError('Access denied');
throw new NotFoundError('Resource not found');
```

### **Response Helpers**
```typescript
// Success responses
return successResponse(200, 'Success message', data);

// Error responses
return errorResponse(400, 'Error message');
```

## 🔒 Security Features

### **Rate Limiting**
- **Authentication endpoints**: 5 attempts per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **General endpoints**: 1000 requests per 15 minutes
- **Webhooks**: 1000 requests per 5 minutes
- **IP-based tracking** with user ID fallback

### **Authentication**
- **JWT token validation** on protected routes
- **Token expiration handling**
- **Signature verification**
- **User context injection**

### **Authorization**
- **Role-based access control**
- **Resource-level permissions**
- **User ownership validation**
- **Granular permission checks**

### **Input Validation**
- **Schema-based validation** using Zod
- **Type safety** with TypeScript
- **Sanitization** of user inputs
- **Detailed error messages**

## 🛡️ Error Handling

### **Custom Error Classes**
- `ValidationError` - Input validation failures
- `UnauthorizedError` - Authentication failures
- `ForbiddenError` - Authorization failures
- `NotFoundError` - Resource not found
- `ConflictError` - Data conflicts
- `TooManyRequestsError` - Rate limit exceeded

### **Database Error Handling**
- **Prisma error mapping** to user-friendly messages
- **Constraint violation handling**
- **Connection error recovery**
- **Transaction rollback support**

### **Logging & Monitoring**
- **Structured error logging**
- **Request/response logging**
- **Performance monitoring**
- **Audit trail support**

## 📊 Performance Features

### **Caching**
- **In-memory rate limit storage**
- **Token validation caching**
- **Response caching headers**

### **Optimization**
- **Lazy loading** of middleware
- **Efficient database queries**
- **Minimal payload responses**
- **Compression support**

## 🔧 Usage Examples

### **Complete API Route**
```typescript
export const POST = withErrorHandler(
  withRole(['business_owner'])(
    withValidation(createProductSchema)(
      withRateLimit(rateLimitConfigs.api)(async (req: NextRequest) => {
        const user = (req as any).user;
        const data = (req as any).validatedBody;
        
        // Your business logic here
        const result = await createProduct(data, user.id);
        
        return successResponse(201, 'Product created', result);
      })
    )
  )
);
```

### **Server Action Enhancement**
```typescript
import { withActionErrorHandler, validateFormData } from '@/core/utils/action-helpers';

export const createProductAction = withActionErrorHandler(async (formData: FormData) => {
  validateFormData(formData, ['productName', 'species']);
  
  const productName = formData.get('productName') as string;
  const species = formData.get('species') as string;
  
  // Your logic here
  const product = await prisma.product.create({
    data: { productName, species }
  });
  
  return createSuccessResponse(product, 'Product created successfully');
});
```

## 🚀 Next Steps

### **Immediate Benefits**
- ✅ **Enhanced Security** - Rate limiting, authentication, authorization
- ✅ **Better UX** - Consistent error messages, proper validation
- ✅ **Maintainability** - Centralized error handling, reusable middleware
- ✅ **Monitoring** - Structured logging, error tracking
- ✅ **Performance** - Optimized request handling, caching

### **Future Enhancements**
- [ ] **Redis Integration** - For distributed rate limiting
- [ ] **Metrics Collection** - Performance and usage analytics
- [ ] **Advanced Caching** - Response caching, CDN integration
- [ ] **Audit Logging** - Complete audit trail system
- [ ] **Health Checks** - API health monitoring endpoints

## 📝 Configuration

### **Environment Variables Required**
```env
ACCESS_TOKEN_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
DATABASE_URL=your-database-url
```

### **Rate Limit Configuration**
Adjust rate limits in `src/core/middleware/rate-limit.middleware.ts`:
```typescript
export const rateLimitConfigs = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  api: { windowMs: 15 * 60 * 1000, max: 100 },
  general: { windowMs: 15 * 60 * 1000, max: 1000 },
};
```

The middleware system is now production-ready and provides comprehensive protection, validation, and error handling across your entire application! 🎉