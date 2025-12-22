import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/actions/auth.actions';

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

    // Use the server action to refresh the token
    const result = await refreshAccessToken(refreshToken);

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 :
                        result.error?.includes('inactive') ? 403 :
                        result.error?.includes('Invalid') || result.error?.includes('expired') ? 401 : 500;

      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error: any) {
    console.error('❌ Refresh token API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}