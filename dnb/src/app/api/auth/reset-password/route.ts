import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithOtp } from '@/actions/password-reset.actions';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit number'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input data',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithOtp(validation.data);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}