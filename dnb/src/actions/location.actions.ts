'use server';

import { prisma } from '@/lib/prisma';
import { getStoredSession } from '@/utils/auth';

export interface LocationSearchParams {
  city?: string;
  state?: string;
  country?: string;
  pageIndex?: number;
  pageSize?: number;
}

/**
 * Get all locations for the authenticated user
 */
export async function getAllLocations(authToken?: string, pageIndex = 0, pageSize = 100): Promise<{
  success: boolean;
  data?: {
    data: any[];
    totalItems: number;
    totalPages: number;
    pageIndex: number;
    pageSize: number;
  };
  error?: string;
}> {
  try {
    let businessOwnerId: string;
    
    if (authToken) {
      // If auth token is provided, decode it to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        
        if (!businessOwnerId) {
          return { success: false, error: 'Business owner ID not found in token' };
        }
      } catch (error) {
        return { success: false, error: 'Invalid authentication token' };
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }

      const user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    const skip = pageIndex * pageSize;

    // Build where clause
    const where: any = {
      ownerId: businessOwnerId,
    };

    // Get total count
    const totalItems = await prisma.location.count({ where });

    // Get locations
    const locations = await prisma.location.findMany({
      where,
      orderBy: [
        { country: 'asc' },
        { state: 'asc' },
        { city: 'asc' },
      ],
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      success: true,
      data: {
        data: locations,
        totalItems,
        totalPages,
        pageIndex,
        pageSize,
      },
    };
  } catch (error: any) {
    console.error('Get all locations error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get locations',
    };
  }
}

/**
 * Get location by ID
 */
export async function getLocationById(locationId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const session = getStoredSession();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    const user = session.user as any;
    const businessOwnerId = user.businessOwnerId || user.id;

    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        ownerId: businessOwnerId,
      },
    });

    if (!location) {
      return { success: false, error: 'Location not found or access denied' };
    }

    return {
      success: true,
      data: location,
    };
  } catch (error: any) {
    console.error('Get location by ID error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get location',
    };
  }
}

/**
 * Search locations
 */
