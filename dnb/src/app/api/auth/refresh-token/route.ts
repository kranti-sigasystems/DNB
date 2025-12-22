import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface RefreshTokenPayload {
  id: string;
  email: string;
  userRole: string;
  businessOwnerId?: string;
  businessName?: string;
  name?: string;
  ownerId?: string;
  activeNegotiationId?: string | null;
}

// Generate access token (15 minutes)
function generateAccessToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret', {
    expiresIn: '15m',
  });
}

// Generate refresh token (7 days)
function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret', {
    expiresIn: '7d',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret'
      ) as RefreshTokenPayload;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        businessOwner: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // For business owners, verify business owner still exists
    if (decoded.businessOwnerId) {
      const businessOwner = await prisma.businessOwner.findUnique({
        where: { id: decoded.businessOwnerId },
      });

      if (!businessOwner) {
        return NextResponse.json(
          { success: false, error: 'Business owner not found' },
          { status: 404 }
        );
      }

      // Check if business owner is still active
      if (businessOwner.status !== 'active' || businessOwner.is_deleted) {
        return NextResponse.json(
          { success: false, error: 'Business owner account is inactive' },
          { status: 403 }
        );
      }
    }

    // Generate new tokens with the same payload
    const newAccessToken = generateAccessToken(decoded);
    const newRefreshToken = generateRefreshToken(decoded);

    return NextResponse.json({
      success: true,
      data: {
        authToken: newAccessToken,
        accessToken: newAccessToken, // Some clients might expect this field name
        refreshToken: newRefreshToken,
        tokenPayload: decoded,
      },
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}