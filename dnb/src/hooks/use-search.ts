import { useState, useCallback } from 'react';

export interface UseSearchOptions<T> {
  onFetch: (filters: T, isSearch?: boolean) => void;
  initialFilters?: T;
}

export function useSearch<T extends Record<string, any>>({
  onFetch,
  initialFilters = {} as T,
}: UseSearchOptions<T>) {
  const [searchFilters, setSearchFilters] = useState<T>(initialFilters);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback((filters: T) => {
    setSearchFilters(filters);
    setIsSearching(true);
    
    // Call the fetch function with search flag
    onFetch(filters, true);
    
    // Reset searching state after a short delay
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  }, [onFetch]);

  const handleClearSearch = useCallback(() => {
    setSearchFilters(initialFilters);
    setIsSearching(true);
    
    // Call the fetch function without search flag (clear search)
    onFetch(initialFilters, false);
    
    // Reset searching state after a short delay
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  }, [onFetch, initialFilters]);

  return {
    searchFilters,
    isSearching,
    handleSearch,
    handleClearSearch,
  };
}