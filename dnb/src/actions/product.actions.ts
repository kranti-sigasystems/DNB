'use server';

import { prisma } from '@/lib/prisma';
import { ensureAuthenticated } from '@/utils/tokenManager';
import { decodeTokenClient } from '@/utils/token-utils';
import type { 
  Product, 
  ProductFormData, 
  ProductsResponse, 
  ProductSearchParams,
  CreateProductResponse,
  ProductActionResponse 
} from '@/types/product';

/**
 * Get business owner ID from auth token
 */
async function getBusinessOwnerIdFromToken(authToken: string): Promise<string> {
  const decoded = decodeTokenClient(authToken);
  
  if (!decoded?.businessOwnerId && !decoded?.ownerId) {
    throw new Error('Business owner ID not found in token');
  }
  
  return decoded.businessOwnerId || decoded.ownerId!;
}

/**
 * Get all products for the authenticated business owner
 */
export async function getProducts(
  params: ProductSearchParams = {},
  authToken?: string
): Promise<ProductsResponse> {
  try {
    const token = authToken || await ensureAuthenticated();
    const ownerId = await getBusinessOwnerIdFromToken(token);
    
    const { pageIndex = 0, pageSize = 10, ...filters } = params;
    const skip = pageIndex * pageSize;
    
    // Build where clause
    const where: any = { ownerId };
    
    if (filters.productName) {
      where.productName = {
        contains: filters.productName,
        mode: 'insensitive',
      };
    }
    
    if (filters.code) {
      where.code = {
        contains: filters.code,
        mode: 'insensitive',
      };
    }
    
    if (filters.species) {
      where.species = {
        has: filters.species,
      };
    }
    
    if (filters.query) {
      where.OR = [
        {
          productName: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
      ];
    }
    
    // Get products with pagination
    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { productName: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);
    
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      data: products,
      totalItems,
      totalPages,
      pageIndex,
      pageSize,
    };
  } catch (error: any) {
    console.error('❌ Error fetching products:', error);
    throw new Error(error.message || 'Failed to fetch products');
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(
  productId: string,
  authToken?: string
): Promise<ProductActionResponse> {
  try {
    const token = authToken || await ensureAuthenticated();
    const ownerId = await getBusinessOwnerIdFromToken(token);
    
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId,
      },
    });
    
    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }
    
    return {
      success: true,
      data: product,
    };
  } catch (error: any) {
    console.error('❌ Error fetching product:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch product',
    };
  }
}

/**
 * Create a single product
 */
export async function createProduct(
  product: ProductFormData,
  authToken?: string
): Promise<CreateProductResponse> {
  return createProducts(product, authToken);
}

/**
 * Create new product(s)
 */
export async function createProducts(
  products: ProductFormData | ProductFormData[],
  authToken?: string
): Promise<CreateProductResponse> {
  try {
    const token = authToken || await ensureAuthenticated();
    const ownerId = await getBusinessOwnerIdFromToken(token);
    
    const productsArray = Array.isArray(products) ? products : [products];
    
    // Validate required fields
    for (const product of productsArray) {
      if (!product.code || !product.productName || !product.species?.length) {
        return {
          success: false,
          error: 'Code, product name, and at least one species are required',
        };
      }
    }
    
    // Check for duplicate codes within the request
    const codes = productsArray.map(p => p.code.trim());
    const duplicateCodes = codes.filter((code, idx) => codes.indexOf(code) !== idx);
    
    if (duplicateCodes.length > 0) {
      return {
        success: false,
        error: `Duplicate product codes in request: ${[...new Set(duplicateCodes)].join(', ')}`,
      };
    }
    
    // Check for existing products with same codes
    const existingProducts = await prisma.product.findMany({
      where: {
        code: { in: codes },
        ownerId,
      },
      select: { code: true },
    });
    
    if (existingProducts.length > 0) {
      const existingCodes = existingProducts.map(p => p.code);
      return {
        success: false,
        error: `Products with these codes already exist: ${existingCodes.join(', ')}`,
      };
    }
    
    // Create products
    const productsToCreate = productsArray.map(product => ({
      code: product.code,
      productName: product.productName,
      species: product.species,
      size: product.size || [], // Ensure size is always an array, never undefined
      sku: product.sku,
      ownerId,
    }));
    
    if (productsArray.length === 1) {
      const createdProduct = await prisma.product.create({
        data: productsToCreate[0],
      });
      
      return {
        success: true,
        data: createdProduct,
      };
    } else {
      const createdProducts = await prisma.product.createMany({
        data: productsToCreate,
      });
      
      return {
        success: true,
        data: createdProducts as any,
      };
    }
  } catch (error: any) {
    console.error('❌ Error creating products:', error);
    return {
      success: false,
      error: error.message || 'Failed to create products',
    };
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: string,
  productData: Partial<ProductFormData>,
  authToken?: string
): Promise<ProductActionResponse> {
  try {
    const token = authToken || await ensureAuthenticated();
    const ownerId = await getBusinessOwnerIdFromToken(token);
    
    // Check if product exists and belongs to owner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId,
      },
    });
    
    if (!existingProduct) {
      return {
        success: false,
        error: 'Product not found',
      };
    }
    
    // Check for code uniqueness if code is being updated
    if (productData.code && productData.code !== existingProduct.code) {
      const codeExists = await prisma.product.findFirst({
        where: {
          code: productData.code,
          ownerId,
          id: { not: productId },
        },
      });
      
      if (codeExists) {
        return {
          success: false,
          error: `Product with code '${productData.code}' already exists`,
        };
      }
    }
    
    // Prepare update data with proper size handling
    const updateData: any = {};
    
    if (productData.code !== undefined) updateData.code = productData.code;
    if (productData.productName !== undefined) updateData.productName = productData.productName;
    if (productData.species !== undefined) updateData.species = productData.species;
    if (productData.size !== undefined) updateData.size = productData.size || []; // Ensure array
    if (productData.sku !== undefined) updateData.sku = productData.sku;

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });
    
    return {
      success: true,
      data: updatedProduct,
    };
  } catch (error: any) {
    console.error('❌ Error updating product:', error);
    return {
      success: false,
      error: error.message || 'Failed to update product',
    };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(
  productId: string,
  authToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = authToken || await ensureAuthenticated();
    const ownerId = await getBusinessOwnerIdFromToken(token);
    
    // Check if product exists and belongs to owner
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId,
      },
    });
    
    if (!existingProduct) {
      return {
        success: false,
        error: 'Product not found',
      };
    }
    
    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Error deleting product:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete product',
    };
  }
}

/**
 * Search products
 */
export async function searchProducts(
  searchParams: ProductSearchParams,
  authToken?: string
): Promise<ProductsResponse> {
  try {
    // Use the same logic as getProducts since it already handles search
    return await getProducts(searchParams, authToken);
  } catch (error: any) {
    console.error('❌ Error searching products:', error);
    throw new Error(error.message || 'Failed to search products');
  }
}