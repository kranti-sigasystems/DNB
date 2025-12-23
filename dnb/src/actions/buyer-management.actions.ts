'use server';

import prisma from '@/lib/prisma-client';
import { revalidatePath } from 'next/cache';
import type { Buyer, SearchParams } from '@/types/users';

// Helper function to transform buyer data
function transformBuyer(buyer: any): Buyer {
  return {
    id: buyer.id,
    contactName: buyer.contactName,
    email: buyer.email,
    phoneNumber: buyer.phoneNumber || undefined,
    businessName: buyer.businessName || undefined,
    registrationNumber: buyer.registrationNumber || undefined,
    address: buyer.address || undefined,
    city: buyer.city || undefined,
    state: buyer.state || undefined,
    country: buyer.country,
    postalCode: buyer.postalCode || undefined,
    businessOwnerId: buyer.businessOwnerId,
    status: buyer.status,
    isDeleted: buyer.is_deleted,
    createdAt: buyer.createdAt.toISOString(),
    updatedAt: buyer.updatedAt.toISOString(),
    userRole: 'buyer',
  };
}

/**
 * Add new buyer
 * Equivalent to: POST /add-buyer
 */
export async function addBuyer(
  buyerData: {
    contactName: string;
    email: string;
    phoneNumber?: string;
    businessName?: string;
    registrationNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    businessOwnerId: string;
  },
  authToken: string
): Promise<Buyer> {
  try {
    const buyer = await prisma.buyer.create({
      data: {
        contactName: buyerData.contactName,
        email: buyerData.email,
        phoneNumber: buyerData.phoneNumber,
        buyersCompanyName: buyerData.businessName,
        businessName: buyerData.businessName,
        registrationNumber: buyerData.registrationNumber || `BUY-${Date.now()}`,
        address: buyerData.address,
        city: buyerData.city,
        state: buyerData.state,
        country: buyerData.country || 'India',
        postalCode: buyerData.postalCode,
        businessOwnerId: buyerData.businessOwnerId,
        status: 'active',
      },
    });

    revalidatePath('/buyers');
    revalidatePath('/users');

    return transformBuyer(buyer);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create buyer');
  }
}

/**
 * Check if registration number is unique for buyers
 * Equivalent to: GET /check-registration/:registrationNumber
 */
export async function checkBuyerRegistrationNumber(
  registrationNumber: string,
  authToken: string
): Promise<{ isUnique: boolean }> {
  try {
    const existing = await prisma.buyer.findUnique({
      where: { registrationNumber },
    });

    const isUnique = !existing;

    return { isUnique };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to check registration number');
  }
}

/**
 * Delete buyer (soft delete)
 * Equivalent to: DELETE /delete-buyer/:id
 */
export async function deleteBuyer(buyerId: string, authToken: string): Promise<void> {
  try {
    await prisma.buyer.update({
      where: { id: buyerId },
      data: { is_deleted: true },
    });

    revalidatePath('/buyers');
    revalidatePath('/users');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete buyer');
  }
}

/**
 * Activate buyer
 * Equivalent to: PATCH /activate-buyer/:id/activate
 */
export async function activateBuyer(buyerId: string, authToken: string): Promise<void> {
  try {
    await prisma.buyer.update({
      where: { id: buyerId },
      data: { status: 'active' },
    });

    revalidatePath('/buyers');
    revalidatePath('/users');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to activate buyer');
  }
}

/**
 * Deactivate buyer
 * Equivalent to: PATCH /deactivate-buyer/:id/deactivate
 */
export async function deactivateBuyer(buyerId: string, authToken: string): Promise<void> {
  try {
    await prisma.buyer.update({
      where: { id: buyerId },
      data: { status: 'inactive' },
    });

    revalidatePath('/buyers');
    revalidatePath('/users');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to deactivate buyer');
  }
}

/**
 * Edit buyer
 * Equivalent to: PATCH /edit-buyer/:id/edit
 */
