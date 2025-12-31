'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OtpInput } from '@/components/ui/otp-input';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' },
  });

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setEmail(data.email);
        setStep('reset');
        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to send reset email',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Network error. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: data.otp,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep('success');
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to reset password',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Network error. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "OTP Resent",
          description: "A new verification code has been sent to your email.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to resend OTP',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Network error. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              {step === 'email' && <Mail className="w-6 h-6 text-blue-600" />}
              {step === 'reset' && <Shield className="w-6 h-6 text-blue-600" />}
              {step === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {step === 'email' && 'Forgot Password'}
                {step === 'reset' && 'Reset Password'}
                {step === 'success' && 'Password Reset'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {step === 'email' && 'Enter your email to receive a verification code'}
                {step === 'reset' && 'Enter the code sent to your email and your new password'}
                {step === 'success' && 'Your password has been successfully reset'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'email' && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Verification Code'}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'reset' && (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-6">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      We've sent a 6-digit code to <strong>{email}</strong>
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={resetForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <OtpInput
                            length={6}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Enter your new password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Confirm your new password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                    >
                      Resend Code
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Password Reset Complete</h3>
                  <p className="text-gray-600 mt-2">
                    You can now log in with your new password.
                  </p>
                </div>
                <Button onClick={handleBackToLogin} className="w-full">
                  Back to Login
                </Button>
              </div>
            )}

            {step !== 'success' && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={handleBackToLogin}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}