/**
 * Email Configuration Example
 * 
 * Copy this file to your .env.local and configure your email provider
 */

// Email Provider Configuration
// Choose one: 'console', 'nodemailer', 'sendgrid', 'resend'
EMAIL_PROVIDER=console

// Default sender information
EMAIL_FROM=noreply@yourcompany.com
EMAIL_REPLY_TO=support@yourcompany.com

// === NODEMAILER (SMTP) CONFIGURATION ===
// For Gmail, Outlook, or custom SMTP servers
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

// === SENDGRID CONFIGURATION ===
// Get API key from https://sendgrid.com/
SENDGRID_API_KEY=your-sendgrid-api-key

// === RESEND CONFIGURATION ===
// Get API key from https://resend.com/
RESEND_API_KEY=your-resend-api-key

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Console Provider (Development):
 *    - Set EMAIL_PROVIDER=console
 *    - Emails will be logged to console instead of sent
 * 
 * 2. Nodemailer (SMTP):
 *    - Set EMAIL_PROVIDER=nodemailer
 *    - Configure SMTP_* variables for your email provider
 *    - For Gmail: Enable 2FA and use App Password
 * 
 * 3. SendGrid:
 *    - Set EMAIL_PROVIDER=sendgrid
 *    - Get API key from SendGrid dashboard
 *    - Verify your sender domain
 * 
 * 4. Resend:
 *    - Set EMAIL_PROVIDER=resend
 *    - Get API key from Resend dashboard
 *    - Add your domain and verify DNS records
 */