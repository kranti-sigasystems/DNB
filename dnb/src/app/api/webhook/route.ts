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
    console.log('Processing webhook event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', session.id);

      if (!session.subscription || !session.customer) {
        console.log('No subscription or customer found in session');
        return NextResponse.json({ received: true });
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const { userId, planId, billingCycle, businessOwnerId } = session.metadata!;

      console.log('Processing subscription for user:', userId, 'plan:', planId, 'businessOwner:', businessOwnerId);

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
          stripeSubscriptionId: subscription.id,
        },
        update: {
          status: subscription.status,
          currentPeriodStart,
          currentPeriodEnd,
        },
        create: {
          userId,
          subscriptionId: subscription.id, // Use Stripe subscription ID
          planName: plan.name,
          status: subscription.status,
          paymentStatus: 'paid',
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
            status: 'success',
            stripePaymentId: session.payment_intent as string,
            stripeCustomerId: subscription.customer as string,
          },
        });

        // Update business owner if exists
        if (businessOwnerId && businessOwnerId !== '') {
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
            console.log('Business owner updated with payment info');
          } catch (error) {
            console.error('Failed to update business owner:', error);
          }
        }

        // Send success email
        try {
          const customerName =
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Customer';

          await sendPaymentSuccessEmail(user.email, {
            customerName,
            planName: plan.name,
            amount: Number(payment.amount), // Convert Decimal to number for email
            currency: plan.currency,
            billingCycle: billingCycle || 'yearly',
            paymentId: payment.id,
            subscriptionStartDate: currentPeriodStart.toLocaleDateString(),
            subscriptionEndDate: currentPeriodEnd.toLocaleDateString(),
          });

          console.log('Payment success email sent to:', user.email);
        } catch (emailError) {
          console.error('Failed to send payment success email:', emailError);
          // Don't fail the webhook for email errors
        }
      }

      console.log('Subscription created/updated successfully');
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice payment succeeded:', invoice.id);

      if (!invoice.subscription) {
        return NextResponse.json({ received: true });
      }

      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: invoice.subscription as string,
        },
        data: {
          status: 'active',
          paymentStatus: 'paid',
        },
      });

      console.log('Subscription status updated to active');
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Subscription deleted:', subscription.id);

      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          status: 'cancelled',
          paymentStatus: 'cancelled',
        },
      });

      console.log('Subscription marked as cancelled');
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice payment failed:', invoice.id);

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
