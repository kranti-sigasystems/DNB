import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../handlers/responseHandler';

interface DecodedToken {
  id: string;
  email: string;
  userRole: string;
  businessName?: string;
  [key: string]: any;
}

interface AuthenticatedRequest extends NextRequest {
  user?: DecodedToken;
}

/**
 * Authenticate JWT token for Next.js API routes
 */
export const authenticateJWT = async (
  req: AuthenticatedRequest
): Promise<NextResponse | null> => {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(401, 'Unauthorized: No access token provided');
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.ACCESS_TOKEN_SECRET) {
      console.error('ACCESS_TOKEN_SECRET is not defined');
      return errorResponse(500, 'Server configuration error');
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as DecodedToken;
      req.user = decoded;
      return null; // Success, no error response
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return errorResponse(403, 'Token expired');
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return errorResponse(403, 'Invalid token');
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse(500, 'Internal Server Error during authentication');
  }
};

/**
 * Authenticate access token (alias for authenticateJWT)
 */
export const authenticateAccessToken = authenticateJWT;

/**
 * Middleware wrapper for API routes that require authentication
 */
export const withAuth = <T extends any[]>(
  handler: (req: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) => {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const authError = await authenticateJWT(req as AuthenticatedRequest);
    
    if (authError) {
      return authError;
    }
    
    return handler(req as AuthenticatedRequest, ...args);
  };
};

/**
 * Role-based authorization middleware
 */
export const withRole = (allowedRoles: string[]) => {
  return <T extends any[]>(
    handler: (req: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
  ) => {
    return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      const authError = await authenticateJWT(req as AuthenticatedRequest);
      
      if (authError) {
        return authError;
      }
      
      const userRole = (req as AuthenticatedRequest).user?.userRole;
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        return errorResponse(403, 'Insufficient permissions');
      }
      
      return handler(req as AuthenticatedRequest, ...args);
    };
  };
};

/**
 * Extract user from request (after authentication)
 */
export const getAuthenticatedUser = (req: AuthenticatedRequest): DecodedToken | null => {
  return req.user || null;
};