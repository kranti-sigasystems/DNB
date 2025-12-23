import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'User by ID API - use server actions for user operations'
  });
}