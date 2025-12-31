# Password Reset & Email Notification Module

This module provides a complete password reset functionality with email notifications for various user actions including buyer management and offer notifications.

## Features

### 🔐 Password Reset
- **Forgot Password**: Users can request password reset via email
- **OTP Verification**: 6-digit OTP sent to user's email
- **Secure Reset**: Password reset with OTP verification
- **Auto Cleanup**: Expired OTPs are automatically cleaned up

### 📧 Email Notifications
- **Buyer Welcome**: Welcome email when buyer is created
- **Status Updates**: Email notifications for buyer activation/deactivation/deletion
- **Offer Notifications**: Email alerts for new offers and counter offers
- **Status Confirmations**: Notifications for offer confirmations/rejections

### 🎨 UI Components
- **Reusable Components**: Password input with show/hide toggle
- **OTP Input**: 6-digit OTP input with auto-focus
- **Responsive Design**: Mobile-friendly forms
- **Toast Notifications**: User-friendly feedback system

## API Endpoints

### Authentication
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/refresh-token` - Refresh access token

### Maintenance
- `GET /api/cron/cleanup-otps` - Cleanup expired OTPs (cron job)

## Database Schema

### PasswordResetOtp Model
```prisma
model PasswordResetOtp {
  id        String   @id @default(cuid())
  email     String
  otp       String   // Hashed OTP
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("password_reset_otps")
}
```

## Usage Examples

### 1. Password Reset Flow

```typescript
// Request password reset
const response = await fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' }),
});

// Reset password with OTP
const resetResponse = await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    otp: '123456',
    password: 'newPassword123',
  }),
});
```

### 2. Buyer Email Notifications

```typescript
// Create buyer with welcome email
const result = await createBuyer({
  contactName: 'John Doe',
  contactEmail: 'john@example.com',
  buyersCompanyName: 'Acme Corp',
  // ... other fields
}, authToken);

// Activate buyer with notification
await activateBuyer(buyerId, authToken);

// Deactivate buyer with notification
await deactivateBuyer(buyerId, authToken);

// Delete buyer with notification
await deleteBuyer(buyerId, authToken);
```

### 3. Offer Notifications

```typescript
// Send offer notification to buyers
await sendOfferNotification({
  offerId: 'offer_123',
  buyerIds: ['buyer_1', 'buyer_2'],
  isCounterOffer: false,
});

// Send offer status notification
await sendOfferStatusNotification({
  offerId: 'offer_123',
  buyerId: 'buyer_1',
  status: 'confirmed',
  message: 'Offer has been accepted',
});
```

## Email Templates

### Template Types
1. **OTP Template**: For password reset verification
2. **Password Reset Success**: Confirmation of successful reset
3. **Buyer Welcome**: Welcome new buyers with credentials
4. **Buyer Status**: Activation/deactivation/deletion notifications
5. **Offer Notifications**: New offers and counter offers

### Template Features
- **Responsive Design**: Works on all devices
- **Professional Styling**: Clean, modern appearance
- **Brand Consistency**: Customizable branding
- **Action Buttons**: Clear call-to-action buttons
- **Security Warnings**: Important security notices

## Configuration

### Environment Variables
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Your App <noreply@yourapp.com>"

# JWT Secrets
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# App URLs
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Security
CRON_SECRET=your-cron-secret
```

### Email Provider Setup
The module supports multiple email providers:
- **Console**: Development mode (logs emails)
- **Nodemailer**: SMTP configuration
- **SendGrid**: API-based email service
- **Resend**: Modern email API

## Security Features

### Password Reset Security
- **OTP Expiration**: 10-minute expiry for OTPs
- **One-time Use**: OTPs can only be used once
- **Rate Limiting**: Prevents spam requests
- **Secure Hashing**: OTPs are hashed before storage

### Email Security
- **Retry Logic**: Automatic retry for failed emails
- **Error Handling**: Graceful error handling
- **Template Validation**: Secure template rendering
- **Sender Verification**: Proper sender authentication

## Monitoring & Maintenance

### Cleanup Jobs
- **Expired OTPs**: Automatic cleanup of expired/used OTPs
- **Email Logs**: Optional email delivery logging
- **Error Tracking**: Comprehensive error logging

### Health Checks
- **Email Service**: Test email configuration
- **Database**: Monitor OTP table size
- **API Endpoints**: Health check endpoints

## Testing

### Unit Tests
```typescript
// Test password reset request
describe('Password Reset', () => {
  it('should send OTP email', async () => {
    const result = await requestPasswordReset({ email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('should reset password with valid OTP', async () => {
    const result = await resetPasswordWithOtp({
      email: 'test@example.com',
      otp: '123456',
      password: 'newPassword123',
    });
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
- **Email Delivery**: Test actual email sending
- **OTP Validation**: Test OTP generation and validation
- **Database Operations**: Test CRUD operations
- **API Endpoints**: Test all API routes

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check SMTP configuration
2. **OTP not working**: Verify OTP hasn't expired
3. **Template errors**: Check template syntax
4. **Database errors**: Verify Prisma schema

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=email,auth,password-reset
```

## Migration Guide

### From v1 to v2
1. Run database migration for PasswordResetOtp model
2. Update environment variables
3. Install new dependencies
4. Update import statements

### Database Migration
```bash
npx prisma migrate dev --name add-password-reset-otp
npx prisma generate
```

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper error handling
- Include comprehensive tests

### Pull Request Process
1. Create feature branch
2. Add tests for new functionality
3. Update documentation
4. Submit pull request with description

## License

This module is part of the main application and follows the same license terms.