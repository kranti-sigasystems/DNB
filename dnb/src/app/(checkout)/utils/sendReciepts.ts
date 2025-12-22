export interface ReceiptOrderData {
  businessName?: string;
  email?: string;
  date: string;
  time: string;
  transactionId?: string;
  cardType?: string;
  cardLast4?: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly' | string;
  planPrice: number;
  currencySymbol: string;
  planStartDate: string;
  planEndDate: string;
}

export type FormatPriceFn = (amount: number, currencySymbol: string) => string;

export const generateReceiptHTML = (
  orderData: ReceiptOrderData,
  formatPrice: FormatPriceFn
): string => {
  return `
    <html>
      <head>
        <title>Payment Receipt - ${orderData.businessName}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 48px; 
            max-width: 900px; 
            margin: 0 auto;
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 24px;
            margin-bottom: 32px;
          }
          .logo-area {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 16px;
          }
          h1 { 
            color: #111827; 
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 14px;
          }
          .receipt-id {
            text-align: right;
          }
          .receipt-id-label {
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .receipt-id-value {
            font-family: 'Courier New', monospace;
            color: #111827;
            font-size: 14px;
            font-weight: 600;
            margin-top: 4px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            background: #f9fafb;
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 32px;
            border: 1px solid #e5e7eb;
          }
          .info-section h3 {
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            font-weight: 600;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label { 
            color: #6b7280; 
            font-size: 14px;
          }
          .value { 
            color: #111827; 
            font-weight: 500; 
            font-size: 14px;
            text-align: right;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .details-table th {
            background: #f3f4f6;
            color: #374151;
            font-size: 13px;
            font-weight: 600;
            text-align: left;
            padding: 14px 16px;
            border-bottom: 2px solid #e5e7eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .details-table td {
            padding: 16px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
            color: #1f2937;
          }
          .badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .totals-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 24px;
            border-radius: 12px;
            margin-top: 32px;
            border: 2px solid #bae6fd;
          }
          .subtotal-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            color: #374151;
            font-size: 14px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding-top: 16px;
            margin-top: 16px;
            border-top: 2px solid #93c5fd;
            font-size: 24px;
            font-weight: 700;
            color: #111827;
          }
          .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
          }
          .footer-text {
            color: #6b7280;
            font-size: 13px;
            margin-bottom: 8px;
          }
          .footer-contact {
            color: #2563eb;
            font-size: 13px;
            font-weight: 600;
          }
          .print-button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 24px;
          }
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #dcfce7;
            color: #166534;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
          }
          .status-dot {
            width: 6px;
            height: 6px;
            background: #16a34a;
            border-radius: 50%;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">Print Receipt</button>
        <h1>Payment Receipt</h1>
        <p>Plan: ${orderData.planName}</p>
        <p>Total: ${formatPrice(orderData.planPrice, orderData.currencySymbol)}</p>
      </body>
    </html>
  `;
};
