import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------------------------------------
 * Types
 * --------------------------------------------*/

type BillingCycle = "monthly" | "yearly";

interface SelectedPlan {
  name: string;
  description?: string;
  currency: string;
  priceMonthly?: number;
  priceYearly?: number;
  features?: string[];
  maxUsers?: number;
  maxProducts?: number;
  maxOffers?: number;
  maxBuyers?: number;
  trialDays?: number;
}

interface SelectedPlanCardProps {
  selectedPlan?: SelectedPlan | null;
  billingCycle?: BillingCycle;
}

/* ---------------------------------------------
 * Component
 * --------------------------------------------*/

const SelectedPlanCard: React.FC<SelectedPlanCardProps> = ({
  selectedPlan,
  billingCycle = "monthly",
}) => {
  if (!selectedPlan) {
    return (
      <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center text-slate-500 dark:text-slate-400">
        No plan selected yet.
      </div>
    );
  }

  const {
    name,
    description,
    currency,
    priceMonthly = 0,
    priceYearly = 0,
    features = [],
    trialDays,
  } = selectedPlan;

  const price = billingCycle === "yearly" ? priceYearly : priceMonthly;

  return (
    <Card className="shadow-md border-slate-200 dark:border-slate-700 dark:bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 mb-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => window.history.back()}
            >
              <MoveLeft className="w-4 h-4" />
              Back
            </Button>

            <CardTitle className="text-xl font-semibold dark:text-white">
              {name}
            </CardTitle>

            {description && (
              <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {description}
              </CardDescription>
            )}
          </div>

          <Badge variant="outline" className="capitalize whitespace-nowrap dark:border-slate-600 dark:text-slate-300">
            {billingCycle} Billing
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Price Section */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Price</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {currency} {price}
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">
                  / {billingCycle === "yearly" ? "year" : "month"}
                </span>
              </p>
            </div>
          </div>

          {/* Uncomment if needed later */}
          {/* {trialDays && trialDays > 0 && (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              {trialDays}-day Trial
            </Badge>
          )} */}
        </div>

        <Separator className="dark:bg-slate-700" />

        {/* Features Section */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Plan Includes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.length > 0 ? (
              features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm dark:text-slate-300"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{feature}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic text-sm">
                No features listed.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectedPlanCard;
