/**
 * Custom hook for pagination logic
 */

import { useState, useCallback, useMemo } from 'react';
import { DASHBOARD_CONFIG } from '@/lib/constants/dashboard';
import { generatePageNumbers, calculatePaginationRange } from '@/lib/utils/dashboard.utils';

interface UsePaginationProps {
  totalItems: number;
  initialPageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  pageNumbers: number[];
  paginationInfo: {
    start: number;
    end: number;
    total: number;
  };
  actions: {
    goToPage: (page: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    changePageSize: (size: number) => void;
    reset: () => void;
  };
  state: {
    canGoNext: boolean;
    canGoPrevious: boolean;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}

export function usePagination({
  totalItems,
  initialPageSize = DASHBOARD_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
  onPageChange,
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  const pageNumbers = useMemo(() => {
    return generatePageNumbers(
      currentPage,
      totalPages,
      DASHBOARD_CONFIG.PAGINATION.MAX_VISIBLE_PAGES
    );
  }, [currentPage, totalPages]);

  const paginationInfo = useMemo(() => {
    return {
      ...calculatePaginationRange(currentPage, pageSize, totalItems),
      total: totalItems,
    };
  }, [currentPage, pageSize, totalItems]);

  const state = useMemo(() => {
    return {
      canGoNext: currentPage < totalPages - 1,
      canGoPrevious: currentPage > 0,
      isFirstPage: currentPage === 0,
      isLastPage: currentPage >= totalPages - 1,
    };
  }, [currentPage, totalPages]);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(0, Math.min(page, totalPages - 1));
      setCurrentPage(validPage);
      onPageChange?.(validPage, pageSize);
    },
    [totalPages, pageSize, onPageChange]
  );

  const goToNextPage = useCallback(() => {
    if (state.canGoNext) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, state.canGoNext, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (state.canGoPrevious) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, state.canGoPrevious, goToPage]);

  const changePageSize = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(0); // Reset to first page
      onPageChange?.(0, size);
    },
    [onPageChange]
  );

  const reset = useCallback(() => {
    setCurrentPage(0);
    setPageSize(initialPageSize);
    onPageChange?.(0, initialPageSize);
  }, [initialPageSize, onPageChange]);

  return {
    currentPage,
    pageSize,
    totalPages,
    pageNumbers,
    paginationInfo,
    actions: {
      goToPage,
      goToNextPage,
      goToPreviousPage,
      changePageSize,
      reset,
    },
    state,
  };
}