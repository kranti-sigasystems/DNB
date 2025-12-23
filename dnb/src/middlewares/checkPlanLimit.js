// import { Request, Response, NextFunction } from "express";
// import { errorResponse } from "../handlers/responseHandler";
// import Plan from "../models/plan.model";
// import UserPlanUsage from "../models/UserPlanUsage";

// /**
//  * Allowed usage types.
//  * Extend this union if you add more limits.
//  */
// type UsageType = string;

// interface AuthenticatedRequest extends Request {
//   user?: {
//     id?: string;
//   };
// }

// export const checkPlanLimit = (type: UsageType) => {
//   return async (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> => {
//     try {
//       const userId: string | undefined =
//         req.user?.id || (req.body?.userId as string | undefined);

//       if (!userId) {
//         errorResponse(res, 400, "User ID is required");
//         return;
//       }

//       const usage = await UserPlanUsage.findOne({
//         where: { userId },
//       });

//       if (!usage) {
//         errorResponse(res, 404, "Usage record not found for user");
//         return;
//       }

//       // Ensure plan is assigned
//       const planKey: string | null = usage.planKey;
//       if (!planKey) {
//         errorResponse(res, 404, "User does not have a plan assigned");
//         return;
//       }

//       const plan = await Plan.findOne({
//         where: { key: planKey },
//       });

//       if (!plan) {
//         errorResponse(res, 404, "Plan not found for user");
//         return;
//       }

//       const capitalizedType =
//         type.charAt(0).toUpperCase() + type.slice(1);

//       const usageColumn = `used${capitalizedType}s` as keyof typeof usage;
//       const maxColumn = `max${capitalizedType}s` as keyof typeof plan;

//       const currentUsage = usage[usageColumn] as number;
//       const maxAllowed = plan[maxColumn] as number;

//       if (currentUsage >= maxAllowed) {
//         errorResponse(res, 403, `Limit reached for ${type}`);
//         return;
//       }

//       usage[usageColumn] = (currentUsage + 1) as any;
//       usage.lastUpdated = new Date();

//       await usage.save();

//       next();
//     } catch (error) {
//       const message =
//         error instanceof Error ? error.message : "Internal server error";
//       errorResponse(res, 500, message);
//     }
//   };
// };
