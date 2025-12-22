/**
 * Session Restore Utility
 * Helps restore authentication state when user data exists but auth context is not initialized
 */

import { getStoredSession, persistSession } from './auth';

export function attemptSessionRestore(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    
    // Check if we have individual storage items but no complete session
    const authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    const refreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    
    if (!authToken || !userStr) {
      return false;
    }

    // Check if session is already properly stored
    const existingSession = getStoredSession();
    if (existingSession && existingSession.user && existingSession.accessToken) {
      
      return true;
    }

    // Parse user data
    const user = JSON.parse(userStr);
    
    // Create session object
    const sessionData = {
      accessToken: authToken,
      refreshToken: refreshToken,
      user: user,
      remember: true,
    };

    // Persist the session
    const restoredSession = persistSession(sessionData, { remember: true });
    
    if (restoredSession) {
      
      // Trigger a storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'dnb_auth_session',
        newValue: JSON.stringify(restoredSession),
        storageArea: sessionStorage
      }));
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Error during session restore:', error);
    return false;
  }
}

/**
 * Check if user should be redirected to login
 */
export function shouldRedirectToLogin(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  const user = sessionStorage.getItem('user') || localStorage.getItem('user');
  
  // If no token or user data, should redirect
  if (!authToken || !user) {
    return true;
  }

  // Check if token is expired
  try {
    const tokenParts = authToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      if (currentTime > expirationTime) {
        return true;
      }
    }
  } catch (error) {
    console.error('❌ Error checking token expiry:', error);
    return true;
  }

  return false;
}