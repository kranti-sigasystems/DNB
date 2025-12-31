'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/services/email.service';
import crypto from 'crypto';
import type { Buyer, SearchParams } from '@/types/users';

/**
 * Hash password using Node.js crypto (fallback for bcrypt)
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}
function generateStrongPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one character from each category
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate unique registration number
 */
async function generateUniqueRegistrationNumber(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const regNumber = `BUY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const existing = await prisma.buyer.findUnique({
      where: { registrationNumber: regNumber },
    });
    
    if (!existing) {
      return regNumber;
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
  }
  
  throw new Error('Failed to generate unique registration number');
}

/**
 * Check for duplicate values in buyer data
 */
export async function checkBuyerDuplicates(data: {
  email: string;
  businessName?: string;
  registrationNumber?: string;
  phoneNumber?: string;
  excludeBuyerId?: string;
}): Promise<{
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}> {
  try {
    const errors: Array<{ field: string; message: string }> = [];
    
    // Check email uniqueness
    if (data.email) {
      const existingEmail = await prisma.buyer.findFirst({
        where: {
          email: data.email,
          is_deleted: false,
          ...(data.excludeBuyerId && { id: { not: data.excludeBuyerId } }),
        },
      });
      
      if (existingEmail) {
        errors.push({ field: 'email', message: 'Email address is already registered' });
      }
    }
    
    // Check business name uniqueness
    if (data.businessName) {
      const existingBusiness = await prisma.buyer.findFirst({
        where: {
          buyersCompanyName: data.businessName,
          is_deleted: false,
          ...(data.excludeBuyerId && { id: { not: data.excludeBuyerId } }),
        },
      });
      
      if (existingBusiness) {
        errors.push({ field: 'buyersCompanyName', message: 'Company name is already registered' });
      }
    }
    
    // Check registration number uniqueness
    if (data.registrationNumber) {
      const existingReg = await prisma.buyer.findFirst({
        where: {
          registrationNumber: data.registrationNumber,
          ...(data.excludeBuyerId && { id: { not: data.excludeBuyerId } }),
        },
      });
      
      if (existingReg) {
        errors.push({ field: 'registrationNumber', message: 'Registration number is already in use' });
      }
    }
    
    // Check phone number uniqueness
    if (data.phoneNumber) {
      const existingPhone = await prisma.buyer.findFirst({
        where: {
          OR: [
            { phoneNumber: data.phoneNumber },
            { contactPhone: data.phoneNumber },
          ],
          is_deleted: false,
          ...(data.excludeBuyerId && { id: { not: data.excludeBuyerId } }),
        },
      });
      
      if (existingPhone) {
        errors.push({ field: 'phoneNumber', message: 'Phone number is already registered' });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    console.error('❌ Error checking buyer duplicates:', error);
    return {
      isValid: false,
      errors: [{ field: 'general', message: 'Failed to validate data' }],
    };
  }
}
/**
 * Send welcome email to new buyer with login credentials
 */
async function sendWelcomeEmail(buyer: any, businessOwner: any, loginCredentials: { email: string; password: string }): Promise<void> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/login`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to Our Platform!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your buyer account has been created</p>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Dear ${buyer.contactName},</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; line-height: 1.6;">
              Welcome to our digital negotiation platform! You have been added as a buyer by <strong>${businessOwner.businessName}</strong>.
            </p>
            
            <p style="color: #333; line-height: 1.6;">
              Your account has been created and you can now log in to receive and manage business offers efficiently.
            </p>
          </div>
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #1565c0; margin-top: 0; margin-bottom: 15px;">🔐 Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #bbdefb;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #bbdefb; font-family: monospace; background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${loginCredentials.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #bbdefb;"><strong>Password:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #bbdefb; font-family: monospace; background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${loginCredentials.password}</td>
              </tr>
            </table>
            <p style="margin: 15px 0 0 0; color: #1565c0; font-size: 14px;">
              <strong>⚠️ Important:</strong> Please save these credentials securely and change your password after first login.
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Account Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${buyer.contactName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${buyer.email}</td>
              </tr>
              ${buyer.buyersCompanyName ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${buyer.buyersCompanyName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Added by:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${businessOwner.businessName}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🚀 Login to Platform
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              Click the button above to log in and start receiving offers.
            </p>
          </div>
          
          <div style="background: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #2e7d32; font-size: 14px;">
              <strong>💡 What's Next:</strong><br>
              • Log in using the credentials above<br>
              • You'll receive email notifications when new offers are available<br>
              • Each offer email will contain a direct link for easy access<br>
              • You can review offer details and respond directly through the platform
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              If you have any questions or need assistance, please don't hesitate to contact us.<br>
              We look forward to facilitating successful business negotiations for you.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px;">
              Best regards,<br>
              <strong>${businessOwner.businessName}</strong><br>
              <span style="opacity: 0.8;">Digital Negotiation Platform</span>
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
Welcome to Our Platform!

Dear ${buyer.contactName},

Welcome to our digital negotiation platform! You have been added as a buyer by ${businessOwner.businessName}.

Your Login Credentials:
Email: ${loginCredentials.email}
Password: ${loginCredentials.password}

IMPORTANT: Please save these credentials securely and change your password after first login.

Your Account Details:
- Name: ${buyer.contactName}
- Email: ${buyer.email}
${buyer.buyersCompanyName ? `- Company: ${buyer.buyersCompanyName}` : ''}
- Added by: ${businessOwner.businessName}

What's Next:
• Log in using the credentials above
• You'll receive email notifications when new offers are available
• Each offer email will contain a direct link for easy access
• You can review offer details and respond directly through the platform

Login to the platform: ${loginUrl}

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
${businessOwner.businessName}
Digital Negotiation Platform
    `;

    await sendEmail({
      to: buyer.email,
      subject: `Welcome to ${businessOwner.businessName}'s Digital Platform - Login Credentials`,
      html: emailHtml,
      text: textContent,
    });

  } catch (error) {
    console.error('❌ Failed to send welcome email to buyer:', buyer.email, error);
    // Don't throw error - buyer creation should succeed even if email fails
  }
}
function transformBuyer(buyer: any): Buyer {
  return {
    id: buyer.id,
    email: buyer.email,
    first_name: buyer.contactName || '',
    last_name: '',
    phoneNumber: buyer.phoneNumber || undefined,
    status: buyer.status as 'active' | 'inactive',
    isDeleted: buyer.is_deleted,
    createdAt: buyer.createdAt.toISOString(),
    updatedAt: buyer.updatedAt.toISOString(),
    userRole: 'buyer',
    contactName: buyer.contactName,
    contactEmail: buyer.contactEmail || undefined,
    contactPhone: buyer.contactPhone || undefined,
    buyersCompanyName: buyer.businessName || buyer.buyersCompanyName || undefined,
    productName: buyer.productName || undefined,
    locationName: buyer.locationName || undefined,
    businessOwnerId: buyer.businessOwnerId,
  };
}

