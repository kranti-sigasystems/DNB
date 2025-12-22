// // app/api/checkout/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import jwt from 'jsonwebtoken';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-06-30', // Use latest stable version
// });

// interface PaymentPayload {
//   userId: string;
//   planId: string;
//   billingCycle: 'monthly' | 'yearly';
// }

// export async function POST(request: NextRequest) {
//   try {
//     // Get authorization header
//     const authHeader = request.headers.get('authorization');
//     const accessToken = authHeader?.replace('Bearer ', '');

//     if (!accessToken) {
//       return NextResponse.json(
//         { success: false, message: 'Authentication required' },
//         { status: 401 }
//       );
//     }

//     // Verify token
//     let userId: string;
//     try {
//       const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
//       userId = decoded.id;
//     } catch (error) {
//       return NextResponse.json(
//         { success: false, message: 'Invalid or expired token' },
//         { status: 401 }
//       );
//     }

//     // Parse request body
//     const body = await request.json();
//     const payload: PaymentPayload = body;

//     // Validate payload
//     if (!payload.planId || !payload.billingCycle) {
//       return NextResponse.json(
//         { success: false, message: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     // Verify user exists and is authorized
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: { businessOwner: true },
//     });

//     if (!user) {
//       return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
//     }

//     // Get plan details
//     const plan = await prisma.plan.findUnique({
//       where: { id: payload.planId },
//     });

//     if (!plan) {
//       return NextResponse.json({ success: false, message: 'Plan not found' }, { status: 404 });
//     }

//     // Calculate price
//     const amount = payload.billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
//     const currency = plan.currency.toLowerCase();

//     // Create Stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [
//         {
//           price_data: {
//             currency,
//             product_data: {
//               name: `${plan.name} Plan - ${payload.billingCycle}`,
//               description: plan.description || `Access to ${plan.name} features`,
//             },
//             unit_amount: amount,
//             recurring: {
//               interval: payload.billingCycle === 'yearly' ? 'year' : 'month',
//             },
//           },
//           quantity: 1,
//         },
//       ],
//       mode: 'subscription',
//       success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
//       customer_email: user.email,
//       metadata: {
//         userId: user.id,
//         planId: plan.id,
//         billingCycle: payload.billingCycle,
//         businessOwnerId: user.businessOwner?.id || '',
//       },
//       allow_promotion_codes: true,
//     });

//     // Create payment record in database
//     await prisma.payment.create({
//       data: {
//         userId: user.id,
//         planId: plan.id,
//         amount: amount,
//         currency: plan.currency,
//         status: 'PENDING',
//         billingCycle: payload.billingCycle.toUpperCase() as any,
//         stripeSessionId: session.id,
//         metadata: {
//           checkoutSessionId: session.id,
//           billingCycle: payload.billingCycle,
//           created: new Date().toISOString(),
//         },
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       checkoutUrl: session.url,
//       sessionId: session.id,
//     });
//   } catch (error: any) {
//     console.error('Checkout API error:', error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: 'Failed to create checkout session',
//         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

// // Optional: Add other HTTP methods
// export async function GET(request: NextRequest) {
//   return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
// }

// // app/api/checkout/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import Stripe from 'stripe';
// import jwt from 'jsonwebtoken';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-02-24.acacia',
// });

// export async function POST(req: NextRequest) {
//   try {
//     /* ---------- AUTH ---------- */
//     const authHeader = req.headers.get('authorization');
//     const token = authHeader?.replace('Bearer ', '');

//     if (!token) {
//       return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

//     /* ---------- BODY ---------- */
//     const { planKey, billingCycle } = await req.json();

//     if (!planKey || !billingCycle) {
//       return NextResponse.json(
//         { success: false, message: 'planKey and billingCycle are required from checkout route' },
//         { status: 400 }
//       );
//     }

//     /* ---------- PLAN ---------- */
//     const plan = await prisma.plan.findUnique({
//       where: { key: planKey },
//     });

//     if (!plan || !plan.isActive) {
//       return NextResponse.json({ success: false, message: 'Plan not available' }, { status: 404 });
//     }

//     const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

//     if (amount <= 0) {
//       return NextResponse.json(
//         { success: false, message: 'Free plan does not require payment' },
//         { status: 400 }
//       );
//     }

//     /* ---------- STRIPE ---------- */
//     const session = await stripe.checkout.sessions.create({
//       mode: 'subscription',
//       payment_method_types: ['card'],
//       customer_email: decoded.email,
//       line_items: [
//         {
//           price_data: {
//             currency: plan.currency.toLowerCase(),
//             unit_amount: amount * 100,
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
//         userId: decoded.id,
//         planKey,
//         billingCycle,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       checkoutUrl: session.url,
//       sessionId: session.id,
//     });
//   } catch (error: any) {
//     console.error('Checkout API error:', error);
//     return NextResponse.json(
//       { success: false, message: 'Checkout failed from checkout route.' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, planKey } = await req.json();

    const billingCycle = 'yearly';
    if (!userId || !planKey) {
      return NextResponse.json(
        { success: false, message: 'userId, planKey and billingCycle are required' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { success: false, message: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user)
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const plan = await prisma.plan.findFirst({
      where: { key: planKey, isActive: true },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
        currency: true,
      },
    });

    console.log('plan log from route.ts......', plan);

    if (!plan)
      return NextResponse.json({ success: false, message: 'Plan not available' }, { status: 404 });

    const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

    console.log('amount in route.ts.....', amount);
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Free plan does not require payment' },
        { status: 400 }
      );
    }

    // Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: amount * 100,
            recurring: { interval: billingCycle === 'yearly' ? 'year' : 'month' },
            product_data: {
              name: plan.name || plan.key,
              description: plan.description?.trim() || `Subscription for ${plan.name || plan.key}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      metadata: { userId, planId: plan.id, billingCycle },
    });

    // Save pending payment
    console.log('Coming in checkout route.....');
    // billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
    await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount,
        status: 'pending',
        transactionId: `temp_${Date.now()}`, // ✅ REQUIRED
      },
    });

    return NextResponse.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
