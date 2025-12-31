"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* -------------------- TYPES -------------------- */

type BillingCycle = "monthly" | "yearly";

interface StoredUser {
  id?: string;
  planId?: string;
  userRole?: "business_owner" | "user";
}

interface Plan {
  id: string;
  key: "basic" | "advanced" | "pro";
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

/* -------------------- HELPERS -------------------- */

const safeJSONParse = <T,>(value: string | null): T | null => {
  try {
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

const fetchPlans = async (): Promise<Plan[]> => {
  const res = await fetch("http://localhost:3000/api/plans");
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
};

/* -------------------- COMPONENT -------------------- */

export default function Plans() {
  const router = useRouter();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);

  /* ---- Read sessionStorage SAFELY ---- */
  useEffect(() => {
    const user = safeJSONParse<StoredUser>(sessionStorage.getItem("user"));
    setStoredUser(user);
  }, []);

  const currentPlanId = storedUser?.planId ?? null;
  const userId = storedUser?.id;

  /* ---- React Query ---- */
  const {
    data: plans = [],
    isLoading,
    isError,
  } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: fetchPlans,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  /* -------------------- UI HELPERS -------------------- */

  const formatCurrency = (amount = 0, currency = "INR"): string =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  const isActivePlan = (planId: string): boolean => planId === currentPlanId;

  const handlePlanSelect = (plan: Plan): void => {
    // Store plan data for checkout page
    const planData = {
      selectedPlan: {
        ...plan,
        price:
          billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly,
        currency: plan.currency || "INR",
        maxUsers: plan.maxBuyers, // Map maxBuyers to maxUsers for compatibility
      },
      billingCycle,
    };
    sessionStorage.setItem("selectedPlanData", JSON.stringify(planData));
    // Also store for payment processing
    sessionStorage.setItem(
      "pendingBusinessData",
      JSON.stringify({
        planId: plan.id,
        planName: plan.name,
        billingCycle,
        isUpgrade: Boolean(userId),
      })
    );

    router.push("/checkout");
  };

  /* -------------------- STATES -------------------- */

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading plans...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-muted-foreground">
          Unable to load plans. Please refresh.
        </p>
      </div>
    );
  }

  /* -------------------- RENDER -------------------- */

  return (
    <div className="space-y-5 text-center">
      <h2 className="text-5xl font-bold text-foreground">Choose Your Plan</h2>
      <p className="text-muted-foreground">
        Simple pricing for businesses of all sizes
      </p>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="flex rounded-full border border-border bg-muted p-1">
          {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                billingCycle === cycle
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {cycle === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isActive = isActivePlan(plan.id);
          const price =
            billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-primary shadow-lg"
                  : "hover:shadow-xl hover:border-primary/50"
              }`}
            >
              {isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow-md">
                  Active Plan
                </span>
              )}

              <CardHeader className="text-center">
                <h3 className="text-xl font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description ?? "Ideal for scaling your business."}
                </p>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-semibold text-foreground">
                    {formatCurrency(price, plan.currency)}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    /{billingCycle === "monthly" ? "mo" : "yr"}
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
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  disabled={isActive}
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full transition-all duration-200 ${
                    isActive
                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md"
                  }`}
                >
                  {isActive ? "Current Plan" : `${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- SMALL COMPONENT -------------------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
