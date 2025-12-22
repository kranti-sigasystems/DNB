// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import jwt from 'jsonwebtoken';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-06-30',
// });

// interface CheckoutPayload {
//   planKey: string;
//   billingCycle: 'monthly' | 'yearly';
// }

// export async function POST(req: NextRequest) {
//   try {
//     /* -------------------- AUTH -------------------- */
//     const authHeader = req.headers.get('authorization');
//     const token = authHeader?.replace('Bearer ', '');

//     if (!token) {
//       return NextResponse.json(
//         { success: false, message: 'Authentication required' },
//         { status: 401 }
//       );
//     }

//     let userId: string;
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//       userId = decoded.id;
//     } catch {
//       return NextResponse.json(
//         { success: false, message: 'Invalid or expired token' },
//         { status: 401 }
//       );
//     }

//     /* -------------------- BODY -------------------- */
//     const { planKey, billingCycle } = (await req.json()) as CheckoutPayload;

//     if (!planKey || !billingCycle) {
//       return NextResponse.json(
//         { success: false, message: 'planKey and billingCycle are required' },
//         { status: 400 }
//       );
//     }

//     /* -------------------- USER -------------------- */
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: { businessOwner: true },
//     });

//     if (!user) {
//       return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
//     }

//     /* -------------------- PLAN -------------------- */
//     const plan = await prisma.plan.findUnique({
//       where: { key: planKey },
//     });

//     if (!plan || !plan.isActive) {
//       return NextResponse.json({ success: false, message: 'Plan not available' }, { status: 404 });
//     }

//     /* -------------------- PRICE -------------------- */
//     const amountInRupees = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

//     if (amountInRupees <= 0) {
//       return NextResponse.json(
//         { success: false, message: 'Free plan does not require payment' },
//         { status: 400 }
//       );
//     }

//     const amountInPaise = amountInRupees * 100;

//     /* -------------------- STRIPE -------------------- */
//     const session = await stripe.checkout.sessions.create({
//       mode: 'subscription',
//       payment_method_types: ['card'],
//       customer_email: user.email,
//       line_items: [
//         {
//           price_data: {
//             currency: plan.currency.toLowerCase(),
//             unit_amount: amountInPaise,
//             recurring: {
//               interval: billingCycle === 'yearly' ? 'year' : 'month',
//             },
//             product_data: {
//               name: plan.name,
//               description: plan.description || undefined,
//             },
//           },
//           quantity: 1,
//         },
//       ],
//       success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
//       metadata: {
//         userId: user.id,
//         planKey: plan.key,
//         billingCycle,
//         businessOwnerId: user.businessOwner?.id ?? '',
//       },
//       allow_promotion_codes: true,
//     });

//     /* -------------------- PAYMENT RECORD -------------------- */
//     await prisma.payment.create({
//       data: {
//         userId: user.id,
//         planId: plan.id,
//         amount: amountInPaise,
//         currency: plan.currency,
//         status: 'PENDING',
//         billingCycle: billingCycle.toUpperCase() as any,
//         stripeSessionId: session.id,
//         metadata: {
//           planKey,
//           billingCycle,
//         },
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       checkoutUrl: session.url,
//       sessionId: session.id,
//     });
//   } catch (error: any) {
//     console.error('Checkout Error:', error);
//     return NextResponse.json(
//       { success: false, message: 'Checkout failed from webhook .' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

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
    /* ---------------- EVENT HANDLING ---------------- */

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.subscription || !session.customer) return NextResponse.json({ received: true });

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      const { userId, planKey, billingCycle } = session.metadata!;

      /* ---- Save Subscription ---- */
      await prisma.subscription.upsert({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        update: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        create: {
          userId,
          planKey,
          billingCycle,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });

      /* ---- Mark Payment Success ---- */
      await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: {
          status: 'SUCCESS',
          transactionId: `temp_${Date.now()}`, // ✅ REQUIRED
        },
      });
    }

    /* ---------- PAYMENT SUCCESS ---------- */
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;

      if (!invoice.subscription) return NextResponse.json({ received: true });

      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: invoice.subscription as string,
        },
        data: {
          status: 'active',
        },
      });
    }

    /* ---------- SUBSCRIPTION CANCEL ---------- */
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          status: 'canceled',
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
