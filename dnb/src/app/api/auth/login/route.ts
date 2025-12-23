import { NextRequest, NextResponse } from 'next/server';
import { loginFormAction } from '@/actions/auth.actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, businessName } = body;

    // Create FormData for the server action
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (businessName) {
      formData.append('businessName', businessName);
    }

    // Use the server action for login
    const result = await loginFormAction(null, formData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Login successful'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Login failed'
      }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Login endpoint - use POST method'
  }, { status: 405 });
}