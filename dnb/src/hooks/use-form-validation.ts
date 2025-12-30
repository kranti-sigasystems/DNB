/**
 * Form Validation Hook
 * 
 * Provides centralized form validation and error handling functionality
 */

import { useState, useCallback } from 'react';
import { useFormErrorFocus, ErrorFocusConfig } from '@/utils/form-error-focus';

export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData: any) => string | null;
  message?: string;
}

export interface UseFormValidationProps {
  validationRules: ValidationRule[];
  customErrorConfigs?: ErrorFocusConfig[];
}

export function useFormValidation({ validationRules, customErrorConfigs = [] }: UseFormValidationProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { focusOnError } = useFormErrorFocus();

  const validateField = useCallback((field: string, value: any, formData: any): string | null => {
    const rule = validationRules.find(r => r.field === field);
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rule.message || `${field} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `${field} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `${field} must be no more than ${rule.maxLength} characters`;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${field} format is invalid`;
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value, formData);
    }

    return null;
  }, [validationRules]);

  const validateForm = useCallback((formData: any): boolean => {
    const errors: Record<string, string> = {};

    for (const rule of validationRules) {
      const fieldValue = getNestedValue(formData, rule.field);
      const error = validateField(rule.field, fieldValue, formData);
      if (error) {
        errors[rule.field] = error;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [validationRules, validateField]);

  const clearValidationError = useCallback((field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const handleValidationError = useCallback((errors?: Record<string, string>) => {
    const errorsToFocus = errors || validationErrors;
    if (Object.keys(errorsToFocus).length > 0) {
      focusOnError(errorsToFocus, customErrorConfigs);
    }
  }, [validationErrors, focusOnError, customErrorConfigs]);

  const getFieldError = useCallback((field: string): string | undefined => {
    return validationErrors[field];
  }, [validationErrors]);

  const hasFieldError = useCallback((field: string): boolean => {
    return !!validationErrors[field];
  }, [validationErrors]);

  return {
    validationErrors,
    validateForm,
    validateField,
    clearValidationError,
    clearAllErrors,
    handleValidationError,
    getFieldError,
    hasFieldError,
    setValidationErrors,
  };
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Common validation rules
export const commonValidationRules = {
  required: (field: string, message?: string): ValidationRule => ({
    field,
    required: true,
    message: message || `${field} is required`,
  }),

  email: (field: string = 'email'): ValidationRule => ({
    field,
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  }),

  phone: (field: string = 'phone'): ValidationRule => ({
    field,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number',
  }),

  minLength: (field: string, length: number): ValidationRule => ({
    field,
    minLength: length,
    message: `${field} must be at least ${length} characters`,
  }),

  maxLength: (field: string, length: number): ValidationRule => ({
    field,
    maxLength: length,
    message: `${field} must be no more than ${length} characters`,
  }),

  positiveNumber: (field: string): ValidationRule => ({
    field,
    custom: (value) => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return `${field} must be a positive number`;
      }
      return null;
    },
  }),

  dateNotPast: (field: string): ValidationRule => ({
    field,
    custom: (value) => {
      if (!value) return null;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return `${field} cannot be in the past`;
      }
      return null;
    },
  }),
};