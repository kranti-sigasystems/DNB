'use server';

import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to decode JWT and get business owner ID
async function getBusinessOwnerFromToken(authToken: string) {
  try {
    const decoded = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret') as any;
    
    // If the token has businessOwnerId, use it directly
    if (decoded.businessOwnerId) {
      return decoded.businessOwnerId;
    }
    
    // Otherwise, find business owner by user ID
    if (decoded.id) {
      const businessOwner = await prisma.businessOwner.findFirst({
        where: { userId: decoded.id },
        select: { id: true }
      });
      return businessOwner?.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Debug function to check all buyers in database
export async function debugAllBuyers(authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    
    // Get all buyers for this business owner (no pagination)
    const allBuyers = await prisma.buyer.findMany({
      where: {
        businessOwnerId: businessOwnerId,
      },
      select: {
        id: true,
        contactName: true,
        email: true,
        status: true,
        is_deleted: true,
        businessOwnerId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      success: true,
      data: {
        businessOwnerId,
        totalBuyers: allBuyers.length,
        buyers: allBuyers
      }
    };
  } catch (error) {
    console.error('❌ Error in debugAllBuyers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to debug buyers' 
    };
  }
}

// Get all buyers for business owner
export async function getAllBuyers(params: {
  pageIndex?: number;
  pageSize?: number;
  email?: string;
  status?: string;
  country?: string;
  isVerified?: boolean;
} = {}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const pageIndex = params.pageIndex || 0;
    const pageSize = params.pageSize || 50;
    
    // Build where clause for filtering (but get ALL buyers first like the old code)
    const where: any = {
      businessOwnerId: businessOwnerId,
      is_deleted: false,
    };
    
    // Get ALL buyers first (like the old code), then apply pagination in memory
    const allBuyers = await prisma.buyer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        businessOwner: {
          select: {
            businessName: true,
            email: true
          }
        }
      }
    });
    
    // Apply filters in memory (like the old code)
    let filteredBuyers = allBuyers;
    
    if (params.email) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.email?.toLowerCase().includes(params.email!.toLowerCase())
      );
    }
    if (params.status) {
      filteredBuyers = filteredBuyers.filter(buyer => buyer.status === params.status);
    }
    if (params.country) {
      filteredBuyers = filteredBuyers.filter(buyer => buyer.country === params.country);
    }
    
    // Calculate totals from ALL buyers (not just filtered)
    const totalItems = filteredBuyers.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const totalActive = allBuyers.filter(b => b.status === 'active' && !b.is_deleted).length;
    const totalInactive = allBuyers.filter(b => b.status === 'inactive' && !b.is_deleted).length;
    const totalDeleted = allBuyers.filter(b => b.is_deleted === true).length;
    
    // Apply pagination in memory (like the old code)
    const start = pageIndex * pageSize;
    const paginatedBuyers = filteredBuyers.slice(start, start + pageSize);
    
    const result = {
      success: true,
      data: {
        data: {
          data: paginatedBuyers,
          totalItems: totalItems,
          totalActive: totalActive,
          totalInactive: totalInactive,
          totalDeleted: totalDeleted,
          totalPending: 0,
          totalPages,
          pageIndex,
          pageSize,
          revenueGrowth: 0,
          userGrowth: 0,
        }
      }
    };

    return result;
  } catch (error) {
    console.error('❌ Error in getAllBuyers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch buyers' 
    };
  }
}

// Search buyers - matches your frontend searchBuyers implementation
export async function searchBuyers(filters: {
  page?: number;
  limit?: number;
  email?: string;
  status?: string;
  country?: string;
  isVerified?: boolean;
  contactName?: string;
  buyersCompanyName?: string;
  productName?: string;
  locationName?: string;
}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const pageIndex = filters.page || 0;
    const pageSize = filters.limit || 50;
    
    // Get ALL buyers first (like the old code)
    const allBuyers = await prisma.buyer.findMany({
      where: {
        businessOwnerId: businessOwnerId,
        is_deleted: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        businessOwner: {
          select: {
            businessName: true,
            email: true
          }
        }
      }
    });
    
    // Apply filters in memory (like the old code)
    let filteredBuyers = allBuyers;
    
    if (filters.email) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.email?.toLowerCase().includes(filters.email!.toLowerCase())
      );
    }
    if (filters.status) {
      filteredBuyers = filteredBuyers.filter(buyer => buyer.status === filters.status);
    }
    if (filters.country) {
      filteredBuyers = filteredBuyers.filter(buyer => buyer.country === filters.country);
    }
    if (filters.contactName) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.contactName?.toLowerCase().includes(filters.contactName!.toLowerCase())
      );
    }
    if (filters.buyersCompanyName) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.buyersCompanyName?.toLowerCase().includes(filters.buyersCompanyName!.toLowerCase())
      );
    }
    if (filters.productName) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.productName?.toLowerCase().includes(filters.productName!.toLowerCase())
      );
    }
    if (filters.locationName) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.locationName?.toLowerCase().includes(filters.locationName!.toLowerCase())
      );
    }
    
    
    // Apply pagination in memory (like the old code)
    const totalItems = filteredBuyers.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = pageIndex * pageSize;
    const paginatedBuyers = filteredBuyers.slice(start, start + pageSize);
    
    return {
      success: true,
      data: {
        data: {
          buyers: paginatedBuyers,
          totalItems: totalItems,
          totalPages,
          pageIndex,
          pageSize,
        }
      }
    };
  } catch (error) {
    console.error('Error searching buyers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search buyers' 
    };
  }
}

