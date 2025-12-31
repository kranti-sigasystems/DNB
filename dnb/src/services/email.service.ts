/**
 * Email Service
 * 
 * This service provides email functionality for the application.
 * It can be easily configured to work with different email providers
 * like Nodemailer, SendGrid, Resend, etc.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email service configuration
 */
const EMAIL_CONFIG = {
  // Default sender information
  defaultFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@yourcompany.com',
  defaultReplyTo: process.env.EMAIL_REPLY_TO || 'support@yourcompany.com',
  
  // Email provider settings - use nodemailer with SMTP by default
  provider: process.env.EMAIL_PROVIDER || 'nodemailer', // 'console', 'nodemailer', 'sendgrid', 'resend'
  
  // Provider-specific configurations
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false', // Default to true for port 465
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  },
  
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
};

/**
 * Console email provider (for development/testing)
 */
async function sendEmailConsole(options: EmailOptions): Promise<EmailResponse> {
  return {
    success: true,
    messageId: `console-${Date.now()}`,
  };
}

/**
 * Nodemailer email provider
 */
async function sendEmailNodemailer(options: EmailOptions): Promise<EmailResponse> {
  try {
    // Check if nodemailer is available
    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
    } catch (error) {
      console.warn('Nodemailer not installed, falling back to console');
      return await sendEmailConsole(options);
    }
    
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.smtp.host,
      port: EMAIL_CONFIG.smtp.port,
      secure: EMAIL_CONFIG.smtp.secure,
      auth: EMAIL_CONFIG.smtp.auth,
    });

    const result = await transporter.sendMail({
      from: options.from || EMAIL_CONFIG.defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || EMAIL_CONFIG.defaultReplyTo,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    console.error('Nodemailer error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email via Nodemailer',
    };
  }
}

/**
 * SendGrid email provider
 */
async function sendEmailSendGrid(options: EmailOptions): Promise<EmailResponse> {
  try {
    // Check if SendGrid is available
    let sgMail: any;
    try {
      sgMail = await import('@sendgrid/mail' as any);
    } catch (error) {
      console.warn('SendGrid not installed, falling back to console');
      return await sendEmailConsole(options);
    }
    
    if (!EMAIL_CONFIG.sendgrid.apiKey) {
      console.warn('SendGrid API key not configured, falling back to console');
      return await sendEmailConsole(options);
    }
    
    sgMail.setApiKey(EMAIL_CONFIG.sendgrid.apiKey);

    const msg = {
      to: options.to,
      from: options.from || EMAIL_CONFIG.defaultFrom,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || EMAIL_CONFIG.defaultReplyTo,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        type: att.contentType,
        disposition: 'attachment',
      })),
    };

    const result = await sgMail.send(msg);
    
    return {
      success: true,
      messageId: result[0].headers['x-message-id'] as string,
    };
  } catch (error: any) {
    console.error('SendGrid error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email via SendGrid',
    };
  }
}

/**
 * Resend email provider
 */
