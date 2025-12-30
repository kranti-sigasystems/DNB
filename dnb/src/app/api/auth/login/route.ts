import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  withErrorHandler, 
  withRateLimit, 
  withValidation, 
  rateLimitConfigs,
  commonSchemas 
} from '@/core/middleware';
import { successResponse, errorResponse } from '@/core/handlers';
import { loginFormAction } from '@/actions/auth.actions';

// Login validation schema
const loginSchema = {
  body: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
    businessName: z.string().optional(),
  }),
};

// POST /api/auth/login - User login with rate limiting and validation
export const POST = withErrorHandler(
  withRateLimit(rateLimitConfigs.auth)(
    withValidation(loginSchema)(async (request: NextRequest) => {
      const { email, password, businessName } = (request as any).validatedBody;

      // Create FormData for the server action
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      if (businessName) {
        formData.append('businessName', businessName);
      }

      // Use the server action for login
      const result = await loginFormAction(null, formData);

      if (result.success) {
        return successResponse(200, 'Login successful', result.data);
      } else {
        return errorResponse(401, result.error || 'Login failed');
      }
    })
  )
);

// GET /api/auth/login - Method not allowed
export const GET = withErrorHandler(async () => {
  return errorResponse(405, 'Method not allowed - use POST');
});