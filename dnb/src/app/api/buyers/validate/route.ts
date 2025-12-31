import { NextRequest, NextResponse } from 'next/server';
import { checkBuyerDuplicates } from '@/actions/buyer-management.actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, businessName, registrationNumber, phoneNumber, excludeBuyerId } = body;

    const result = await checkBuyerDuplicates({
      email,
      businessName,
      registrationNumber,
      phoneNumber,
      excludeBuyerId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Buyer validation API error:', error);
    return NextResponse.json(
      { 
        isValid: false, 
        errors: [{ field: 'general', message: 'Validation failed' }] 
      },
      { status: 500 }
    );
  }
}