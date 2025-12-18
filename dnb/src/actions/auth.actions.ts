// app/actions/auth/login.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

/* ============================
   Validation
============================ */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  businessName: z.string().optional(),
});

interface LoginCredentials {
  email: string;
  password: string;
  businessName?: string;
}

/* ============================
   Token Types
============================ */

interface TokenPayload {
  id: number | string;
  email: string;
  userRole: string;
  businessName?: string;
  name?: string;
  businessOwnerId?: string;
  ownerId?: string;
  activeNegotiationId?: number | null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenPayload: TokenPayload;
  roleCreatedAt?: Date;
  roleUpdatedAt?: Date;
  roleIsActive?: boolean;
}

/* ============================
   Helpers
============================ */

const generateAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });

const generateRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  });

const checkAccountStatus = (entity: any, name: string) => {
  if (!entity) throw new Error(`${name} not found`);
  if (entity.isDeleted) throw new Error(`${name} deleted`);
  if (entity.status && entity.status !== 'active') {
    throw new Error(`${name} is ${entity.status}`);
  }
};

/* ============================
   Login Action
============================ */

export async function loginAction(
  credentials: LoginCredentials
): Promise<{
  success: boolean;
  data?: LoginResponse;
  error?: string;
  redirectTo?: string;
}> {
  try {
    const parsed = loginSchema.safeParse(credentials);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map(i => i.message).join(', '),
      };
    }

    const { email, password, businessName } = parsed.data;
    console.log('Login attempt for email:', email);
    
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        businessOwner: true,
      },
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User details:', {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        role: user.role?.name,
        businessOwner: user.businessOwner ? 'Has business owner' : 'No business owner'
      });
    }
    // Create user
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          roleId: 6,
          businessName: businessName?.trim() || null,
        },
        include: {
          businessOwner: true,
          role: true,
        },
      });
    } else {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return { success: false, error: 'Invalid email or password' };
      }
    }

    checkAccountStatus(user, 'User');

    if (!user.role?.isActive) {
      return {
        success: false,
        error: `The role '${user.role.name}' is inactive. Contact support.`,
      };
    }

    const roleName = user.role.name;
    let tokenPayload: TokenPayload;

    /* ============================
       Role Handling
    ============================ */

    switch (user.roleId) {
      // Business Owner
      case 2: {
        const owner =
          user.businessOwner ??
          (await prisma.businessOwner.findFirst({
            where: { userId: user.id },
          }));

        if (!owner) {
          return { success: false, error: 'Business owner profile not found' };
        }

        checkAccountStatus(owner, 'Business Owner');

        tokenPayload = {
          id: user.id,
          email: user.email,
          userRole: roleName,
          businessOwnerId: owner.id,
          businessName: owner.businessName,
          name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
        };
        break;
      }

      // Buyer
      case 3: {
        const buyer = await prisma.buyer.findFirst({
          where: { contactEmail: email },
        });

        if (!buyer) {
          return { success: false, error: 'Buyer profile not found' };
        }

        checkAccountStatus(buyer, 'Buyer');

        const activeOffer = await prisma.offer.findFirst({
          where: {
            buyerId: buyer.id,
            businessOwnerId: buyer.ownerId,
          },
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        });

        tokenPayload = {
          id: buyer.id,
          email,
          userRole: roleName,
          businessName: buyer.buyersCompanyName,
          name: buyer.contactName,
          ownerId: buyer.ownerId,
          activeNegotiationId: activeOffer?.id ?? null,
        };
        break;
      }

      // Default
      default:
        tokenPayload = {
          id: user.id,
          email: user.email,
          userRole: roleName,
          businessName: user.businessName ?? '',
          name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
        };
    }

    /* ============================
       Tokens & Cookies
    ============================ */

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const cookieStore = await cookies();

    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    cookieStore.set('user', JSON.stringify(tokenPayload), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    const loginResponse = {
      success: true,
      data: {
        accessToken,
        refreshToken,
        tokenPayload,
        roleCreatedAt: user.role.createdAt,
        roleUpdatedAt: user.role.updatedAt,
        roleIsActive: user.role.isActive,
      },
      redirectTo: tokenPayload.activeNegotiationId
        ? `/negotiation/${tokenPayload.activeNegotiationId}`
        : '/dashboard',
    };
    
    console.log('=== LOGIN SUCCESSFUL ===');
    console.log('Complete Login Response:', JSON.stringify(loginResponse, null, 2));
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Token Payload:', JSON.stringify(tokenPayload, null, 2));
    console.log('========================');
    
    return loginResponse;
  } catch (err) {
    console.error('Login error:', err);
    const errorResponse = {
      success: false,
      error: err instanceof Error ? err.message : 'Login failed',
    };
    console.log('Login failed! Error response:', errorResponse);
    return errorResponse;
  }
}

/* ============================
   Form Action
============================ */

export async function loginFormAction(
  _prev: { error?: string },
  formData: FormData
) {
  const result = await loginAction({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    businessName: (formData.get('businessName') as string) || undefined,
  });

  // Return the full result including tokens for client-side handling
  return result;
}
