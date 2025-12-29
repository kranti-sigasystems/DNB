import { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/prisma";

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
  };
  subscription?: any;
}

export const checkPlanValidity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user?.id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "active",
      },
      orderBy: {
        endDate: "desc",
      },
    });

    if (!subscription) {
      res.status(403).json({
        success: false,
        code: "NO_ACTIVE_SUBSCRIPTION",
        message: "No active subscription found. Please purchase a plan.",
      });
      return;
    }

    const today = new Date();
    const endDate = new Date(subscription.endDate || new Date());

    if (today >= endDate) {
      res.status(403).json({
        success: false,
        code: "PLAN_EXPIRED",
        message: `Your subscription expired on ${endDate.toISOString()}. Please renew.`,
      });
      return;
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Plan Validity Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error validating subscription.",
    });
  }
};

export default checkPlanValidity;
