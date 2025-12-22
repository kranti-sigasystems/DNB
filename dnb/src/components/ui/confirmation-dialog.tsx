'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Trash2, UserCheck, UserX, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ConfirmationAction = 'add' | 'activate' | 'deactivate' | 'delete' | 'update' | 'custom';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  message: string;
  action: ConfirmationAction;
  itemName?: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'success';
}

const actionConfig = {
  add: {
    icon: Plus,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    confirmText: 'Add',
    variant: 'default' as const,
  },
  activate: {
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    confirmText: 'Activate',
    variant: 'default' as const,
  },
  deactivate: {
    icon: UserX,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    confirmText: 'Deactivate',
    variant: 'default' as const,
  },
  delete: {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    confirmText: 'Delete',
    variant: 'destructive' as const,
  },
  update: {
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    confirmText: 'Update',
    variant: 'default' as const,
  },
  custom: {
    icon: AlertTriangle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    confirmText: 'Confirm',
    variant: 'default' as const,
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  message,
  action,
  itemName,
  isLoading = false,
  confirmText,
  cancelText = 'Cancel',
  variant,
}: ConfirmationDialogProps) {
  const config = actionConfig[action];
  const Icon = config.icon;
  const finalConfirmText = confirmText || config.confirmText;
  const finalVariant = variant || config.variant;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isLoading}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 ${config.bgColor} rounded-lg`}>
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        {itemName && (
          <div className="my-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground">{itemName}</p>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={finalVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              finalConfirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing confirmation dialogs
export function useConfirmationDialog() {
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    action: ConfirmationAction;
    itemName?: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'success';
  }>({
    open: false,
    title: '',
    message: '',
    action: 'custom',
    onConfirm: () => {},
  });

  const [isLoading, setIsLoading] = React.useState(false);

  const showConfirmation = React.useCallback((config: {
    title: string;
    message: string;
    action: ConfirmationAction;
    itemName?: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'success';
  }) => {
    
    setDialog({
      open: true,
      title: config.title,
      message: config.message,
      action: config.action,
      itemName: config.itemName,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await config.onConfirm();
          setDialog(prev => ({ ...prev, open: false }));
        } catch (error) {
          console.error('Confirmation action failed:', error);
        } finally {
          setIsLoading(false);
        }
      },
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      variant: config.variant,
    });
    
  }, []);

  const hideConfirmation = React.useCallback(() => {
    if (!isLoading) {
      setDialog(prev => ({ ...prev, open: false }));
    }
  }, [isLoading]);

  const ConfirmationDialogComponent = React.useCallback(() => (
    <ConfirmationDialog
      open={dialog.open}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          hideConfirmation();
        }
      }}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      action={dialog.action}
      itemName={dialog.itemName}
      isLoading={isLoading}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      variant={dialog.variant}
    />
  ), [dialog, isLoading, hideConfirmation]);

  return {
    showConfirmation,
    hideConfirmation,
    isLoading,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}