// Core middleware exports for Next.js application
export { checkPlanLimit, withPlanLimit } from './check-plan-limit.middleware';
export { checkPlanValidity, withPlanValidity, default as checkPlanValidityDefault } from './check-plan-validity.middleware';

// Authentication middleware
export { 
  authenticateJWT, 
  authenticateAccessToken, 
  withAuth, 
  withRole, 
  getAuthenticatedUser 
} from './auth.middleware';

// Rate limiting middleware
export { 
  rateLimit, 
  withRateLimit, 
  rateLimiters,
  rateLimitConfigs 
} from './rate-limit.middleware';

// Validation middleware
export { 
  validate, 
  withValidation, 
  commonSchemas, 
  authValidation 
} from './validation.middleware';

// Error handling middleware
export { 
  errorMiddleware,
  withErrorHandler,
  asyncErrorHandler,
  handleError,
  logError,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError
} from './error.middleware';