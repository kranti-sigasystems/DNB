'use server';

import prisma from '@/lib/prisma-client';

/**
 * Create test business owner data
 */
export async function createTestBusinessOwner(): Promise<{ success: boolean; message: string; data?: any }> {
  console.log('🧪 createTestBusinessOwner - Creating test data');

  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test.business@example.com' },
    });

    if (existingUser) {
      console.log('⚠️ createTestBusinessOwner - Test user already exists');
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

    console.log('✅ createTestBusinessOwner - User created:', user.id);

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

    console.log('✅ createTestBusinessOwner - Business owner created:', businessOwner.id);

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
  console.log('📊 getDatabaseStats - Fetching database statistics');

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

    console.log('📊 getDatabaseStats - Statistics:', stats);
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
  console.log('🧪 createTestBuyer - Creating test buyer for business owner:', businessOwnerId);

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

    console.log('✅ createTestBuyer - Buyer created:', buyer.id);

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
  console.log('📋 listAllBusinessOwners - Fetching all business owners');

  try {
    const businessOwners = await prisma.businessOwner.findMany({
      include: {
        user: true,
        buyers: true, // Include buyers
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📋 listAllBusinessOwners - Found business owners:', businessOwners.length);
    businessOwners.forEach((bo, index) => {
      console.log(`👤 Business Owner ${index + 1}:`, {
        id: bo.id,
        name: `${bo.first_name} ${bo.last_name}`,
        email: bo.email,
        businessName: bo.businessName,
        status: bo.status,
        isDeleted: bo.is_deleted,
        buyersCount: bo.buyers?.length || 0,
        createdAt: bo.createdAt,
      });
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
  console.log('📋 listAllBuyers - Fetching all buyers');

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

    console.log('📋 listAllBuyers - Found buyers:', buyers.length);
    buyers.forEach((buyer, index) => {
      console.log(`🛒 Buyer ${index + 1}:`, {
        id: buyer.id,
        contactName: buyer.contactName,
        email: buyer.email,
        buyersCompanyName: buyer.buyersCompanyName,
        productName: buyer.productName,
        locationName: buyer.locationName,
        status: buyer.status,
        businessOwner: buyer.businessOwner?.businessName,
        createdAt: buyer.createdAt,
      });
    });

    return buyers;
  } catch (error: any) {
    console.error('❌ listAllBuyers - Error:', error);
    throw new Error(error.message || 'Failed to list buyers');
  }
}