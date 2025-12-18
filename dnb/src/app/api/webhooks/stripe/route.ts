// import { NextRequest, NextResponse } from "next/server";
// import { stripe } from "@/lib/stripe";
// import { prisma } from "@/lib/prisma";
// import Stripe from "stripe";

// export async function POST(req: NextRequest) {
//   const body = await req.text();
//   const signature = req.headers.get("stripe-signature");

//   if (!signature) {
//     return NextResponse.json(
//       { error: "No signature provided" },
//       { status: 400 }
//     );
//   }

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//   } catch (err: any) {
//     console.error("Webhook signature verification failed:", err.message);
//     return NextResponse.json(
//       { error: `Webhook Error: ${err.message}` },
//       { status: 400 }
//     );
//   }

//   try {
//     switch (event.type) {
//       case "checkout.session.completed": {
//         const session = event.data.object as Stripe.Checkout.Session;
//         await handleCheckoutSessionCompleted(session);
//         break;
//       }

//       case "invoice.payment_succeeded": {
//         const invoice = event.data.object as Stripe.Invoice;
//         await handleInvoicePaymentSucceeded(invoice);
//         break;
//       }

//       case "invoice.payment_failed": {
//         const invoice = event.data.object as Stripe.Invoice;
//         await handleInvoicePaymentFailed(invoice);
//         break;
//       }

//       case "customer.subscription.updated": {
//         const subscription = event.data.object as Stripe.Subscription;
//         await handleSubscriptionUpdated(subscription);
//         break;
//       }

//       case "customer.subscription.deleted": {
//         const subscription = event.data.object as Stripe.Subscription;
//         await handleSubscriptionDeleted(subscription);
//         break;
//       }

//       default:
//         console.log(`Unhandled event type: ${event.type}`);
//     }

//     return NextResponse.json({ received: true });
//   } catch (error) {
//     console.error("Webhook handler error:", error);
//     return NextResponse.json(
//       { error: "Webhook handler failed" },
//       { status: 500 }
//     );
//   }
// }

// async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
//   const { userId, planId, billingCycle, businessOwnerId } = session.metadata || {};

//   if (!userId || !planId) {
//     console.error("Missing metadata in checkout session");
//     return;
//   }

//   try {
//     // Update payment record
//     await prisma.payment.updateMany({
//       where: { stripeSessionId: session.id },
//       data: {
//         status: "COMPLETED",
//         stripePaymentIntentId: session.payment_intent as string,
//         paidAt: new Date(),
//       },
//     });

//     // Get subscription ID from Stripe
//     const stripeSubscriptionId = session.subscription as string;

//     // Create or update subscription
//     const existingSubscription = await prisma.subscription.findFirst({
//       where: {
//         userId,
//         planId,
//         status: "ACTIVE",
//       },
//     });

//     if (!existingSubscription) {
//       // Calculate dates
//       const startDate = new Date();
//       const endDate = new Date();
//       if (billingCycle === "yearly") {
//         endDate.setFullYear(endDate.getFullYear() + 1);
//       } else {
//         endDate.setMonth(endDate.getMonth() + 1);
//       }

//       await prisma.subscription.create({
//         data: {
//           userId,
//           planId,
//           businessOwnerId: businessOwnerId || undefined,
//           status: "ACTIVE",
//           billingCycle: (billingCycle?.toUpperCase() || "MONTHLY") as any,
//           startDate,
//           endDate,
//           stripeSubscriptionId,
//           autoRenew: true,
//         },
//       });

//       // Update business owner status
//       if (businessOwnerId) {
//         await prisma.businessOwner.update({
//           where: { id: businessOwnerId },
//           data: { isActive: true },
//         });
//       }
//     }

//     console.log(`✅ Checkout completed for user ${userId}`);
//   } catch (error) {
//     console.error("Error handling checkout session completed:", error);
//   }
// }

// async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
//   const subscriptionId = invoice.subscription as string;

//   if (!subscriptionId) return;

//   try {
//     // Update subscription payment status
//     await prisma.subscription.updateMany({
//       where: { stripeSubscriptionId: subscriptionId },
//       data: {
//         status: "ACTIVE",
//         lastPaymentDate: new Date(),
//       },
//     });

//     console.log(`✅ Invoice payment succeeded for subscription ${subscriptionId}`);
//   } catch (error) {
//     console.error("Error handling invoice payment succeeded:", error);
//   }
// }

// async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
//   const subscriptionId = invoice.subscription as string;

//   if (!subscriptionId) return;

//   try {
//     // Update subscription status
//     await prisma.subscription.updateMany({
//       where: { stripeSubscriptionId: subscriptionId },
//       data: { status: "PAYMENT_FAILED" },
//     });

//     console.log(`❌ Invoice payment failed for subscription ${subscriptionId}`);
//   } catch (error) {
//     console.error("Error handling invoice payment failed:", error);
//   }
// }

// async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
//   try {
//     const status = subscription.status === "active" ? "ACTIVE" : "INACTIVE";

//     await prisma.subscription.updateMany({
//       where: { stripeSubscriptionId: subscription.id },
//       data: {
//         status,
//         endDate: new Date(subscription.current_period_end * 1000),
//       },
//     });

//     console.log(`✅ Subscription updated: ${subscription.id}`);
//   } catch (error) {
//     console.error("Error handling subscription updated:", error);
//   }
// }

// async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
//   try {
//     await prisma.subscription.updateMany({
//       where: { stripeSubscriptionId: subscription.id },
//       data: {
//         status: "CANCELLED",
//         cancelledAt: new Date(),
//       },
//     });

//     console.log(`✅ Subscription cancelled: ${subscription.id}`);
//   } catch (error) {
//     console.error("Error handling subscription deleted:", error);
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30",
});

interface CheckoutPayload {
  planKey: string;
  billingCycle: "monthly" | "yearly";
}

export async function POST(req: NextRequest) {
  try {
    /* -------------------- AUTH -------------------- */
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.id;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    /* -------------------- BODY -------------------- */
    const { planKey, billingCycle } = (await req.json()) as CheckoutPayload;

    if (!planKey || !billingCycle) {
      return NextResponse.json(
        { success: false, message: "planKey and billingCycle are required" },
        { status: 400 }
      );
    }

    /* -------------------- USER -------------------- */
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { businessOwner: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    /* -------------------- PLAN -------------------- */
    const plan = await prisma.plan.findUnique({
      where: { key: planKey },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { success: false, message: "Plan not available" },
        { status: 404 }
      );
    }

    /* -------------------- PRICE -------------------- */
    const amountInRupees =
      billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

    if (amountInRupees <= 0) {
      return NextResponse.json(
        { success: false, message: "Free plan does not require payment" },
        { status: 400 }
      );
    }

    const amountInPaise = amountInRupees * 100;

    /* -------------------- STRIPE -------------------- */
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: amountInPaise,
            recurring: {
              interval: billingCycle === "yearly" ? "year" : "month",
            },
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        userId: user.id,
        planKey: plan.key,
        billingCycle,
        businessOwnerId: user.businessOwner?.id ?? "",
      },
      allow_promotion_codes: true,
    });

    /* -------------------- PAYMENT RECORD -------------------- */
    await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: amountInPaise,
        currency: plan.currency,
        status: "PENDING",
        billingCycle: billingCycle.toUpperCase() as any,
        stripeSessionId: session.id,
        metadata: {
          planKey,
          billingCycle,
        },
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { success: false, message: "Checkout failed" },
      { status: 500 }
    );
  }
}