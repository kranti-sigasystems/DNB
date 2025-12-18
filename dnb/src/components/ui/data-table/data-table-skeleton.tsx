/**
 * Data Table Skeleton Component
 * Professional loading skeletons for table states
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TableRow, TableCell } from '@/components/ui/table';
import { DASHBOARD_CONFIG } from '@/lib/constants/dashboard';
import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  columnsCount?: number;
  rowsCount?: number;
  showHeader?: boolean;
}

export function DataTableSkeleton({
  columnsCount = DASHBOARD_CONFIG.TABLE.COLUMNS_COUNT,
  rowsCount = DASHBOARD_CONFIG.ANIMATION.SKELETON_ROWS,
  showHeader = true,
}: DataTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowsCount }).map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          {Array.from({ length: columnsCount }).map((_, j) => (
            <TableCell key={j} className="py-4">
              <Skeleton
                className={cn(
                  "rounded-md",
                  j === 0 ? "h-4 w-4" : // Checkbox column
                  j === 1 ? "h-4 w-32" : // Name column
                  j === 2 ? "h-4 w-48" : // Email column
                  j === 3 ? "h-6 w-20" : // Status column (badge height)
                  j === 4 ? "h-4 w-36" : // Business column
                  "h-8 w-8" // Actions column (button height)
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function MobileCardSkeleton({ cardsCount = DASHBOARD_CONFIG.ANIMATION.MOBILE_SKELETON_CARDS }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: cardsCount }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="flex items-center space-x-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
    </div>
  );
}