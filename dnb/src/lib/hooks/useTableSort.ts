/**
 * Custom hook for table sorting logic
 */

import { useState, useCallback, useMemo } from 'react';
import type { SortDirection } from '@/lib/constants/dashboard';
import { SORT_DIRECTIONS } from '@/lib/constants/dashboard';

interface UseSortProps<T> {
  data: T[];
  initialSortField?: keyof T;
  initialSortDirection?: SortDirection;
}

interface UseSortReturn<T> {
  sortedData: T[];
  sortConfig: {
    field: keyof T | null;
    direction: SortDirection;
  };
  actions: {
    handleSort: (field: keyof T) => void;
    resetSort: () => void;
  };
  getSortIcon: (field: keyof T) => 'asc' | 'desc' | 'none';
}

export function useTableSort<T extends Record<string, any>>({
  data,
  initialSortField,
  initialSortDirection = SORT_DIRECTIONS.NONE,
}: UseSortProps<T>): UseSortReturn<T> {
  const [sortConfig, setSortConfig] = useState<{
    field: keyof T | null;
    direction: SortDirection;
  }>({
    field: initialSortField || null,
    direction: initialSortDirection,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field!];
      const bValue = b[sortConfig.field!];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === SORT_DIRECTIONS.ASC ? 1 : -1;
      if (bValue == null) return sortConfig.direction === SORT_DIRECTIONS.ASC ? -1 : 1;

      // Convert to strings for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) {
        return sortConfig.direction === SORT_DIRECTIONS.ASC ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortConfig.direction === SORT_DIRECTIONS.ASC ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = useCallback((field: keyof T) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        // Cycle through: asc -> desc -> none
        if (prev.direction === SORT_DIRECTIONS.ASC) {
          return { field, direction: SORT_DIRECTIONS.DESC };
        } else if (prev.direction === SORT_DIRECTIONS.DESC) {
          return { field: null, direction: SORT_DIRECTIONS.NONE };
        } else {
          return { field, direction: SORT_DIRECTIONS.ASC };
        }
      } else {
        // New field: start with asc
        return { field, direction: SORT_DIRECTIONS.ASC };
      }
    });
  }, []);

  const resetSort = useCallback(() => {
    setSortConfig({
      field: null,
      direction: SORT_DIRECTIONS.NONE,
    });
  }, []);

  const getSortIcon = useCallback(
    (field: keyof T): 'asc' | 'desc' | 'none' => {
      if (sortConfig.field !== field) return 'none';
      if (sortConfig.direction === SORT_DIRECTIONS.ASC) return 'asc';
      if (sortConfig.direction === SORT_DIRECTIONS.DESC) return 'desc';
      return 'none';
    },
    [sortConfig]
  );

  return {
    sortedData,
    sortConfig,
    actions: {
      handleSort,
      resetSort,
    },
    getSortIcon,
  };
}