export async function editBuyer(
  buyerId: string,
  buyerData: Partial<{
    contactName: string;
    email: string;
    phoneNumber: string;
    businessName: string;
    registrationNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    status: string;
  }>,
  authToken: string
): Promise<Buyer> {
  try {
    const buyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: {
        contactName: buyerData.contactName,
        email: buyerData.email,
        phoneNumber: buyerData.phoneNumber,
        buyersCompanyName: buyerData.businessName,
        businessName: buyerData.businessName,
        registrationNumber: buyerData.registrationNumber,
        address: buyerData.address,
        city: buyerData.city,
        state: buyerData.state,
        country: buyerData.country,
        postalCode: buyerData.postalCode,
        status: buyerData.status,
      },
    });

    revalidatePath('/buyers');
    revalidatePath('/users');

    return transformBuyer(buyer);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update buyer');
  }
}

/**
 * Search buyers for a specific business owner
 * Equivalent to: GET /:ownerId/buyers/search
 */
export async function searchBuyers(
  ownerId: string,
  searchParams: SearchParams,
  authToken: string
): Promise<{
  data: Buyer[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}> {
  try {
    const { pageIndex, pageSize, ...filters } = searchParams;

    // Build where clause
    const whereClause: any = {
      businessOwnerId: ownerId,
      is_deleted: false,
    };

    if (filters.contactName) {
      whereClause.contactName = { contains: filters.contactName, mode: 'insensitive' };
    }
    if (filters.email) {
      whereClause.email = { contains: filters.email, mode: 'insensitive' };
    }
    if (filters.businessName) {
      whereClause.buyersCompanyName = { contains: filters.businessName, mode: 'insensitive' };
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }

    // Get total count
    const totalItems = await prisma.buyer.count({ where: whereClause });

    // Get buyers with pagination
    const buyers = await prisma.buyer.findMany({
      where: whereClause,
      skip: pageIndex * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    const transformedBuyers: Buyer[] = buyers.map(transformBuyer);

    return {
      data: transformedBuyers,
      totalItems,
      totalPages,
      pageIndex,
      pageSize,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to search buyers');
  }
}

/**
 * Get all buyers for a business owner
 * Equivalent to: GET /get-all-buyers
 */
export async function getAllBuyers(businessOwnerId: string, authToken: string): Promise<Buyer[]> {
  try {
    const buyers = await prisma.buyer.findMany({
      where: {
        businessOwnerId,
        is_deleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return buyers.map(transformBuyer);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch buyers');
  }
}

/**
 * Get buyers list (simplified) for a business owner
 * Equivalent to: GET /get-buyers-list
 */
export async function getBuyersList(
  businessOwnerId: string,
  authToken: string
): Promise<Array<{ id: string; contactName: string; email: string }>> {
  try {
    const buyers = await prisma.buyer.findMany({
      where: {
        businessOwnerId,
        is_deleted: false,
      },
      select: {
        id: true,
        contactName: true,
        email: true,
      },
      orderBy: { contactName: 'asc' },
    });

    return buyers;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch buyers list');
  }
}

/**
 * Get buyer by ID
 * Equivalent to: GET /get-buyer/:id
 */
export async function getBuyerById(buyerId: string, authToken: string): Promise<Buyer> {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new Error('Buyer not found');
    }

    return transformBuyer(buyer);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch buyer');
  }
}

/**
 * Become business owner (user registration as business owner)
 * Equivalent to: POST /become-business-owner
 */
export async function becomeBusinessOwner(userData: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  businessName: string;
  phoneNumber?: string;
  registrationNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
}): Promise<{ user: any; businessOwner: any; message: string }> {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Check if business name already exists
    const existingBusiness = await prisma.businessOwner.findUnique({
      where: { businessName: userData.businessName },
    });

    if (existingBusiness) {
      throw new Error('Business name already exists');
    }

    // Create user first
    const user = await prisma.user.create({
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        password: userData.password, // Should be hashed in production
        roleId: 2, // Business owner role
        businessName: userData.businessName,
      },
    });

    // Create business owner
    const businessOwner = await prisma.businessOwner.create({
      data: {
        userId: user.id,
        businessName: userData.businessName,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        registrationNumber: userData.registrationNumber || `REG-${Date.now()}`,
        country: userData.country || 'India',
        state: userData.state || 'Unknown',
        city: userData.city || 'Unknown',
        address: userData.address || 'Unknown',
        postalCode: userData.postalCode || '000000',
        status: 'active',
      },
    });

    revalidatePath('/users');

    return {
      user,
      businessOwner,
      message: 'Business owner account created successfully',
    };
  } catch (error: any) {
    
    throw new Error(error.message || 'Failed to create business owner account');
  }
}