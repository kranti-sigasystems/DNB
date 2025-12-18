'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  key: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  billingCycle: string;
  maxLocations: number;
  maxProducts: number;
  maxOffers: number;
  maxBuyers: number;
  features: string[];
  trialDays: number;
  isDefault: boolean;
  isActive: boolean;
}

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  onSelectPlan?: (planId: string) => void;
}

export function PlanCard({ plan, isCurrentPlan = false, onSelectPlan }: PlanCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: plan.currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className={`p-6 relative ${isCurrentPlan ? 'border-blue-500 bg-blue-50' : ''}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-4">{plan.description}</p>
        
        <div className="mb-4">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(plan.priceMonthly)}
          </span>
          <span className="text-gray-600">/month</span>
        </div>
        
        <div className="text-sm text-gray-500">
          or {formatPrice(plan.priceYearly)}/year
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Locations:</span> {plan.maxLocations}
          </div>
          <div>
            <span className="font-medium">Products:</span> {plan.maxProducts}
          </div>
          <div>
            <span className="font-medium">Offers:</span> {plan.maxOffers}
          </div>
          <div>
            <span className="font-medium">Buyers:</span> {plan.maxBuyers}
          </div>
        </div>

        {plan.features && plan.features.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {plan.trialDays > 0 && (
          <div className="text-sm text-blue-600 font-medium">
            {plan.trialDays} days free trial
          </div>
        )}
      </div>

      <Button 
        className="w-full" 
        variant={isCurrentPlan ? "outline" : "default"}
        onClick={() => onSelectPlan?.(plan.id)}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
      </Button>
    </Card>
  );
}