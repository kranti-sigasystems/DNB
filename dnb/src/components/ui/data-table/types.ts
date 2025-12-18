/**
 * Data Table Types
 */

import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DataTableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => ReactNode;
}

export interface DataTableAction<T = any> {
  label: string;
  icon?: LucideIcon;
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive';
  disabled?: (item: T) => boolean;
  hidden?: (item: T) => boolean;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  emptyState?: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
  };
  className?: string;
}