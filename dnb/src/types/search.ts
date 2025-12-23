export interface SearchField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

export interface SearchFilters {
  [key: string]: string | undefined;
}

export interface SearchConfig {
  title: string;
  quickSearchPlaceholder: string;
  quickSearchField?: string; // The field name for quick search
  fields: SearchField[];
  showQuickSearch?: boolean;
  showAdvancedToggle?: boolean;
  defaultExpanded?: boolean;
}

export interface UniversalSearchProps {
  config: SearchConfig;
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
  className?: string;
}