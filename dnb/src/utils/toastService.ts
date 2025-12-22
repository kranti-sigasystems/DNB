/**
 * Legacy toast service - now uses the centralized toast system
 * This file maintains backward compatibility while using the new system
 */

import { toast } from '@/utils/toast';

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showInfo = (message: string) => {
  toast.info(message);
};

export const showWarning = (message: string) => {
  toast.warning(message);
};