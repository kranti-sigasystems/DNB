import { OrderData } from "@/types/payment";

export const generateReceiptHTML = (orderData: OrderData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - Digital Negotiation Book</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body { 
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa; 
            padding: 20px;
            color: #2c3e50;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .company-info h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        .company-info p {
            font-size: 13px;
            opacity: 0.95;
            margin-bottom: 4px;
            line-height: 1.5;
        }
        .invoice-meta {
            text-align: right;
        }
        .invoice-meta h2 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 15px;
        }
        .meta-item {
            font-size: 13px;
            margin-bottom: 6px;
            opacity: 0.95;
        }
        .meta-item strong {
            display: inline-block;
            width: 80px;
        }
        
        /* Main Content */
        .content {
            padding: 50px;
        }
        
        /* Bill To Section */
        .bill-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            margin-bottom: 50px;
            padding-bottom: 40px;
            border-bottom: 2px solid #ecf0f1;
        }
        .bill-to h3,
        .payment-info h3 {
            font-size: 12px;
            font-weight: 700;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 15px;
        }
        .bill-to p,
        .payment-info p {
            font-size: 14px;
            line-height: 1.8;
            color: #2c3e50;
            margin-bottom: 4px;
        }
        .bill-to .name {
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 8px;
        }
        .payment-info .label {
            color: #7f8c8d;
            font-size: 12px;
            margin-bottom: 2px;
        }
        
        /* Items Table */
        .items-table {
            width: 100%;
            margin-bottom: 40px;
            border-collapse: collapse;
        }
        .items-table thead {
            background: #f8f9fa;
            border-top: 2px solid #ecf0f1;
            border-bottom: 2px solid #ecf0f1;
        }
        .items-table th {
            padding: 16px 15px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items-table td {
            padding: 22px 15px;
            font-size: 14px;
            color: #2c3e50;
            border-bottom: 1px solid #ecf0f1;
        }
        .items-table tbody tr:last-child td {
            border-bottom: none;
        }
        .item-name {
            font-weight: 700;
            color: #1a252f;
            margin-bottom: 4px;
        }
        .item-desc {
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 4px;
        }
        .text-right {
            text-align: right;
        }
        .amount-cell {
            font-weight: 700;
            color: #1a252f;
        }
        
        /* Summary Section */
        .summary-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 50px;
        }
        .summary-box {
            width: 100%;
            max-width: 380px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 14px 0;
            font-size: 14px;
            border-bottom: 1px solid #ecf0f1;
        }
        .summary-row.subtotal .label {
            color: #7f8c8d;
            font-weight: 500;
        }
        .summary-row.subtotal .amount {
            color: #2c3e50;
            font-weight: 600;
        }
        .summary-row.tax .label {
            color: #7f8c8d;
            font-weight: 500;
        }
        .summary-row.tax .amount {
            color: #2c3e50;
            font-weight: 600;
        }
        .summary-row.total {
            border-top: 2px solid #ecf0f1;
            border-bottom: none;
            padding-top: 16px;
            padding-bottom: 0;
            margin-top: 8px;
        }
        .summary-row.total .label {
            font-weight: 700;
            font-size: 16px;
            color: #1a252f;
        }
        .summary-row.total .amount {
            font-weight: 700;
            font-size: 20px;
            color: #10b981;
        }
        
        /* Subscription Details */
        .subscription-box {
            background: #f0f9ff;
            border-left: 4px solid #667eea;
            padding: 24px;
            margin-bottom: 40px;
            border-radius: 4px;
        }
        .subscription-box h3 {
            font-size: 13px;
            font-weight: 700;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
        }
        .subscription-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            font-size: 13px;
        }
        .subscription-item .label {
            color: #7f8c8d;
            margin-bottom: 4px;
            font-weight: 500;
        }
        .subscription-item .value {
            color: #1a252f;
            font-weight: 700;
            font-size: 14px;
        }
        
        /* Payment Status */
        .payment-status {
            background: #ecfdf5;
            border: 2px solid #10b981;
            border-radius: 6px;
            padding: 24px;
            margin-bottom: 40px;
            text-align: center;
        }
        .status-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .payment-status p {
            font-size: 14px;
            color: #047857;
            font-weight: 600;
        }
        
        /* Notes Section */
        .notes-section {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 24px;
            margin-bottom: 40px;
            border-radius: 4px;
        }
        .notes-section h3 {
            font-size: 13px;
            font-weight: 700;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .notes-section p {
            font-size: 13px;
            color: #78350f;
            line-height: 1.6;
        }
        
        /* Footer */
        .footer {
            background: #f8f9fa;
            padding: 40px 50px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            line-height: 1.8;
        }
        .footer p {
            margin-bottom: 8px;
        }
        .footer strong {
            color: #2c3e50;
        }
        .footer-divider {
            height: 1px;
            background: #ecf0f1;
            margin: 20px 0;
        }
        
        /* Print Styles */
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            @page { margin: 0; }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                padding: 40px 30px;
            }
            .invoice-meta {
                text-align: left;
                margin-top: 20px;
            }
            .bill-section {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            .content {
                padding: 30px;
            }
            .subscription-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>Digital Negotiation Book</h1>
                <p>Premium Subscription Services</p>
                <p>📧 support@dnb.com</p>
                <p>🌐 www.dnb.com</p>
            </div>
            <div class="invoice-meta">
                <h2>INVOICE</h2>
                <div class="meta-item">
                    <strong>Invoice #:</strong> ${orderData.transactionId?.substring(0, 16).toUpperCase() || 'N/A'}
                </div>
                <div class="meta-item">
                    <strong>Date:</strong> ${orderData.date}
                </div>
                <div class="meta-item">
                    <strong>Time:</strong> ${orderData.time}
                </div>
                <div class="meta-item">
                    <strong>Status:</strong> <span style="color: #10b981; font-weight: 700;">✓ PAID</span>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Bill To Section -->
            <div class="bill-section">
                <div class="bill-to">
                    <h3>Bill To</h3>
                    <p class="name">${orderData.first_name} ${orderData.last_name}</p>
                    <p>${orderData.email}</p>
                    ${orderData.businessName ? `<p>${orderData.businessName}</p>` : ''}
                </div>
                <div class="payment-info">
                    <h3>Payment Information</h3>
                    <p class="label">Payment Method</p>
                    <p>Stripe Payment Gateway (Secure)</p>
                    <p class="label" style="margin-top: 12px;">Currency</p>
                    <p>${orderData.currencyCode}</p>
                    <p class="label" style="margin-top: 12px;">Transaction ID</p>
                    <p style="font-family: monospace; font-size: 12px;">${orderData.transactionId}</p>
                </div>
            </div>

            <!-- Payment Status -->
            <div class="payment-status">
                <div class="status-badge">✓ Payment Successful</div>
                <p>Your payment has been received and processed successfully</p>
            </div>

            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Description</th>
                        <th style="width: 15%;">Billing Cycle</th>
                        <th style="width: 15%;">Quantity</th>
                        <th style="width: 20%; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="item-name">${orderData.planName} Plan</div>
                            <div class="item-desc">Premium subscription with full access to all features and priority support</div>
                        </td>
                        <td>${orderData.billingCycle?.charAt(0).toUpperCase()}${orderData.billingCycle?.slice(1)}</td>
                        <td>1</td>
                        <td class="text-right amount-cell">${orderData.currencySymbol}${orderData.planPrice?.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Summary -->
            <div class="summary-wrapper">
                <div class="summary-box">
                    <div class="summary-row subtotal">
                        <span class="label">Subtotal</span>
                        <span class="amount">${orderData.currencySymbol}${orderData.planPrice?.toLocaleString()}</span>
                    </div>
                    <div class="summary-row tax">
                        <span class="label">Tax (0%)</span>
                        <span class="amount">${orderData.currencySymbol}0.00</span>
                    </div>
                    <div class="summary-row total">
                        <span class="label">Total Amount Due</span>
                        <span class="amount">${orderData.currencySymbol}${orderData.planPrice?.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <!-- Subscription Details -->
            <div class="subscription-box">
                <h3>📅 Subscription Details</h3>
                <div class="subscription-grid">
                    <div class="subscription-item">
                        <div class="label">Subscription Start Date</div>
                        <div class="value">${orderData.planStartDate}</div>
                    </div>
                    <div class="subscription-item">
                        <div class="label">Subscription End Date</div>
                        <div class="value">${orderData.planEndDate}</div>
                    </div>
                    <div class="subscription-item">
                        <div class="label">Billing Cycle</div>
                        <div class="value">${orderData.billingCycle?.charAt(0).toUpperCase()}${orderData.billingCycle?.slice(1)}</div>
                    </div>
                    <div class="subscription-item">
                        <div class="label">Subscription Status</div>
                        <div class="value" style="color: #10b981;">✓ Active</div>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            <div class="notes-section">
                <h3>📝 Important Notes</h3>
                <p>
                    ✓ Your subscription is now active and you have full access to all premium features.<br>
                    ✓ A confirmation email has been sent to ${orderData.email}.<br>
                    ✓ You can manage your subscription from your account dashboard.<br>
                    ✓ Your subscription will automatically renew on ${orderData.planEndDate}.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Digital Negotiation Book</strong></p>
            <p>Thank you for your business and trust in our platform.</p>
            <div class="footer-divider"></div>
            <p>For any questions or support, please contact us at <strong>support@dnb.com</strong></p>
            <p>This invoice is a record of your payment and subscription activation.</p>
            <p>&copy; ${new Date().getFullYear()} Digital Negotiation Book. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
};
