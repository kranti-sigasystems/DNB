import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { sendPaymentSuccessEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.subscription || !session.customer) {
        return NextResponse.json({ received: true });
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const { userId, planId, billingCycle, businessOwnerId } = session.metadata!;

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
        console.error('User or plan not found:', { userId, planId });
        return NextResponse.json({ error: 'User or plan not found' }, { status: 404 });
      }

      // Calculate subscription dates
      const currentPeriodStart = new Date(subscription.current_period_start * 1000);
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      // Create or update subscription with correct schema
      const subscriptionData = await prisma.subscription.upsert({
        where: {
          id: subscription.id, // Use the subscription ID directly
        },
        update: {
          status: subscription.status === 'active' ? 'active' : subscription.status === 'canceled' ? 'cancelled' : 'inactive',
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
        },
        create: {
          id: subscription.id,
          userId,
          planId: planKey, // Assuming planKey maps to planId
          status: subscription.status === 'active' ? 'active' : subscription.status === 'canceled' ? 'cancelled' : 'inactive',
          billingCycle: billingCycle as 'monthly' | 'yearly',
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
          autoRenew: true,
        },
      });

      /* ---- Update User with Stripe Customer ID ---- */
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: subscription.customer as string,
          subscriptionId: subscription.id,
        },
      });

      /* ---- Mark Payment Success ---- */
      await prisma.payment.update({
        where: { transactionId: session.id },
        data: {
          status: 'completed',
          transactionId: session.id, // Keep the session ID as transaction ID
        },
      });
    }

    /* ---------- PAYMENT SUCCESS ---------- */
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;

      if (!invoice.subscription) {
        return NextResponse.json({ received: true });
      }

      await prisma.subscription.update({
        where: {
          id: invoice.subscription as string,
        },
        data: {
          status: 'active',
          paymentStatus: 'paid',
        },
      });

    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: 'cancelled',
        },
      });

    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;

      if (invoice.subscription) {
        await prisma.subscription.update({
          where: {
            stripeSubscriptionId: invoice.subscription as string,
          },
          data: {
            status: 'payment_failed',
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
