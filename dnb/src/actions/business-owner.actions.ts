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

// Get all buyers for business owner
export async function getAllBuyers(params: {
  pageIndex?: number;
  pageSize?: number;
  email?: string;
  status?: string;
  country?: string;
  isVerified?: boolean;
} = {}, authToken?: string) {
  console.log('🔍 getAllBuyers called with params:', params);
  console.log('🔑 authToken provided:', !!authToken);
  
  try {
    if (!authToken) {
      console.log('❌ No authToken provided');
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    console.log('🏢 businessOwnerId from token:', businessOwnerId);
    
    if (!businessOwnerId) {
      console.log('❌ No businessOwnerId found');
      return { success: false, error: 'Business owner not found' };
    }
    
    const pageIndex = params.pageIndex || 0;
    const pageSize = params.pageSize || 10;
    const skip = pageIndex * pageSize;
    
    console.log('📄 Pagination:', { pageIndex, pageSize, skip });
    
    // Build where clause
    const where: any = {
      businessOwnerId: businessOwnerId,
      is_deleted: false,
    };
    
    if (params.email) {
      where.email = { contains: params.email, mode: 'insensitive' };
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.country) {
      where.country = params.country;
    }
    
    console.log('🔍 Where clause:', where);
    
    // Get buyers with pagination
    const [buyers, totalCount] = await Promise.all([
      prisma.buyer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          businessOwner: {
            select: {
              businessName: true,
              email: true
            }
          }
        }
      }),
      prisma.buyer.count({ where })
    ]);
    
    console.log('📊 Query results:');
    console.log('  - Total buyers found:', totalCount);
    console.log('  - Buyers returned:', buyers.length);
    console.log('  - Buyers data:', buyers.map(b => ({ 
      id: b.id, 
      name: b.contactName, 
      email: b.email, 
      company: b.buyersCompanyName,
      status: b.status 
    })));
    
    // Get status counts
    const [activeCount, inactiveCount, deletedCount] = await Promise.all([
      prisma.buyer.count({ where: { ...where, status: 'active' } }),
      prisma.buyer.count({ where: { ...where, status: 'inactive' } }),
      prisma.buyer.count({ where: { businessOwnerId, is_deleted: true } })
    ]);
    
    console.log('📈 Status counts:', { activeCount, inactiveCount, deletedCount });
    
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const result = {
      success: true,
      data: {
        data: {
          data: buyers,
          totalItems: totalCount,
          totalActive: activeCount,
          totalInactive: inactiveCount,
          totalDeleted: deletedCount,
          totalPending: 0,
          totalPages,
          pageIndex,
          pageSize,
          revenueGrowth: 0,
          userGrowth: 0,
        }
      }
    };
    
    console.log('✅ getAllBuyers returning result structure:', {
      success: result.success,
      dataKeys: Object.keys(result.data),
      dataDataKeys: Object.keys(result.data.data),
      buyersCount: result.data.data.data.length
    });
    
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
    const pageSize = filters.limit || 10;
    const skip = pageIndex * pageSize;
    
    // Build where clause
    const where: any = {
      businessOwnerId: businessOwnerId,
      is_deleted: false,
    };
    
    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.country) {
      where.country = filters.country;
    }
    if (filters.contactName) {
      where.contactName = { contains: filters.contactName, mode: 'insensitive' };
    }
    if (filters.buyersCompanyName) {
      where.buyersCompanyName = { contains: filters.buyersCompanyName, mode: 'insensitive' };
    }
    if (filters.productName) {
      where.productName = { contains: filters.productName, mode: 'insensitive' };
    }
    if (filters.locationName) {
      where.locationName = { contains: filters.locationName, mode: 'insensitive' };
    }
    
    // Get buyers with pagination
    const [buyers, totalCount] = await Promise.all([
      prisma.buyer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          businessOwner: {
            select: {
              businessName: true,
              email: true
            }
          }
        }
      }),
      prisma.buyer.count({ where })
    ]);
    
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      success: true,
      data: {
        data: {
          buyers: buyers,
          totalItems: totalCount,
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