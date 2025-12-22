'use server';

import prisma from '@/lib/prisma-client';
import { revalidatePath } from 'next/cache';
import type { 
  UsersResponse, 
  SearchParams, 
  BusinessOwner, 
  Buyer 
} from '@/types/users';

/**
 * Get users data based on user role using Prisma
 */
export async function getUsersData(
  userRole: 'super_admin' | 'business_owner',
  params: SearchParams,
  authToken: string,
  currentUserId?: string
): Promise<UsersResponse> {

  try {
    // Test database connection first
    
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;

    const { pageIndex, pageSize, ...filters } = params;
    
    // Check if we have search filters
    const hasFilters = Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== ''
    );

    let users: any[] = [];
    let totalItems = 0;
    let totalActive = 0;
    let totalInactive = 0;
    let totalDeleted = 0;

    if (userRole === 'super_admin') {

      // Build where clause for filtering
      const whereClause: any = {};
      
      if (hasFilters) {
        if (filters.first_name) {
          whereClause.first_name = { contains: filters.first_name, mode: 'insensitive' };
        }
        if (filters.last_name) {
          whereClause.last_name = { contains: filters.last_name, mode: 'insensitive' };
        }
        if (filters.email) {
          whereClause.email = { contains: filters.email, mode: 'insensitive' };
        }
        if (filters.businessName) {
          whereClause.businessName = { contains: filters.businessName, mode: 'insensitive' };
        }
        if (filters.phoneNumber) {
          whereClause.phoneNumber = { contains: filters.phoneNumber, mode: 'insensitive' };
        }
        if (filters.postalCode) {
          whereClause.postalCode = { contains: filters.postalCode, mode: 'insensitive' };
        }
        if (filters.status) {
          whereClause.status = filters.status;
        }
      }

      // First, let's check if there are any business owners at all
      const totalBusinessOwners = await prisma.businessOwner.count();

      // Get total count with filters
      totalItems = await prisma.businessOwner.count({ where: whereClause });

      // Get users with pagination
      const skip = pageIndex * pageSize;
      const take = pageSize;

      users = await prisma.businessOwner.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });

      // Get status counts
      const statusCounts = await prisma.businessOwner.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true },
      });

      const deletedCount = await prisma.businessOwner.count({
        where: { ...whereClause, is_deleted: true },
      });

      // Process status counts
      statusCounts.forEach(({ status, _count }) => {
        if (status === 'active') totalActive = _count.status;
        if (status === 'inactive') totalInactive = _count.status;
      });
      totalDeleted = deletedCount;

      // Transform data to match expected format
      users = users.map(businessOwner => ({
        id: businessOwner.id,
        userId: businessOwner.userId,
        first_name: businessOwner.first_name,
        last_name: businessOwner.last_name,
        email: businessOwner.email,
        phoneNumber: businessOwner.phoneNumber,
        businessName: businessOwner.businessName,
        registrationNumber: businessOwner.registrationNumber,
        postalCode: businessOwner.postalCode,
        status: businessOwner.status,
        isDeleted: businessOwner.is_deleted,
        createdAt: businessOwner.createdAt.toISOString(),
        updatedAt: businessOwner.updatedAt.toISOString(),
        userRole: 'business_owner',
      }));

    } else if (userRole === 'business_owner') {
      // For business_owner role, they should see their buyers

      // Get the current business owner's ID
      let currentBusinessOwnerId: string | null = null;
      
      if (currentUserId) {
        // Try to find business owner by user ID
        try {
          const businessOwner = await prisma.businessOwner.findUnique({
            where: { userId: currentUserId },
            select: { id: true }
          });
          currentBusinessOwnerId = businessOwner?.id || null;
          
        } catch (error) {
          
        }
      }
      
      // If no currentUserId provided, try to decode from token as fallback
      if (!currentBusinessOwnerId && authToken) {
        try {
          const tokenParts = authToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

            // Get business owner ID from token payload
            currentBusinessOwnerId = payload.businessOwnerId || payload.id;
            
            // If not in payload, try to find business owner by user ID
            if (!currentBusinessOwnerId && payload.userId) {
              const businessOwner = await prisma.businessOwner.findUnique({
                where: { userId: payload.userId },
                select: { id: true }
              });
              currentBusinessOwnerId = businessOwner?.id || null;
            }
          }
        } catch (error) {
          
        }
      }
      
      if (!currentBusinessOwnerId) {
        
        // Return empty results if we can't identify the business owner
        users = [];
        totalItems = 0;
        totalActive = 0;
        totalInactive = 0;
        totalDeleted = 0;
      } else {

        // Build where clause for filtering buyers
        const whereClause: any = {
          businessOwnerId: currentBusinessOwnerId,
          is_deleted: false, // Only show non-deleted buyers
        };
        
        if (hasFilters) {
          if (filters.email) {
            whereClause.OR = [
              { email: { contains: filters.email, mode: 'insensitive' } },
              { contactEmail: { contains: filters.email, mode: 'insensitive' } }
            ];
          }
          if (filters.businessName) {
            whereClause.buyersCompanyName = { contains: filters.businessName, mode: 'insensitive' };
          }
          if (filters.productName) {
            whereClause.productName = { contains: filters.productName, mode: 'insensitive' };
          }
          if (filters.locationName) {
            whereClause.locationName = { contains: filters.locationName, mode: 'insensitive' };
          }
          if (filters.status) {
            whereClause.status = filters.status;
          }
        }

        try {
          // First check if buyers table exists by trying a simple query
          await prisma.$queryRaw`SELECT 1 FROM "buyers" LIMIT 1`;
          
          // Get total count of buyers for this business owner
          totalItems = await prisma.buyer.count({ where: whereClause });

          // Get buyers with pagination
          const skip = pageIndex * pageSize;
          const take = pageSize;

          const buyers = await prisma.buyer.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
          });

          // Get status counts for buyers
          const statusCounts = await prisma.buyer.groupBy({
            by: ['status'],
            where: { businessOwnerId: currentBusinessOwnerId, is_deleted: false },
            _count: { status: true },
          });

          const deletedCount = await prisma.buyer.count({
            where: { businessOwnerId: currentBusinessOwnerId, is_deleted: true },
          });

          // Process status counts
          statusCounts.forEach(({ status, _count }) => {
            if (status === 'active') totalActive = _count.status;
            if (status === 'inactive') totalInactive = _count.status;
          });
          totalDeleted = deletedCount;

          // Transform buyers data to match expected format
          users = buyers.map(buyer => ({
            id: buyer.id,
            first_name: buyer.contactName?.split(' ')[0] || '',
            last_name: buyer.contactName?.split(' ').slice(1).join(' ') || '',
            email: buyer.email,
            contactEmail: buyer.contactEmail,
            contactPhone: buyer.contactPhone,
            buyersCompanyName: buyer.buyersCompanyName,
            productName: buyer.productName,
            locationName: buyer.locationName,
            phoneNumber: buyer.contactPhone,
            status: buyer.status,
            isDeleted: buyer.is_deleted,
            createdAt: buyer.createdAt.toISOString(),
            updatedAt: buyer.updatedAt.toISOString(),
            userRole: 'buyer',
          }));

        } catch (error: any) {
          
          // If Buyer table doesn't exist yet, return empty results with helpful message
          if (error.code === 'P2010' || error.code === 'P2022' || error.message?.includes('does not exist') || error.message?.includes('relation "buyers" does not exist')) {

            users = [];
            totalItems = 0;
            totalActive = 0;
            totalInactive = 0;
            totalDeleted = 0;
          } else {
            throw error;
          }
        }
      }
    } else {
      
      users = [];
      totalItems = 0;
      totalActive = 0;
      totalInactive = 0;
      totalDeleted = 0;
    }

    const totalPages = Math.ceil(totalItems / pageSize);

    const finalResponse = {
      data: users,
      totalItems,
      totalPages,
      totalActive,
      totalInactive,
      totalDeleted,
      pageIndex,
      pageSize,
    };

    return finalResponse;
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to fetch users');
  }
}

