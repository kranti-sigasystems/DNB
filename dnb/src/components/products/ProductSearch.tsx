'use client';

import { UniversalSearch } from '@/components/ui/universal-search';
import { PRODUCT_SEARCH_CONFIG } from '@/config/searchConfigs';
import type { ProductSearchParams } from '@/types/product';
import type { SearchFilters } from '@/types/search';

interface ProductSearchProps {
  onSearch: (filters: ProductSearchParams) => void;
  onClear: () => void;
  loading?: boolean;
}

export function ProductSearch({ onSearch, onClear, loading = false }: ProductSearchProps) {
  const handleSearch = (filters: SearchFilters) => {
    // Convert SearchFilters to ProductSearchParams
    const productFilters: ProductSearchParams = {
      query: filters.query,
      productName: filters.productName,
      code: filters.code,
      species: filters.species,
      size: filters.size,
      sku: filters.sku,
    };
    
    onSearch(productFilters);
  };

  return (
    <UniversalSearch
      config={PRODUCT_SEARCH_CONFIG}
      onSearch={handleSearch}
      onClear={onClear}
      loading={loading}
    />
  );
}