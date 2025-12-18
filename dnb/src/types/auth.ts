// types/index.ts
export interface LoginFormData {
  businessName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  authToken: string;
  refreshToken: string;
  tokenPayload: TokenPayload;
}

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  activeNegotiationId?: string;
  [key: string]: any;
}

export interface AuthState {
  authToken: string | null;
  refreshToken: string | null;
  user: TokenPayload | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials extends LoginFormData {
  remember?: boolean;
}

export interface InputFieldProps {
  label: string;
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: {
    message?: string;
  };
  field?: any;
}

export interface PasswordFieldProps {
  field: any;
  label: string;
  required?: boolean;
  error?: {
    message?: string;
  };
}

export type ValidationRule = (value: string) => string | boolean;

export interface ValidationRules {
  email: ValidationRule;
  password: ValidationRule;
  required: (fieldName: string) => ValidationRule;
  minLength: (fieldName: string, length: number) => ValidationRule;
  maxLength: (fieldName: string, length: number) => ValidationRule;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}