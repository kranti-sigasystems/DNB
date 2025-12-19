"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardData {
  name: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StatCardsProps {
  data: StatCardData[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  showFooter?: boolean;
}

export default function StatCards({ 
  data, 
  className, 
  columns = 3, 
  showFooter = true 
}: StatCardsProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("grid w-full gap-3 sm:gap-4 lg:gap-6", gridCols[columns])}>
        {data.map((item, index) => {
          // Assign different colors to each card
          const colorClasses = [
            "border-l-4 border-l-info bg-gradient-to-r from-info/5 to-transparent",
            "border-l-4 border-l-success bg-gradient-to-r from-success/5 to-transparent", 
            "border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent",
            "border-l-4 border-l-purple bg-gradient-to-r from-purple/5 to-transparent",
            "border-l-4 border-l-orange bg-gradient-to-r from-orange/5 to-transparent"
          ];
          
          const iconColors = [
            "text-info",
            "text-success", 
            "text-warning",
            "text-purple",
            "text-orange"
          ];
          
          const cardColor = colorClasses[index % colorClasses.length];
          const iconColor = iconColors[index % iconColors.length];
          
          return (
            <Card key={item.name} className={cn("hover:shadow-lg transition-all duration-200", cardColor)}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.icon && (
                      <div className={cn("flex-shrink-0", iconColor)}>
                        {item.icon}
                      </div>
                    )}
                    <span className="text-muted-foreground text-sm sm:text-base font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-medium flex-shrink-0 px-2 py-1 rounded-full",
                      item.changeType === "positive"
                        ? "text-success-foreground bg-success"
                        : "text-destructive-foreground bg-destructive"
                    )}
                  >
                    {item.change}
                  </span>
                </div>
                <div className="mt-3 sm:mt-4">
                  <div className="text-foreground text-2xl sm:text-3xl font-bold">
                    {item.value}
                  </div>
                  {item.description && (
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}