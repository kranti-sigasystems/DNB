import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeTokenClient } from '@/utils/token-utils';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Get business owner ID from token
    const decoded = decodeTokenClient(token);
    if (!decoded?.businessOwnerId && !decoded?.ownerId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const ownerId = decoded.businessOwnerId || decoded.ownerId!;

    // Check if product with this code exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        code: code.toUpperCase(),
        ownerId,
      },
      select: { id: true, code: true, productName: true },
    });

    return NextResponse.json({
      exists: !!existingProduct,
      product: existingProduct,
    });
  } catch (error: any) {
    console.error('Error checking product code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}