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
    console.log('Getting payment status for session:', sessionId);
    
    // Find payment by Stripe session ID
    const payment = await prisma.payment.findFirst({
      where: {
        stripeSessionId: sessionId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            currency: true,
          }
        },
      },
    });

    if (!payment) {
      console.log('Payment not found for session:', sessionId);
      return { success: false, message: 'Payment not found' };
    }

    // Get business owner if exists
    let businessOwner = null;
    if (payment.businessOwnerId) {
      businessOwner = await prisma.businessOwner.findUnique({
        where: { id: payment.businessOwnerId },
        select: {
          id: true,
          businessName: true,
          registrationNumber: true,
          country: true,
          state: true,
          city: true,
          is_verified: true,
          is_approved: true,
        },
      });
    }

    console.log('Payment found:', payment.id, 'Status:', payment.status);

    // Get Stripe session details
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('Stripe session status:', session.status, 'Payment status:', session.payment_status);
    } catch (stripeError) {
      console.error('Failed to retrieve Stripe session:', stripeError);
      return { success: false, message: 'Failed to verify payment with Stripe' };
    }

    // If Stripe shows payment as paid but our database shows pending, update it
    if (session.payment_status === 'paid' && payment.status === 'pending') {
      console.log('Updating payment status from pending to success');
      
      try {
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'success',
            stripePaymentId: session.payment_intent as string,
            stripeCustomerId: session.customer as string,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              }
            },
            plan: {
              select: {
                id: true,
                name: true,
                description: true,
                currency: true,
              }
            },
          },
        });

        // Also create/update subscription if it doesn't exist
        if (session.subscription) {
          try {
            const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            await prisma.subscription.upsert({
              where: {
                stripeSubscriptionId: stripeSubscription.id,
              },
              update: {
                status: stripeSubscription.status,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              },
              create: {
                userId: payment.userId!,
                subscriptionId: stripeSubscription.id,
                planName: payment.plan.name,
                status: stripeSubscription.status,
                paymentStatus: 'paid',
                startDate: new Date(stripeSubscription.current_period_start * 1000),
                endDate: new Date(stripeSubscription.current_period_end * 1000),
                stripeSubscriptionId: stripeSubscription.id,
                stripeCustomerId: stripeSubscription.customer as string,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              },
            });
            
            console.log('Subscription created/updated successfully');
          } catch (subError) {
            console.error('Failed to create/update subscription:', subError);
            // Don't fail the payment verification for subscription errors
          }
        }

        return { 
          success: true, 
          payment: {
            ...updatedPayment,
            amount: Number(updatedPayment.amount), // Convert Decimal to number
            billingCycle: 'yearly',
            businessOwner,
          }, 
          session 
        };
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
        // Return the original payment data even if update fails
      }
    }

    // Check if payment is completed
    if (payment.status === 'success' || payment.status === 'succeeded' || session.payment_status === 'paid') {
      return { 
        success: true, 
        payment: {
          ...payment,
          amount: Number(payment.amount), // Convert Decimal to number for display
          billingCycle: 'yearly', // Default for now, you can store this in payment metadata
          businessOwner,
        }, 
        session 
      };
    }

    return { 
      success: false, 
      message: `Payment is ${payment.status}. Please wait for confirmation or try again.` 
    };
  } catch (error) {
    console.error('Payment status error:', error);
    return { success: false, message: 'Failed to get payment status' };
  }
}
