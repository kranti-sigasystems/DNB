'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Download,
  Shield,
  Check,
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SessionUser {
  name?: string;
  phone?: string;
  businessName?: string;
  accountType?: string;
  paymentId?: string;
}

interface BackendUser {
  first_name?: string;
  last_name?: string;
  email?: string;
  created_at?: string;
}

interface Plan {
  name: string;
  billingCycle: string;
  stripeProductId?: string;
  maxLocations?: number;
  maxProducts?: number;
  maxOffers?: number;
  maxBuyers?: number;
  maxUsers?: number;
  features?: string[] | string;
}

interface Payment {
  status?: string;
  amount?: string | number;
  paymentMethod?: string;
  createdAt?: string;
  Plan?: Plan & { maxUsers?: number; features?: string[] | string };
  User?: BackendUser;
}

const Profile: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);

  useEffect(() => {
    const initializeProfile = async (): Promise<void> => {
      try {
        const userString = sessionStorage.getItem('user');
        setBackendUser(userString ? JSON.parse(userString) : null);
        if (!userString) {
          setError('No user data found. Please log in again.');
          return;
        }

        const storedUser: SessionUser = JSON.parse(userString);
        setUser(storedUser);

        if (storedUser.paymentId && process.env.VITE_API_URL) {
          const res = await fetch(`${process.env.VITE_API_URL}/payments/${storedUser.paymentId}`);
          if (res.ok) {
            const response = await res.json();
            setPaymentData(response?.data ?? null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  const payment = paymentData;
  const plan = payment?.Plan;

  const fullName = backendUser
    ? `${backendUser.first_name ?? ''} ${backendUser.last_name ?? ''}`.trim()
    : (user.name ?? 'User');

  const avatarInitials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const memberSince = backendUser?.created_at
    ? new Date(backendUser.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Account</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your account information</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg mb-8">
          <div className="px-6 sm:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-semibold">
                  {avatarInitials}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
                  <p className="text-gray-500 text-sm mt-1">{backendUser?.email}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Active Account</span>
                  </div>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <Tabs defaultValue="profile" className="w-full">
            <div className="border-b border-gray-200 px-6 sm:px-8">
              <TabsList className="bg-transparent border-b-0 w-full justify-start gap-8 h-auto p-0">
                <TabsTrigger
                  value="profile"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-600 hover:text-gray-900 rounded-none px-0 py-4 font-medium text-sm"
                >
                  Personal Information
                </TabsTrigger>
                <TabsTrigger
                  value="subscription"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-600 hover:text-gray-900 rounded-none px-0 py-4 font-medium text-sm"
                >
                  Subscription & Plan
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="p-6 sm:p-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <p className="text-sm text-gray-500 mb-2">Email Address</p>
                      <p className="text-gray-900 font-medium">{backendUser?.email || 'Not provided'}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <p className="text-sm text-gray-500 mb-2">Phone Number</p>
                      <p className="text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Information</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <p className="text-sm text-gray-500 mb-2">Business Name</p>
                      <p className="text-gray-900 font-medium">{user.businessName || 'Not provided'}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <p className="text-sm text-gray-500 mb-2">Account Type</p>
                      <p className="text-gray-900 font-medium">{user.accountType || 'Standard'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Details</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <p className="text-sm text-gray-500 mb-2">Member Since</p>
                      <p className="text-gray-900 font-medium">{memberSince}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <p className="text-sm text-gray-500 mb-2">Account Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-gray-900 font-medium">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="p-6 sm:p-8">
              {plan ? (
                <div className="space-y-8">
                  <div className="border border-blue-200 rounded-lg p-8 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <h3 className="text-3xl font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-gray-600 text-sm mt-2">Your current subscription plan</p>
                      </div>
                      <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Active
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">{payment?.amount}</span>
                      <span className="text-gray-600 text-lg">per {plan.billingCycle}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Plan Features</h3>
                    <div className="border border-gray-200 rounded-lg p-6 bg-white">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {payment?.Plan?.features ? (
                          (() => {
                            const features = typeof payment.Plan.features === 'string' 
                              ? JSON.parse(payment.Plan.features) 
                              : payment.Plan.features;
                            return Array.isArray(features) && features.length > 0 ? (
                              features.map((feature: string, index: number) => (
                                <div key={index} className="flex items-start gap-3">
                                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700">{feature}</span>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 text-gray-500">No features available</div>
                            );
                          })()
                        ) : (
                          <div className="col-span-2 text-gray-500">Features information not available</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Resource Limits</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-500 mb-3">Maximum Products</p>
                        <p className="text-3xl font-bold text-gray-900">{plan.maxProducts || 'Unlimited'}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-500 mb-3">Maximum Offers</p>
                        <p className="text-3xl font-bold text-gray-900">{plan.maxOffers || 'Unlimited'}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-500 mb-3">Maximum Buyers</p>
                        <p className="text-3xl font-bold text-gray-900">{plan.maxBuyers || 'Unlimited'}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-500 mb-3">Maximum Users</p>
                        <p className="text-3xl font-bold text-gray-900">{payment?.Plan?.maxUsers || 'Unlimited'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Information</h3>
                    <div className="border border-gray-200 rounded-lg divide-y bg-white">
                      <div className="px-6 py-4 flex justify-between items-center">
                        <span className="text-gray-600">Payment Method</span>
                        <span className="text-gray-900 font-medium">{payment?.paymentMethod || 'Stripe'}</span>
                      </div>
                      <div className="px-6 py-4 flex justify-between items-center">
                        <span className="text-gray-600">Billing Cycle</span>
                        <span className="text-gray-900 font-medium capitalize">{plan.billingCycle}</span>
                      </div>
                      <div className="px-6 py-4 flex justify-between items-center">
                        <span className="text-gray-600">Subscription Status</span>
                        <span className="text-gray-900 font-medium">Active</span>
                      </div>
                      <div className="px-6 py-4 flex justify-between items-center">
                        <span className="text-gray-600">Auto-Renewal</span>
                        <span className="text-gray-900 font-medium">Enabled</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-1">
                      <Download className="w-4 h-4" />
                      Download Invoice
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                      <Shield className="w-4 h-4" />
                      Manage Subscription
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
                  <p className="text-gray-500 mb-6">You do not have an active subscription at this time.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    View Available Plans
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
