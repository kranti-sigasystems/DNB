import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, planKey, businessData } = await req.json();

    if (!userId || !planKey) {
      return NextResponse.json(
        { success: false, message: 'userId and planKey are required' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, first_name: true, last_name: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Get plan details
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

    if (!plan) {
      return NextResponse.json({ success: false, message: 'Plan not available' }, { status: 404 });
    }

    // Create or get business owner
    let businessOwner;

    if (businessData) {
      // Create business owner if business data is provided
      try {
        businessOwner = await prisma.businessOwner.create({
          data: {
            userId: user.id,
            businessName: businessData.businessName,
            first_name: businessData.first_name || user.first_name,
            last_name: businessData.last_name || user.last_name,
            email: businessData.email || user.email,
            phoneNumber: businessData.phoneNumber,
            registrationNumber: businessData.registrationNumber,
            country: businessData.country,
            state: businessData.state,
            city: businessData.city,
            address: businessData.address,
            postalCode: businessData.postalCode,
            planId: plan.id,
            status: 'active',
            is_verified: false,
            is_approved: false,
          },
        });
      } catch (error: any) {
        // If business owner already exists, get it
        if (error.code === 'P2002') {
          businessOwner = await prisma.businessOwner.findUnique({
            where: { userId: user.id },
          });
        } else {
          throw error;
        }
      }
    } else {
      // Try to get existing business owner
      businessOwner = await prisma.businessOwner.findUnique({
        where: { userId: user.id },
      });
    }

    // For now, default to yearly billing - you can modify this based on your needs
    const billingCycle = 'yearly';
    const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Free plan does not require payment' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: amount * 100, // Convert to smallest currency unit
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
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        billingCycle,
        businessOwnerId: businessOwner?.id || '',
      },
    });

    // Create payment record with business owner ID
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        businessOwnerId: businessOwner?.id || null,
        planId: plan.id,
        amount: amount,
        currency: plan.currency,
        status: 'pending',
        transactionId: session.id, // ✅ Store session ID as transaction ID
        paymentMethod: 'card',
        stripeSessionId: session.id,
        transactionId: `stripe_${session.id}`,
      },
    });

    // Update business owner with payment ID if exists
    if (businessOwner) {
      await prisma.businessOwner.update({
        where: { id: businessOwner.id },
        data: { paymentId: payment.id },
      });
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      paymentId: payment.id,
      businessOwnerId: businessOwner?.id || null,
    });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
