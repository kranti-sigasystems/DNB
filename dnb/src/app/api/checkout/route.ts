import { NextRequest } from "next/server";
import { z } from 'zod';
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { 
  withErrorHandler, 
  withAuth, 
  withRateLimit, 
  withValidation, 
  rateLimitConfigs,
  commonSchemas 
} from '@/core/middleware';
import { successResponse, errorResponse } from '@/core/handlers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Checkout validation schema
const checkoutSchema = {
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    planKey: z.string().min(1, 'Plan key is required'),
    billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
    businessData: z.object({
      businessName: z.string().min(1, 'Business name is required'),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: commonSchemas.email.optional(),
      phoneNumber: commonSchemas.phone.optional(),
      registrationNumber: z.string().optional(),
      country: z.string().min(1, 'Country is required'),
      state: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      address: z.string().optional(),
      postalCode: z.string().optional(),
    }).optional(),
  }),
};

// POST /api/checkout - Create Stripe checkout session
export const POST = withErrorHandler(
  withAuth(
    withRateLimit(rateLimitConfigs.api)(
      withValidation(checkoutSchema)(async (req: NextRequest) => {
        const { userId, planKey, billingCycle, businessData } = (req as any).validatedBody;
        const authenticatedUser = (req as any).user;

        // Verify user can create checkout for this userId
        if (authenticatedUser.id !== userId && authenticatedUser.userRole !== 'super_admin') {
          return errorResponse(403, 'Cannot create checkout for another user');
        }

        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, first_name: true, last_name: true },
        });

        if (!user) {
          return errorResponse(404, 'User not found');
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
          return errorResponse(404, 'Plan not available');
        }

        // Create or get business owner
        let businessOwner;

        if (businessData) {
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
                status: "active",
                is_verified: false,
                is_approved: false,
              },
            });
          } catch (error: any) {
            if (error.code === "P2002") {
              businessOwner = await prisma.businessOwner.findUnique({
                where: { userId: user.id },
              });
            } else {
              throw error;
            }
          }
        } else {
          businessOwner = await prisma.businessOwner.findUnique({
            where: { userId: user.id },
          });
        }

        // Calculate amount based on billing cycle
        const amount = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

        if (amount <= 0) {
          return errorResponse(400, 'Free plan does not require payment');
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: plan.currency.toLowerCase(),
                unit_amount: amount * 100,
                recurring: {
                  interval: billingCycle === "yearly" ? "year" : "month",
                },
                product_data: {
                  name: `${plan.name} - ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)} Plan`,
                  description: plan.description?.trim() || 
                    `${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)} subscription for ${plan.name}`,
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
            billingCycle: billingCycle,
            businessOwnerId: businessOwner?.id || "",
          },
        });

        // Create payment record
        const payment = await prisma.payment.create({
          data: {
            userId: user.id,
            businessOwnerId: businessOwner?.id || null,
            planId: plan.id,
            amount: amount,
            currency: plan.currency,
            status: "pending",
            transactionId: session.id,
            paymentMethod: "card",
            stripeSessionId: session.id,
          },
        });

        // Update business owner with payment ID if exists
        if (businessOwner) {
          await prisma.businessOwner.update({
            where: { id: businessOwner.id },
            data: { paymentId: payment.id },
          });
        }

        return successResponse(200, 'Checkout session created successfully', {
          checkoutUrl: session.url,
          sessionId: session.id,
          paymentId: payment.id,
          businessOwnerId: businessOwner?.id || null,
          billingCycle: billingCycle,
          amount: amount,
          planName: plan.name,
        });
      })
    )
  )
);
