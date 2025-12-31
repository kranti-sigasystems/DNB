/**
 * Data Table Pagination Component
 * Reusable pagination with page size selector
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { usePagination } from '@/lib/hooks/usePagination';
import { DASHBOARD_CONFIG } from '@/lib/constants/dashboard';
import { cn } from '@/lib/utils';

interface DataTablePaginationProps {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function DataTablePagination({
  totalItems,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  className,
}: DataTablePaginationProps) {
  const {
    pageNumbers,
    paginationInfo,
    state,
    actions,
  } = usePagination({
    totalItems,
    initialPageSize: pageSize,
    onPageChange: (page, size) => {
      if (page !== currentPage) onPageChange(page);
      if (size !== pageSize) onPageSizeChange(size);
    },
  });

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", className)}>
      {/* Items info and page size selector */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {paginationInfo.start} to {paginationInfo.end} of {paginationInfo.total} entries
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DASHBOARD_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous page (double chevron) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!state.canGoPrevious || isLoading}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page (single chevron) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!state.canGoPrevious || isLoading}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              disabled={isLoading}
              className={cn(
                "h-8 w-8 p-0 transition-all duration-200",
                currentPage === pageNum && "bg-primary text-primary-foreground"
              )}
            >
              {pageNum + 1}
            </Button>
          ))}
        </div>

        {/* Next page (single chevron) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!state.canGoNext || isLoading}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Next page (double chevron) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!state.canGoNext || isLoading}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}