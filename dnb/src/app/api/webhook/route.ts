import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendPaymentSuccessEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("❌ Missing Stripe signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
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
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.subscription || !session.customer) {
        return NextResponse.json({ received: true });
      }

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
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
        return NextResponse.json(
          { error: "User or plan not found" },
          { status: 404 }
        );
      }

      // Calculate subscription dates
      const currentPeriodStart = new Date(
        subscription.current_period_start * 1000
      );
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      // Create or update subscription with correct schema
      const subscriptionData = await prisma.subscription.upsert({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        update: {
          status:
            subscription.status === "active"
              ? "active"
              : subscription.status === "canceled"
                ? "cancelled"
                : "inactive",
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
        },
        create: {
          userId,
          subscriptionId: subscription.id,
          planName: plan.name,
          status:
            subscription.status === "active"
              ? "active"
              : subscription.status === "canceled"
                ? "cancelled"
                : "inactive",
          paymentStatus: "paid",
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      // Update payment record
      const payment = await prisma.payment.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (payment) {
        // Update payment status
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
                is_verified: true, // Mark as verified after successful payment
                updatedAt: new Date(),
              },
            });
          } catch (error) {}
        }

        // Send success email - This is the key part!
        try {
          const customerName =
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            "Customer";

          const emailData = {
            customerName,
            planName: plan.name,
            amount: Number(payment.amount), // Convert Decimal to number for email
            currency: plan.currency,
            billingCycle: billingCycle || "yearly",
            paymentId: payment.id,
            subscriptionStartDate: currentPeriodStart.toLocaleDateString(),
            subscriptionEndDate: currentPeriodEnd.toLocaleDateString(),
          };

          const emailResult = await sendPaymentSuccessEmail(
            user.email,
            emailData
          );

          if (emailResult) {
          } else {
            console.error(
              "❌ Payment success email failed to send to:",
              user.email
            );

            // Try to send a simple test email to verify email service
            try {
              const testResult = await sendPaymentSuccessEmail(user.email, {
                ...emailData,
                customerName: "Test User",
                planName: "Test Plan",
              });
            } catch (testError) {}
          }
        } catch (emailError) {
          console.error("❌ Failed to send payment success email:", {
            error:
              emailError instanceof Error ? emailError.message : emailError,
            stack: emailError instanceof Error ? emailError.stack : undefined,
            userEmail: user.email,
          });
          // Don't fail the webhook for email errors
        }
      } else {
        console.error("❌ No payment record found for session:", session.id);
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      if (!invoice.subscription) {
        return NextResponse.json({ received: true });
      }

      await prisma.subscription.update({
        where: {
          id: invoice.subscription as string,
        },
        data: {
          status: "active",
          paymentStatus: "paid",
        },
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: "cancelled",
        },
      });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;

      if (invoice.subscription) {
        await prisma.subscription.update({
          where: {
            stripeSubscriptionId: invoice.subscription as string,
          },
          data: {
            status: "payment_failed",
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook handler error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      eventType: event?.type,
      eventId: event?.id,
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
