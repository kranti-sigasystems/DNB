// utils/apiClient.ts
import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredSession,
  persistSession,
} from "@/utils/auth";
import { 
  CustomAxiosRequestConfig, 
  RefreshTokenResponse,
  Session 
} from "@/types/api";
console.log("process.env.VITE_API_URL",process.env.NEXT_PUBLIC_API_URL)
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshPromise: Promise<AxiosResponse<RefreshTokenResponse>> | null = null;

// Attach Authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!error.response || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 403 &&
      (error.response?.data as any)?.message === "Invalid or expired access token"
    ) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;

          const refreshToken = getRefreshToken();

          if (!refreshToken) {
            throw new Error("Missing refresh token");
          }

          refreshPromise = apiClient.post<RefreshTokenResponse>("/auth/refresh-token", {
            refreshToken,
          });
        }

        const refreshResponse = await refreshPromise!;

        const refreshedData = refreshResponse?.data?.data ?? {};
        const newAccessToken = refreshedData?.accessToken;
        const newRefreshToken = refreshedData?.refreshToken;
        const existingSession = getStoredSession();

        if (existingSession) {
          const nextSession: Session = {
            accessToken: newAccessToken ?? existingSession.accessToken,
            refreshToken: newRefreshToken ?? existingSession.refreshToken,
            user: existingSession.user,
            remember: existingSession.remember,
          };
          persistSession(nextSession, { remember: existingSession.remember });
        }

        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          if (apiClient.defaults.headers) {
            apiClient.defaults.headers["Authorization"] = `Bearer ${newAccessToken}`;
          }
        }

        return apiClient(originalRequest);
      } catch (err) {
        console.error("Refresh failed", err);
        clearSession();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;