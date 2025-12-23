// import { Request, Response, NextFunction } from "express";
// import Subscription from "../models/subscription.model";

// /**
//  * Extend Express Request to include authenticated user
//  * and attached subscription.
//  */
// interface AuthenticatedRequest extends Request {
//   user?: {
//     id?: string;
//   };
//   subscription?: any; // Replace `any` with Subscription type if you have typings
// }

// const checkPlanValidity = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const user = req.user;

//     if (!user?.id) {
//       res.status(401).json({
//         success: false,
//         message: "Unauthorized user.",
//       });
//       return;
//     }

//     // Fetch the latest active subscription for the user
//     const subscription = await Subscription.findOne({
//       where: {
//         userId: user.id,
//         status: "active",
//       },
//       order: [["endDate", "DESC"]],
//     });

//     if (!subscription) {
//       res.status(403).json({
//         success: false,
//         code: "NO_ACTIVE_SUBSCRIPTION",
//         message: "No active subscription found. Please purchase a plan.",
//       });
//       return;
//     }

//     const today = new Date();
//     const endDate = new Date(subscription.endDate);

//     if (today >= endDate) {
//       res.status(403).json({
//         success: false,
//         code: "PLAN_EXPIRED",
//         message: `Your subscription expired on ${endDate.toISOString()}. Please renew.`,
//       });
//       return;
//     }

//     // Attach subscription to request for downstream handlers
//     req.subscription = subscription;

//     next();
//   } catch (error) {
//     console.error("Plan Validity Error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error validating subscription.",
//     });
//   }
// };

// export default checkPlanValidity;
