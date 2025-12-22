'use server';

import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to decode JWT and get user info
async function getUserFromToken(authToken: string) {
  try {
    const decoded = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret') as any;
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Get all business owners using Prisma
export async function getAllBusinessOwners(params: {
  pageIndex?: number;
  pageSize?: number;
  withBuyers?: boolean;
  email?: string;
  status?: string;
  country?: string;
  isVerified?: boolean;
} = {}, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const user = await getUserFromToken(authToken);
    if (!user || user.userRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' };
    }
    
    const pageIndex = params.pageIndex || 0;
    const pageSize = params.pageSize || 10;
    const skip = pageIndex * pageSize;
    
    // Build where clause
    const where: any = {
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
    if (params.isVerified !== undefined) {
      where.is_verified = params.isVerified;
    }
    
    // Get business owners with pagination
    const [businessOwners, totalCount] = await Promise.all([
      prisma.businessOwner.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            }
          },
          ...(params.withBuyers && {
            buyers: {
              where: { is_deleted: false },
              select: {
                id: true,
                contactName: true,
                email: true,
                status: true,
              }
            }
          })
        }
      }),
      prisma.businessOwner.count({ where })
    ]);
    
    // Get status counts
    const [activeCount, inactiveCount, deletedCount] = await Promise.all([
      prisma.businessOwner.count({ where: { ...where, status: 'active' } }),
      prisma.businessOwner.count({ where: { ...where, status: 'inactive' } }),
      prisma.businessOwner.count({ where: { is_deleted: true } })
    ]);
    
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      success: true,
      data: {
        data: {
          data: businessOwners,
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
  } catch (error) {
    console.error('Error fetching business owners:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch business owners' 
    };
  }
}

// Search business owners using Prisma
export async function searchBusinessOwners(filters: {
  page?: number;
  limit?: number;
  offset?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  businessName?: string;
  phoneNumber?: string;
  postalCode?: string;
  status?: string;
}, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const user = await getUserFromToken(authToken);
    if (!user || user.userRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' };
    }
    
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    
    // Build where clause for search
    const where: any = {
      is_deleted: false,
    };
    
    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }
    if (filters.businessName) {
      where.businessName = { contains: filters.businessName, mode: 'insensitive' };
    }
    if (filters.phoneNumber) {
      where.phoneNumber = { contains: filters.phoneNumber, mode: 'insensitive' };
    }
    if (filters.postalCode) {
      where.postalCode = { contains: filters.postalCode, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    
    // Handle user-related filters
    if (filters.first_name || filters.last_name) {
      where.user = {};
      if (filters.first_name) {
        where.user.first_name = { contains: filters.first_name, mode: 'insensitive' };
      }
      if (filters.last_name) {
        where.user.last_name = { contains: filters.last_name, mode: 'insensitive' };
      }
    }
    
    const [businessOwners, totalCount] = await Promise.all([
      prisma.businessOwner.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            }
          }
        }
      }),
      prisma.businessOwner.count({ where })
    ]);
    
    return {
      success: true,
      data: {
        data: businessOwners,
        totalItems: totalCount,
        page: filters.page || 1,
        limit,
        offset
      }
    };
  } catch (error) {
    console.error('Error searching business owners:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search business owners' 
    };
  }
}

// Activate business owner using Prisma
export async function activateBusinessOwner(businessOwnerId: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const user = await getUserFromToken(authToken);
    if (!user || user.userRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' };
    }
    
    const businessOwner = await prisma.businessOwner.update({
      where: { 
        id: businessOwnerId,
        is_deleted: false 
      },
      data: { 
        status: 'active',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          }
        }
      }
    });
    
    return {
      success: true,
      data: businessOwner,
      message: 'Business owner activated successfully'
    };
  } catch (error) {
    console.error('Error activating business owner:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to activate business owner' 
    };
  }
}

// Deactivate business owner using Prisma
export async function deactivateBusinessOwner(businessOwnerId: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const user = await getUserFromToken(authToken);
    if (!user || user.userRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' };
    }
    
    const businessOwner = await prisma.businessOwner.update({
      where: { 
        id: businessOwnerId,
        is_deleted: false 
      },
      data: { 
        status: 'inactive',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          }
        }
      }
    });
    
    return {
      success: true,
      data: businessOwner,
      message: 'Business owner deactivated successfully'
    };
  } catch (error) {
    console.error('Error deactivating business owner:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deactivate business owner' 
    };
  }
}

// Delete business owner using Prisma (soft delete)
export async function deleteBusinessOwner(businessOwnerId: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const user = await getUserFromToken(authToken);
    if (!user || user.userRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' };
    }
    
    const businessOwner = await prisma.businessOwner.update({
      where: { 
        id: businessOwnerId,
        is_deleted: false 
      },
      data: { 
        is_deleted: true,
        status: 'inactive',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          }
        }
      }
    });
    
    return {
      success: true,
      data: businessOwner,
      message: 'Business owner deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting business owner:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete business owner' 
    };
  }
}

// Get business owner by ID using Prisma
export async function getBusinessOwnerById(businessOwnerId: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const user = await getUserFromToken(authToken);
    if (!user || user.userRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' };
    }
    
    const businessOwner = await prisma.businessOwner.findUnique({
      where: { 
        id: businessOwnerId,
        is_deleted: false 
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          }
        },
        buyers: {
          where: { is_deleted: false },
          select: {
            id: true,
            contactName: true,
            email: true,
            status: true,
          }
        }
      }
    });
    
    if (!businessOwner) {
      return { success: false, error: 'Business owner not found' };
    }
    
    return {
      success: true,
      data: businessOwner
    };
  } catch (error) {
    console.error('Error getting business owner:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get business owner' 
    };
  }
}

// Update business owner using Prisma
export async function updateBusinessOwner(businessOwnerId: string, updateData: {
  businessName?: string;
  email?: string;
  status?: string;
  [key: string]: any;
}, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const user = await getUserFromToken(authToken);
    if (!user || user.userRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Super admin access required' };
    }
    
    // Prepare update data - only include valid BusinessOwner fields
    const businessOwnerData: any = {
      updatedAt: new Date()
    };
    
    if (updateData.businessName) businessOwnerData.businessName = updateData.businessName;
    if (updateData.status) businessOwnerData.status = updateData.status;
    
    const businessOwner = await prisma.businessOwner.update({
      where: { 
        id: businessOwnerId,
        is_deleted: false 
      },
      data: businessOwnerData,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          }
        }
      }
    });
    
    return {
      success: true,
      data: businessOwner,
      message: 'Business owner updated successfully'
    };
  } catch (error) {
    console.error('Error updating business owner:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update business owner' 
    };
  }
}