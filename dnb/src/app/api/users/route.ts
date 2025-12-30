import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  withErrorHandler, 
  withRole, 
  withRateLimit, 
  withValidation, 
  rateLimitConfigs,
  commonSchemas 
} from '@/core/middleware';
import { successResponse, errorResponse } from '@/core/handlers';
import { getBusinessOwners, getBuyers } from '@/actions/business-owner.actions';

// User validation schemas
const listUsersSchema = {
  query: z.object({
    pageIndex: z.number().min(0).default(0),
    pageSize: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    userRole: z.enum(['business_owner', 'buyer', 'super_admin']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

const createUserSchema = {
  body: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    userRole: z.enum(['business_owner', 'buyer']),
    businessName: z.string().optional(),
    phoneNumber: commonSchemas.phone.optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
  }),
};

// GET /api/users - List users (role-based access)
export const GET = withErrorHandler(
  withRole(['business_owner', 'super_admin'])(
    withValidation(listUsersSchema)(
      withRateLimit(rateLimitConfigs.api)(async (req: NextRequest) => {
        const user = (req as any).user;
        const { pageIndex, pageSize, search, status, userRole, sortBy, sortOrder } = (req as any).validatedQuery;

        const searchParams = {
          pageIndex,
          pageSize,
          search,
          status,
          sortBy,
          sortOrder,
        };

        let result;

        // Super admin can see all users, business owners can only see their buyers
        if (user.userRole === 'super_admin') {
          if (userRole === 'buyer') {
            result = await getBuyers(searchParams, user.accessToken || '');
          } else {
            result = await getBusinessOwners(searchParams, user.accessToken || '');
          }
        } else if (user.userRole === 'business_owner') {
          // Business owners can only see their buyers
          result = await getBuyers(searchParams, user.accessToken || '');
        } else {
          return errorResponse(403, 'Insufficient permissions');
        }

        if (result.success) {
          return successResponse(200, 'Users retrieved successfully', result.data);
        } else {
          return errorResponse(400, result.error || 'Failed to retrieve users');
        }
      })
    )
  )
);

// POST /api/users - Create new user (super admin only)
export const POST = withErrorHandler(
  withRole(['super_admin'])(
    withValidation(createUserSchema)(
      withRateLimit(rateLimitConfigs.api)(async (req: NextRequest) => {
        const user = (req as any).user;
        const userData = (req as any).validatedBody;

        // Implementation would go here - create user logic
        // For now, return a placeholder response
        return successResponse(201, 'User creation endpoint - implementation needed', {
          message: 'This endpoint needs to be connected to user creation logic',
          userData,
        });
      })
    )
  )
);