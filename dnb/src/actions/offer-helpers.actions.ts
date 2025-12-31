'use server';

import { prisma } from '@/lib/prisma';

/**
 * Get all buyers for the authenticated business owner (for offer creation)
 */
/**
 * Get all buyers for the authenticated business owner (for offer creation)
 */
export async function getBuyersForOffer(params: {
  pageIndex?: number;
  pageSize?: number;
} = {}, authToken?: string) {
  try {
    if (!authToken) {
      return {
        success: false,
        data: [],
        totalItems: 0,
        totalPages: 0,
        pageIndex: 0,
        pageSize: 100,
        error: 'Authentication token required',
      };
    }

    // Decode the token to get business owner ID
    const jwt = require('jsonwebtoken');
    let businessOwnerId: string;
    
    try {
      const decoded = jwt.decode(authToken) as any;
      businessOwnerId = decoded?.businessOwnerId || decoded?.id;
    } catch (error) {
      console.error('❌ JWT decode error:', error);
      return {
        success: false,
        data: [],
        totalItems: 0,
        totalPages: 0,
        pageIndex: 0,
        pageSize: 100,
        error: 'Invalid authentication token',
      };
    }

    if (!businessOwnerId) {
      console.error('❌ No business owner ID found in token');
      return {
        success: false,
        data: [],
        totalItems: 0,
        totalPages: 0,
        pageIndex: 0,
        pageSize: 100,
        error: 'Business owner ID not found in token',
      };
    }

    const { pageIndex = 0, pageSize = 100 } = params;

    // Get buyers for this business owner
    const buyers = await prisma.buyer.findMany({
      where: {
        businessOwnerId: businessOwnerId,
        is_deleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: pageSize,
      skip: pageIndex * pageSize,
    });

    const totalItems = await prisma.buyer.count({
      where: {
        businessOwnerId: businessOwnerId,
        is_deleted: false,
      },
    });

    return {
      success: true,
      data: buyers,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      pageIndex,
      pageSize,
    };
  } catch (error: any) {
    console.error('💥 Get buyers for offer error:', error);
    return {
      success: false,
      data: [],
      totalItems: 0,
      totalPages: 0,
      pageIndex: 0,
      pageSize: 100,
      error: error.message || 'Failed to get buyers',
    };
  }
}

/**
 * Get all locations for the authenticated business owner (for offer creation)
 */
/**
 * Get all locations for the authenticated business owner (for offer creation)
 */
export async function getLocationsForOffer(params: {
  pageIndex?: number;
  pageSize?: number;
} = {}, authToken?: string) {
  try {
    if (!authToken) {
      return {
        success: false,
        data: [],
        totalItems: 0,
        totalPages: 0,
        pageIndex: 0,
        pageSize: 100,
        error: 'Authentication token required',
      };
    }

    // Decode the token to get business owner ID
    const jwt = require('jsonwebtoken');
    let businessOwnerId: string;
    
    try {
      const decoded = jwt.decode(authToken) as any;
      businessOwnerId = decoded?.businessOwnerId || decoded?.id;
    } catch (error) {
      return {
        success: false,
        data: [],
        totalItems: 0,
        totalPages: 0,
        pageIndex: 0,
        pageSize: 100,
        error: 'Invalid authentication token',
      };
    }

    if (!businessOwnerId) {
      return {
        success: false,
        data: [],
        totalItems: 0,
        totalPages: 0,
        pageIndex: 0,
        pageSize: 100,
        error: 'Business owner ID not found in token',
      };
    }

    const { pageIndex = 0, pageSize = 100 } = params;

    // Get locations for this business owner
    const locations = await prisma.location.findMany({
      where: {
        ownerId: businessOwnerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: pageSize,
      skip: pageIndex * pageSize,
    });

    const totalItems = await prisma.location.count({
      where: {
        ownerId: businessOwnerId,
      },
    });

    return {
      success: true,
      data: locations,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      pageIndex,
      pageSize,
    };
  } catch (error: any) {
    console.error('Get locations for offer error:', error);
    return {
      success: false,
      data: [],
      totalItems: 0,
      totalPages: 0,
      pageIndex: 0,
      pageSize: 100,
      error: error.message || 'Failed to get locations',
    };
  }
}

/**
 * Debug function to get all buyers in the system (for troubleshooting)
 */
export async function debugGetAllBuyers(authToken?: string) {
  try {
    const allBuyers = await prisma.buyer.findMany({
      where: {
        is_deleted: false,
      },
      select: {
        id: true,
        contactName: true,
        email: true,
        buyersCompanyName: true,
        businessOwnerId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Also get all business owners for reference
    const allBusinessOwners = await prisma.businessOwner.findMany({
      select: {
        id: true,
        businessName: true,
        email: true,
      },
    });

    if (authToken) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
      } catch (error) {
        console.error('❌ Token decode error:', error);
      }
    }

    return {
      success: true,
      data: {
        buyers: allBuyers,
        businessOwners: allBusinessOwners,
      },
    };
  } catch (error: any) {
    console.error('💥 Debug get all buyers error:', error);
    return {
      success: false,
      error: error.message || 'Failed to debug buyers',
    };
  }
}