/**
 * Add new buyer with user account creation and validation
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
    const duplicateCheck = await checkBuyerDuplicates({
      email: buyerData.email,
      businessName: buyerData.businessName,
      registrationNumber: buyerData.registrationNumber,
      phoneNumber: buyerData.phoneNumber,
    });
    
    if (!duplicateCheck.isValid) {
      const errorMessage = duplicateCheck.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    
    // Step 2: Get business owner details for welcome email
    const businessOwner = await prisma.businessOwner.findUnique({
      where: { id: buyerData.businessOwnerId },
      select: {
        id: true,
        businessName: true,
        email: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!businessOwner) {
      throw new Error('Business owner not found');
    }
    
    // Step 3: Generate unique registration number if not provided
    const registrationNumber = buyerData.registrationNumber || await generateUniqueRegistrationNumber();
    
    // Step 4: Generate strong password for buyer login
    const password = generateStrongPassword();
    const hashedPassword = hashPassword(password);
    
    // Step 5: Create user account first (for login)
    const user = await prisma.user.create({
      data: {
        first_name: buyerData.contactName.split(' ')[0] || buyerData.contactName,
        last_name: buyerData.contactName.split(' ').slice(1).join(' ') || '',
        email: buyerData.email,
        password: hashedPassword,
        roleId: 3, // Buyer role
        businessName: buyerData.businessName || '',
      },
    });
    
    // Step 6: Create buyer record
    const buyer = await prisma.buyer.create({
      data: {
        contactName: buyerData.contactName,
        email: buyerData.email,
        phoneNumber: buyerData.phoneNumber,
        contactPhone: buyerData.phoneNumber,
        buyersCompanyName: buyerData.businessName,
        businessName: buyerData.businessName,
        registrationNumber: registrationNumber,
        address: buyerData.address,
        city: buyerData.city,
        state: buyerData.state,
        country: buyerData.country || 'India',
        postalCode: buyerData.postalCode,
        businessOwnerId: buyerData.businessOwnerId,
        status: 'active',
      },
    });

    // Step 7: Send welcome email with login credentials
    await sendWelcomeEmail(buyer, businessOwner, {
      email: buyerData.email,
      password: password, // Send plain password in email (user should change it)
    });

    revalidatePath('/buyers');
    revalidatePath('/users');

    return transformBuyer(buyer);
  } catch (error: any) {
    console.error('❌ Failed to create buyer:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        throw new Error('Email address is already registered');
      } else if (error.meta?.target?.includes('registrationNumber')) {
        throw new Error('Registration number is already in use');
      } else {
        throw new Error('A buyer with this information already exists');
      }
    }
    
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