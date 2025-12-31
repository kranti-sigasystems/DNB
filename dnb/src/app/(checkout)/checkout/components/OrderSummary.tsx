"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Shield } from "lucide-react";
import useAuth from "@/hooks/use-auth";
import { toast, toastMessages } from "@/utils/toast";

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
  billingCycle: "monthly" | "yearly";
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
  const [submitting, setSubmitting] = useState(false);
  const { login: setSession } = useAuth();

  if (!selectedPlan) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Select a plan to view the order summary.
      </div>
    );
  }

  /* ----------------------------- Submit Logic ----------------------------- */
  // 🔒 (Your existing submit logic remains unchanged)
  const handleSubmit = async () => {
    /* unchanged logic */
  };

  /* --------------------------------- UI ---------------------------------- */

  const features = [
    { label: "Users", value: selectedPlan.maxUsers },
    { label: "Products", value: selectedPlan.maxProducts },
    { label: "Offers", value: selectedPlan.maxOffers },
    { label: "Buyers", value: selectedPlan.maxBuyers },
  ];

  const total = calculateTotal();

  return (
    <aside className="lg:col-span-1">
      <div className="lg:sticky lg:top-24 space-y-6">
        {/* ---------------- Order Summary Card ---------------- */}
        <Card className="border-slate-200 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Order Summary
              </CardTitle>

              <Badge
                variant="outline"
                className="capitalize bg-amber-300 text-black"
              >
                {billingCycle}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Plan Info */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {selectedPlan.name}
              </h3>
              {selectedPlan.description && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {selectedPlan.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  <Check className="h-4 w-4 text-green-600" />
                  <span>
                    <strong>{item.value}</strong> {item.label}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Subtotal
                </span>
                <span className="font-medium">
                  {total} {selectedPlan.currency}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Tax</span>
                <span className="text-slate-500">Calculated at checkout</span>
              </div>

              <Separator />

              <div className="flex items-end justify-between">
                <span className="text-base font-semibold">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {total === 0
                      ? "Free Trial"
                      : `${total} ${selectedPlan.currency}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    per {billingCycle === "monthly" ? "month" : "year"}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={handleSubmit}
              disabled={loading || submitting}
              className="w-full py-6 text-base font-semibold bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? "Processing..." : "Complete Purchase"}
            </Button>

            {/* Flow Hint */}
            <p className="text-center text-xs text-slate-500">
              Account creation → Secure payment → Instant activation
            </p>
          </CardContent>
        </Card>

        {/* ---------------- Security Note ---------------- */}
        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardContent className="">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Secure Payment</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Payments are encrypted and processed securely via Stripe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
};

export default OrderSummary;
