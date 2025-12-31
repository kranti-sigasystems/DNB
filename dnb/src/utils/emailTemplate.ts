import type { EmailTemplate } from '@/types/auth';

export const generateEmailTemplate = ({ title, subTitle, body, footer }: EmailTemplate): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8fafc;
            padding: 20px;
            color: #334155;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            font-size: 24px;
            margin: 0;
            font-weight: 600;
          }
          .content {
            padding: 32px 24px;
          }
          .content h2 {
            color: #1e293b;
            margin-bottom: 16px;
            font-size: 20px;
            font-weight: 600;
          }
          .content p {
            line-height: 1.6;
            margin-bottom: 16px;
            color: #475569;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            margin: 16px 0;
          }
          .button:hover {
            background: #2563eb;
          }
          .footer {
            background: #f1f5f9;
            padding: 20px 24px;
            font-size: 14px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .otp-code {
            background: #f0f9ff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code h2 {
            color: #1e40af;
            font-size: 32px;
            margin: 0;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 4px;
          }
          .warning p {
            margin: 0;
            color: #92400e;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <h2>${subTitle}</h2>
            <div>${body}</div>
          </div>
          ${footer ? `<div class="footer"><p>${footer}</p></div>` : ''}
        </div>
      </body>
    </html>
  `;
};

export const emailLoginButton = ({ url, label }: { url: string; label: string }): string => {
  return `<a href="${url}" class="button">${label}</a>`;
};

export const generateOtpTemplate = (otp: string, userName?: string): string => {
  return generateEmailTemplate({
    title: "Password Reset OTP",
    subTitle: `Hello ${userName || "User"},`,
    body: `
      <p>You have requested to reset your password. Please use the OTP below to proceed:</p>
      <div class="otp-code">
        <h2>${otp}</h2>
      </div>
      <div class="warning">
        <p>⚠️ This OTP will expire in 10 minutes.</p>
      </div>
      <p>If you didn't request this password reset, please ignore this email.</p>
    `,
    footer: "This is an automated email. Please do not reply."
  });
};

export const generatePasswordResetSuccessTemplate = (userName?: string, loginUrl?: string): string => {
  return generateEmailTemplate({
    title: "Password Reset Successful",
    subTitle: `Hello ${userName || "User"},`,
    body: `
      <p>Your password has been successfully reset.</p>
      <p>You can now log in with your new password.</p>
      ${loginUrl ? emailLoginButton({ url: loginUrl, label: "Login Now" }) : ''}
    `,
    footer: "This is an automated email. Please do not reply."
  });
};

export const generateBuyerWelcomeTemplate = ({
  buyerName,
  businessName,
  email,
  password,
  loginUrl
}: {
  buyerName: string;
  businessName: string;
  email: string;
  password: string;
  loginUrl: string;
}): string => {
  return generateEmailTemplate({
    title: `Welcome to ${businessName} 🎉`,
    subTitle: "Your buyer account has been created",
    body: `
      <p>Hello <strong>${buyerName}</strong>,</p>
      <p>You have been added as a buyer to <strong>${businessName}</strong>.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <div class="warning">
        <p>⚠️ Please log in and change your password immediately for security.</p>
      </div>
      ${emailLoginButton({ url: loginUrl, label: "Login to Your Account" })}
    `,
    footer: "Welcome to our platform! Contact support if you need assistance."
  });
};

export const generateBuyerStatusTemplate = ({
  buyerName,
  businessName,
  status,
  message
}: {
  buyerName: string;
  businessName: string;
  status: 'activated' | 'deactivated' | 'deleted';
  message?: string;
}): string => {
  const statusMessages = {
    activated: {
      title: `Account Activated - ${businessName} 🎉`,
      subTitle: "Your account is now active!",
      body: `<p>Hello <strong>${buyerName}</strong>,</p><p>Your buyer account has been activated and you can now access all features.</p>`
    },
    deactivated: {
      title: `Account Deactivated - ${businessName}`,
      subTitle: "Your account has been temporarily deactivated",
      body: `<p>Hello <strong>${buyerName}</strong>,</p><p>Your buyer account has been deactivated. Please contact support for assistance.</p>`
    },
    deleted: {
      title: `Account Removed - ${businessName}`,
      subTitle: "Your account has been removed",
      body: `<p>Hello <strong>${buyerName}</strong>,</p><p>Your buyer account has been removed from our system.</p>`
    }
  };

  const config = statusMessages[status];
  
  return generateEmailTemplate({
    title: config.title,
    subTitle: config.subTitle,
    body: `${config.body}${message ? `<p>${message}</p>` : ''}`,
    footer: "Contact support if you have any questions."
  });
};

export const generateOfferNotificationTemplate = ({
  offerName,
  fromParty,
  toParty,
  isCounterOffer = false,
  versionNo,
  productName,
  quantity,
  grandTotal,
  shipmentDate,
  loginUrl
}: {
  offerName: string;
  fromParty: string;
  toParty: string;
  isCounterOffer?: boolean;
  versionNo?: number;
  productName?: string;
  quantity?: string;
  grandTotal?: string;
  shipmentDate?: string;
  loginUrl: string;
}): string => {
  const title = isCounterOffer ? "New Counter Offer" : "New Offer Notification";
  const subTitle = isCounterOffer 
    ? `${offerName} has a new version (${versionNo}).`
    : `${offerName} has been created.`;

  return generateEmailTemplate({
    title,
    subTitle,
    body: `
      <p><strong>From:</strong> ${fromParty}</p>
      <p><strong>To:</strong> ${toParty}</p>
      <p><strong>Offer Name:</strong> ${offerName}</p>
      ${isCounterOffer ? `<p><strong>Version:</strong> ${versionNo}</p>` : ''}
      ${productName ? `<p><strong>Product:</strong> ${productName}</p>` : ''}
      ${quantity ? `<p><strong>Quantity:</strong> ${quantity}</p>` : ''}
      ${grandTotal ? `<p><strong>Total:</strong> ${grandTotal}</p>` : ''}
      ${shipmentDate ? `<p><strong>Shipment Date:</strong> ${shipmentDate}</p>` : ''}
      ${emailLoginButton({ url: loginUrl, label: "View Offer" })}
    `,
    footer: "Please review the offer and take necessary action."
  });
};