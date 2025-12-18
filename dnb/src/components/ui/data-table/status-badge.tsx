/**
 * Status Badge Component
 * Reusable badge for displaying status with consistent styling
 */

import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';
import { getStatusColorClass } from '@/lib/utils/dashboard.utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = getStatusColorClass(status);

  return (
    <Badge variant="outline" className={cn(colorClass, className)}>
      <Circle className="w-2 h-2 mr-1 fill-current" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}