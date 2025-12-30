/**
 * Form Error Focusing Utility
 * 
 * Provides centralized error focusing functionality for all forms in the application
 */

export interface ErrorFocusConfig {
  fieldId: string;
  priority: number;
  selector?: string; // Custom selector if fieldId is not sufficient
  customFocus?: () => void; // Custom focus function
}

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Focus on the first error field based on priority
 * @param validationErrors Object containing validation errors
 * @param errorConfigs Array of error focus configurations
 */
export function focusOnFirstError(
  validationErrors: ValidationErrors,
  errorConfigs: ErrorFocusConfig[]
): void {
  if (Object.keys(validationErrors).length === 0) return;

  // Sort by priority (lower number = higher priority)
  const sortedConfigs = errorConfigs.sort((a, b) => a.priority - b.priority);

  for (const config of sortedConfigs) {
    if (validationErrors[config.fieldId]) {
      if (config.customFocus) {
        config.customFocus();
        return;
      }

      let element: HTMLElement | null = null;

      // Try custom selector first
      if (config.selector) {
        element = document.querySelector(config.selector);
      }

      // Fallback to fieldId
      if (!element) {
        element = document.getElementById(config.fieldId);
      }

      // Fallback to data-error attribute
      if (!element) {
        element = document.querySelector(`[data-error-field="${config.fieldId}"]`);
      }

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        return;
      }
    }
  }

  // Final fallback: focus on any element with data-error="true"
  const firstErrorElement = document.querySelector('[data-error="true"]') as HTMLElement;
  if (firstErrorElement) {
    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstErrorElement.focus();
  }
}

/**
 * Create standard error focus configs for common form fields
 */
export function createStandardErrorConfigs(): ErrorFocusConfig[] {
  return [
    // Basic form fields (highest priority)
    { fieldId: 'name', priority: 1 },
    { fieldId: 'firstName', priority: 1 },
    { fieldId: 'lastName', priority: 2 },
    { fieldId: 'email', priority: 3 },
    { fieldId: 'phone', priority: 4 },
    { fieldId: 'businessName', priority: 5 },
    { fieldId: 'fromParty', priority: 6 },
    { fieldId: 'draftName', priority: 7 },
    
    // Address fields
    { fieldId: 'address', priority: 10 },
    { fieldId: 'city', priority: 11 },
    { fieldId: 'state', priority: 12 },
    { fieldId: 'postalCode', priority: 13 },
    { fieldId: 'country', priority: 14 },
    
    // Business fields
    { fieldId: 'origin', priority: 20 },
    { fieldId: 'plantApprovalNumber', priority: 21 },
    { fieldId: 'brand', priority: 22 },
    { fieldId: 'processor', priority: 23 },
    
    // Product fields
    { fieldId: 'productName', priority: 30 },
    { fieldId: 'species', priority: 31 },
    { fieldId: 'size', priority: 32 },
    { fieldId: 'sku', priority: 33 },
    { fieldId: 'code', priority: 34 },
    
    // Location fields
    { fieldId: 'locationName', priority: 40 },
    
    // Date fields
    { fieldId: 'offerValidityDate', priority: 50 },
    { fieldId: 'shipmentDate', priority: 51 },
    
    // Numeric fields
    { fieldId: 'grandTotal', priority: 60 },
    { fieldId: 'price', priority: 61 },
    { fieldId: 'quantity', priority: 62 },
    { fieldId: 'tolerance', priority: 63 },
  ];
}

/**
 * Create error focus configs for product-specific fields
 * @param productIndex Index of the product
 */
export function createProductErrorConfigs(productIndex: number): ErrorFocusConfig[] {
  return [
    {
      fieldId: `product_${productIndex}_productId`,
      priority: 100 + productIndex * 10,
      selector: `[data-product-index="${productIndex}"] select`,
    },
    {
      fieldId: `product_${productIndex}_species`,
      priority: 101 + productIndex * 10,
      selector: `[data-product-index="${productIndex}"] [data-field="species"] select`,
    },
    {
      fieldId: `product_${productIndex}_sizeBreakups`,
      priority: 102 + productIndex * 10,
      customFocus: () => {
        const element = document.querySelector(`[data-product-index="${productIndex}"] .size-breakup-section`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const sizeInput = element.querySelector('input[placeholder="Size"]') as HTMLInputElement;
          if (sizeInput) {
            sizeInput.focus();
          }
        }
      },
    },
  ];
}

/**
 * Enhanced input component props for error handling
 */
export interface ErrorAwareInputProps {
  fieldId: string;
  hasError?: boolean;
  errorMessage?: string;
}

/**
 * Get error-aware input props
 */
export function getErrorInputProps(
  fieldId: string,
  validationErrors: ValidationErrors
): {
  'data-error': boolean;
  'data-error-field': string;
  className: string;
} {
  const hasError = !!validationErrors[fieldId];
  
  return {
    'data-error': hasError,
    'data-error-field': fieldId,
    className: hasError ? 'border-red-500 focus:border-red-500' : '',
  };
}

/**
 * Hook for form error focusing
 */
export function useFormErrorFocus() {
  const focusOnError = (
    validationErrors: ValidationErrors,
    customConfigs: ErrorFocusConfig[] = []
  ) => {
    const standardConfigs = createStandardErrorConfigs();
    const allConfigs = [...standardConfigs, ...customConfigs];
    focusOnFirstError(validationErrors, allConfigs);
  };

  return { focusOnError };
}