export async function searchLocations(searchParams: LocationSearchParams & {
  page?: number;
  limit?: number;
}, authToken?: string): Promise<{
  success: boolean;
  data?: {
    data: any[];
    totalItems: number;
    totalPages: number;
    pageIndex: number;
    pageSize: number;
  };
  error?: string;
}> {
  try {
    let businessOwnerId: string;
    
    if (authToken) {
      // If auth token is provided, decode it to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        
        if (!businessOwnerId) {
          return { success: false, error: 'Business owner ID not found in token' };
        }
      } catch (error) {
        return { success: false, error: 'Invalid authentication token' };
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }

      const user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    const {
      page = 0,
      limit = 100,
      city,
      state,
      country,
    } = searchParams;

    const skip = page * limit;

    // Build where clause
    const where: any = {
      ownerId: businessOwnerId,
    };

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (state) {
      where.state = {
        contains: state,
        mode: 'insensitive',
      };
    }

    if (country) {
      where.country = {
        contains: country,
        mode: 'insensitive',
      };
    }

    // Get total count
    const totalItems = await prisma.location.count({ where });

    // Get locations
    const locations = await prisma.location.findMany({
      where,
      orderBy: [
        { country: 'asc' },
        { state: 'asc' },
        { city: 'asc' },
      ],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      data: {
        data: locations,
        totalItems,
        totalPages,
        pageIndex: page,
        pageSize: limit,
      },
    };
  } catch (error: any) {
    console.error('Search locations error:', error);
    return {
      success: false,
      error: error.message || 'Failed to search locations',
    };
  }
}

/**
 * Create a new location
 */
export async function createLocation(locationData: {
  locationName?: string;
  city: string;
  state: string;
  code: string;
  country: string;
  address?: string;
  postalCode?: string;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Fallback to session
    const session = getStoredSession();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    const user = session.user as any;
    const businessOwnerId = user.businessOwnerId || user.id;

    // Validate required fields
    if (!locationData.city?.trim()) {
      return { success: false, error: 'City is required' };
    }

    if (!locationData.state?.trim()) {
      return { success: false, error: 'State is required' };
    }

    if (!locationData.code?.trim()) {
      return { success: false, error: 'Location code is required' };
    }

    if (!locationData.country?.trim()) {
      return { success: false, error: 'Country is required' };
    }

    // Check if location code already exists for this business owner
    const existingLocation = await prisma.location.findFirst({
      where: {
        code: locationData.code,
        ownerId: businessOwnerId,
      },
    });

    if (existingLocation) {
      return { success: false, error: 'Location code already exists' };
    }

    // Create the location
    const newLocation = await prisma.location.create({
      data: {
        locationName: locationData.locationName || null,
        city: locationData.city,
        state: locationData.state,
        code: locationData.code,
        country: locationData.country,
        address: locationData.address || null,
        postalCode: locationData.postalCode || null,
        ownerId: businessOwnerId,
      },
    });

    return {
      success: true,
      data: newLocation,
    };
  } catch (error: any) {
    console.error('Create location error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create location',
    };
  }
}

/**
 * Create a new location (with auth token)
 */
export async function createLocationWithToken(locationData: {
  locationName?: string;
  city: string;
  state: string;
  code: string;
  country: string;
  address?: string;
  postalCode?: string;
}, authToken: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // If auth token is provided, decode it to get business owner ID
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.decode(authToken) as any;
      const businessOwnerId = decoded?.businessOwnerId || decoded?.id;
      
      if (!businessOwnerId) {
        return { success: false, error: 'Business owner ID not found in token' };
      }

      // Validate required fields
      if (!locationData.city?.trim()) {
        return { success: false, error: 'City is required' };
      }

      if (!locationData.state?.trim()) {
        return { success: false, error: 'State is required' };
      }

      if (!locationData.code?.trim()) {
        return { success: false, error: 'Location code is required' };
      }

      if (!locationData.country?.trim()) {
        return { success: false, error: 'Country is required' };
      }

      // Check if location code already exists for this business owner
      const existingLocation = await prisma.location.findFirst({
        where: {
          code: locationData.code,
          ownerId: businessOwnerId,
        },
      });

      if (existingLocation) {
        return { success: false, error: 'Location code already exists' };
      }

      // Create the location
      const newLocation = await prisma.location.create({
        data: {
          locationName: locationData.locationName || null,
          city: locationData.city,
          state: locationData.state,
          code: locationData.code,
          country: locationData.country,
          address: locationData.address || null,
          postalCode: locationData.postalCode || null,
          ownerId: businessOwnerId,
        },
      });

      return {
        success: true,
        data: newLocation,
      };
    } catch (error) {
      return { success: false, error: 'Invalid authentication token' };
    }
  } catch (error: any) {
    console.error('Create location error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create location',
    };
  }
}

/**
 * Update location
 */
export async function updateLocation(locationId: string, updateData: {
  locationName?: string;
  city?: string;
  code?: string;
  country?: string;
  address?: string;
  postalCode?: string;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const session = getStoredSession();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    const user = session.user as any;
    const businessOwnerId = user.businessOwnerId || user.id;

    // Check if location exists and belongs to user
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: locationId,
        ownerId: businessOwnerId,
      },
    });

    if (!existingLocation) {
      return { success: false, error: 'Location not found or access denied' };
    }

    // Update the location
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        ...(updateData.locationName !== undefined && { locationName: updateData.locationName }),
        ...(updateData.city && { city: updateData.city }),
        ...(updateData.code && { code: updateData.code }),
        ...(updateData.country && { country: updateData.country }),
        ...(updateData.address !== undefined && { address: updateData.address }),
        ...(updateData.postalCode !== undefined && { postalCode: updateData.postalCode }),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: updatedLocation,
    };
  } catch (error: any) {
    console.error('Update location error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update location',
    };
  }
}

/**
 * Delete location (hard delete)
 */
export async function deleteLocation(locationId: string, authToken?: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    let businessOwnerId: string;
    
    if (authToken) {
      // If auth token is provided, decode it to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        
        if (!businessOwnerId) {
          return { success: false, error: 'Business owner ID not found in token' };
        }
      } catch (error) {
        return { success: false, error: 'Invalid authentication token' };
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }

      const user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    // Check if location exists and belongs to user
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: locationId,
        ownerId: businessOwnerId,
      },
    });

    if (!existingLocation) {
      return { success: false, error: 'Location not found or access denied' };
    }

    // Delete the location
    await prisma.location.delete({
      where: { id: locationId },
    });

    return {
      success: true,
      data: { message: 'Location deleted successfully' },
    };
  } catch (error: any) {
    console.error('Delete location error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete location',
    };
  }
}