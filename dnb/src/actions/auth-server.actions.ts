'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateOtpTemplate, generatePasswordResetSuccessTemplate } from '@/utils/emailTemplate';
import { sendEmailWithRetry } from '@/services/email.service';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  businessName: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Helper functions
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateTokens(payload: any) {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: payload.id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// Server Actions
export async function loginAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      businessName: formData.get('businessName') as string,
    };

    const validation = loginSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map(i => i.message).join(', '),
      };
    }

    const { email, password, businessName } = validation.data;

    // Find user
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        first_name: true,
        last_name: true,
        roleId: true,
        businessName: true,
      }
    });

    // Create user if doesn't exist (for new users)
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          roleId: 6, // default guest role
          businessName: businessName || undefined,
        },
        select: {
          id: true,
          email: true,
          password: true,
          first_name: true,
          last_name: true,
          roleId: true,
          businessName: true,
        }
      });
    } else {
      // Validate password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }
    }

    // Build token payload based on role
    let userRole = 'guest';
    if (user.roleId === 1) userRole = 'super_admin';
    else if (user.roleId === 2) userRole = 'business_owner';
    else if (user.roleId === 3) userRole = 'buyer';

    let tokenPayload: any = {
      id: user.id,
      email: user.email,
      userRole,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      businessName: user.businessName || '',
    };

    // Handle business owner
    if (user.roleId === 2) {
      const businessOwner = await prisma.businessOwner.findUnique({
        where: { userId: user.id }
      });

      if (businessOwner) {
        if (businessOwner.is_deleted || businessOwner.status !== 'active') {
          return { success: false, error: 'Business owner account is inactive' };
        }

        tokenPayload.businessOwnerId = businessOwner.id;
        tokenPayload.businessName = businessOwner.businessName;
        tokenPayload.paymentId = businessOwner.paymentId;
      }
    }

    // Handle buyer
    if (user.roleId === 3) {
      const buyer = await prisma.buyer.findFirst({
        where: { email: user.email }
      });

      if (buyer) {
        if (buyer.is_deleted || buyer.status !== 'active') {
          return { success: false, error: 'Buyer account is inactive' };
        }

        tokenPayload = {
          id: buyer.id,
          email: user.email,
          userRole: 'buyer',
          name: buyer.contactName,
          businessName: buyer.buyersCompanyName,
          ownerId: buyer.businessOwnerId,
        };
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set('authToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    });

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return {
      success: true,
      data: {
        authToken: accessToken,
        refreshToken,
        tokenPayload,
      },
      redirectTo: '/dashboard',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Login failed. Please try again.',
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('authToken');
  cookieStore.delete('refreshToken');
  redirect('/login');
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
    };

    const validation = forgotPasswordSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map(i => i.message).join(', '),
      };
    }

    const { email } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, first_name: true, last_name: true }
    });

    // Always return success for security
    if (!user) {
      return { success: true, message: 'If the email exists, an OTP has been sent.' };
    }

    // Generate and store OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.passwordResetOtp.create({
      data: {
        email,
        otp: hashedOtp,
        expiresAt,
        used: false,
      },
    });

    // Send email
    const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : undefined;
    const emailHtml = generateOtpTemplate(otp, userName);

    const emailResult = await sendEmailWithRetry({
      to: email,
      subject: '🔑 Password Reset OTP',
      html: emailHtml,
    });

    if (!emailResult.success) {
      return { success: false, error: 'Failed to send reset email. Please try again.' };
    }

    return { success: true, message: 'If the email exists, an OTP has been sent.' };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { success: false, error: 'Failed to process request. Please try again.' };
  }
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      otp: formData.get('otp') as string,
      password: formData.get('password') as string,
    };

    const validation = resetPasswordSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map(i => i.message).join(', '),
      };
    }

    const { email, otp, password } = validation.data;

    // Find latest unused OTP
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: { email, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return { success: false, error: 'Invalid or expired OTP' };
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    // Verify OTP
    const isValidOtp = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValidOtp) {
      return { success: false, error: 'Invalid OTP' };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, first_name: true, last_name: true }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Update password and mark OTP as used
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
    ]);

    // Send confirmation email
    const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : undefined;
    const loginUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
    const emailHtml = generatePasswordResetSuccessTemplate(userName, loginUrl);

    await sendEmailWithRetry({
      to: email,
      subject: '✅ Password Reset Successful',
      html: emailHtml,
    });

    return {
      success: true,
      message: 'Password reset successful. You can now log in.',
      redirectTo: '/login',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Failed to reset password. Please try again.' };
  }
}

export async function refreshTokenAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      refreshToken: formData.get('refreshToken') as string,
    };

    const validation = refreshTokenSchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: 'Invalid refresh token' };
    }

    const { refreshToken } = validation.data;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;
    
    if (!decoded || !decoded.id) {
      return { success: false, error: 'Invalid refresh token' };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        roleId: true,
        businessName: true,
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Build token payload
    let userRole = 'guest';
    if (user.roleId === 1) userRole = 'super_admin';
    else if (user.roleId === 2) userRole = 'business_owner';
    else if (user.roleId === 3) userRole = 'buyer';

    let tokenPayload: any = {
      id: user.id,
      email: user.email,
      userRole,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      businessName: user.businessName || '',
    };

    // Handle business owner
    if (user.roleId === 2) {
      const businessOwner = await prisma.businessOwner.findUnique({
        where: { userId: user.id }
      });

      if (businessOwner) {
        tokenPayload.businessOwnerId = businessOwner.id;
        tokenPayload.businessName = businessOwner.businessName;
        tokenPayload.paymentId = businessOwner.paymentId;
      }
    }

    // Handle buyer
    if (user.roleId === 3) {
      const buyer = await prisma.buyer.findFirst({
        where: { email: user.email }
      });

      if (buyer) {
        tokenPayload = {
          id: buyer.id,
          email: user.email,
          userRole: 'buyer',
          name: buyer.contactName,
          businessName: buyer.buyersCompanyName,
          ownerId: buyer.businessOwnerId,
        };
      }
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

    // Update cookies
    const cookieStore = await cookies();
    cookieStore.set('authToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    });

    cookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: tokenPayload.id,
          email: tokenPayload.email,
          userRole: tokenPayload.userRole,
          businessName: tokenPayload.businessName,
          name: tokenPayload.name,
        }
      }
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    return { success: false, error: 'Invalid or expired refresh token' };
  }
}