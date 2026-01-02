'use server';

import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { 
  generateBuyerWelcomeTemplate, 
  generateBuyerStatusTemplate,
  generateOfferNotificationTemplate 
} from '@/utils/emailTemplate';
import { sendEmailWithRetry } from '@/services/email.service';

// Helper function to generate a strong password
// Requirements: at least 8 chars, at least one capital letter, at least one number, only !@#$%& special chars
function generateStrongPassword(): string {
  const length = 8;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%&";
  const charset = uppercase + numbers + special;
  let password = "";
  
  // Ensure at least one uppercase letter
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  
  // Ensure at least one number
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Fill the rest randomly from all allowed characters
  for (let i = 2; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

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

// Get all business owners (for admin/system use)
export async function getBusinessOwners(params: {
  pageIndex?: number;
  pageSize?: number;
  email?: string;
  status?: string;
} = {}, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const pageIndex = params.pageIndex || 0;
    const pageSize = params.pageSize || 50;
    const skip = pageIndex * pageSize;
    
    // Build where clause for filtering
    const where: any = {
      is_deleted: false,
    };
    
    if (params.email) {
      where.email = {
        contains: params.email,
        mode: 'insensitive',
      };
    }
    
    if (params.status) {
      where.status = params.status;
    }
    
    const [businessOwners, totalItems] = await Promise.all([
      prisma.businessOwner.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              first_name: true,
              last_name: true,
            }
          }
        }
      }),
      prisma.businessOwner.count({ where })
    ]);
    
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      success: true,
      data: {
        data: businessOwners,
        totalItems,
        totalPages,
        pageIndex,
        pageSize,
      }
    };
  } catch (error) {
    console.error('❌ Error in getBusinessOwners:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch business owners' 
    };
  }
}

// Alias for getAllBuyers to match API route expectations
export async function getBuyers(params: {
  pageIndex?: number;
  pageSize?: number;
  email?: string;
  status?: string;
  country?: string;
  isVerified?: boolean;
} = {}, authToken?: string) {
  return getAllBuyers(params, authToken);
}

