import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id?: string;
  };
  subscription?: any;
}

export const checkPlanValidity = async (
  req: AuthenticatedRequest,
  context?: any
): Promise<NextResponse | void> => {
  try {
    const user = req.user;

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized user.',
        },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
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
          code: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'No active subscription found. Please purchase a plan.',
        },
        { status: 403 }
      );
    }

    const today = new Date();
    const endDate = new Date(subscription.endDate || new Date());

    if (today >= endDate) {
      return NextResponse.json(
        {
          success: false,
          code: 'PLAN_EXPIRED',
          message: `Your subscription expired on ${endDate.toISOString()}. Please renew.`,
        },
        { status: 403 }
      );
    }

    // Attach subscription to request for downstream handlers
    req.subscription = subscription;
    
    // If we reach here, the plan is valid
    return;
  } catch (error) {
    console.error('Plan Validity Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Server error validating subscription.',
      },
      { status: 500 }
    );
  }
};

// Helper function for API routes
export const withPlanValidity = (handler: Function) => {
  return async (req: NextRequest, context?: any) => {
    const validityCheck = await checkPlanValidity(req, context);
    
    if (validityCheck) {
      return validityCheck; // Return error response if plan invalid
    }
    
    return handler(req, context);
  };
};

export default checkPlanValidity;