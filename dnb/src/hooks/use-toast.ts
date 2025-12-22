'use client';

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = `toast-${++toastCount}`;
    const toast: Toast = {
      id,
      type: options.type || 'info',
      message,
      duration: options.duration || 5000,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return addToast(message, { type: 'success', duration });
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    return addToast(message, { type: 'error', duration });
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return addToast(message, { type: 'warning', duration });
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    return addToast(message, { type: 'info', duration });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };
}