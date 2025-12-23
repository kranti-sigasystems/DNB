import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Auth API - use specific endpoints like /api/auth/login'
  });
}