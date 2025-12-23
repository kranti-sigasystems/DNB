import { NextRequest, NextResponse } from 'next/server';
import { 
  createBusinessOwner, 
  getBusinessOwnerByUserId, 
  updateBusinessOwner,
  verifyBusinessOwner,
  approveBusinessOwner,
  getBusinessOwnerStats,
} from '@/services/businessOwnerService';

// GET - Get business owner by user ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const businessOwnerId = searchParams.get('businessOwnerId');
    const action = searchParams.get('action');

    if (action === 'stats' && businessOwnerId) {
      const result = await getBusinessOwnerStats(businessOwnerId);
      return NextResponse.json(result);
    }

    if (userId) {
      const result = await getBusinessOwnerByUserId(userId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('GET business owner error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get business owner' },
      { status: 500 }
    );
  }
}

// POST - Create new business owner
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    const result = await createBusinessOwner(data);
    
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('POST business owner error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create business owner' },
      { status: 500 }
    );
  }
}

// PUT - Update business owner
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessOwnerId = searchParams.get('businessOwnerId');
    const action = searchParams.get('action');

    if (!businessOwnerId) {
      return NextResponse.json(
        { success: false, message: 'businessOwnerId is required' },
        { status: 400 }
      );
    }

    if (action === 'verify') {
      const result = await verifyBusinessOwner(businessOwnerId);
      return NextResponse.json(result);
    }

    if (action === 'approve') {
      const result = await approveBusinessOwner(businessOwnerId);
      return NextResponse.json(result);
    }

    // Regular update
    const data = await req.json();
    const result = await updateBusinessOwner(businessOwnerId, data);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('PUT business owner error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update business owner' },
      { status: 500 }
    );
  }
}