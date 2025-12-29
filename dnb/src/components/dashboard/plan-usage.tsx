'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Package, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface PlanUsage {
  planName: string;
  maxProducts: number;
  maxOffers: number;
  maxBuyers: number;
  maxUsers: number;
  usedProducts: number;
  usedOffers: number;
  usedBuyers: number;
  usedUsers: number;
  endDate: string;
  daysRemaining: number;
}

const PlanUsageCard = ({
  label,
  used,
  max,
  icon: Icon,
}: {
  label: string;
  used: number;
  max: number;
  icon: React.ReactNode;
}) => {
  const percentage = max > 0 ? (used / max) * 100 : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">{Icon}</div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            isCritical
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : isWarning
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          }`}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="mb-3">
        <Progress value={percentage} className="h-2" />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {used} of {max} used
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{max - used} remaining</span>
      </div>

      {isCritical && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">Limit nearly reached</p>
        </div>
      )}
    </div>
  );
};

export const PlanUsage: React.FC = () => {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanUsage = async () => {
      try {
        const userString = sessionStorage.getItem('user');
        if (!userString) {
          setError('User data not found');
          return;
        }

        const user = JSON.parse(userString);
        const response = await fetch(`/api/subscription/usage?userId=${user.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch plan usage');
        }

        const data = await response.json();
        setUsage(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plan usage');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanUsage();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading plan usage...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const endDate = new Date(usage.endDate);
  const today = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 7;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{usage.planName}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current subscription plan</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{daysRemaining}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">days remaining</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isExpiringSoon && (
            <Alert className="mb-4 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                Your plan expires on {endDate.toLocaleDateString()}. Consider renewing soon.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PlanUsageCard
              label="Products"
              used={usage.usedProducts}
              max={usage.maxProducts}
              icon={<Package className="w-5 h-5" />}
            />
            <PlanUsageCard
              label="Offers"
              used={usage.usedOffers}
              max={usage.maxOffers}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <PlanUsageCard
              label="Buyers"
              used={usage.usedBuyers}
              max={usage.maxBuyers}
              icon={<Users className="w-5 h-5" />}
            />
            <PlanUsageCard
              label="Users"
              used={usage.usedUsers}
              max={usage.maxUsers}
              icon={<Zap className="w-5 h-5" />}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Total Resources Used</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {usage.usedProducts + usage.usedOffers + usage.usedBuyers + usage.usedUsers}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Total Resources Available</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {usage.maxProducts + usage.maxOffers + usage.maxBuyers + usage.maxUsers}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Plan Expiry Date</span>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {endDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanUsage;
