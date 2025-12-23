'use server';

import { prisma } from '@/lib/prisma';

export interface BusinessOwnerData {
  userId: string;
  businessName: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phoneNumber?: string;
  registrationNumber: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  taxId?: string;
  website?: string;
  planId?: string;
  paymentId?: string;
}

export interface BusinessOwnerResponse {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Create a new business owner
 */
export async function createBusinessOwner(data: BusinessOwnerData): Promise<BusinessOwnerResponse> {
  try {
    const businessOwner = await prisma.businessOwner.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        registrationNumber: data.registrationNumber,
        country: data.country,
        state: data.state,
        city: data.city,
        address: data.address,
        postalCode: data.postalCode,
        planId: data.planId,
        paymentId: data.paymentId,
        status: 'active',
        is_verified: false,
        is_approved: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    return {
      success: true,
      data: businessOwner,
      message: 'Business owner created successfully',
    };
  } catch (error: any) {
    console.error('Create business owner error:', error);
    
    if (error.code === 'P2002') {
      return {
        success: false,
        message: 'Business name or registration number already exists',
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to create business owner',
    };
  }
}

/**
 * Get business owner by user ID
 */
export async function getBusinessOwnerByUserId(userId: string): Promise<BusinessOwnerResponse> {
  try {
    const businessOwner = await prisma.businessOwner.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    if (!businessOwner) {
      return {
        success: false,
        message: 'Business owner not found',
      };
    }

    return {
      success: true,
      data: businessOwner,
    };
  } catch (error: any) {
    console.error('Get business owner error:', error);
    return {
      success: false,
      message: error.message || 'Failed to get business owner',
    };
  }
}

/**
 * Update business owner
 */
export async function updateBusinessOwner(
  businessOwnerId: string, 
  data: Partial<BusinessOwnerData>
): Promise<BusinessOwnerResponse> {
  try {
    const businessOwner = await prisma.businessOwner.update({
      where: { id: businessOwnerId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    return {
      success: true,
      data: businessOwner,
      message: 'Business owner updated successfully',
    };
  } catch (error: any) {
    console.error('Update business owner error:', error);
    return {
      success: false,
      message: error.message || 'Failed to update business owner',
    };
  }
}

/**
 * Verify business owner (after successful payment)
 */
export async function verifyBusinessOwner(businessOwnerId: string): Promise<BusinessOwnerResponse> {
  try {
    const businessOwner = await prisma.businessOwner.update({
      where: { id: businessOwnerId },
      data: {
        is_verified: true,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: businessOwner,
      message: 'Business owner verified successfully',
    };
  } catch (error: any) {
    console.error('Verify business owner error:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify business owner',
    };
  }
}

/**
 * Approve business owner (admin action)
 */
export async function approveBusinessOwner(businessOwnerId: string): Promise<BusinessOwnerResponse> {
  try {
    const businessOwner = await prisma.businessOwner.update({
      where: { id: businessOwnerId },
      data: {
        is_approved: true,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: businessOwner,
      message: 'Business owner approved successfully',
    };
  } catch (error: any) {
    console.error('Approve business owner error:', error);
    return {
      success: false,
      message: error.message || 'Failed to approve business owner',
    };
  }
}

/**
 * Get business owner statistics
 */
export async function getBusinessOwnerStats(businessOwnerId: string) {
  try {
    const [businessOwner, buyersCount, productsCount] = await Promise.all([
      prisma.businessOwner.findUnique({
        where: { id: businessOwnerId },
        select: {
          id: true,
          businessName: true,
          is_verified: true,
          is_approved: true,
          createdAt: true,
        }
      }),
      prisma.buyer.count({
        where: { businessOwnerId }
      }),
      // Assuming you have a products table
      // prisma.product.count({
      //   where: { businessOwnerId }
      // }),
      0, // Placeholder for products count
    ]);

    if (!businessOwner) {
      return {
        success: false,
        message: 'Business owner not found',
      };
    }

    return {
      success: true,
      data: {
        businessOwner,
        stats: {
          buyersCount,
          productsCount,
          accountAge: Math.floor((Date.now() - businessOwner.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        }
      },
    };
  } catch (error: any) {
    console.error('Get business owner stats error:', error);
    return {
      success: false,
      message: error.message || 'Failed to get business owner statistics',
    };
  }
}