export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  password: string;
}

export interface LoginFormData {
  businessName?: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    userRole: string;
    businessName?: string;
    name?: string;
  };
}

export interface PasswordResetOtp {
  id: string;
  email: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  title: string;
  subTitle: string;
  body: string;
  footer?: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  from?: string;
}