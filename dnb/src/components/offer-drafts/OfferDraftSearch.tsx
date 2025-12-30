'use client';

import { UniversalSearch } from '@/components/ui/universal-search';
import { OFFER_DRAFT_SEARCH_CONFIG } from '@/config/searchConfigs';
import type { OfferDraftSearchFilters } from '@/types/offer-draft';
import type { SearchFilters } from '@/types/search';

interface OfferDraftSearchProps {
  onSearch: (filters: OfferDraftSearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
}

export function OfferDraftSearch({ onSearch, onClear, loading = false }: OfferDraftSearchProps) {
  const handleSearch = (filters: SearchFilters) => {
    // Convert SearchFilters to OfferDraftSearchFilters
    const offerDraftFilters: OfferDraftSearchFilters = {
      draftNo: filters.draftNo,
      draftName: filters.draftName,
      productName: filters.productName,
      // status: filters.status, // Temporarily disabled
    };
    
    onSearch(offerDraftFilters);
  };

  return (
    <UniversalSearch
      config={OFFER_DRAFT_SEARCH_CONFIG}
      onSearch={handleSearch}
      onClear={onClear}
      loading={loading}
    />
  );
}