// Activate buyer - matches your frontend activateBuyer endpoint
export async function activateBuyer(buyerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Update buyer status
    const buyer = await prisma.buyer.update({
      where: { 
        id: buyerId,
        businessOwnerId: businessOwnerId // Ensure buyer belongs to this business owner
      },
      data: { status: 'active' }
    });
    
    return {
      success: true,
      data: { buyer }
    };
  } catch (error) {
    console.error('Error activating buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to activate buyer' 
    };
  }
}

// Deactivate buyer - matches your frontend deactivateBuyer endpoint
export async function deactivateBuyer(buyerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Update buyer status
    const buyer = await prisma.buyer.update({
      where: { 
        id: buyerId,
        businessOwnerId: businessOwnerId // Ensure buyer belongs to this business owner
      },
      data: { status: 'inactive' }
    });
    
    return {
      success: true,
      data: { buyer }
    };
  } catch (error) {
    console.error('Error deactivating buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deactivate buyer' 
    };
  }
}

// Delete buyer - matches your frontend deleteBuyer endpoint
export async function deleteBuyer(buyerId: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Soft delete buyer
    const buyer = await prisma.buyer.update({
      where: { 
        id: buyerId,
        businessOwnerId: businessOwnerId // Ensure buyer belongs to this business owner
      },
      data: { is_deleted: true }
    });
    
    return {
      success: true,
      data: { buyer }
    };
  } catch (error) {
    console.error('Error deleting buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete buyer' 
    };
  }
}

// Get buyer by ID - matches your frontend getBuyerById endpoint
export async function getBuyerById(buyerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const buyer = await prisma.buyer.findFirst({
      where: { 
        id: buyerId,
        businessOwnerId: businessOwnerId,
        is_deleted: false
      },
      include: {
        businessOwner: {
          select: {
            businessName: true,
            email: true
          }
        }
      }
    });
    
    if (!buyer) {
      return { success: false, error: 'Buyer not found' };
    }
    
    return {
      success: true,
      data: { buyer }
    };
  } catch (error) {
    console.error('Error getting buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get buyer' 
    };
  }
}

// Update buyer - matches your frontend updateBuyer endpoint
export async function updateBuyer(buyerId: string, updateData: {
  contactName?: string;
  contactEmail?: string;
  buyersCompanyName?: string;
  status?: string;
  [key: string]: any;
}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Clean the data like your frontend does
    const sanitizedData = { ...updateData };
    delete sanitizedData.createdAt;
    delete sanitizedData.updatedAt;
    delete sanitizedData.id;
    delete sanitizedData.businessOwnerId; // Don't allow changing business owner
    
    const buyer = await prisma.buyer.update({
      where: { 
        id: buyerId,
        businessOwnerId: businessOwnerId
      },
      data: sanitizedData
    });
    
    return {
      success: true,
      data: { buyer }
    };
  } catch (error) {
    console.error('Error updating buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update buyer' 
    };
  }
}

