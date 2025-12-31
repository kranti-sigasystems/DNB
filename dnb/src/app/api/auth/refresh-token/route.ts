import { NextRequest, NextResponse } from 'next/server';
import { refreshToken } from '@/actions/auth.actions';
import { z } from 'zod';

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = refreshTokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid refresh token',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const result = await refreshToken(validation.data);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 401 
    });
  } catch (error) {
    console.error('Refresh token API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}