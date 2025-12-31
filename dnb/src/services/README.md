# Email Service Documentation

This document explains how to set up and use the email functionality in the offer creation system.

## Features

- ✅ Professional email templates for offers
- ✅ Multiple email provider support (Nodemailer, SendGrid, Resend)
- ✅ Development mode with console logging
- ✅ Email tracking (sent status and timestamp)
- ✅ Customizable email content
- ✅ Automatic offer details inclusion

## Setup

### 1. Environment Configuration

Copy the example configuration and add to your `.env.local`:

```bash
# Email Provider (choose one: console, nodemailer, sendgrid, resend)
EMAIL_PROVIDER=console

# Default sender information
EMAIL_FROM=noreply@yourcompany.com
EMAIL_REPLY_TO=support@yourcompany.com
```

### 2. Provider-Specific Setup

#### Console Provider (Development)
```bash
EMAIL_PROVIDER=console
```
- Emails will be logged to console instead of sent
- Perfect for development and testing

#### Nodemailer (SMTP)
```bash
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASS`

#### SendGrid
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

Setup steps:
1. Create account at [SendGrid](https://sendgrid.com/)
2. Generate API key with Mail Send permissions
3. Verify your sender domain/email

#### Resend
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
```

Setup steps:
1. Create account at [Resend](https://resend.com/)
2. Add and verify your domain
3. Generate API key

## Usage

### In Create Offer Page

1. **Enable Email**: Check the "Send offer via email to buyer" checkbox
2. **Customize Subject**: Edit the email subject line
3. **Customize Message**: Write a personalized message to the buyer
4. **Create & Send**: Click "Create & Send Offer" to create the offer and send email

### Email Features

The offer email includes:
- Custom message from the sender
- Professional offer summary table
- Offer details (name, from party, destination, products, total value)
- Validity date (if set)
- **Direct offer link** - Buyers can click "View Full Offer Details" to access the offer directly
- Company branding

### Offer Access Link

When an offer email is sent, it includes a direct link to view the offer:
- **Format**: `{baseUrl}/offers/{offerId}/view`
- **Example**: `https://yourapp.com/offers/123/view`
- **Buyer Experience**: Buyers can click the button in the email to view the complete offer details
- **Authentication**: The link works for both authenticated and public access (buyers don't need to log in)

### Email Tracking

- `emailSent`: Boolean flag indicating if email was sent
- `emailSentAt`: Timestamp of when email was sent
- Visible in offers listing with email status icons
- **Offer link included**: Each email contains a direct link to the specific offer

## API Usage

### Send Offer Email

```typescript
import { sendOfferEmail } from '@/actions/offer.actions';

const result = await sendOfferEmail({
  offerId: 123,
  buyerEmail: 'buyer@company.com',
  buyerName: 'John Doe',
  subject: 'New Offer: OFFER-2024-001',
  message: 'Dear John, please find our new offer...'
});

if (result.success) {
  console.log('Email sent successfully');
} else {
  console.error('Email failed:', result.error);
}
```

### Direct Email Service

```typescript
import { sendEmail } from '@/services/email.service';

const result = await sendEmail({
  to: 'recipient@example.com',
  subject: 'Test Email',
  html: '<p>Hello World!</p>',
  text: 'Hello World!'
});
```

## Email Template

The offer email template includes:

1. **Header**: Gradient background with "New Offer Available" title
2. **Greeting**: Personalized greeting with buyer name
3. **Custom Message**: User-provided message content
4. **Offer Summary Table**: 
   - Offer Name
   - From Party
   - Destination
   - Number of Products
   - Total Value
   - Validity Date (if set)
5. **Footer**: Company signature

## Error Handling

The email service includes comprehensive error handling:

- Provider configuration validation
- Network error handling
- Email format validation
- Graceful fallbacks
- Detailed error messages

## Testing

### Test Email Configuration

```typescript
import { testEmailConfiguration } from '@/services/email.service';

const result = await testEmailConfiguration();
console.log('Email test result:', result);
```

### Development Testing

1. Set `EMAIL_PROVIDER=console`
2. Create an offer with email enabled
3. Check console logs for email content
4. Verify email tracking in offers list

## Production Deployment

1. Choose your email provider (SendGrid or Resend recommended)
2. Set up domain verification
3. Configure environment variables
4. Test with real email addresses
5. Monitor email delivery rates

## Troubleshooting

### Common Issues

1. **Gmail SMTP Issues**:
   - Enable 2FA
   - Use App Password, not regular password
   - Check "Less secure app access" if needed

2. **SendGrid Issues**:
   - Verify sender domain
   - Check API key permissions
   - Review SendGrid activity logs

3. **Email Not Sending**:
   - Check environment variables
   - Verify email provider configuration
   - Check console logs for errors
   - Test with `testEmailConfiguration()`

4. **Email in Spam**:
   - Set up SPF, DKIM, DMARC records
   - Use verified sender domain
   - Avoid spam trigger words

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

This will log email content and provider responses to the console.

## Security Considerations

- Store API keys in environment variables, never in code
- Use App Passwords for Gmail, not regular passwords
- Implement rate limiting for email sending
- Validate email addresses before sending
- Monitor for abuse and implement sending limits

## Future Enhancements

- [ ] Email templates for different offer types
- [ ] Bulk email sending for multiple buyers
- [ ] Email analytics and tracking
- [ ] Scheduled email sending
- [ ] Email attachments (PDF offers)
- [ ] Email bounce handling
- [ ] Unsubscribe functionality