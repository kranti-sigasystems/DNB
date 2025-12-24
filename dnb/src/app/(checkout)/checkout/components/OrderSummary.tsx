'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Check, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { registerAndLoginUser } from '@/actions/auth';
import useAuth from '@/hooks/use-auth';
import { toast, toastMessages } from '@/utils/toast';

/* ---------------------------------- Types --------------------------------- */

interface Plan {
  id: string;
  key: string;
  name: string;
  description?: string;
  currency: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxProducts: number;
  maxOffers: number;
  maxBuyers: number;
}

interface CheckoutFormData {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  businessName?: string;
  registrationNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
  [key: string]: unknown;
}

interface OrderSummaryProps {
  selectedPlan: Plan | null;
  billingCycle: 'monthly' | 'yearly';
  calculateTotal: () => number;
  formData?: CheckoutFormData;
  loading?: boolean;
}

/* -------------------------------- Component -------------------------------- */

const OrderSummary: React.FC<OrderSummaryProps> = ({
  selectedPlan,
  billingCycle,
  calculateTotal,
  formData = {},
  loading = false,
}) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { login: setSession } = useAuth();

  // Get the latest form data from sessionStorage
  const getLatestFormData = (): CheckoutFormData => {
    try {
      const stored = sessionStorage.getItem('checkoutFormData');
      if (stored) {
        const parsedData = JSON.parse(stored);
        return { ...formData, ...parsedData };
      }
    } catch (error) {
      // Handle error silently
    }
    return formData;
  };

  if (!selectedPlan) {
    return (
      <div className="text-center text-slate-500 p-6 border border-dashed rounded-lg">
        No plan selected.
      </div>
    );
  }

  /* ----------------------------- Validations ----------------------------- */

  const validateForm = (
    dataToValidate: CheckoutFormData
  ): { isValid: boolean; missingFields: string[] } => {
    const requiredFields: { key: keyof CheckoutFormData; label: string }[] = [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'password', label: 'Password' },
      { key: 'phoneNumber', label: 'Phone Number' },
      { key: 'businessName', label: 'Business Name' },
      { key: 'registrationNumber', label: 'Registration Number' },
      { key: 'country', label: 'Country' },
      { key: 'state', label: 'State' },
      { key: 'city', label: 'City' },
      { key: 'address', label: 'Address' },
      { key: 'postalCode', label: 'Postal Code' },
    ];

    const missingFields: string[] = [];

    requiredFields.forEach(({ key, label }) => {
      const value = dataToValidate[key];
      if (!value || typeof value !== 'string' || !value.trim()) {
        missingFields.push(label);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  /* ------------------------------ Submit Flow ------------------------------ */

  const handleSubmit = async (): Promise<void> => {
    // Get the latest form data
    const latestFormData = getLatestFormData();

    // Validate form data
    const validation = validateForm(latestFormData);

    if (!validation.isValid) {
      const missingFieldsList = validation.missingFields.join(', ');
      toast.error(`Please fill in all required fields: ${missingFieldsList}`);

      // Scroll to top to show the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      /* 1️⃣ Auto-register / login user */
      const loginResponse = await registerAndLoginUser({
        first_name: latestFormData.first_name || '',
        last_name: latestFormData.last_name || '',
        email: latestFormData.email || '',
        password: latestFormData.password || '',
        phoneNumber: latestFormData.phoneNumber || '',
        businessName: latestFormData.businessName || '',
        registrationNumber: latestFormData.registrationNumber || '',
        country: latestFormData.country || '',
        state: latestFormData.state || '',
        city: latestFormData.city || '',
        address: latestFormData.address || '',
        postalCode: latestFormData.postalCode || '',
        taxId: latestFormData.taxId || '',
        website: latestFormData.website || '',
      });

      const authData = loginResponse?.data;
      const tokenPayload = authData?.tokenPayload;
      const accessToken = authData?.accessToken;
      const refreshToken = authData?.refreshToken ?? null;

      if (loginResponse?.success === true && accessToken && tokenPayload) {
        setSession(
          {
            accessToken,
            refreshToken,
            user: tokenPayload,
          },
          { remember: true }
        );
      } else {
        toast.error(authData?.message || toastMessages.error.generic);
        return;
      }

      /* 2️⃣ Create Stripe checkout session */
      const paymentResult = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planKey: selectedPlan.key,
          userId: tokenPayload.id,
          billingCycle: billingCycle, // Add billing cycle to the request
          businessData: {
            businessName: latestFormData.businessName,
            first_name: latestFormData.first_name,
            last_name: latestFormData.last_name,
            email: latestFormData.email,
            phoneNumber: latestFormData.phoneNumber,
            registrationNumber: latestFormData.registrationNumber,
            country: latestFormData.country,
            state: latestFormData.state,
            city: latestFormData.city,
            address: latestFormData.address,
            postalCode: latestFormData.postalCode,
            taxId: latestFormData.taxId,
            website: latestFormData.website,
          },
        }),
      }).then((res) => res.json());

      if (!paymentResult.success || !paymentResult.checkoutUrl) {
        toast.error(paymentResult.message || 'Failed to create checkout session');
        return;
      }

      toast.success('Redirecting to secure payment...');

      // Store pending business data for webhook processing
      sessionStorage.setItem(
        'pendingBusinessData',
        JSON.stringify({
          planId: selectedPlan.id,
          billingCycle,
          userId: tokenPayload.id,
          ...latestFormData,
        })
      );

      // Redirect to Stripe checkout
      window.location.href = paymentResult.checkoutUrl;
    } catch (error: any) {
      toast.error(error?.message || toastMessages.error.generic);
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------- UI ---------------------------------- */

  const planFeatures = [
    { label: 'Users', value: selectedPlan.maxUsers },
    { label: 'Products', value: selectedPlan.maxProducts },
    { label: 'Offers', value: selectedPlan.maxOffers },
    { label: 'Buyers', value: selectedPlan.maxBuyers },
  ];

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 space-y-6">
        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedPlan.name}</h3>
                <p className="text-slate-600">{selectedPlan.description}</p>
              </div>
              <Badge variant="outline" className="capitalize bg-amber-300">
                {billingCycle} Billing
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              {planFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  {f.value} {f.label}
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>
                  {calculateTotal()} {selectedPlan.currency}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>

              <Separator />

              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-slate-900">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {calculateTotal() === 0
                      ? 'You\'re starting your trial plan'
                      : `${calculateTotal()} ${selectedPlan.currency}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    per {billingCycle === 'monthly' ? 'month' : 'year'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-base font-semibold"
            >
              {submitting ? 'Creating Account & Processing Payment...' : 'Complete Purchase'}
            </Button>

            {/* Flow explanation */}
            <div className="text-xs text-gray-500 text-center mt-2">
              <p>✅ Auto-create account → ✅ Secure payment → ✅ Activate subscription</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">Secure Payment</h4>
                <p className="text-xs text-slate-600">
                  Your payment information is encrypted and never stored.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderSummary;