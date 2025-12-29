'use client';

import { UniversalSearch } from '@/components/ui/universal-search';
import { LOCATION_SEARCH_CONFIG } from '@/config/searchConfigs';
import type { LocationSearchFilters } from '@/types/location';
import type { SearchFilters } from '@/types/search';

interface LocationSearchProps {
  onSearch: (filters: LocationSearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
}

export function LocationSearch({ onSearch, onClear, loading = false }: LocationSearchProps) {
  const handleSearch = (filters: SearchFilters) => {
    // Convert SearchFilters to LocationSearchFilters
    const locationFilters: LocationSearchFilters = {
      query: filters.query,
      locationName: filters.locationName,
      code: filters.code,
      city: filters.city,
      state: filters.state,
      country: filters.country,
      address: filters.address,
    };
    
    onSearch(locationFilters);
  };

  return (
    <UniversalSearch
      config={LOCATION_SEARCH_CONFIG}
      onSearch={handleSearch}
      onClear={onClear}
      loading={loading}
    />
  );
}