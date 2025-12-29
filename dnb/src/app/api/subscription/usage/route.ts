import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active subscription found',
        },
        { status: 404 }
      );
    }

    const usageData = {
      planName: subscription.planName,
      maxProducts: subscription.maxProducts || 50,
      maxOffers: subscription.maxOffers || 100,
      maxBuyers: subscription.maxBuyers || 50,
      maxUsers: 1,
      usedProducts: 0,
      usedOffers: 0,
      usedBuyers: 0,
      usedUsers: 1,
      endDate: subscription.endDate,
      daysRemaining: subscription.endDate
        ? Math.ceil(
            (new Date(subscription.endDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: usageData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching subscription usage:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch subscription usage',
      },
      { status: 500 }
    );
  }
}
