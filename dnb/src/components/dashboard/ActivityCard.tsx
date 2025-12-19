import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

interface ActivityCardProps {
  title: string;
  icon: LucideIcon;
  activities: ActivityItem[];
}

export function ActivityCard({ title, icon: Icon, activities }: ActivityCardProps) {
  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'info':
        return 'bg-info';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold truncate pr-2">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 sm:space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-border/50 last:border-0 last:pb-0"
              >
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${getActivityColor(activity.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 sm:py-6">
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}