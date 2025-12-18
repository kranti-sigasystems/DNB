import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  changeType?: 'positive' | 'negative';
}

export function StatsCard({ label, value, icon: Icon, color, changeType }: StatsCardProps) {
  return (
    <Card className="border-2 border-gray-300 shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className={cn("p-4 sm:p-6", color)}>
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
              <Icon className="w-6 h-6 text-black" />
            </div>
          </div>
          <h3 className="text-3xl sm:text-4xl font-bold text-black mb-1">
            {value?.toLocaleString() || 0}
          </h3>
          <p className="text-black/90 text-sm font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}