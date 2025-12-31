'use client';

import { UniversalSearch } from '@/components/ui/universal-search';
import { OFFER_SEARCH_CONFIG } from '@/config/searchConfigs';
import type { SearchFilters } from '@/types/search';

interface OfferSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
}

export function OfferSearch({ onSearch, onClear, loading = false }: OfferSearchProps) {
  return (
    <UniversalSearch
      config={OFFER_SEARCH_CONFIG}
      onSearch={onSearch}
      onClear={onClear}
      loading={loading}
    />
  );
}