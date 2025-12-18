import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface GrowthMetric {
  label: string;
  value: number;
  color: string;
}

interface GrowthCardProps {
  title: string;
  icon: LucideIcon;
  metrics: GrowthMetric[];
}

export function GrowthCard({ title, icon: Icon, metrics }: GrowthCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Icon className="w-5 h-5 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{metric.label}</span>
                <span className={`font-semibold ${metric.color}`}>
                  +{metric.value}%
                </span>
              </div>
              <Progress 
                value={Math.min(metric.value * 5, 100)} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}