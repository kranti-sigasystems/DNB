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
import { getProducts, createProduct } from '@/actions/product.actions';

// Product validation schemas
const createProductSchema = {
  body: z.object({
    productName: z.string().min(1, 'Product name is required'),
    species: z.array(z.string().min(1)).min(1, 'At least one species is required'),
    code: z.string().min(1, 'Product code is required'),
    sku: z.string().optional(),
    description: z.string().optional(),
  }),
};

const listProductsSchema = {
  query: z.object({
    pageIndex: z.number().min(0).default(0),
    pageSize: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    species: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

// GET /api/products - List products with pagination and search
export const GET = withErrorHandler(
  withRole(['business_owner', 'super_admin'])(
    withValidation(listProductsSchema)(
      withRateLimit(rateLimitConfigs.api)(async (req: NextRequest) => {
        const user = (req as any).user;
        const { pageIndex, pageSize, search, species, sortBy, sortOrder } = (req as any).validatedQuery;

        const searchParams = {
          pageIndex,
          pageSize,
          search,
          species,
          sortBy,
          sortOrder,
        };

        const result = await getProducts(searchParams, user.accessToken || '');

        if (result.success) {
          return successResponse(200, 'Products retrieved successfully', result.data);
        } else {
          return errorResponse(400, result.error || 'Failed to retrieve products');
        }
      })
    )
  )
);

// POST /api/products - Create new product
export const POST = withErrorHandler(
  withRole(['business_owner'])(
    withValidation(createProductSchema)(
      withRateLimit(rateLimitConfigs.api)(async (req: NextRequest) => {
        const user = (req as any).user;
        const productData = (req as any).validatedBody;

        const result = await createProduct(productData, user.accessToken || '');

        if (result.success) {
          return successResponse(201, 'Product created successfully', result.data);
        } else {
          return errorResponse(400, result.error || 'Failed to create product');
        }
      })
    )
  )
);