/**
 * Get user by ID using Prisma
 */
export async function getUserById(
  userRole: 'super_admin' | 'business_owner',
  userId: string,
  authToken: string
): Promise<BusinessOwner | Buyer> {

  try {
    if (userRole === 'super_admin') {
      const businessOwner = await prisma.businessOwner.findUnique({
        where: { id: userId },
        include: { user: true },
      });

      if (!businessOwner) {
        throw new Error('Business owner not found');
      }

      return {
        id: businessOwner.id,
        userId: businessOwner.userId,
        first_name: businessOwner.first_name,
        last_name: businessOwner.last_name,
        email: businessOwner.email,
        phoneNumber: businessOwner.phoneNumber,
        businessName: businessOwner.businessName,
        registrationNumber: businessOwner.registrationNumber,
        postalCode: businessOwner.postalCode,
        status: businessOwner.status,
        isDeleted: businessOwner.is_deleted,
        createdAt: businessOwner.createdAt.toISOString(),
        updatedAt: businessOwner.updatedAt.toISOString(),
        userRole: 'business_owner',
      } as BusinessOwner;
    } else {
      // For buyers
      try {
        const buyer = await prisma.buyer.findUnique({
          where: { id: userId },
        });

        if (!buyer) {
          throw new Error('Buyer not found');
        }

        return {
          id: buyer.id,
          contactName: buyer.contactName,
          email: buyer.email,
          phoneNumber: buyer.phoneNumber,
          businessName: buyer.businessName,
          registrationNumber: buyer.registrationNumber,
          address: buyer.address,
          city: buyer.city,
          state: buyer.state,
          country: buyer.country,
          postalCode: buyer.postalCode,
          businessOwnerId: buyer.businessOwnerId,
          status: buyer.status,
          isDeleted: buyer.is_deleted,
          createdAt: buyer.createdAt.toISOString(),
          updatedAt: buyer.updatedAt.toISOString(),
          userRole: 'buyer',
        } as Buyer;
      } catch (error: any) {
        
        throw new Error('Buyer not found or buyers table does not exist');
      }
    }
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to fetch user');
  }
}

