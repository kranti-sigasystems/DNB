import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PaymentSuccessEmailData {
  customerName: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  paymentId: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

// ----------------------
// SMTP Transporter
// ----------------------
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

// ----------------------
// Generic Send Email Function
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"Digital Negotiation Book" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// ----------------------
// Generate Payment Success Email HTML
function generatePaymentSuccessEmail(data: PaymentSuccessEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful - Digital Negotiation Book</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f7fa;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
          color: white; 
          padding: 40px 32px; 
          text-align: center; 
        }
        .content { 
          padding: 32px; 
        }
        .success-icon { 
          font-size: 48px; 
          margin-bottom: 16px; 
        }
        .plan-details { 
          background: #f9fafb; 
          padding: 24px; 
          border-radius: 8px; 
          margin: 24px 0; 
          border: 1px solid #e5e7eb;
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          margin: 12px 0; 
          padding: 8px 0; 
          border-bottom: 1px solid #e5e7eb; 
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label { 
          font-weight: 600; 
          color: #374151; 
        }
        .detail-value { 
          color: #1f2937; 
        }
        .footer { 
          text-align: center; 
          margin-top: 32px; 
          padding-top: 24px; 
          border-top: 1px solid #e5e7eb; 
          color: #6b7280; 
          font-size: 14px; 
        }
        .button { 
          display: inline-block; 
          background: #2563eb; 
          color: white !important; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 24px 0; 
          font-weight: 600;
        }
        .features-list {
          background: #eff6ff;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #2563eb;
        }
        .features-list ul {
          margin: 0;
          padding-left: 20px;
        }
        .features-list li {
          margin: 8px 0;
          color: #1e40af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1 style="margin: 0; font-size: 28px;">Payment Successful!</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Welcome to Digital Negotiation Book</p>
        </div>

        <div class="content">
          <h2 style="color: #1f2937; margin-bottom: 16px;">Hello ${data.customerName},</h2>

          <p>Thank you for your subscription! Your payment has been processed successfully and your <strong>${data.planName}</strong> account is now active.</p>

          <div class="plan-details">
            <h3 style="margin-top: 0; color: #1f2937;">Subscription Details</h3>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${data.planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount Paid:</span>
              <span class="detail-value">${data.currency} ${data.amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Billing Cycle:</span>
              <span class="detail-value">${data.billingCycle}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment ID:</span>
              <span class="detail-value">${data.paymentId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Subscription Period:</span>
              <span class="detail-value">${data.subscriptionStartDate} - ${data.subscriptionEndDate}</span>
            </div>
          </div>

          <div class="features-list">
            <h3 style="margin-top: 0; color: #1e40af;">What's Next?</h3>
            <ul>
              <li>Complete your business profile setup</li>
              <li>Add your products and services</li>
              <li>Start creating negotiation offers</li>
              <li>Invite team members (if applicable)</li>
              <li>Explore all ${data.planName} features</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Access Your Dashboard</a>
          </div>

          <p>You can now access all the features of your ${data.planName} plan. If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>

        <div class="footer">
          <p>This is an automated email from Digital Negotiation Book.</p>
          <p>If you didn't make this purchase, please contact us immediately.</p>
          <p>&copy; ${new Date().getFullYear()} Digital Negotiation Book. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ----------------------
// Payment Success Email Function
export async function sendPaymentSuccessEmail(
  email: string,
  data: PaymentSuccessEmailData
): Promise<boolean> {
  try {
    const html = generatePaymentSuccessEmail(data);

    return await sendEmail({
      to: email,
      subject: `Payment Successful - Welcome to ${data.planName}!`,
      html,
      text: `Payment Successful! Welcome to Digital Negotiation Book. Your ${data.planName} subscription is now active. Payment ID: ${data.paymentId}. Access your dashboard at ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
  } catch (error) {
    console.error('Payment success email failed:', error);
    return false;
  }
}