// Debug function to check all buyers in database
export async function debugAllBuyers(authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    
    // Get all buyers for this business owner (no pagination)
    const allBuyers = await prisma.buyer.findMany({
      where: {
        businessOwnerId: businessOwnerId,
      },
      select: {
        id: true,
        contactName: true,
        email: true,
        status: true,
        is_deleted: true,
        businessOwnerId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      success: true,
      data: {
        businessOwnerId,
        totalBuyers: allBuyers.length,
        buyers: allBuyers
      }
    };
  } catch (error) {
    console.error('❌ Error in debugAllBuyers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to debug buyers' 
    };
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
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const pageIndex = params.pageIndex || 0;
    const pageSize = params.pageSize || 50;
    
    // Build where clause for filtering (but get ALL buyers first like the old code)
    const where: any = {
      businessOwnerId: businessOwnerId,
      is_deleted: false,
    };
    
    // Get ALL buyers first (like the old code), then apply pagination in memory
    const allBuyers = await prisma.buyer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    // Apply filters in memory (like the old code)
    let filteredBuyers = allBuyers;
    
    if (params.email) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.email?.toLowerCase().includes(params.email!.toLowerCase())
      );
    }
    if (params.status) {
      filteredBuyers = filteredBuyers.filter(buyer => buyer.status === params.status);
    }
    if (params.country) {
      filteredBuyers = filteredBuyers.filter(buyer => buyer.country === params.country);
    }
    
    // Calculate totals from ALL buyers (not just filtered)
    const totalItems = filteredBuyers.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const totalActive = allBuyers.filter(b => b.status === 'active' && !b.is_deleted).length;
    const totalInactive = allBuyers.filter(b => b.status === 'inactive' && !b.is_deleted).length;
    const totalDeleted = allBuyers.filter(b => b.is_deleted === true).length;
    
    // Apply pagination in memory (like the old code)
    const start = pageIndex * pageSize;
    const paginatedBuyers = filteredBuyers.slice(start, start + pageSize);
    
    const result = {
      success: true,
      data: {
        data: {
          data: paginatedBuyers,
          totalItems: totalItems,
          totalActive: totalActive,
          totalInactive: totalInactive,
          totalDeleted: totalDeleted,
          totalPending: 0,
          totalPages,
          pageIndex,
          pageSize,
          revenueGrowth: 0,
          userGrowth: 0,
        }
      }
    };

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
    const pageSize = filters.limit || 50;
    
    // Get ALL buyers first (like the old code)
    const allBuyers = await prisma.buyer.findMany({
      where: {
        businessOwnerId: businessOwnerId,
        is_deleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Apply filters in memory (like the old code)
    let filteredBuyers = allBuyers;
    
    if (filters.email) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.email?.toLowerCase().includes(filters.email!.toLowerCase())
      );
    }
    if (filters.status) {
      filteredBuyers = filteredBuyers.filter(buyer => buyer.status === filters.status);
    }
    if (filters.country) {
      filteredBuyers = filteredBuyers.filter(buyer => buyer.country === filters.country);
    }
    if (filters.contactName) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.contactName?.toLowerCase().includes(filters.contactName!.toLowerCase())
      );
    }
    if (filters.buyersCompanyName) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.buyersCompanyName?.toLowerCase().includes(filters.buyersCompanyName!.toLowerCase())
      );
    }
    if (filters.productName) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.productName?.toLowerCase().includes(filters.productName!.toLowerCase())
      );
    }
    if (filters.locationName) {
      filteredBuyers = filteredBuyers.filter(buyer => 
        buyer.locationName?.toLowerCase().includes(filters.locationName!.toLowerCase())
      );
    }
    
    
    // Apply pagination in memory (like the old code)
    const totalItems = filteredBuyers.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = pageIndex * pageSize;
    const paginatedBuyers = filteredBuyers.slice(start, start + pageSize);
    
    return {
      success: true,
      data: {
        data: {
          buyers: paginatedBuyers,
          totalItems: totalItems,
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
  registrationNumber?: string;
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
  contactEmail?: string;
  buyersCompanyName: string;
  registrationNumber?: string;
  taxId?: string;
  countryCode?: string;
  country?: string;
  businessName?: string;
  phoneNumber?: string;
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
    
    // Validate contact name (allow spaces)
    if (!buyerData.contactName || buyerData.contactName.trim().length === 0) {
      return { success: false, error: 'Contact name is required' };
    }
    
    // Check if buyer with same email already exists for this business owner
    const email = buyerData.contactEmail || buyerData.email || '';
    if (!email) {
      return { success: false, error: 'Email is required' };
    }
    
    const existingBuyer = await prisma.buyer.findFirst({
      where: {
        email: email,
        businessOwnerId: businessOwnerId,
        is_deleted: false
      }
    });
    
    if (existingBuyer) {
      return { success: false, error: 'Buyer with this email already exists' };
    }
    
    // Check if user with same email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return { success: false, error: 'Email is already registered in the system' };
    }
    
    // Check if business name is unique for this business owner (use buyersCompanyName if businessName not provided)
    const businessNameToCheck = buyerData.businessName || buyerData.buyersCompanyName;
    if (businessNameToCheck) {
      const existingBusinessName = await prisma.buyer.findFirst({
        where: {
          businessName: businessNameToCheck,
          businessOwnerId: businessOwnerId,
          is_deleted: false
        }
      });
      
      if (existingBusinessName) {
        return { success: false, error: 'A buyer with this business name already exists' };
      }
    }
    
    // Check if phone number is unique for this business owner (use contactPhone if phoneNumber not provided)
    const phoneToCheck = buyerData.phoneNumber || buyerData.contactPhone;
    if (phoneToCheck) {
      const existingPhone = await prisma.buyer.findFirst({
        where: {
          phoneNumber: phoneToCheck,
          businessOwnerId: businessOwnerId,
          is_deleted: false
        }
      });
      
      if (existingPhone) {
        return { success: false, error: 'A buyer with this phone number already exists' };
      }
    }
    
    // Generate a strong password for the buyer
    const tempPassword = generateStrongPassword();
    
    // Hash the password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Create User account for the buyer (roleId 3 = buyer)
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        first_name: buyerData.contactName.split(' ')[0] || buyerData.contactName,
        last_name: buyerData.contactName.split(' ').slice(1).join(' ') || '',
        roleId: 3, // buyer role
        businessName: buyerData.businessName || buyerData.buyersCompanyName || ''
      }
    });
    
    // Create buyer record
    const buyer = await prisma.buyer.create({
      data: {
        ...buyerData,
        email: email,
        businessOwnerId: businessOwnerId,
        status: 'active',
        is_deleted: false,
        // Ensure businessName is set (use buyersCompanyName as fallback)
        businessName: buyerData.businessName || buyerData.buyersCompanyName || '',
        // Ensure phoneNumber is set (use contactPhone as fallback)
        phoneNumber: buyerData.phoneNumber || buyerData.contactPhone || '',
      }
    });

    // Send welcome email to buyer with credentials
    if (email) {
      try {
        const businessOwner = await prisma.businessOwner.findUnique({
          where: { id: businessOwnerId },
          select: { businessName: true, email: true }
        });

        const loginUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
        
        const emailHtml = generateBuyerWelcomeTemplate({
          buyerName: buyerData.contactName || 'Buyer',
          businessName: businessOwner?.businessName || 'Business',
          email: email,
          password: tempPassword,
          loginUrl
        });

        await sendEmailWithRetry({
          to: email,
          subject: `Welcome to ${businessOwner?.businessName || 'Our Platform'} 🎉`,
          html: emailHtml,
          from: businessOwner?.email || process.env.EMAIL_USER
        });

      } catch (emailError) {
        console.error('Failed to send welcome email to buyer:', emailError);
        // Don't fail the buyer creation if email fails
      }
    }
    
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

