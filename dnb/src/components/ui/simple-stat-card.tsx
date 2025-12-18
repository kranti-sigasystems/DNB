"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleStatItem {
  label: string;
  value: string;
  color?: string;
}

interface SimpleStatCardProps {
  title: string;
  icon: LucideIcon;
  items: SimpleStatItem[];
  className?: string;
}

export function SimpleStatCard({ 
  title, 
  icon: Icon, 
  items, 
  className 
}: SimpleStatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Icon className="w-5 h-5 text-gray-600" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{item.label}</span>
              <span 
                className={cn(
                  "text-sm font-semibold",
                  item.color || "text-gray-900"
                )}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}