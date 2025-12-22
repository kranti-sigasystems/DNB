// This service is now deprecated - use server actions directly
// Keeping for backward compatibility only

import { AxiosError } from "axios";

import apiClient from "@/actions/apiClient";


export interface LoginCredentials {
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  businessName?: string;
  registrationNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
}

export interface LoginResponse {
  statusCode: number;
  success: boolean;
  data: {
    accessToken: string;
    refreshToken?: string;
    tokenPayload: any;
    message?: string;
  };
}

// Use registerAndLoginUser server action directly instead
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  throw new Error("Use registerAndLoginUser server action directly instead of this service");
};

export const register = async (userData: any) => {
  try {
    const response = await apiClient.post("/auth/register", userData, {
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    console.error("Register Error:", err);
    const error = err as AxiosError<{ message: string }>;
    throw error.response?.data?.message || "Failed to register";
  }
};

export const logout = async () => {
  try {
    const response = await apiClient.post("/auth/logout", {}, {
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    console.error("Logout Error:", err);
    const error = err as AxiosError<{ message: string }>;
    throw error.response?.data?.message || "Failed to logout";
  }
};