async function sendEmailResend(options: EmailOptions): Promise<EmailResponse> {
  try {
    // Check if Resend is available
    let Resend;
    try {
      const resendModule = await import('resend');
      Resend = resendModule.Resend;
    } catch (error) {
      console.warn('Resend not installed, falling back to console');
      return await sendEmailConsole(options);
    }
    
    const resend = new Resend(EMAIL_CONFIG.resend.apiKey);

    const result = await resend.emails.send({
      from: options.from || EMAIL_CONFIG.defaultFrom,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      ...(options.text && { text: options.text }),
      ...(options.html && { html: options.html }),
      ...(options.replyTo && { replyTo: options.replyTo || EMAIL_CONFIG.defaultReplyTo }),
      ...(options.attachments && options.attachments.length > 0 && {
        attachments: options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
        })),
      }),
    } as any);

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error('Resend error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email via Resend',
    };
  }
}

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxAttempts: number = 2
): Promise<EmailResponse> {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await sendEmail(options);
      
      if (result.success) {
        return result;
      } else {
        lastError = result.error;
        console.error(`❌ Email attempt ${attempt} failed:`, result.error);
      }
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Email attempt ${attempt} failed:`, error);
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return { success: false, error: lastError };
}

/**
 * Main email sending function
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    // Validate required fields
    if (!options.to) {
      return { success: false, error: 'Recipient email is required' };
    }
    
    if (!options.subject) {
      return { success: false, error: 'Email subject is required' };
    }
    
    if (!options.html && !options.text) {
      return { success: false, error: 'Email content (html or text) is required' };
    }

    // Route to appropriate provider
    switch (EMAIL_CONFIG.provider) {
      case 'nodemailer':
        return await sendEmailNodemailer(options);
      
      case 'sendgrid':
        if (!EMAIL_CONFIG.sendgrid.apiKey) {
          throw new Error('SendGrid API key not configured');
        }
        return await sendEmailSendGrid(options);
      
      case 'resend':
        if (!EMAIL_CONFIG.resend.apiKey) {
          throw new Error('Resend API key not configured');
        }
        return await sendEmailResend(options);
      
      case 'console':
      default:
        return await sendEmailConsole(options);
    }
  } catch (error: any) {
    console.error('Email service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send offer email with predefined template
 */
export async function sendOfferEmailTemplate(data: {
  buyerEmail: string;
  buyerName: string;
  subject: string;
  message: string;
  offer: {
    id: number;
    offerName: string;
    fromParty: string;
    destination: string;
    grandTotal: number;
    offerValidityDate?: Date;
    products: any[];
  };
  offerUrl?: string;
}): Promise<EmailResponse> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const offerViewUrl = data.offerUrl || `${baseUrl}/offers/${data.offer.id}/view`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">New Offer Available</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">You have received a new business offer</p>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <p style="font-size: 16px; color: #333;">Dear ${data.buyerName},</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${data.message.replace(/\n/g, '<br>')}
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Offer Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Offer Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.offer.offerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>From:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.offer.fromParty}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Destination:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.offer.destination}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Products:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.offer.products?.length || 0} items</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Total Value:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #2563eb;">₹${Number(data.offer.grandTotal || 0).toLocaleString()}</td>
            </tr>
            ${data.offer.offerValidityDate ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Valid Until:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date(data.offer.offerValidityDate).toLocaleDateString()}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${offerViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            📋 View Full Offer Details
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 15px;">
            Click the button above to view the complete offer details and respond.
          </p>
        </div>
        
        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1565c0; font-size: 14px;">
            <strong>💡 Quick Access:</strong> Save this link for easy access: <br>
            <a href="${offerViewUrl}" style="color: #1565c0; word-break: break-all;">${offerViewUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            Please review the offer details and contact us if you have any questions.<br>
            We look forward to doing business with you.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px;">
            Best regards,<br>
            <strong>${data.offer.fromParty}</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  const textContent = `
${data.message}

Offer Details:
- Offer Name: ${data.offer.offerName}
- From: ${data.offer.fromParty}
- Destination: ${data.offer.destination}
- Products: ${data.offer.products?.length || 0} items
- Total Value: ₹${Number(data.offer.grandTotal || 0).toLocaleString()}
${data.offer.offerValidityDate ? `- Valid Until: ${new Date(data.offer.offerValidityDate).toLocaleDateString()}` : ''}

View Full Offer: ${offerViewUrl}

Best regards,
${data.offer.fromParty}
  `;

  return await sendEmail({
    to: data.buyerEmail,
    subject: data.subject,
    html: emailHtml,
    text: textContent,
  });
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<EmailResponse> {
  return await sendEmail({
    to: 'test@example.com',
    subject: 'Email Configuration Test',
    html: '<p>This is a test email to verify email configuration.</p>',
    text: 'This is a test email to verify email configuration.',
  });
}