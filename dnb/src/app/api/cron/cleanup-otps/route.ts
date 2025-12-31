import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredOtps } from '@/actions/password-reset.actions';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await cleanupExpiredOtps();
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.deletedCount || 0} expired OTPs`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('OTP cleanup cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}