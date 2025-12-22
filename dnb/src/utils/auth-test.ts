/**
 * Authentication Testing Utilities
 * Helper functions to test token refresh functionality
 */

import { refreshAccessToken, validateAccessToken } from '@/actions/auth.actions';
import { getValidToken, forceRefreshToken, isCurrentTokenValid } from './tokenManager';
import { getauthToken, getRefreshToken } from './auth';
import { isTokenExpiredClient, getTokenInfo } from './token-utils';

/**
 * Test the complete token refresh flow
 */
export async function testTokenRefresh(): Promise<{
  success: boolean;
  results: Record<string, any>;
  errors: string[];
}> {
  const results: Record<string, any> = {};
  const errors: string[] = [];

  try {
    console.log('🧪 Starting token refresh test...');

    // 1. Check current tokens
    const currentAccessToken = getauthToken();
    const currentRefreshToken = getRefreshToken();
    
    results.hasAccessToken = !!currentAccessToken;
    results.hasRefreshToken = !!currentRefreshToken;
    
    console.log('📋 Current tokens:', {
      hasAccessToken: results.hasAccessToken,
      hasRefreshToken: results.hasRefreshToken,
    });

    if (!currentRefreshToken) {
      errors.push('No refresh token available');
      return { success: false, results, errors };
    }

    // 2. Check if current access token is valid
    if (currentAccessToken) {
      results.currentTokenValid = isCurrentTokenValid();
      results.currentTokenExpired = isTokenExpiredClient(currentAccessToken);
      results.tokenInfo = getTokenInfo(currentAccessToken);
      
      console.log('🔍 Current token status:', {
        valid: results.currentTokenValid,
        expired: results.currentTokenExpired,
        info: results.tokenInfo,
      });
    }

    // 3. Test server-side token refresh
    console.log('🔄 Testing server-side refresh...');
    const serverRefreshResult = await refreshAccessToken(currentRefreshToken);
    
    results.serverRefreshSuccess = serverRefreshResult.success;
    results.serverRefreshError = serverRefreshResult.error;
    
    if (!serverRefreshResult.success) {
      errors.push(`Server refresh failed: ${serverRefreshResult.error}`);
    } else {
      results.newTokenGenerated = !!serverRefreshResult.data?.accessToken;
      console.log('✅ Server refresh successful');
    }

    // 4. Test client-side token manager
    console.log('🔄 Testing client-side token manager...');
    try {
      const validToken = await getValidToken();
      results.clientRefreshSuccess = !!validToken;
      
      if (validToken) {
        // Validate the new token
        const validation = await validateAccessToken(validToken);
        results.newTokenValid = validation.valid;
        results.newTokenPayload = validation.payload;
        
        console.log('✅ Client refresh successful');
      } else {
        errors.push('Client refresh returned null token');
      }
    } catch (error: any) {
      errors.push(`Client refresh failed: ${error.message}`);
      results.clientRefreshSuccess = false;
    }

    // 5. Test force refresh
    console.log('🔄 Testing force refresh...');
    try {
      const forceRefreshedToken = await forceRefreshToken();
      results.forceRefreshSuccess = !!forceRefreshedToken;
      
      if (forceRefreshedToken) {
        console.log('✅ Force refresh successful');
      } else {
        errors.push('Force refresh returned null token');
      }
    } catch (error: any) {
      errors.push(`Force refresh failed: ${error.message}`);
      results.forceRefreshSuccess = false;
    }

    const success = errors.length === 0;
    console.log(success ? '✅ All token refresh tests passed' : '❌ Some token refresh tests failed');
    
    return { success, results, errors };

  } catch (error: any) {
    console.error('❌ Token refresh test failed:', error);
    errors.push(`Test execution failed: ${error.message}`);
    return { success: false, results, errors };
  }
}

/**
 * Test token expiry scenarios
 */
export async function testTokenExpiry(): Promise<{
  success: boolean;
  results: Record<string, any>;
}> {
  const results: Record<string, any> = {};

  try {
    const currentToken = getauthToken();
    
    if (!currentToken) {
      results.error = 'No access token available';
      return { success: false, results };
    }

    // Decode token to check expiry
    const tokenParts = currentToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      results.tokenExpiry = new Date(expirationTime).toISOString();
      results.currentTime = new Date(currentTime).toISOString();
      results.timeUntilExpiryMinutes = Math.round(timeUntilExpiry / (1000 * 60));
      results.isExpired = timeUntilExpiry <= 0;
      results.willExpireSoon = timeUntilExpiry <= (5 * 60 * 1000); // 5 minutes
      
      console.log('⏰ Token expiry analysis:', results);
    }

    return { success: true, results };
  } catch (error: any) {
    results.error = error.message;
    return { success: false, results };
  }
}

/**
 * Debug authentication state
 */
export function debugAuthState(): void {
  console.log('🔍 Authentication Debug State:');
  console.log('- Access Token:', !!getauthToken());
  console.log('- Refresh Token:', !!getRefreshToken());
  console.log('- Token Valid:', isCurrentTokenValid());
  
  const token = getauthToken();
  if (token) {
    const tokenInfo = getTokenInfo(token);
    console.log('- Token Info:', {
      valid: tokenInfo.valid,
      expired: tokenInfo.expired,
      expiringSoon: tokenInfo.expiringSoon,
      expiryTime: tokenInfo.expiryTime,
      timeUntilExpiry: tokenInfo.timeUntilExpiry,
      payload: {
        id: tokenInfo.payload?.id,
        email: tokenInfo.payload?.email,
        userRole: tokenInfo.payload?.userRole,
      },
    });
  }
}