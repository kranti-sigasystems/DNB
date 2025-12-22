/**
 * Data Table Component
 * Enterprise-grade reusable data table with all features
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTableSort } from '@/lib/hooks/useTableSort';
import { debounce } from '@/lib/utils/dashboard.utils';

import { DataTablePagination } from './data-table-pagination';
import { DataTableSkeleton, MobileCardSkeleton, PaginationSkeleton } from './data-table-skeleton';
import { SortableHeader } from './sortable-header';
import { ActionMenu } from './action-menu';
import type { DataTableProps, DataTableColumn } from './types';

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  isLoading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  onSearch,
  pagination,
  emptyState,
  className,
}: DataTableProps<T>) {

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((query: string) => onSearch?.(query), 300),
    [onSearch]
  );

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    
    if (!searchQuery || onSearch) {
      return data; // If onSearch is provided, filtering is handled externally
    }
    
    const filtered = data.filter((item) =>
      columns.some((column) => {
        const value = item[column.key];
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
    
    return filtered;
  }, [data, searchQuery, columns, onSearch]);

  // Sort functionality
  const { sortedData, sortConfig, actions: sortActions, getSortIcon } = useTableSort({
    data: filteredData,
  });

  // Row selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(sortedData.map((item) => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedRows(newSelection);
  };

  // Mobile card component
  const MobileCard = ({ item }: { item: T }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {columns.slice(0, 2).map((column) => (
              <div key={String(column.key)} className="mb-1">
                {column.render ? (
                  column.render(item[column.key], item)
                ) : (
                  <span className={column.key === columns[0].key ? "font-semibold" : "text-sm text-muted-foreground"}>
                    {String(item[column.key] || '')}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {columns.length > 2 && columns[2].render && (
              columns[2].render(item[columns[2].key], item)
            )}
            {actions.length > 0 && (
              <ActionMenu item={item} actions={actions} />
            )}
          </div>
        </div>
        {columns.length > 3 && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{columns[3].label}:</span>{' '}
            {columns[3].render ? 
              columns[3].render(item[columns[3].key], item) : 
              String(item[columns[3].key] || '')
            }
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Empty state
  const EmptyState = () => {
    const EmptyIcon = emptyState?.icon || Users;
    return (
      <div className="p-12 text-center">
        <EmptyIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">
          {emptyState?.title || "No data found"}
        </p>
        {emptyState?.description && (
          <p className="text-muted-foreground text-sm mt-1">
            {emptyState.description}
          </p>
        )}
        {emptyState?.action && (
          <div className="mt-4">
            {emptyState.action}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile Cards */}
      <Card className="lg:hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Data</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-xs"
            />
          )}
          {isLoading ? (
            <MobileCardSkeleton />
          ) : sortedData.length > 0 ? (
            <div className="space-y-4">
              {sortedData.map((item) => (
                <MobileCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Data</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-xs"
            />
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={sortedData.length > 0 && sortedData.every(item => selectedRows.has(item.id))}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  {columns.map((column) => (
                    <TableHead key={String(column.key)} style={{ width: column.width }}>
                      {column.sortable ? (
                        <SortableHeader
                          sortDirection={getSortIcon(column.key)}
                          onSort={() => sortActions.handleSort(column.key)}
                        >
                          {column.label}
                        </SortableHeader>
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  ))}
                  {actions.length > 0 && (
                    <TableHead className="w-12">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <DataTableSkeleton columnsCount={columns.length + (actions.length > 0 ? 2 : 1)} />
                ) : sortedData.length > 0 ? (
                  sortedData.map((item) => (
                    <TableRow
                      key={item.id}
                      data-state={selectedRows.has(item.id) && "selected"}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(item.id)}
                          onCheckedChange={(checked) => handleSelectRow(item.id, !!checked)}
                          aria-label="Select row"
                        />
                      </TableCell>
                      {columns.map((column) => (
                        <TableCell key={String(column.key)}>
                          {column.render ? 
                            column.render(item[column.key], item) : 
                            String(item[column.key] || '')
                          }
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell>
                          <ActionMenu item={item} actions={actions} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length + (actions.length > 0 ? 2 : 1)}>
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && (
            <>
              {isLoading ? (
                <PaginationSkeleton />
              ) : (
                <DataTablePagination
                  totalItems={pagination.totalItems}
                  totalPages={pagination.totalPages}
                  currentPage={pagination.currentPage}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.onPageChange}
                  onPageSizeChange={pagination.onPageSizeChange}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}