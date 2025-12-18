/**
 * Token Manager - Handles token refresh and validation on client-side
 * This ensures tokens are fresh before calling server actions
 */

import { getauthToken, getRefreshToken, getStoredSession, persistSession, clearSession } from './auth';
import { apiClient } from '@/utils/apiClient';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Get a valid access token, refreshing if necessary
 * @returns Valid access token or null if refresh fails
 */
export async function getValidToken(): Promise<string | null> {
  const currentToken = getauthToken();
  
  if (!currentToken) {
    console.log('❌ No access token found');
    return null;
  }

  // Check if token is expired by trying to decode it
  try {
    const tokenParts = currentToken.split('.');
    if (tokenParts.length !== 3) {
      console.log('❌ Invalid token format');
      return null;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // If token expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < 5 * 60 * 1000) {
      return await refreshAccessToken();
    }

    console.log('✅ Token is valid');
    return currentToken;
  } catch (error) {
    console.error('❌ Error checking token validity:', error);
    // If we can't decode the token, try to refresh it
    return await refreshAccessToken();
  }
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

    const refreshedData = response?.data?.data ?? {};
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
        user: existingSession.user,
        remember: existingSession.remember,
      };
      persistSession(nextSession, { remember: existingSession.remember });
    }

    return newAccessToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    clearSession();
    
    // Redirect to login if we're in the browser
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
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
