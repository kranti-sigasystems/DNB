'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type BillingCycle = 'monthly' | 'yearly';

interface StoredUser {
  id?: string;
  planId?: string;
  userRole?: 'business_owner' | 'user';
}

interface Plan {
  id: string;
  key: 'basic' | 'advanced' | 'pro';
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  currency?: string;
  maxLocations: number;
  maxProducts: number;
  maxOffers: number;
  maxBuyers: number;
  features?: string[];
}

const safeJSONParse = <T,>(value: string | null): T | null => {
  try {
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

export default function Plans() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const router = useRouter();

  const storedUser = useMemo<StoredUser | null>(() => {
    return safeJSONParse<StoredUser>(sessionStorage.getItem('user'));
  }, []);

  const currentPlanId = storedUser?.planId ?? null;
  const userId = storedUser?.id;

  const {
    data: plans = [],
    isLoading,
    isError,
  } = useQuery<Plan[]>({
    queryKey: ['plans'],
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const formatCurrency = (amount = 0, currency = 'INR'): string =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  const isActivePlan = (planId: string): boolean => planId === currentPlanId;

  const handlePlanSelect = (plan: Plan): void => {
    sessionStorage.setItem(
      'pendingBusinessData',
      JSON.stringify({
        planId: plan.id,
        planName: plan.name,
        billingCycle,
        isUpgrade: Boolean(userId),
      })
    );

    router.push(userId ? '/checkout' : '/register');
  };

  /* ---------------- UI STATES ---------------- */

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">Loading plans...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-gray-500">Unable to load plans. Please refresh.</p>
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */

  return (
    <div className="space-y-10 text-center">
      <h2 className="text-5xl font-bold text-gray-800">Choose Your Plan</h2>
      <p className="text-gray-700">Simple pricing for businesses of all sizes</p>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="flex rounded-full border bg-gray-100 p-1">
          {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`rounded-full px-5 py-2 text-sm font-medium ${
                billingCycle === cycle
                  ? 'bg-[#16a34a] text-white'
                  : 'text-gray-700 hover:text-[#16a34a]'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isActive = isActivePlan(plan.id);
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

          return (
            <Card
              key={plan.id}
              className={`relative transition-all ${
                isActive ? 'ring-2 ring-green-500' : 'hover:shadow-lg'
              }`}
            >
              {isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-1 text-xs text-white">
                  Active Plan
                </span>
              )}

              <CardHeader className="text-center">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-sm text-gray-700">
                  {plan.description ?? 'Ideal for scaling your business.'}
                </p>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-semibold">
                    {formatCurrency(price, plan.currency)}
                  </span>
                  <span className="ml-1 text-gray-700">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Locations" value={plan.maxLocations} />
                  <Stat label="Products" value={plan.maxProducts} />
                  <Stat label="Offers" value={plan.maxOffers} />
                  <Stat label="Buyers" value={plan.maxBuyers} />
                </div>

                <ul className="mt-4 space-y-2 text-left">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  disabled={isActive}
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full ${
                    isActive ? 'cursor-not-allowed bg-gray-300' : 'bg-[#16a34a] hover:bg-green-700'
                  }`}
                >
                  {isActive ? 'Current Plan' : `Choose ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-gray-700">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
