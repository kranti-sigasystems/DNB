'use client';

import React, { createContext, useContext } from 'react';
import { useToast, Toast as ToastType } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';

interface ToastContextType {
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast, success, error, warning, info, clearAll } = useToast();

  return (
    <ToastContext.Provider value={{ success, error, warning, info, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}