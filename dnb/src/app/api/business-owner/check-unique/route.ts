import { NextRequest, NextResponse } from "next/server";
import { checkUniqueField } from "@/actions/business-owner";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');
    const value = searchParams.get('value');

    if (!field || !value) {
      return NextResponse.json({
        success: false,
        error: 'Field and value parameters are required'
      }, { status: 400 });
    }

    const result = await checkUniqueField(field, value);
    
    return NextResponse.json({
      success: true,
      isUnique: !result.exists,
      message: result.message
    });
  } catch (error: any) {
    console.error('Check unique field error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}