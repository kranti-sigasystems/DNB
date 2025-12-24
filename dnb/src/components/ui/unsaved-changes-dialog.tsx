'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onContinueEditing: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onDiscard,
  onContinueEditing,
  title = 'Unsaved Changes',
  description = 'You have unsaved changes that will be lost if you continue. Are you sure you want to discard them?',
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button 
            variant="outline"
            onClick={onContinueEditing}
            className="flex-1 sm:flex-none"
          >
            Continue Editing
          </Button>
          <Button
            variant="destructive"
            onClick={onDiscard}
            className="flex-1 sm:flex-none"
          >
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing unsaved changes dialog
export function useUnsavedChangesDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<(() => void) | null>(null);

  const showDialog = React.useCallback((action: () => void) => {
    setPendingAction(() => action);
    setIsOpen(true);
  }, []);

  const handleDiscard = React.useCallback(() => {
    if (pendingAction) {
      pendingAction();
    }
    setIsOpen(false);
    setPendingAction(null);
  }, [pendingAction]);

  const handleContinueEditing = React.useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  return {
    isOpen,
    showDialog,
    handleDiscard,
    handleContinueEditing,
    handleClose,
  };
}