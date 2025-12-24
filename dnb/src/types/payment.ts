// components/payment/types.ts
export type BillingCycle = "monthly" | "yearly";

export interface OrderData {
  businessName?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  planName?: string;
  planPrice?: number;
  billingCycle?: BillingCycle;
  currencySymbol?: string;
  currencyCode?: string;
  transactionId?: string;
  date?: string;
  time?: string;
  planStartDate?: string;
  planEndDate?: string;
}
