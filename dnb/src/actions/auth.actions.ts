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
  authToken: string;
  refreshToken: string;
  tokenPayload: TokenPayload;
  roleCreatedAt?: Date;
  roleUpdatedAt?: Date;
  roleIsActive?: boolean;
}

/* ============================
   Helpers
============================ */

const generateauthToken = (payload: TokenPayload) =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret', {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });

const generateRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret', {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  });

const checkAccountStatus = (entity: any, name: string) => {
  if (!entity) throw new Error(`${name} not found`);
  if (entity.isDeleted) throw new Error(`${name} deleted`);
  if (entity.status && entity.status !== 'active') {
    throw new Error(`${name} is ${entity.status}`);
  }
};

// Role mapping based on roleId
const getRoleName = (roleId: number): string => {
  switch (roleId) {
    case 1: return 'super_admin';
    case 2: return 'business_owner';
    case 3: return 'buyer';
    case 6: return 'user';
    default: return 'user';
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
    
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        businessOwner: true,
      },
    });
    
    // Create user if doesn't exist
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          roleId: 6, // Default user role
          businessName: businessName?.trim() || undefined,
        },
        include: {
          businessOwner: true,
        },
      });
    } else {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return { success: false, error: 'Invalid email or password' };
      }
    }

    checkAccountStatus(user, 'User');

    const roleName = getRoleName(user.roleId);
    let tokenPayload: TokenPayload;

    /* ============================
       Role Handling
    ============================ */

    switch (user.roleId) {
      // Super Admin
      case 1: {
        tokenPayload = {
          id: user.id,
          email: user.email,
          userRole: roleName,
          businessName: user.businessName ?? '',
          name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
        };
        break;
      }

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
        try {
          const buyer = await prisma.buyer.findFirst({
            where: { email: email },
          });

          if (!buyer) {
            return { success: false, error: 'Buyer profile not found' };
          }

          checkAccountStatus(buyer, 'Buyer');

          tokenPayload = {
            id: buyer.id,
            email,
            userRole: roleName,
            businessName: buyer.buyersCompanyName,
            name: buyer.contactName,
            ownerId: buyer.businessOwnerId,
            activeNegotiationId: null,
          };
        } catch (error) {
          // If buyer table doesn't exist, treat as regular user
          tokenPayload = {
            id: user.id,
            email: user.email,
            userRole: 'user',
            businessName: user.businessName ?? '',
            name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
          };
        }
        break;
      }

      // Default User
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

    const authToken = generateauthToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const sessionStorage = await cookies();

    sessionStorage.set('authToken', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });

    sessionStorage.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    sessionStorage.set('user', JSON.stringify(tokenPayload), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    const loginResponse = {
      success: true,
      data: {
        authToken,
        refreshToken,
        tokenPayload,
        roleCreatedAt: new Date(),
        roleUpdatedAt: new Date(),
        roleIsActive: true,
      },
      redirectTo: tokenPayload.activeNegotiationId
        ? `/negotiation/${tokenPayload.activeNegotiationId}`
        : '/dashboard',
    };

    return loginResponse;
  } catch (err) {
    const errorResponse = {
      success: false,
      error: err instanceof Error ? err.message : 'Login failed',
    };
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
