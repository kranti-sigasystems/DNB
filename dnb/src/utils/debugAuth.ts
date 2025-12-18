/**
 * Debug utility to check authentication state
 */

export function debugAuthState() {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Check sessionStorage
  const sessionItems = {
    authToken: sessionStorage.getItem('authToken'),
    refreshToken: sessionStorage.getItem('refreshToken'),
    user: sessionStorage.getItem('user'),
    dnb_auth_session: sessionStorage.getItem('dnb_auth_session'),
  };
  
  // Check localStorage
  const localItems = {
    authToken: localStorage.getItem('authToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: localStorage.getItem('user'),
    dnb_auth_session: localStorage.getItem('dnb_auth_session'),
  };
  
  // Try to parse user data
  const sessionUser = sessionItems.user ? JSON.parse(sessionItems.user) : null;
  const localUser = localItems.user ? JSON.parse(localItems.user) : null;
  const sessionAuth = sessionItems.dnb_auth_session ? JSON.parse(sessionItems.dnb_auth_session) : null;
  const localAuth = localItems.dnb_auth_session ? JSON.parse(localItems.dnb_auth_session) : null;
  
  // Check token expiry
  const token = sessionItems.authToken || localItems.authToken;
  if (token) {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const isExpired = currentTime > expirationTime;
        const timeUntilExpiry = expirationTime - currentTime;
      }
    } catch (error) {
      console.error('❌ Error parsing token:', error);
    }
  }
  
  return {
    sessionItems,
    localItems,
    sessionUser,
    localUser,
    sessionAuth,
    localAuth,
    hasToken: !!token,
    token
  };
}

// Auto-run debug on import in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    debugAuthState();
  }, 1000);
}