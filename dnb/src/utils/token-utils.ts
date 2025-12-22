/**
 * Client-side Token Utilities
 * Helper functions for token operations that don't require server actions
 */

interface TokenPayload {
  id: string;
  email: string;
  userRole: string;
  businessOwnerId?: string;
  businessName?: string;
  name?: string;
  ownerId?: string;
  activeNegotiationId?: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Check if a token is expired (client-side)
 * @param token JWT token string
 * @returns boolean indicating if token is expired
 */
export function isTokenExpiredClient(token: string): boolean {
  try {
    const decoded = decodeTokenClient(token);
    
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiry time in seconds (client-side)
 * @param token JWT token string
 * @returns expiry timestamp or null
 */
export function getTokenExpiryTimeClient(token: string): number | null {
  try {
    const decoded = decodeTokenClient(token);
    return decoded?.exp || null;
  } catch (error) {
    return null;
  }
}

/**
 * Decode a JWT token (client-side)
 * @param token JWT token string
 * @returns decoded payload or null
 */
export function decodeTokenClient(token: string): TokenPayload | null {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token will expire soon (client-side)
 * @param token JWT token string
 * @param bufferMinutes Minutes before expiry to consider "expiring soon"
 * @returns boolean indicating if token will expire soon
 */
export function isTokenExpiringSoonClient(token: string, bufferMinutes: number = 5): boolean {
  try {
    const decoded = decodeTokenClient(token);
    
    if (!decoded || !decoded.exp) {
      return true;
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds
    
    return (expirationTime - currentTime) <= bufferTime;
  } catch (error) {
    return true;
  }
}

/**
 * Get time until token expires (client-side)
 * @param token JWT token string
 * @returns milliseconds until expiry, or 0 if expired/invalid
 */
export function getTimeUntilExpiryClient(token: string): number {
  try {
    const decoded = decodeTokenClient(token);
    
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    return Math.max(0, timeUntilExpiry);
  } catch (error) {
    return 0;
  }
}

/**
 * Format time until expiry in human-readable format
 * @param token JWT token string
 * @returns formatted string like "5 minutes" or "expired"
 */
export function formatTimeUntilExpiry(token: string): string {
  const timeUntilExpiry = getTimeUntilExpiryClient(token);
  
  if (timeUntilExpiry <= 0) {
    return 'expired';
  }
  
  const minutes = Math.floor(timeUntilExpiry / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'less than 1 minute';
  }
}

/**
 * Get token information for debugging
 * @param token JWT token string
 * @returns object with token information
 */
export function getTokenInfo(token: string): {
  valid: boolean;
  expired: boolean;
  expiringSoon: boolean;
  payload: TokenPayload | null;
  expiryTime: string | null;
  timeUntilExpiry: string;
} {
  const payload = decodeTokenClient(token);
  const expired = isTokenExpiredClient(token);
  const expiringSoon = isTokenExpiringSoonClient(token);
  
  let expiryTime: string | null = null;
  if (payload?.exp) {
    expiryTime = new Date(payload.exp * 1000).toISOString();
  }
  
  return {
    valid: !!payload && !expired,
    expired,
    expiringSoon,
    payload,
    expiryTime,
    timeUntilExpiry: formatTimeUntilExpiry(token),
  };
}