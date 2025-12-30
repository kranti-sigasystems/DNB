import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id?: string;
  };
}

type UsageType = 'product' | 'offer' | 'buyer' | 'location';

export const checkPlanLimit = (type: UsageType) => {
  return async (
    req: AuthenticatedRequest,
    context?: any
  ): Promise<NextResponse | void> => {
    try {
      const userId = req.user?.id || context?.params?.userId;

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
            message: 'No active subscription found for user',
          },
          { status: 404 }
        );
      }

      const plan = await prisma.plan.findUnique({
        where: {
          key: subscription.planName.toLowerCase().replace(/\s+/g, '-'),
        },
      });

      if (!plan) {
        return NextResponse.json(
          {
            success: false,
            message: 'Plan not found for user',
          },
          { status: 404 }
        );
      }

      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
      const maxColumn = `max${capitalizedType}s` as keyof typeof plan;
      const maxAllowed = plan[maxColumn] as number;

      if (maxAllowed === 0 || maxAllowed === null) {
        return NextResponse.json(
          {
            success: false,
            message: `Limit reached for ${type}`,
          },
          { status: 403 }
        );
      }

      // If we reach here, the limit check passed
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 500 }
      );
    }
  };
};

// Helper function for API routes
export const withPlanLimit = (type: UsageType, handler: Function) => {
  return async (req: NextRequest, context?: any) => {
    const limitCheck = checkPlanLimit(type);
    const limitResult = await limitCheck(req, context);
    
    if (limitResult) {
      return limitResult; // Return error response if limit exceeded
    }
    
    return handler(req, context);
  };
};