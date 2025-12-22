/**
 * Authentication Server Actions
 * Handles token refresh and authentication operations
 */

'use server';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

interface TokenPayload {
  id: string;
  email: string;
  userRole: string;
  businessOwnerId?: string;
  businessName?: string;
  name?: string;
  ownerId?: string;
  activeNegotiationId?: string | null;
  iat?: number;
  exp?: number;
}

interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    authToken: string;
    refreshToken: string;
    tokenPayload: TokenPayload;
  };
  error?: string;
}

interface LoginFormResponse {
  success: boolean;
  data?: {
    authToken: string;
    refreshToken: string;
    tokenPayload: TokenPayload;
  };
  error?: string;
  redirectTo?: string;
}

/**
 * Generate a new access token
 */
function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('ACCESS_TOKEN_SECRET is not configured');
  }

  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '15m';

  return (jwt.sign as any)(payload, secret, { expiresIn });
}

/**
 * Generate a new refresh token
 */
function generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET;
  
  if (!secret) {
    throw new Error('REFRESH_TOKEN_SECRET is not configured');
  }

  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '7d';

  return (jwt.sign as any)(payload, secret, { expiresIn });
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token: string, secret: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 * This server action handles expired access tokens and creates new ones
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
  try {

    if (!refreshToken) {
      return {
        success: false,
        error: 'Refresh token is required',
      };
    }

    // Get refresh token secret
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET;
    
    if (!refreshSecret) {
      console.error('❌ REFRESH_TOKEN_SECRET is not configured');
      return {
        success: false,
        error: 'Server configuration error',
      };
    }

    // Verify refresh token (even if expired, we'll check manually)
    let decoded: TokenPayload | null = null;
    
    try {
      decoded = jwt.verify(refreshToken, refreshSecret) as TokenPayload;
    } catch (error: any) {
      // Check if token is expired
      if (error.name === 'TokenExpiredError') {
        
        // Try to decode without verification to get the payload
        try {
          decoded = jwt.decode(refreshToken) as TokenPayload;
        } catch (decodeError) {
          console.error('❌ Failed to decode expired token:', decodeError);
          return {
            success: false,
            error: 'Invalid refresh token format',
          };
        }
      } else {
        console.error('❌ Refresh token verification failed:', error.message);
        return {
          success: false,
          error: 'Invalid refresh token',
        };
      }
    }

    if (!decoded || !decoded.id) {
      return {
        success: false,
        error: 'Invalid token payload',
      };
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        roleId: true,
        businessName: true,
      },
    });

    if (!user) {
      console.error('❌ User not found:', decoded.id);
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Determine user role
    let userRole = 'buyer';
    let businessOwnerId: string | undefined;
    let businessName: string | undefined;

    if (user.roleId === 1) {
      userRole = 'super_admin';
    } else if (user.roleId === 2) {
      userRole = 'business_owner';
      
      // Get business owner details
      const businessOwner = await prisma.businessOwner.findFirst({
        where: { 
          userId: user.id,
          is_deleted: false,
        },
        select: {
          id: true,
          businessName: true,
          status: true,
        },
      });

      if (businessOwner) {
        if (businessOwner.status !== 'active') {
          console.error('❌ Business owner account is inactive:', businessOwner.id);
          return {
            success: false,
            error: 'Business owner account is inactive',
          };
        }
        
        businessOwnerId = businessOwner.id;
        businessName = businessOwner.businessName;
      }
    }

    // Create new token payload with fresh data
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      userRole,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      businessOwnerId,
      businessName: businessName || user.businessName || undefined,
      ownerId: businessOwnerId,
      activeNegotiationId: decoded.activeNegotiationId || null,
    };

    // Generate new tokens
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return {
      success: true,
      data: {
        accessToken: newAccessToken,
        authToken: newAccessToken, // Alias for compatibility
        refreshToken: newRefreshToken,
        tokenPayload: {
          ...tokenPayload,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
        },
      },
    };

  } catch (error: any) {
    console.error('❌ Token refresh error:', error);
    return {
      success: false,
      error: error.message || 'Internal server error',
    };
  }
}

/**
 * Validate an access token
 */
export async function validateAccessToken(accessToken: string): Promise<{
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}> {
  try {
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
    
    if (!secret) {
      return {
        valid: false,
        error: 'Server configuration error',
      };
    }

    const decoded = verifyToken(accessToken, secret);
    
    if (!decoded) {
      return {
        valid: false,
        error: 'Invalid or expired token',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };

  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Token validation failed',
    };
  }
}

/**
 * Check if a token is expired
 */
export async function isTokenExpired(token: string): Promise<boolean> {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiry time in seconds
 */
export async function getTokenExpiryTime(token: string): Promise<number | null> {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded?.exp || null;
  } catch (error) {
    return null;
  }
}
/**
 * Login form action for Next.js form handling
 * @param prevState Previous form state
 * @param formData Form data from the login form
 * @returns Login response with tokens or error
 */
export async function loginFormAction(
  prevState: any,
  formData: FormData
): Promise<LoginFormResponse> {
  try {
    // Extract form data
    const businessName = formData.get('businessName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validate required fields
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        first_name: true,
        last_name: true,
        roleId: true,
        businessName: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }
    // Determine user role and get additional data
    let userRole = 'buyer';
    let businessOwnerId: string | undefined;
    let businessNameFromDB: string | undefined;
    let redirectTo = '/dashboard';

    if (user.roleId === 1) {
      userRole = 'super_admin';
      redirectTo = '/dashboard';
    } else if (user.roleId === 2) {
      userRole = 'business_owner';
      
      // Get business owner details
      const businessOwner = await prisma.businessOwner.findFirst({
        where: { 
          userId: user.id,
          is_deleted: false,
        },
        select: {
          id: true,
          businessName: true,
          status: true,
        },
      });

      if (businessOwner) {
        if (businessOwner.status !== 'active') {
          return {
            success: false,
            error: 'Your business account is inactive. Please contact support.',
          };
        }
        
        businessOwnerId = businessOwner.id;
        businessNameFromDB = businessOwner.businessName;
        
        // If business name was provided in form, verify it matches
        if (businessName && businessName !== businessOwner.businessName) {
          return {
            success: false,
            error: 'Invalid business name',
          };
        }
        
      } else {
        return {
          success: false,
          error: 'Business owner account not found',
        };
      }
      
      redirectTo = '/dashboard';
    }

    // Create token payload
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      userRole,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      businessOwnerId,
      businessName: businessNameFromDB || user.businessName || undefined,
      ownerId: businessOwnerId,
      activeNegotiationId: null,
    };
    // Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      success: true,
      data: {
        authToken: accessToken,
        refreshToken,
        tokenPayload: {
          ...tokenPayload,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
        },
      },
      redirectTo,
    };

  } catch (error: any) {
    console.error('❌ Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed. Please try again.',
    };
  }
}