'use server';

import { sendPaymentSuccessEmail } from '@/lib/email';

export async function sendPaymentConfirmationEmail(
  email: string,
  customerName: string,
  planName: string,
  amount: number,
  currency: string,
  billingCycle: string,
  paymentId: string,
  subscriptionStartDate: string,
  subscriptionEndDate: string
) {
  try {
    const result = await sendPaymentSuccessEmail(email, {
      customerName,
      planName,
      amount,
      currency,
      billingCycle,
      paymentId,
      subscriptionStartDate,
      subscriptionEndDate,
    });

    return {
      success: result,
      message: result ? 'Email sent successfully' : 'Failed to send email',
    };
  } catch (error) {
    console.error('Error sending payment email:', error);
    return {
      success: false,
      message: 'Error sending confirmation email',
    };
  }
}
