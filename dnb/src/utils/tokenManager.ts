/**
 * Token Manager - Handles token refresh and validation on client-side
 * This ensures tokens are fresh before calling server actions
 */

import { getauthToken, getRefreshToken, getStoredSession, persistSession, clearSession } from './auth';
import { apiClient } from '@/utils/apiClient';
import { isTokenExpiringSoonClient } from './token-utils';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

function isTokenExpiredOrExpiringSoon(token: string, bufferMinutes: number = 5): boolean {
  return isTokenExpiringSoonClient(token, bufferMinutes);
}

/**
 * Get a valid access token, refreshing if necessary
 * @returns Valid access token or null if refresh fails
 */
export async function getValidToken(): Promise<string | null> {
  const currentToken = getauthToken();
  
  if (!currentToken) {
    return null;
  }

  // Check if token is expired or will expire soon
  if (isTokenExpiredOrExpiringSoon(currentToken, 5)) {

    
    return await refreshAccessToken();
  }
  return currentToken;
}

/**
 * Refresh the access token using the refresh token
 * @returns New access token or null if refresh fails
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = performRefresh();

  try {
    const newToken = await refreshPromise;
    return newToken;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

/**
 * Perform the actual token refresh
 */
async function performRefresh(): Promise<string | null> {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      console.error('❌ No refresh token available');
      clearSession();
      return null;
    }
    
    const response = await apiClient.post('/auth/refresh-token', {
      refreshToken,
    });

    if (!response?.data?.success) {
      console.error('❌ Refresh token API returned error:', response?.data?.error);
      clearSession();
      return null;
    }

    const refreshedData = response.data.data;
    const newAccessToken = refreshedData?.authToken || refreshedData?.accessToken;
    const newRefreshToken = refreshedData?.refreshToken;

    if (!newAccessToken) {
      console.error('❌ No access token in refresh response');
      clearSession();
      return null;
    }

    // Update session with new tokens
    const existingSession = getStoredSession();
    if (existingSession) {
      const nextSession = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken ?? existingSession.refreshToken,
        user: {
          ...existingSession.user,
          // Update user data from token payload if available
          ...(refreshedData.tokenPayload && {
            id: refreshedData.tokenPayload.id,
            email: refreshedData.tokenPayload.email,
            userRole: refreshedData.tokenPayload.userRole,
            name: refreshedData.tokenPayload.name,
            businessOwnerId: refreshedData.tokenPayload.businessOwnerId,
            businessName: refreshedData.tokenPayload.businessName,
          }),
        },
        remember: existingSession.remember,
      };
      persistSession(nextSession, { remember: existingSession.remember });
    }

    return newAccessToken;
  } catch (error: any) {
    console.error('❌ Token refresh failed:', error);
    
    // Check if it's a network error vs auth error
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearSession();
      
      // Redirect to login if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      // Don't clear session on network errors, allow retry
    } else {
      clearSession();
    }
    
    return null;
  }
}

/**
 * Ensure user is authenticated and has a valid token
 * @returns Valid access token or throws error
 */
export async function ensureAuthenticated(): Promise<string> {
  const token = await getValidToken();
  
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }
  
  return token;
}
export async function forceRefreshToken(): Promise<string | null> {
  return await refreshAccessToken();
}

export function isCurrentTokenValid(): boolean {
  const currentToken = getauthToken();
  
  if (!currentToken) {
    return false;
  }

  return !isTokenExpiredOrExpiringSoon(currentToken, 0);
}
