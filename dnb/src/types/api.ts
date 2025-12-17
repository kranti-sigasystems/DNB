// types/api.ts
import { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
}

export interface LoginCredentials {
  businessName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenPayload: {
    id: string;
    name: string;
    email: string;
    role: string;
    activeNegotiationId?: string;
    [key: string]: any;
  };
  data?: {
    accessToken?: string;
    refreshToken?: string;
    tokenPayload?: any;
    remember?: boolean;
  };
  remember?: boolean;
}

export interface RefreshTokenResponse {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    [key: string]: any;
  };
}

export interface ApiClient extends AxiosInstance {
  interceptors: {
    request: any;
    response: any;
  };
}

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface Session {
  accessToken: string | null;
  refreshToken: string | null;
  user: any;
  remember: boolean;
  updatedAt?: number;
}