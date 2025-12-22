'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = 'Processing...', 
  className = '' 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-foreground font-medium text-sm">{message}</p>
      </div>
    </div>
  );
}

// Full screen loading overlay
export function FullScreenLoadingOverlay({ 
  isVisible, 
  message = 'Processing...' 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg border">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

// Hook for managing loading states
export function useLoadingState() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('Processing...');

  const startLoading = React.useCallback((message?: string) => {
    if (message) setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = React.useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(message);
    try {
      return await asyncFn();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
  };
}