import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendPaymentSuccessEmail } from "@/lib/email";
import { 
  withErrorHandler, 
  withRateLimit, 
  rateLimitConfigs 
} from '@/core/middleware';
import { successResponse, errorResponse } from '@/core/handlers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// POST /api/webhook - Stripe webhook handler with rate limiting
export const POST = withErrorHandler(
  withRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1000, // High limit for webhooks
    message: 'Too many webhook requests',
  })(async (req: NextRequest) => {
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      console.error("❌ Missing Stripe signature");
      return errorResponse(400, "Missing signature");
    }

    let event: Stripe.Event;

    try {
      const rawBody = await req.text();
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return errorResponse(400, "Invalid signature");
    }

    // Handle different webhook events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return successResponse(200, 'Webhook processed successfully', { received: true });
  })
);

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription || !session.customer) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const metadata = session.metadata || {};
  const { userId, planId, billingCycle, businessOwnerId } = metadata;

  // Get user and plan details
  const [user, plan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, first_name: true, last_name: true },
    }),
    prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true, name: true, currency: true },
    }),
  ]);

  if (!user || !plan) {
    console.error("❌ User or plan not found:", { userId, planId });
    throw new Error("User or plan not found");
  }

  // Calculate subscription dates
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Create or update subscription
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: subscription.status === "active" ? "active" : 
              subscription.status === "canceled" ? "cancelled" : "inactive",
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
    },
    create: {
      userId,
      subscriptionId: subscription.id,
      planName: plan.name,
      status: subscription.status === "active" ? "active" : 
              subscription.status === "canceled" ? "cancelled" : "inactive",
      paymentStatus: "paid",
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      currentPeriodStart,
      currentPeriodEnd,
    },
  });

  // Update payment record
  const payment = await prisma.payment.findFirst({
    where: { stripeSessionId: session.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "success",
        stripePaymentId: session.payment_intent as string,
        stripeCustomerId: subscription.customer as string,
      },
    });

    // Update business owner if exists
    if (businessOwnerId && businessOwnerId !== "") {
      try {
        await prisma.businessOwner.update({
          where: { id: businessOwnerId },
          data: {
            planId: planId,
            paymentId: payment.id,
            is_verified: true,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error updating business owner:", error);
      }
    }

    // Send success email
    try {
      const customerName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Customer";
      
      const emailData = {
        customerName,
        planName: plan.name,
        amount: Number(payment.amount),
        currency: plan.currency,
        billingCycle: billingCycle || "yearly",
        paymentId: payment.id,
        subscriptionStartDate: currentPeriodStart.toLocaleDateString(),
        subscriptionEndDate: currentPeriodEnd.toLocaleDateString(),
      };

      await sendPaymentSuccessEmail(user.email, emailData);
    } catch (emailError) {
      console.error("❌ Failed to send payment success email:", emailError);
      // Don't fail the webhook for email errors
    }
  }
}

// Handle invoice payment succeeded
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: {
      status: "active",
      paymentStatus: "paid",
    },
  });
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "cancelled" },
  });
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: { status: "payment_failed" },
  });
}
