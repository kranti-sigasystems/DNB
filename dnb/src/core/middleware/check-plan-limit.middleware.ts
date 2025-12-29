import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
  };
}

type UsageType = 'product' | 'offer' | 'buyer' | 'location';

export const checkPlanLimit = (type: UsageType) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id || (req.body?.userId as string | undefined);

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
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
        res.status(404).json({
          success: false,
          message: 'No active subscription found for user',
        });
        return;
      }

      const plan = await prisma.plan.findUnique({
        where: {
          key: subscription.planName.toLowerCase().replace(/\s+/g, '-'),
        },
      });

      if (!plan) {
        res.status(404).json({
          success: false,
          message: 'Plan not found for user',
        });
        return;
      }

      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
      const maxColumn = `max${capitalizedType}s` as keyof typeof plan;
      const maxAllowed = plan[maxColumn] as number;

      if (maxAllowed === 0 || maxAllowed === null) {
        res.status(403).json({
          success: false,
          message: `Limit reached for ${type}`,
        });
        return;
      }

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        message,
      });
    }
  };
};
