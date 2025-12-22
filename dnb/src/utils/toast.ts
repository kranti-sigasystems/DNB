/**
 * Centralized Toast Service
 * 
 * This service provides a centralized way to show toast notifications
 * throughout the application. It filters out technical errors and only
 * shows user-friendly messages.
 */

// Global toast functions that can be used anywhere in the app
let globalToastFunctions: {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
} | null = null;

export function setGlobalToastFunctions(functions: typeof globalToastFunctions) {
  globalToastFunctions = functions;
}

/**
 * Determines if an error should be shown to the user
 */
function shouldShowError(error: string): boolean {
  const technicalErrors = [
    'prisma',
    'database',
    'connection',
    'timeout',
    'network',
    'server error',
    'internal error',
    'jwt',
    'token',
    'unauthorized',
    'forbidden',
    'not found',
    'validation error',
    'syntax error',
    'reference error',
    'type error',
  ];

  const inputValidationErrors = [
    'required',
    'invalid',
    'must be',
    'should be',
    'cannot be empty',
    'too short',
    'too long',
    'format',
  ];

  const errorLower = error.toLowerCase();

  // Don't show technical errors
  if (technicalErrors.some(tech => errorLower.includes(tech))) {
    return false;
  }

  // Don't show basic input validation errors (these should be shown inline)
  if (inputValidationErrors.some(validation => errorLower.includes(validation))) {
    return false;
  }

  return true;
}

/**
 * Converts technical error messages to user-friendly ones
 */
function getUserFriendlyMessage(error: string, type: 'error' | 'success' | 'warning' | 'info' = 'error'): string {
  const errorLower = error.toLowerCase();

  // Authentication errors
  if (errorLower.includes('unauthorized') || errorLower.includes('invalid token')) {
    return 'Please log in again to continue';
  }

  if (errorLower.includes('forbidden')) {
    return 'You do not have permission to perform this action';
  }

  // Database/Network errors
  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'Connection error. Please check your internet and try again';
  }

  if (errorLower.includes('timeout')) {
    return 'Request timed out. Please try again';
  }

  if (errorLower.includes('server error') || errorLower.includes('internal error')) {
    return 'Something went wrong. Please try again later';
  }

  // Data errors
  if (errorLower.includes('not found')) {
    return 'The requested item could not be found';
  }

  if (errorLower.includes('already exists') || errorLower.includes('duplicate')) {
    return 'This item already exists. Please use a different value';
  }

  // Default messages
  if (type === 'error' && error.length > 100) {
    return 'An error occurred. Please try again';
  }

  return error;
}

/**
 * Toast service functions
 */
export const toast = {
  success: (message: string, duration?: number) => {
    if (globalToastFunctions) {
      const friendlyMessage = getUserFriendlyMessage(message, 'success');
      globalToastFunctions.success(friendlyMessage, duration);
    }
  },

  error: (message: string, duration?: number) => {
    if (globalToastFunctions && shouldShowError(message)) {
      const friendlyMessage = getUserFriendlyMessage(message, 'error');
      globalToastFunctions.error(friendlyMessage, duration);
    }
  },

  warning: (message: string, duration?: number) => {
    if (globalToastFunctions) {
      const friendlyMessage = getUserFriendlyMessage(message, 'warning');
      globalToastFunctions.warning(friendlyMessage, duration);
    }
  },

  info: (message: string, duration?: number) => {
    if (globalToastFunctions) {
      const friendlyMessage = getUserFriendlyMessage(message, 'info');
      globalToastFunctions.info(friendlyMessage, duration);
    }
  },

  // Force show error (bypasses filtering)
  forceError: (message: string, duration?: number) => {
    if (globalToastFunctions) {
      const friendlyMessage = getUserFriendlyMessage(message, 'error');
      globalToastFunctions.error(friendlyMessage, duration);
    }
  },
};

/**
 * Predefined toast messages for common scenarios
 */
export const toastMessages = {
  // Success messages
  success: {
    saved: 'Changes saved successfully',
    created: 'Item created successfully',
    updated: 'Item updated successfully',
    deleted: 'Item deleted successfully',
    uploaded: 'File uploaded successfully',
    sent: 'Message sent successfully',
    copied: 'Copied to clipboard',
    loggedIn: 'Welcome back!',
    loggedOut: 'Logged out successfully',
    registered: 'Account created successfully',
  },

  // Error messages
  error: {
    generic: 'Something went wrong. Please try again',
    network: 'Connection error. Please check your internet',
    unauthorized: 'Please log in to continue',
    forbidden: 'You do not have permission for this action',
    notFound: 'The requested item was not found',
    duplicate: 'This item already exists',
    validation: 'Please check your input and try again',
    upload: 'File upload failed. Please try again',
    delete: 'Failed to delete item. Please try again',
  },

  // Warning messages
  warning: {
    unsaved: 'You have unsaved changes',
    leaving: 'Are you sure you want to leave?',
    delete: 'This action cannot be undone',
    limit: 'You have reached the limit',
  },

  // Info messages
  info: {
    loading: 'Please wait...',
    processing: 'Processing your request...',
    saving: 'Saving changes...',
    uploading: 'Uploading file...',
  },
};