// Check business name uniqueness for this business owner
export async function checkBusinessNameUnique(businessName: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    if (!businessName) {
      return { success: false, error: 'Business name is required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const existingBuyer = await prisma.buyer.findFirst({
      where: {
        businessName: businessName,
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
    console.error('Error checking business name uniqueness:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check business name uniqueness' 
    };
  }
}

// Check phone number uniqueness for this business owner
export async function checkPhoneNumberUnique(phoneNumber: string, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    if (!phoneNumber) {
      return { success: false, error: 'Phone number is required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const existingBuyer = await prisma.buyer.findFirst({
      where: {
        phoneNumber: phoneNumber,
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
    console.error('Error checking phone number uniqueness:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check phone number uniqueness' 
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

// Get products for business owner
export async function getProducts(authToken?: string, pageIndex = 0, pageSize = 100) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const skip = pageIndex * pageSize;
    
    // Get products for this business owner (using ownerId to match existing table)
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: { ownerId: businessOwnerId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: { ownerId: businessOwnerId } })
    ]);
    
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      success: true,
      data: {
        data: products,
        totalItems: totalCount,
        totalPages,
        pageIndex,
        pageSize
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch products' 
    };
  }
}

// Get locations for business owner
export async function getLocations(authToken?: string, pageIndex = 0, pageSize = 100) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    const skip = pageIndex * pageSize;
    
    // Get locations for this business owner (using ownerId to match existing table)
    const [locations, totalCount] = await Promise.all([
      prisma.location.findMany({
        where: { ownerId: businessOwnerId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
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

// Get plan usage for business owner
export async function getPlanUsage(authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const businessOwnerId = await getBusinessOwnerFromToken(authToken);
    if (!businessOwnerId) {
      return { success: false, error: 'Business owner not found' };
    }
    
    // Get current usage counts (using correct field names)
    const [buyersCount, productsCount, locationsCount] = await Promise.all([
      prisma.buyer.count({ where: { businessOwnerId, is_deleted: false } }),
      prisma.product.count({ where: { ownerId: businessOwnerId } }),
      prisma.location.count({ where: { ownerId: businessOwnerId } })
    ]);
    
    // Default limits (these could come from a plan table in the future)
    const limits = {
      buyers: 50,
      products: 100,
      locations: 25
    };
    
    return {
      success: true,
      data: {
        buyers: {
          used: buyersCount,
          limit: limits.buyers,
          remaining: Math.max(0, limits.buyers - buyersCount)
        },
        products: {
          used: productsCount,
          limit: limits.products,
          remaining: Math.max(0, limits.products - productsCount)
        },
        locations: {
          used: locationsCount,
          limit: limits.locations,
          remaining: Math.max(0, limits.locations - locationsCount)
        }
      }
    };
  } catch (error) {
    console.error('Error fetching plan usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch plan usage' 
    };
  }
}

// Activate buyer with email notification
export async function activateBuyer(buyerId: string, authToken?: string) {
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
        businessOwnerId: businessOwnerId
      }
    });

    if (!buyer) {
      return { success: false, error: 'Buyer not found' };
    }

    // Update buyer status
    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: { 
        status: 'active',
        is_deleted: false
      }
    });

    // Send activation email
    if (buyer.email) {
      try {
        const businessOwner = await prisma.businessOwner.findUnique({
          where: { id: businessOwnerId },
          select: { businessName: true, email: true }
        });

        const emailHtml = generateBuyerStatusTemplate({
          buyerName: buyer.contactName || 'Buyer',
          businessName: businessOwner?.businessName || 'Business',
          status: 'activated',
          message: 'You can now access all features and place orders.'
        });

        await sendEmailWithRetry({
          to: buyer.email,
          subject: `Account Activated - ${businessOwner?.businessName || 'Platform'} 🎉`,
          html: emailHtml,
          from: businessOwner?.email
        });

      } catch (emailError) {
        console.error('Failed to send activation email:', emailError);
      }
    }

    return {
      success: true,
      data: { buyer: updatedBuyer }
    };
  } catch (error) {
    console.error('Error activating buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to activate buyer' 
    };
  }
}

