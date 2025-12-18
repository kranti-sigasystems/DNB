import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickStat {
  label: string;
  value: string;
}

interface QuickStatsCardProps {
  title: string;
  icon: LucideIcon;
  stats: QuickStat[];
}

export function QuickStatsCard({ title, icon: Icon, stats }: QuickStatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Icon className="w-5 h-5 text-yellow-600" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}