'use client';

import { useAlertDialog } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';

export function useActionConfirmation() {
  const { showAlert, AlertDialog } = useAlertDialog();

  const confirmAction = (config: {
    action: 'add' | 'update' | 'delete' | 'activate' | 'deactivate' | 'custom';
    itemType: string; // e.g., 'user', 'buyer', 'product', 'location'
    itemName?: string;
    onConfirm: () => Promise<void> | void;
    customTitle?: string;
    customDescription?: string;
  }) => {
    const { action, itemType, itemName, onConfirm, customTitle, customDescription } = config;

    // Default messages based on action and item type
    const getDefaultMessages = () => {
      const messages = {
        add: {
          title: `Add ${itemType}`,
          description: `Are you sure you want to add this ${itemType.toLowerCase()}?`,
        },
        update: {
          title: `Update ${itemType}`,
          description: `Are you sure you want to update this ${itemType.toLowerCase()}?`,
        },
        delete: {
          title: `Delete ${itemType}`,
          description: `Are you sure you want to delete this ${itemType.toLowerCase()}? This action cannot be undone.`,
        },
        activate: {
          title: `Activate ${itemType}`,
          description: `Are you sure you want to activate this ${itemType.toLowerCase()}?`,
        },
        deactivate: {
          title: `Deactivate ${itemType}`,
          description: `Are you sure you want to deactivate this ${itemType.toLowerCase()}?`,
        },
        custom: {
          title: 'Confirm Action',
          description: 'Are you sure you want to perform this action?',
        },
      };

      return messages[action] || messages.custom;
    };

    const defaultMessages = getDefaultMessages();

    showAlert({
      title: customTitle || defaultMessages.title,
      description: customDescription || defaultMessages.description,
      action: action,
      itemName: itemName,
      onConfirm: async () => {
        try {
          await onConfirm();
          
          // Show success toast based on action
          const successMessages = {
            add: `${itemType} added successfully!`,
            update: `${itemType} updated successfully!`,
            delete: `${itemType} deleted successfully!`,
            activate: `${itemType} activated successfully!`,
            deactivate: `${itemType} deactivated successfully!`,
            custom: 'Action completed successfully!',
          };
          
          toast.success(successMessages[action] || successMessages.custom);
        } catch (error) {
          console.error(`${action} ${itemType} failed:`, error);
          
          // Show error toast
          const errorMessages = {
            add: `Failed to add ${itemType.toLowerCase()}. Please try again.`,
            update: `Failed to update ${itemType.toLowerCase()}. Please try again.`,
            delete: `Failed to delete ${itemType.toLowerCase()}. Please try again.`,
            activate: `Failed to activate ${itemType.toLowerCase()}. Please try again.`,
            deactivate: `Failed to deactivate ${itemType.toLowerCase()}. Please try again.`,
            custom: 'Action failed. Please try again.',
          };
          
          toast.error(errorMessages[action] || errorMessages.custom);
          throw error; // Re-throw to allow component-specific error handling
        }
      },
    });
  };

  return {
    confirmAction,
    AlertDialog,
  };
}