// Deactivate buyer with email notification
export async function deactivateBuyer(buyerId: string, authToken?: string) {
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
        businessOwnerId: businessOwnerId
      }
    });

    if (!buyer) {
      return { success: false, error: 'Buyer not found' };
    }

    // Update buyer status
    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: { status: 'inactive' }
    });

    // Send deactivation email
    if (buyer.email) {
      try {
        const businessOwner = await prisma.businessOwner.findUnique({
          where: { id: businessOwnerId },
          select: { businessName: true, email: true }
        });

        const emailHtml = generateBuyerStatusTemplate({
          buyerName: buyer.contactName || 'Buyer',
          businessName: businessOwner?.businessName || 'Business',
          status: 'deactivated',
          message: 'Please contact support if you believe this is an error.'
        });

        await sendEmailWithRetry({
          to: buyer.email,
          subject: `Account Deactivated - ${businessOwner?.businessName || 'Platform'}`,
          html: emailHtml,
          from: businessOwner?.email
        });

      } catch (emailError) {
        console.error('Failed to send deactivation email:', emailError);
      }
    }

    return {
      success: true,
      data: { buyer: updatedBuyer }
    };
  } catch (error) {
    console.error('Error deactivating buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deactivate buyer' 
    };
  }
}

// Delete buyer with email notification
export async function deleteBuyer(buyerId: string, authToken?: string) {
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
        businessOwnerId: businessOwnerId
      }
    });

    if (!buyer) {
      return { success: false, error: 'Buyer not found' };
    }

    // Soft delete buyer
    const deletedBuyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: { 
        status: 'inactive',
        is_deleted: true
      }
    });

    // Send deletion email
    if (buyer.email) {
      try {
        const businessOwner = await prisma.businessOwner.findUnique({
          where: { id: businessOwnerId },
          select: { businessName: true, email: true }
        });

        const emailHtml = generateBuyerStatusTemplate({
          buyerName: buyer.contactName || 'Buyer',
          businessName: businessOwner?.businessName || 'Business',
          status: 'deleted',
          message: 'Your account and all associated data have been removed from our system.'
        });

        await sendEmailWithRetry({
          to: buyer.email,
          subject: `Account Removed - ${businessOwner?.businessName || 'Platform'}`,
          html: emailHtml,
          from: businessOwner?.email
        });

      } catch (emailError) {
        console.error('Failed to send deletion email:', emailError);
      }
    }

    return {
      success: true,
      data: { buyer: deletedBuyer }
    };
  } catch (error) {
    console.error('Error deleting buyer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete buyer' 
    };
  }
}