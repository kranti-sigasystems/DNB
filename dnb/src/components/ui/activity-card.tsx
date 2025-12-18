"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

interface ActivityCardProps {
  title: string;
  icon: LucideIcon;
  activities: ActivityItem[];
  className?: string;
}

export function ActivityCard({ 
  title, 
  icon: Icon, 
  activities, 
  className 
}: ActivityCardProps) {
  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Icon className="w-5 h-5 text-gray-600" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0"
              >
                <div className={cn("w-2 h-2 rounded-full", getActivityColor(activity.type))} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No recent activities</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}