import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'User Profile API - use server actions for profile operations'
  });
}