// Create new buyer - matches your frontend addBuyer endpoint
export async function createBuyer(buyerData: {
  contactName: string;
  contactEmail: string;
  buyersCompanyName: string;
  country?: string;
  [key: string]: any;
}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Check if buyer with same email already exists for this business owner
    const existingBuyer = await prisma.buyer.findFirst({
      where: {
        email: buyerData.contactEmail,
        businessOwnerId: businessOwnerId,
        is_deleted: false
      }
    });
    
    if (existingBuyer) {
      return { success: false, error: 'Buyer with this email already exists' };
    }
    
    const buyer = await prisma.buyer.create({
      data: {
        ...buyerData,
        email: buyerData.contactEmail, // Map contactEmail to email
        businessOwnerId: businessOwnerId,
        status: 'active',
        is_deleted: false
      }
    });
    
    return {
      success: true,
      data: { buyer }
    };
  } catch (error) {
    console.error('Error creating buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create buyer' 
    };
  }
}

// Get buyers list - matches your frontend getBuyersList endpoint
export async function getBuyersList(authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const buyers = await prisma.buyer.findMany({
      where: {
        businessOwnerId: businessOwnerId,
        is_deleted: false,
        status: 'active'
      },
      select: {
        id: true,
        contactName: true,
        email: true,
        buyersCompanyName: true
      },
      orderBy: { contactName: 'asc' }
    });
    
    return {
      success: true,
      data: { buyers }
    };
  } catch (error) {
    console.error('Error getting buyers list:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get buyers list' 
    };
  }
}

// Check registration number uniqueness - matches your frontend checkRegistrationNumber endpoint
export async function checkRegistrationNumber(registrationNumber: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    if (!registrationNumber) {
      return { success: false, error: 'Registration number is required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const existingBuyer = await prisma.buyer.findFirst({
      where: {
        registrationNumber: registrationNumber,
        businessOwnerId: businessOwnerId,
        is_deleted: false
      }
    });
    
    return {
      success: true,
      data: { 
        isUnique: !existingBuyer,
        exists: !!existingBuyer
      }
    };
  } catch (error) {
    console.error('Error checking registration number:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check registration number' 
    };
  }
}

// Check unique fields - matches your frontend checkUnique endpoint
export async function checkUnique(params: Record<string, any>, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const where: any = {
      businessOwnerId: businessOwnerId,
      is_deleted: false
    };
    
    // Build where clause from params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        where[key] = value;
      }
    });
    
    const existingBuyer = await prisma.buyer.findFirst({ where });
    
    return {
      success: true,
      data: { 
        isUnique: !existingBuyer,
        exists: !!existingBuyer
      }
    };
  } catch (error) {
    console.error('Error checking unique fields:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check unique fields' 
    };
  }
}

// Get products for business owner
export async function getProducts(authToken?: string, pageIndex = 0, pageSize = 100) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const skip = pageIndex * pageSize;
    
    // Get products for this business owner (using ownerId to match existing table)
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: { ownerId: businessOwnerId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: { ownerId: businessOwnerId } })
    ]);
    
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      success: true,
      data: {
        data: products,
        totalItems: totalCount,
        totalPages,
        pageIndex,
        pageSize
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch products' 
    };
  }
}

// Get locations for business owner
export async function getLocations(authToken?: string, pageIndex = 0, pageSize = 100) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const skip = pageIndex * pageSize;
    
    // Get locations for this business owner (using ownerId to match existing table)
    const [locations, totalCount] = await Promise.all([
      prisma.location.findMany({
        where: { ownerId: businessOwnerId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.location.count({ where: { ownerId: businessOwnerId } })
    ]);
    
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      success: true,
      data: {
        data: locations,
        totalItems: totalCount,
        totalPages,
        pageIndex,
        pageSize
      }
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch locations' 
    };
  }
}

// Get plan usage for business owner
export async function getPlanUsage(authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Get current usage counts (using correct field names)
    const [buyersCount, productsCount, locationsCount] = await Promise.all([
      prisma.buyer.count({ where: { businessOwnerId, is_deleted: false } }),
      prisma.product.count({ where: { ownerId: businessOwnerId } }),
      prisma.location.count({ where: { ownerId: businessOwnerId } })
    ]);
    
    // Default limits (these could come from a plan table in the future)
    const limits = {
      buyers: 50,
      products: 100,
      locations: 25
    };
    
    return {
      success: true,
      data: {
        buyers: {
          used: buyersCount,
          limit: limits.buyers,
          remaining: Math.max(0, limits.buyers - buyersCount)
        },
        products: {
          used: productsCount,
          limit: limits.products,
          remaining: Math.max(0, limits.products - productsCount)
        },
        locations: {
          used: locationsCount,
          limit: limits.locations,
          remaining: Math.max(0, limits.locations - locationsCount)
        }
      }
    };
  } catch (error) {
    console.error('Error fetching plan usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch plan usage' 
    };
  }
}