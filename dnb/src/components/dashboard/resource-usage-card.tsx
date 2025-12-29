'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ResourceUsageData {
  resourceType: string;
  used: number;
  max: number;
  icon: React.ReactNode;
}

interface ResourceUsageCardProps {
  title: string;
  resources: ResourceUsageData[];
  loading?: boolean;
  error?: string;
}

export const ResourceUsageCard: React.FC<ResourceUsageCardProps> = ({
  title,
  resources,
  loading = false,
  error,
}) => {
  const totalUsed = resources.reduce((sum, r) => sum + r.used, 0);
  const totalMax = resources.reduce((sum, r) => sum + r.max, 0);
  const totalPercentage = totalMax > 0 ? (totalUsed / totalMax) * 100 : 0;
  const isWarning = totalPercentage >= 80;
  const isCritical = totalPercentage >= 95;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading resource usage...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              isCritical
                ? 'bg-red-100 text-red-700'
                : isWarning
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
            }`}
          >
            {totalPercentage.toFixed(0)}% Used
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isCritical && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              You are using {totalPercentage.toFixed(0)}% of your resources. Consider upgrading your plan.
            </AlertDescription>
          </Alert>
        )}

        {isWarning && !isCritical && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              You are using {totalPercentage.toFixed(0)}% of your resources.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {resources.map((resource, index) => {
            const percentage = resource.max > 0 ? (resource.used / resource.max) * 100 : 0;
            const resourceWarning = percentage >= 80;
            const resourceCritical = percentage >= 95;

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {resource.icon}
                    </div>
                    <span className="font-medium text-gray-700">{resource.resourceType}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      resourceCritical
                        ? 'bg-red-100 text-red-700'
                        : resourceWarning
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <Progress value={percentage} className="h-2 mb-3" />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {resource.used} of {resource.max} used
                  </span>
                  <span className="font-semibold text-gray-900">
                    {Math.max(0, resource.max - resource.used)} remaining
                  </span>
                </div>

                {resourceCritical && (
                  <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-700 font-medium">Limit nearly reached</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total Used</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsed}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total Available</p>
              <p className="text-2xl font-bold text-gray-900">{totalMax}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceUsageCard;
