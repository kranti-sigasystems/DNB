import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Users API - use server actions for user operations'
  });
}