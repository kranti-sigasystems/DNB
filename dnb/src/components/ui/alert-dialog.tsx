'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Trash2, UserCheck, UserX, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type AlertAction = 'add' | 'activate' | 'deactivate' | 'delete' | 'update' | 'custom';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  action: AlertAction;
  itemName?: string;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const actionConfig = {
  add: { icon: Plus, confirmText: 'Add', variant: 'default' as const },
  activate: { icon: UserCheck, confirmText: 'Activate', variant: 'default' as const },
  deactivate: { icon: UserX, confirmText: 'Deactivate', variant: 'default' as const },
  delete: { icon: Trash2, confirmText: 'Delete', variant: 'destructive' as const },
  update: { icon: CheckCircle, confirmText: 'Update', variant: 'default' as const },
  custom: { icon: AlertTriangle, confirmText: 'Confirm', variant: 'default' as const },
};

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  action,
  itemName,
  onConfirm,
  onCancel,
  confirmText,
  cancelText = 'Cancel',
  isLoading = false,
}: AlertDialogProps) {
  const config = actionConfig[action];
  const Icon = config.icon;
  const finalConfirmText = confirmText || config.confirmText;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              action === 'delete' ? 'bg-red-50' : 
              action === 'activate' ? 'bg-green-50' : 
              action === 'deactivate' ? 'bg-orange-50' : 
              'bg-blue-50'
            }`}>
              <Icon className={`w-5 h-5 ${
                action === 'delete' ? 'text-red-600' : 
                action === 'activate' ? 'text-green-600' : 
                action === 'deactivate' ? 'text-orange-600' : 
                'text-blue-600'
              }`} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {itemName && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">{itemName}</p>
          </div>
        )}
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={config.variant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
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

// Hook for managing alert dialogs
export function useAlertDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title: string;
    description: string;
    action: AlertAction;
    itemName?: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
  }>({
    title: '',
    description: '',
    action: 'custom',
    onConfirm: () => {},
  });

  const showAlert = React.useCallback((alertConfig: {
    title: string;
    description: string;
    action: AlertAction;
    itemName?: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
  }) => {
    setConfig(alertConfig);
    setIsOpen(true);
  }, []);

  const hideAlert = React.useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
    }
  }, [isLoading]);

  const handleConfirm = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await config.onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error('Alert action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config.onConfirm]);

  return {
    showAlert,
    hideAlert,
    isLoading,
    AlertDialog: () => (
      <AlertDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={config.title}
        description={config.description}
        action={config.action}
        itemName={config.itemName}
        onConfirm={handleConfirm}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        isLoading={isLoading}
      />
    ),
  };
}