/**
 * Create new user using Prisma
 */
export async function createUser(
  userRole: 'super_admin' | 'business_owner',
  userData: Partial<BusinessOwner | Buyer>,
  authToken: string
): Promise<BusinessOwner | Buyer> {

  try {
    if (userRole === 'super_admin') {
      const businessOwnerData = userData as Partial<BusinessOwner>;
      
      // First create the user
      const user = await prisma.user.create({
        data: {
          first_name: businessOwnerData.first_name,
          last_name: businessOwnerData.last_name,
          email: businessOwnerData.email!,
          password: 'temp_password', // You should hash this properly
          roleId: 2, // Business owner role
          businessName: businessOwnerData.businessName,
        },
      });

      // Then create the business owner
      const businessOwner = await prisma.businessOwner.create({
        data: {
          userId: user.id,
          businessName: businessOwnerData.businessName!,
          first_name: businessOwnerData.first_name,
          last_name: businessOwnerData.last_name,
          email: businessOwnerData.email!,
          phoneNumber: businessOwnerData.phoneNumber,
          registrationNumber: businessOwnerData.registrationNumber || `REG-${Date.now()}`,
          country: 'India', // Default values
          state: 'Unknown',
          city: 'Unknown',
          address: 'Unknown',
          postalCode: businessOwnerData.postalCode || '000000',
          status: businessOwnerData.status || 'active',
        },
        include: { user: true },
      });

      revalidatePath('/users');

      return {
        id: businessOwner.id,
        userId: businessOwner.userId,
        first_name: businessOwner.first_name,
        last_name: businessOwner.last_name,
        email: businessOwner.email,
        phoneNumber: businessOwner.phoneNumber,
        businessName: businessOwner.businessName,
        registrationNumber: businessOwner.registrationNumber,
        postalCode: businessOwner.postalCode,
        status: businessOwner.status,
        isDeleted: businessOwner.is_deleted,
        createdAt: businessOwner.createdAt.toISOString(),
        updatedAt: businessOwner.updatedAt.toISOString(),
        userRole: 'business_owner',
      } as BusinessOwner;
    } else {
      throw new Error('Buyer creation not implemented - no Buyer model in schema');
    }
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to create user');
  }
}

/**
 * Update user using Prisma
 */
