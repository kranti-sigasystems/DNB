'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface FormChangeOptions {
  enableUnsavedWarning?: boolean;
  onBeforeUnload?: () => boolean;
  onRouteChange?: () => Promise<boolean>;
}

export function useFormChanges<T extends Record<string, any>>(
  initialData: T,
  currentData: T,
  options: FormChangeOptions = {}
) {
  const [hasChanges, setHasChanges] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const initialDataRef = useRef<string>('');
  const currentDataRef = useRef<string>('');
  const { enableUnsavedWarning = true, onBeforeUnload, onRouteChange } = options;

  // Convert objects to JSON strings for stable comparison
  const initialDataString = JSON.stringify(initialData);
  const currentDataString = JSON.stringify(currentData);

  // Update refs and check for changes only when strings actually change
  useEffect(() => {
    initialDataRef.current = initialDataString;
  }, [initialDataString]);

  useEffect(() => {
    currentDataRef.current = currentDataString;
    const changes = initialDataRef.current !== currentDataString;
    setHasChanges(changes);
  }, [currentDataString]);

  // Browser beforeunload event
  useEffect(() => {
    if (!enableUnsavedWarning) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !isNavigating) {
        const shouldPrevent = onBeforeUnload ? onBeforeUnload() : true;
        if (shouldPrevent) {
          e.preventDefault();
          e.returnValue = '';
          return '';
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isNavigating, enableUnsavedWarning, onBeforeUnload]);

  // Navigation wrapper with unsaved changes check
  const navigateWithCheck = useCallback(async (path: string) => {
    if (hasChanges) {
      const shouldContinue = onRouteChange ? await onRouteChange() : false;
      if (!shouldContinue) {
        return false;
      }
    }
    
    setIsNavigating(true);
    router.push(path);
    return true;
  }, [hasChanges, router, onRouteChange]);

  // Reset changes (useful after successful save)
  const resetChanges = useCallback(() => {
    initialDataRef.current = currentDataRef.current;
    setHasChanges(false);
  }, []);

  // Get changed fields (simple version)
  const getChangedFields = useCallback((): Partial<T> => {
    try {
      const initial = JSON.parse(initialDataRef.current);
      const current = JSON.parse(currentDataRef.current);
      const changes: Partial<T> = {};
      
      for (const key in current) {
        if (JSON.stringify(initial[key]) !== JSON.stringify(current[key])) {
          changes[key] = current[key];
        }
      }
      
      return changes;
    } catch {
      return {};
    }
  }, []);

  return {
    hasChanges,
    isNavigating,
    navigateWithCheck,
    resetChanges,
    getChangedFields,
    setIsNavigating,
  };
}