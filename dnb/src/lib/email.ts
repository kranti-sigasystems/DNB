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
// Create Email Transporter
// ----------------------
function createEmailTransporter() {
  
  // Validate environment variables
  const requiredVars = {
    SMTP_HOST: process.env.SMTP_HOST,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('❌ Missing email environment variables:', missingVars);
    throw new Error(`Email configuration is missing: ${missingVars.join(', ')}`);
  }


  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Additional options for better reliability
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    throw new Error('Failed to create email transporter');
  }
}

// ----------------------
// Send Email Function
// ----------------------
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
  
    const transporter = createEmailTransporter();
    
    // Verify transporter before sending
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      throw new Error('SMTP connection verification failed');
    }
    
    const mailOptions = {
      from: `"Digital Negotiation Book" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };


    const result = await transporter.sendMail(mailOptions);

    
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      to: options.to,
      subject: options.subject
    });
    return false;
  }
}

// ----------------------
// Generate Beautiful Email HTML
// ----------------------
function generatePaymentSuccessEmail(data: PaymentSuccessEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - Digital Negotiation Book</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .details-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin: 25px 0;
            border-left: 5px solid #4CAF50;
        }
        .details-title {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-item:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 500;
            color: #555;
        }
        .detail-value {
            font-weight: 600;
            color: #333;
        }
        .cta-section {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
            transition: transform 0.2s;
        }
        .next-steps {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-radius: 15px;
            padding: 25px;
            margin: 25px 0;
        }
        .next-steps h3 {
            color: #1976d2;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .next-steps ul {
            list-style: none;
            padding: 0;
        }
        .next-steps li {
            color: #1565c0;
            margin: 8px 0;
            padding-left: 25px;
            position: relative;
        }
        .next-steps li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4CAF50;
            font-weight: bold;
        }
        .footer {
            background: #f8f9fa;
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 14px;
        }
        .footer p {
            margin: 5px 0;
        }
        @media (max-width: 600px) {
            .email-container { margin: 10px; }
            .content { padding: 20px; }
            .header { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="success-icon">🎉</div>
            <h1>Payment Successful!</h1>
            <p>Welcome to Digital Negotiation Book</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${data.customerName}! 👋</div>
            
            <div class="message">
                Congratulations! Your payment has been processed successfully and your <strong>${data.planName}</strong> subscription is now active. You're all set to start your journey with us!
            </div>
            
            <div class="details-card">
                <div class="details-title">📋 Subscription Details</div>
                <div class="detail-item">
                    <span class="detail-label">Plan</span>
                    <span class="detail-value">${data.planName}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Amount Paid</span>
                    <span class="detail-value">${data.currency} ${data.amount.toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Billing Cycle</span>
                    <span class="detail-value">${data.billingCycle.charAt(0).toUpperCase() + data.billingCycle.slice(1)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Payment ID</span>
                    <span class="detail-value">${data.paymentId}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Valid Period</span>
                    <span class="detail-value">${data.subscriptionStartDate} - ${data.subscriptionEndDate}</span>
                </div>
            </div>
            
            <div class="cta-section">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">
                    🚀 Access Your Dashboard
                </a>
            </div>
            
            <div class="next-steps">
                <h3>🎯 What's Next?</h3>
                <ul>
                    <li>Complete your business profile setup</li>
                    <li>Add your products and services</li>
                    <li>Create your first negotiation offer</li>
                    <li>Invite team members to collaborate</li>
                    <li>Explore all ${data.planName} features</li>
                </ul>
            </div>
            
            <div class="message">
                If you have any questions or need assistance getting started, our support team is here to help. Just reply to this email or contact us through your dashboard.
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Digital Negotiation Book</strong></p>
            <p>This email was sent because you completed a payment on our platform.</p>
            <p>If you didn't make this purchase, please contact us immediately.</p>
            <p>&copy; ${new Date().getFullYear()} Digital Negotiation Book. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

// ----------------------
// Send Payment Success Email
// ----------------------
export async function sendPaymentSuccessEmail(
  email: string,
  data: PaymentSuccessEmailData
): Promise<boolean> {
  try {


    const html = generatePaymentSuccessEmail(data);
    const text = `Payment Successful! Welcome to Digital Negotiation Book. Your ${data.planName} subscription is now active. Payment ID: ${data.paymentId}`;

    const result = await sendEmail({
      to: email,
      subject: `🎉 Payment Successful - Welcome to ${data.customerName}!`,
      html,
      text,
    });

    if (result) {
    } else {
      console.error('❌ Payment success email failed');
    }

    return result;
  } catch (error) {
    console.error('❌ Payment success email error:', error);
    return false;
  }
}