/**
 * Table Refresh Indicator
 * Shows a subtle loading indicator when table data is being refreshed
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableRefreshIndicatorProps {
  isRefreshing: boolean;
  message?: string;
  className?: string;
}

export function TableRefreshIndicator({ 
  isRefreshing, 
  message = "Updating data...",
  className 
}: TableRefreshIndicatorProps) {
  if (!isRefreshing) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md border border-border/50",
      "animate-in fade-in-0 slide-in-from-top-1 duration-200",
      className
    )}>
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Inline refresh indicator for table headers
 */
export function InlineRefreshIndicator({ 
  isRefreshing, 
  className 
}: { 
  isRefreshing: boolean; 
  className?: string; 
}) {
  if (!isRefreshing) return null;

  return (
    <RefreshCw className={cn(
      "w-4 h-4 animate-spin text-primary ml-2",
      className
    )} />
  );
}

/**
 * Floating refresh indicator that appears at the top of the table
 */
export function FloatingRefreshIndicator({ 
  isRefreshing, 
  message = "Refreshing data...",
  className 
}: TableRefreshIndicatorProps) {
  if (!isRefreshing) return null;

  return (
    <div className={cn(
      "absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full",
      "flex items-center gap-2 text-sm text-white bg-primary px-4 py-2 rounded-b-md shadow-lg z-50",
      "animate-in fade-in-0 slide-in-from-top-2 duration-300",
      className
    )}>
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}