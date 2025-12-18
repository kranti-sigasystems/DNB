import axios, { AxiosResponse } from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredSession,
  persistSession,
} from "@/utils/auth";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
});

let isRefreshing = false;
let refreshPromise: Promise<AxiosResponse> | null = null;

// Attach Authorization header
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || originalRequest._retry) {
      return Promise.reject(error);
    }
    if (
      error.response.status === 403 &&
      error.response.data?.message === "Invalid or expired access token"
    ) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;

          const refreshToken = getRefreshToken();

          if (!refreshToken) throw new Error("Missing refresh token");

          refreshPromise = apiClient.post("/auth/refresh-token", {
            refreshToken,
          });
        }

        const refreshResponse = await refreshPromise;

        const refreshedData = refreshResponse?.data?.data ?? {};
        const newAccessToken = refreshedData?.accessToken;
        const newRefreshToken = refreshedData?.refreshToken;
        const existingSession = getStoredSession();

        if (existingSession) {
          const nextSession = {
            accessToken: newAccessToken ?? existingSession.accessToken,
            refreshToken: newRefreshToken ?? existingSession.refreshToken,
            user: existingSession.user,
            remember: existingSession.remember,
          };
          persistSession(nextSession, { remember: existingSession.remember });
        }

        if (newAccessToken) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          apiClient.defaults.headers["Authorization"] = `Bearer ${newAccessToken}`;
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