export async function updateUser(
  userRole: 'super_admin' | 'business_owner',
  userId: string,
  userData: Partial<BusinessOwner | Buyer>,
  authToken: string
): Promise<BusinessOwner | Buyer> {

  try {
    if (userRole === 'super_admin') {
      const businessOwnerData = userData as Partial<BusinessOwner>;
      
      const businessOwner = await prisma.businessOwner.update({
        where: { id: userId },
        data: {
          first_name: businessOwnerData.first_name,
          last_name: businessOwnerData.last_name,
          email: businessOwnerData.email,
          phoneNumber: businessOwnerData.phoneNumber,
          businessName: businessOwnerData.businessName,
          registrationNumber: businessOwnerData.registrationNumber,
          postalCode: businessOwnerData.postalCode,
          status: businessOwnerData.status,
        },
        include: { user: true },
      });

      // Also update the related user record
      if (businessOwnerData.email || businessOwnerData.first_name || businessOwnerData.last_name) {
        await prisma.user.update({
          where: { id: businessOwner.userId },
          data: {
            first_name: businessOwnerData.first_name,
            last_name: businessOwnerData.last_name,
            email: businessOwnerData.email,
            businessName: businessOwnerData.businessName,
          },
        });
      }

      revalidatePath('/users');

      return {
        id: businessOwner.id,
        userId: businessOwner.userId,
        first_name: businessOwner.first_name,
        last_name: businessOwner.last_name,
        email: businessOwner.email,
        phoneNumber: businessOwner.phoneNumber,
        businessName: businessOwner.businessName,
        registrationNumber: businessOwner.registrationNumber,
        postalCode: businessOwner.postalCode,
        status: businessOwner.status,
        isDeleted: businessOwner.is_deleted,
        createdAt: businessOwner.createdAt.toISOString(),
        updatedAt: businessOwner.updatedAt.toISOString(),
        userRole: 'business_owner',
      } as BusinessOwner;
    } else {
      throw new Error('Buyer update not implemented - no Buyer model in schema');
    }
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to update user');
  }
}

/**
 * Activate user using Prisma
 */
export async function activateUser(
  userRole: 'super_admin' | 'business_owner',
  userId: string,
  authToken: string
): Promise<void> {

  try {
    if (userRole === 'super_admin') {
      await prisma.businessOwner.update({
        where: { id: userId },
        data: { status: 'active' },
      });
    } else {
      throw new Error('Buyer activation not implemented - no Buyer model in schema');
    }

    revalidatePath('/users');
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to activate user');
  }
}

/**
 * Deactivate user using Prisma
 */
export async function deactivateUser(
  userRole: 'super_admin' | 'business_owner',
  userId: string,
  authToken: string
): Promise<void> {

  try {
    if (userRole === 'super_admin') {
      await prisma.businessOwner.update({
        where: { id: userId },
        data: { status: 'inactive' },
      });
    } else {
      throw new Error('Buyer deactivation not implemented - no Buyer model in schema');
    }

    revalidatePath('/users');
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to deactivate user');
  }
}

/**
 * Delete user (soft delete) using Prisma
 */
export async function deleteUser(
  userRole: 'super_admin' | 'business_owner',
  userId: string,
  authToken: string
): Promise<void> {

  try {
    if (userRole === 'super_admin') {
      await prisma.businessOwner.update({
        where: { id: userId },
        data: { is_deleted: true },
      });
    } else {
      throw new Error('Buyer deletion not implemented - no Buyer model in schema');
    }

    revalidatePath('/users');
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to delete user');
  }
}

/**
 * Additional server actions based on the routes you provided
 */

/**
 * Check if registration number is unique
 */
export async function checkRegistrationNumber(
  registrationNumber: string
): Promise<{ isUnique: boolean }> {

  try {
    const existing = await prisma.businessOwner.findUnique({
      where: { registrationNumber },
    });

    return { isUnique: !existing };
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to check registration number');
  }
}

/**
 * Check if business owner data is unique
 */
export async function checkBusinessOwnerUnique(
  email?: string,
  businessName?: string
): Promise<{ isUnique: boolean; conflicts: string[] }> {

  try {
    const conflicts: string[] = [];

    if (email) {
      const emailExists = await prisma.businessOwner.findUnique({
        where: { email },
      });
      if (emailExists) conflicts.push('email');
    }

    if (businessName) {
      const businessExists = await prisma.businessOwner.findUnique({
        where: { businessName },
      });
      if (businessExists) conflicts.push('businessName');
    }

    return { isUnique: conflicts.length === 0, conflicts };
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to check uniqueness');
  }
}

/**
 * Get business owners list (simplified)
 */
export async function getBusinessOwnersList(): Promise<Array<{ id: string; businessName: string; email: string }>> {

  try {
    const businessOwners = await prisma.businessOwner.findMany({
      where: { is_deleted: false },
      select: {
        id: true,
        businessName: true,
        email: true,
      },
      orderBy: { businessName: 'asc' },
    });

    return businessOwners;
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to fetch business owners list');
  }
}