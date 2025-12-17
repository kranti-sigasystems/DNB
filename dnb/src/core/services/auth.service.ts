import { apiClient } from "@/actions/apiClient";
import { LoginCredentials, LoginResponse } from "@/types/api";

export const login = async (data: LoginCredentials): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const refreshToken = async (refreshToken: string): Promise<any> => {
  const response = await apiClient.post("/auth/refresh-token", { refreshToken });
  return response.data;
};