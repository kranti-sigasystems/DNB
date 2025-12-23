'use client';

import { UniversalSearch } from '@/components/ui/universal-search';
import { BUYER_SEARCH_CONFIG, BUSINESS_OWNER_SEARCH_CONFIG } from '@/config/searchConfigs';
import type { SearchFilters, SearchField } from '@/types/users';
import type { SearchFilters as UniversalSearchFilters } from '@/types/search';

interface UserSearchProps {
  searchFields: SearchField[];
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
  userType?: 'buyers' | 'business_owners';
}

export function UserSearch({ 
  searchFields, 
  onSearch, 
  onClear, 
  loading,
  userType = 'buyers'
}: UserSearchProps) {
  const handleSearch = (filters: UniversalSearchFilters) => {
    // Convert UniversalSearchFilters to SearchFilters with proper type safety
    const userFilters: SearchFilters = {};
    
    // Map the filters based on the search fields
    searchFields.forEach(field => {
      const filterValue = filters[field.name];
      if (filterValue) {
        // Type-safe assignment based on field name
        if (field.name === 'status' && (filterValue === 'active' || filterValue === 'inactive')) {
          userFilters.status = filterValue;
        } else if (field.name !== 'status') {
          // For non-status fields, assign directly
          (userFilters as any)[field.name] = filterValue;
        }
      }
    });
    
    // Add query field if it exists
    if (filters.query) {
      userFilters.query = filters.query;
    }
    
    onSearch(userFilters);
  };

  // Use the appropriate config based on user type
  const config = userType === 'business_owners' ? BUSINESS_OWNER_SEARCH_CONFIG : BUYER_SEARCH_CONFIG;

  // Override config fields with provided searchFields if they exist
  const customConfig = {
    ...config,
    fields: searchFields.map(field => ({
      name: field.name,
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      options: field.options,
      required: field.required || false,
    })),
  };

  return (
    <UniversalSearch
      config={customConfig}
      onSearch={handleSearch}
      onClear={onClear}
      loading={loading}
    />
  );
}