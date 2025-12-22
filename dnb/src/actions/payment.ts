'use server';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface PaymentPayload {
  userId?: string; // optional since we decode from cookie
  planId: string;
  billingCycle: 'monthly' | 'yearly';
}

interface BusinessOwnerPayload {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  userId: string;
  businessName: string;
  registrationNumber: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  taxId?: string;
  website?: string;
}

/* ---------------------------- Checkout Session ---------------------------- */
export async function createCheckoutSession(
  payload: PaymentPayload
): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
  try {
    /* ---------------- AUTH ---------------- */
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return { success: false, message: 'Authentication required' };
    }

    let userId: string;
    let userEmail: string;

    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
      };
      userId = decoded.id;
      userEmail = decoded.email;
    } catch {
      return { success: false, message: 'Invalid authentication token' };
    }

    /* ---------------- PLAN ---------------- */
    const plan = await prisma.plan.findUnique({
      where: { id: payload.planId },
    });

    if (!plan || !plan.isActive) {
      return { success: false, message: 'Plan not found or inactive' };
    }

    /* ---------------- PRICE ---------------- */
    const rawAmount = payload.billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    console.log('Raw ammount.....', rawAmount);

    if (rawAmount <= 0) {
      return { success: false, message: 'Free plans do not require payment' };
    }

    const stripeAmount = rawAmount * 100; // Stripe expects smallest currency unit

    /* ---------------- STRIPE ---------------- */
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: stripeAmount,
            recurring: { interval: payload.billingCycle === 'yearly' ? 'year' : 'month' },
            product_data: {
              name: plan.name,
              description: plan.description?.trim() || `Subscription for ${plan.name}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        userId,
        planId: plan.id,
        billingCycle: payload.billingCycle,
      },
    });

    console.log('session log.....', session);
    /* ---------------- PAYMENT RECORD ---------------- */
    // await prisma.payment.create({
    //   data: {
    //     userId,
    //     planId: plan.id,
    //     amount: rawAmount,
    //     currency: plan.currency,
    //     status: 'PENDING',
    //     billingCycle: payload.billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY', // matches enum
    //     metadata: { checkoutSessionId: session.id, billingCycle: payload.billingCycle },
    //   },
    // });

    // billingCycle: payload.billingCycle === 'monthly' ? 'MONTHLY' : 'YEARLY',
    await prisma.payment.create({
      data: {
        userId,
        planId: plan.id,
        amount: rawAmount,
        currency: 'INR',
        status: 'pending',
        transactionId: `temp_${Date.now()}`,
      },
    });
    console.log('Checkout url....', session.url);

    return { success: true, checkoutUrl: session.url! };
  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    return { success: false, message: 'Failed to create checkout session' };
  }
}

/* ---------------------- Business Owner Payment ---------------------- */
export async function createBusinessOwnerWithPayment(
  payload: BusinessOwnerPayload
): Promise<{ success: boolean; checkoutUrl?: string; message?: string }> {
  try {
    const paymentPayload: PaymentPayload = {
      userId: payload.userId,
      planId: payload.planId,
      billingCycle: payload.billingCycle,
    };

    return await createCheckoutSession(paymentPayload);
  } catch (error) {
    console.error('Business owner payment creation error:', error);
    return { success: false, message: 'Failed to create payment session' };
  }
}

/* ---------------------- Payment Status ---------------------- */
export async function getPaymentStatus(sessionId: string) {
  try {
    // const payment = await prisma.payment.findFirst({
    //   where: { path: ['checkoutSessionId'], equals: sessionId } as any,
    //   include: { user: true, plan: true },
    // });
    console.log('Coming into the getPaymentstatus action...');
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: sessionId,
      },
      include: {
        user: true,
        plan: true,
      },
    });

    console.log('Payment log from payment.ts .....', payment);

    if (!payment) return { success: false, message: 'Payment not found' };

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return { success: true, payment, session };
  } catch (error) {
    console.error('Payment status error:', error);
    return { success: false, message: 'Failed to get payment status' };
  }
}
