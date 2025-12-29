'use server';

import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import type { 
  Location, 
  CreateLocationData, 
  UpdateLocationData, 
  LocationSearchFilters,
  PaginatedLocationResponse 
} from '@/types/location';

// Helper function to decode JWT and get business owner ID
async function getBusinessOwnerFromToken(authToken: string) {
  try {
    const decoded = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret') as any;
    
    if (decoded.businessOwnerId) {
      // Verify the business owner still exists
      const businessOwner = await prisma.businessOwner.findUnique({
        where: { id: decoded.businessOwnerId },
        select: { id: true }
      });
      return businessOwner?.id || null;
    }
    
    if (decoded.id) {
      const businessOwner = await prisma.businessOwner.findFirst({
        where: { userId: decoded.id },
        select: { id: true }
      });
      return businessOwner?.id || null;
    }
    
    return null;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid JWT token');
    } else {
      console.error('Error decoding token:', error);
    }
    return null;
  }
}

// Get all locations for business owner
export async function getAllLocations(authToken?: string, pageIndex = 0, pageSize = 100) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found. Please log in again.' };
    }
    
    const skip = pageIndex * pageSize;
    
    const [locations, totalCount] = await Promise.all([
      prisma.location.findMany({
        where: { ownerId: businessOwnerId },
        skip,
        take: pageSize,
        orderBy: { city: 'asc' }
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

// Get location by ID
export async function getLocationById(locationId: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const location = await prisma.location.findFirst({
      where: { 
        id: locationId,
        ownerId: businessOwnerId
      }
    });
    
    if (!location) {
      return { success: false, error: 'Location not found' };
    }
    
    return {
      success: true,
      data: { location }
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get location' 
    };
  }
}

// Create new location
export async function createLocation(locationData: CreateLocationData, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Check if location with same code already exists for this business owner
    const existingLocation = await prisma.location.findFirst({
      where: {
        code: locationData.code,
        ownerId: businessOwnerId
      }
    });
    
    if (existingLocation) {
      return { success: false, error: 'Location with this code already exists' };
    }
    
    const location = await prisma.location.create({
      data: {
        locationName: locationData.locationName,
        city: locationData.city,
        state: locationData.state,
        code: locationData.code,
        country: locationData.country,
        address: locationData.address,
        postalCode: locationData.postalCode,
        ownerId: businessOwnerId
      }
    });
    
    return {
      success: true,
      data: { location }
    };
  } catch (error) {
    console.error('Error creating location:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create location' 
    };
  }
}

// Update location
export async function updateLocation(locationId: string, updateData: UpdateLocationData, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Check if location exists and belongs to business owner
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: locationId,
        ownerId: businessOwnerId
      }
    });
    
    if (!existingLocation) {
      return { success: false, error: 'Location not found' };
    }
    
    // Check for code conflicts if code is being updated
    if (updateData.code && updateData.code !== existingLocation.code) {
      const codeConflict = await prisma.location.findFirst({
        where: {
          code: updateData.code,
          ownerId: businessOwnerId,
          id: { not: locationId }
        }
      });
      
      if (codeConflict) {
        return { success: false, error: 'Location with this code already exists' };
      }
    }
    
    const location = await prisma.location.update({
      where: { id: locationId },
      data: updateData
    });
    
    return {
      success: true,
      data: { location }
    };
  } catch (error) {
    console.error('Error updating location:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update location' 
    };
  }
}

// Delete location
export async function deleteLocation(locationId: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        ownerId: businessOwnerId
      }
    });
    
    if (!location) {
      return { success: false, error: 'Location not found' };
    }
    
    await prisma.location.delete({
      where: { id: locationId }
    });
    
    return {
      success: true,
      data: { location }
    };
  } catch (error) {
    console.error('Error deleting location:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete location' 
    };
  }
}

// Get location statistics
export async function getLocationStats(authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found. Please log in again.' };
    }
    
    const [totalCount, countryCount] = await Promise.all([
      prisma.location.count({ where: { ownerId: businessOwnerId } }),
      prisma.location.groupBy({
        by: ['country'],
        where: { ownerId: businessOwnerId },
        _count: { country: true }
      })
    ]);
    
    return {
      success: true,
      data: {
        totalLocations: totalCount,
        countriesCount: countryCount.length,
        countryBreakdown: countryCount.map((item: any) => ({
          country: item.country,
          count: item._count.country
        }))
      }
    };
  } catch (error) {
    console.error('Error fetching location stats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch location statistics' 
    };
  }
}

// Search locations
export async function searchLocations(filters: LocationSearchFilters, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found. Please log in again.' };
    }
    
    const pageIndex = filters.page || 0;
    const pageSize = filters.limit || 50;
    const skip = pageIndex * pageSize;
    
    // Build where clause
    const where: any = {
      ownerId: businessOwnerId
    };
    
    // General query search across multiple fields
    if (filters.query) {
      where.OR = [
        { city: { contains: filters.query, mode: 'insensitive' } },
        { state: { contains: filters.query, mode: 'insensitive' } },
        { country: { contains: filters.query, mode: 'insensitive' } },
        { code: { contains: filters.query, mode: 'insensitive' } },
        { locationName: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } }
      ];
    }
    
    // Specific field filters
    if (filters.locationName) {
      where.locationName = { contains: filters.locationName, mode: 'insensitive' };
    }
    
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    
    if (filters.state) {
      where.state = { contains: filters.state, mode: 'insensitive' };
    }
    
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }
    
    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' };
    }
    
    if (filters.address) {
      where.address = { contains: filters.address, mode: 'insensitive' };
    }
    
    const [locations, totalCount] = await Promise.all([
      prisma.location.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { city: 'asc' }
      }),
      prisma.location.count({ where })
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
    console.error('Error searching locations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search locations' 
    };
  }
}