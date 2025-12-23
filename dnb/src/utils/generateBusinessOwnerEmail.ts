// generateBusinessOwnerEmail.ts

export interface BusinessOwnerEmailPayload {
  name?: string;
  businessName: string;
  plan: string;
  planPrice: number | string;
  currency: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  loginUrl: string;
  invoiceUrl?: string;
}

export const generateBusinessOwnerEmail = ({
  name,
  businessName,
  plan,
  planPrice,
  currency,
  email,
  phoneNumber,
  country,
  state,
  city,
  address,
  postalCode,
  loginUrl,
  invoiceUrl,
}: BusinessOwnerEmailPayload): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to DNB - Your Business Is Live</title>
    <style>
      body {
        background-color: #f5f7fa;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 0;
        color: #1f2937;
      }
      .wrapper {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #ffffff;
        text-align: center;
        padding: 40px 24px;
      }
      .logo {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }
      .content {
        padding: 32px;
      }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      .plan-details {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        margin: 24px 0;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .button {
        display: inline-block;
        background: #2563eb;
        color: #ffffff !important;
        padding: 14px 32px;
        border-radius: 6px;
        text-decoration: none;
        margin: 24px 0;
        font-weight: 600;
      }
      .footer {
        background: #f9fafb;
        font-size: 13px;
        text-align: center;
        color: #6b7280;
        padding: 24px;
      }
    </style>
  </head>

  <body>
    <div class="wrapper">
      <div class="header">
        <div class="logo">DNB</div>
        <h1>Digital Negotiation Book</h1>
      </div>

      <div class="content">
        <div class="greeting">Hi ${name || 'there'},</div>

        <p>
          Welcome to DNB! We're excited to have <strong>${businessName}</strong> on board.
        </p>

        <div class="plan-details">
          <div class="detail-row">
            <span>Plan</span>
            <span>${plan}</span>
          </div>
          <div class="detail-row">
            <span>Price</span>
            <span>${currency} ${planPrice}/month</span>
          </div>
          <div class="detail-row">
            <span>Business</span>
            <span>${businessName}</span>
          </div>
        </div>

        <p><strong>Email:</strong> ${email}</p>
        ${phoneNumber ? `<p><strong>Phone:</strong> ${phoneNumber}</p>` : ''}
        ${
          address
            ? `<p><strong>Address:</strong> ${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${postalCode ? ` ${postalCode}` : ''}${country ? `, ${country}` : ''}</p>`
            : ''
        }

        <a href="${loginUrl}" class="button">Access Your Dashboard</a>

        ${invoiceUrl ? `<p><a href="${invoiceUrl}" target="_blank">Download Invoice →</a></p>` : ''}
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} Digital Negotiation Book. All rights reserved.
      </div>
    </div>
  </body>
</html>
`;
