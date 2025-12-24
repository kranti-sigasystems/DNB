export interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phoneNumber: string;
  businessName: string;
  registrationNumber: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  taxId: string;
  website: string;
  [key: string]: string;
}

export type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;

export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: string;
  key: string;
  name: string;
  description?: string;
  currency: string;
  priceMonthly: number;
  priceYearly: number;
  price: number;
  maxUsers: number;
  maxProducts: number;
  maxOffers: number;
  maxBuyers: number;
}