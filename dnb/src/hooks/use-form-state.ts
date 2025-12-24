'use client';

import { useState, useCallback, useEffect } from 'react';
import { useFormChanges } from './use-form-changes';
import { useUnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

export interface FormStateOptions<T> {
  initialData: T;
  enableUnsavedWarning?: boolean;
  onSave?: (data: T, changedFields: Partial<T>) => Promise<void>;
  onReset?: () => void;
}

export function useFormState<T extends Record<string, any>>(
  options: FormStateOptions<T>
) {
  const { initialData, enableUnsavedWarning = true, onSave, onReset } = options;
  
  const [formData, setFormData] = useState<T>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stableInitialData, setStableInitialData] = useState<T>(initialData);

  const {
    hasChanges,
    isNavigating,
    navigateWithCheck,
    resetChanges,
    getChangedFields,
    setIsNavigating,
  } = useFormChanges(stableInitialData, formData, {
    enableUnsavedWarning,
    onRouteChange: async () => {
      return new Promise((resolve) => {
        showUnsavedDialog(() => {
          setIsNavigating(true);
          resolve(true);
        });
      });
    },
  });

  const {
    isOpen: isUnsavedDialogOpen,
    showDialog: showUnsavedDialog,
    handleDiscard,
    handleContinueEditing,
    handleClose: closeUnsavedDialog,
  } = useUnsavedChangesDialog();

  // Update form data when initial data changes (only if significantly different)
  useEffect(() => {
    const initialString = JSON.stringify(initialData);
    const stableString = JSON.stringify(stableInitialData);
    
    if (initialString !== stableString) {
      setStableInitialData(initialData);
      setFormData(initialData);
    }
  }, [initialData, stableInitialData]);

  // Update a single field
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  // Update multiple fields
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Set field error
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: error,
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Save form
  const saveForm = useCallback(async () => {
    if (!hasChanges || !onSave) return;

    setIsSaving(true);
    try {
      const changedFields = getChangedFields();
      await onSave(formData, changedFields);
      setStableInitialData(formData); // Update stable initial data after successful save
      resetChanges();
      clearErrors();
    } catch (error: any) {
      console.error('Save error:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, onSave, formData, getChangedFields, resetChanges, clearErrors]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(stableInitialData);
    resetChanges();
    clearErrors();
    if (onReset) {
      onReset();
    }
  }, [stableInitialData, resetChanges, clearErrors, onReset]);

  // Navigate with unsaved changes check
  const navigateWithUnsavedCheck = useCallback((path: string) => {
    if (hasChanges) {
      showUnsavedDialog(() => {
        setIsNavigating(true);
        window.location.href = path;
      });
    } else {
      setIsNavigating(true);
      window.location.href = path;
    }
  }, [hasChanges, showUnsavedDialog, setIsNavigating]);

  return {
    // Form data
    formData,
    initialData: stableInitialData,
    
    // Form state
    hasChanges,
    isSaving,
    isNavigating,
    errors,
    
    // Form actions
    updateField,
    updateFields,
    setFieldError,
    clearErrors,
    saveForm,
    resetForm,
    
    // Navigation
    navigateWithCheck,
    navigateWithUnsavedCheck,
    
    // Unsaved changes dialog
    isUnsavedDialogOpen,
    showUnsavedDialog,
    handleDiscard,
    handleContinueEditing,
    closeUnsavedDialog,
    
    // Utilities
    getChangedFields,
    resetChanges,
  };
}