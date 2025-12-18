// This utility works in both client and server environments
// Server actions will pass tokens explicitly, client code can use stored tokens

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://digital-negotiation-book-server.vercel.app/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  message?: string;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<any> | null = null;

  private getAuthHeaders(token?: string): HeadersInit {
    // In server environment, token must be passed explicitly
    // In client environment, we can fall back to stored token
    let authToken = token;
    
    if (!authToken && typeof window !== 'undefined') {
      // Only try to get stored token in browser environment
      try {
        const { getAccessToken } = require('@/utils/auth');
        authToken = getAccessToken();
      } catch (error) {
        console.warn('Could not get stored token:', error);
      }
    }
    
    return {
      'Authorization': authToken ? `Bearer ${authToken}` : '',
      'Content-Type': 'application/json',
    };
  }

  private async refreshToken(): Promise<string | null> {
    // Token refresh only works in client environment
    if (typeof window === 'undefined') {
      console.warn('Token refresh not available in server environment');
      return null;
    }

    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    try {
      const { getRefreshToken, getStoredSession, persistSession, clearSession } = require('@/utils/auth');
      
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('Missing refresh token');
      }

      this.refreshPromise = fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('Refresh token failed');
        }
        
        const result = await response.json();
        const refreshedData = result?.data ?? {};
        const newAccessToken = refreshedData?.accessToken;
        const newRefreshToken = refreshedData?.refreshToken;

        const existingSession = getStoredSession();
        if (existingSession && newAccessToken) {
          const nextSession = {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken ?? existingSession.refreshToken,
            user: existingSession.user,
            remember: existingSession.remember,
          };
          persistSession(nextSession, { remember: existingSession.remember });
          return newAccessToken;
        }
        
        throw new Error('Invalid refresh response');
      });

      return await this.refreshPromise;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      try {
        const { clearSession } = require('@/utils/auth');
        clearSession();
      } catch (e) {
        console.warn('Could not clear session:', e);
      }
      
      // Redirect to login if needed
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async request<T = any>(
    url: string,
    options: RequestInit = {},
    authToken?: string
  ): Promise<ApiResponse<T>> {
    try {
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      
      const headers = {
        ...this.getAuthHeaders(authToken),
        ...options.headers,
      };

      const response = await fetch(fullUrl, {
        ...options,
        headers,
        cache: 'no-store',
      });

      // Handle token expiration
      if (response.status === 403) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        if (errorData.message?.includes('expired') || errorData.message?.includes('Invalid or expired access token')) {
          
          const newToken = await this.refreshToken();
          if (newToken) {
            return this.request(url, options, newToken);
          }
        }
        
        return {
          success: false,
          error: errorData.message || 'Authentication failed',
          statusCode: response.status,
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        console.error('❌ API Error:', errorData);
        return {
          success: false,
          error: errorData.message || `HTTP error! status: ${response.status}`,
          statusCode: response.status,
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('💥 API Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T = any>(url: string, authToken?: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' }, authToken);
  }

  async post<T = any>(url: string, data?: any, authToken?: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, authToken);
  }

  async patch<T = any>(url: string, data?: any, authToken?: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, authToken);
  }

  async delete<T = any>(url: string, authToken?: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' }, authToken);
  }
}

export const apiClient = new ApiClient();
export default apiClient;