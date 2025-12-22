/**
 * Table Refresh Utilities
 * Provides consistent table-only refresh functionality without page reloads
 */

export interface RefreshOptions {
  preserveFilters?: boolean;
  preservePagination?: boolean;
  showSuccessMessage?: boolean;
  successMessage?: string;
}

/**
 * Creates a standardized table refresh function
 * @param fetchFunction - The function to call for fetching fresh data
 * @param currentState - Current table state (pagination, filters, etc.)
 * @param options - Refresh options
 */
export function createTableRefresh<T extends Record<string, any>>(
  fetchFunction: (params: T) => Promise<void>,
  getCurrentState: () => T,
  options: RefreshOptions = {}
) {
  return async (overrides: Partial<T> = {}) => {
    const currentState = getCurrentState();
    const refreshParams = {
      ...currentState,
      ...overrides,
    };

    try {
      await fetchFunction(refreshParams);
      
      if (options.showSuccessMessage && options.successMessage) {
      }
    } catch (error) {
      console.error('❌ Table refresh failed:', error);
      throw error;
    }
  };
}

/**
 * Prevents page refresh and ensures only table data is updated
 * @param event - Form or click event
 */
export function preventPageRefresh(event?: Event | React.FormEvent) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/**
 * Optimized refresh strategy for different action types
 */
export const REFRESH_STRATEGIES = {
  // For actions that modify data (activate, deactivate, delete)
  MODIFY: {
    preserveFilters: true,
    preservePagination: true,
    showSuccessMessage: false, // Let the action handler show the message
  },
  
  // For search operations
  SEARCH: {
    preserveFilters: false, // New filters will be applied
    preservePagination: false, // Reset to first page
    showSuccessMessage: false,
  },
  
  // For pagination changes
  PAGINATE: {
    preserveFilters: true,
    preservePagination: false, // New pagination will be applied
    showSuccessMessage: false,
  },
  
  // For manual refresh
  MANUAL: {
    preserveFilters: true,
    preservePagination: true,
    showSuccessMessage: true,
    successMessage: 'Data refreshed successfully',
  },
} as const;

/**
 * Debounced refresh to prevent multiple rapid calls
 */
export function createDebouncedRefresh<T extends any[]>(
  refreshFunction: (...args: T) => Promise<void>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(async () => {
      try {
        await refreshFunction(...args);
      } catch (error) {
        console.error('❌ Debounced refresh failed:', error);
      }
    }, delay);
  };
}

/**
 * Smart refresh that determines the best strategy based on the action
 */
export function smartRefresh<T extends Record<string, any>>(
  action: keyof typeof REFRESH_STRATEGIES,
  fetchFunction: (params: T) => Promise<void>,
  getCurrentState: () => T,
  overrides: Partial<T> = {}
) {
  const strategy = REFRESH_STRATEGIES[action];
  const refresh = createTableRefresh(fetchFunction, getCurrentState, strategy);
  return refresh(overrides);
}