/**
 * Sortable Header Component
 * Reusable sortable column header with icons
 */

import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableHeaderProps {
  children: React.ReactNode;
  sortDirection: 'asc' | 'desc' | 'none';
  onSort: () => void;
  className?: string;
}

export function SortableHeader({
  children,
  sortDirection,
  onSort,
  className,
}: SortableHeaderProps) {
  const getSortIcon = () => {
    switch (sortDirection) {
      case 'asc':
        return <ArrowUp className="ml-2 h-4 w-4" />;
      case 'desc':
        return <ArrowDown className="ml-2 h-4 w-4" />;
      default:
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={onSort}
      className={cn(
        "h-auto p-0 font-medium hover:bg-transparent text-left justify-start",
        className
      )}
    >
      {children}
      {getSortIcon()}
    </Button>
  );
}