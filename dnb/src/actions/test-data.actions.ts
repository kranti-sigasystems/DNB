'use server';

import prisma from '@/lib/prisma-client';

/**
 * Create test business owner data
 */
export async function createTestBusinessOwner(): Promise<{ success: boolean; message: string; data?: any }> {

  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test.business@example.com' },
    });

    if (existingUser) {
      return { success: false, message: 'Test business owner already exists' };
    }

    // Create test user first
    const user = await prisma.user.create({
      data: {
        first_name: 'Test',
        last_name: 'Business Owner',
        email: 'test.business@example.com',
        password: 'hashed_password_here', // In production, this should be properly hashed
        roleId: 2, // Business owner role
        businessName: 'Test Business Corp',
      },
    });


    // Create test business owner
    const businessOwner = await prisma.businessOwner.create({
      data: {
        userId: user.id,
        businessName: 'Test Business Corp',
        first_name: 'Test',
        last_name: 'Business Owner',
        email: 'test.business@example.com',
        phoneNumber: '+1234567890',
        registrationNumber: `TEST-REG-${Date.now()}`,
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        address: '123 Test Street',
        postalCode: '400001',
        status: 'active',
      },
    });


    return {
      success: true,
      message: 'Test business owner created successfully',
      data: {
        userId: user.id,
        businessOwnerId: businessOwner.id,
        email: user.email,
        businessName: businessOwner.businessName,
      },
    };
  } catch (error: any) {
    console.error('❌ createTestBusinessOwner - Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create test business owner',
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  users: number;
  businessOwners: number;
  activeBusinessOwners: number;
  inactiveBusinessOwners: number;
}> {

  try {
    const [users, businessOwners, activeBusinessOwners, inactiveBusinessOwners] = await Promise.all([
      prisma.user.count(),
      prisma.businessOwner.count(),
      prisma.businessOwner.count({ where: { status: 'active' } }),
      prisma.businessOwner.count({ where: { status: 'inactive' } }),
    ]);

    const stats = {
      users,
      businessOwners,
      activeBusinessOwners,
      inactiveBusinessOwners,
    };
    return stats;
  } catch (error: any) {
    console.error('❌ getDatabaseStats - Error:', error);
    throw new Error(error.message || 'Failed to fetch database statistics');
  }
}

/**
 * Create test buyer data for a business owner
 */
export async function createTestBuyer(businessOwnerId: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const buyer = await prisma.buyer.create({
      data: {
        contactName: 'Test Buyer',
        email: `test.buyer.${Date.now()}@example.com`,
        contactEmail: `contact.${Date.now()}@example.com`,
        contactPhone: '+1234567890',
        buyersCompanyName: 'Test Buyer Company',
        productName: 'Test Product',
        locationName: 'Test Location',
        businessOwnerId: businessOwnerId,
        status: 'active',
      },
    });

    return {
      success: true,
      message: 'Test buyer created successfully',
      data: {
        buyerId: buyer.id,
        contactName: buyer.contactName,
        email: buyer.email,
        businessOwnerId: buyer.businessOwnerId,
      },
    };
  } catch (error: any) {
    console.error('❌ createTestBuyer - Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create test buyer',
    };
  }
}

/**
 * List all business owners (for debugging)
 */
export async function listAllBusinessOwners(): Promise<any[]> {

  try {
    const businessOwners = await prisma.businessOwner.findMany({
      include: {
        user: true,
        buyers: true, // Include buyers
      },
      orderBy: { createdAt: 'desc' },
    });

    return businessOwners;
  } catch (error: any) {
    console.error('❌ listAllBusinessOwners - Error:', error);
    throw new Error(error.message || 'Failed to list business owners');
  }
}

/**
 * List all buyers for debugging
 */
export async function listAllBuyers(): Promise<any[]> {

  try {
    const buyers = await prisma.buyer.findMany({
      include: {
        businessOwner: {
          select: {
            businessName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return buyers;
  } catch (error: any) {
    console.error('❌ listAllBuyers - Error:', error);
    throw new Error(error.message || 'Failed to list buyers');
  }
}