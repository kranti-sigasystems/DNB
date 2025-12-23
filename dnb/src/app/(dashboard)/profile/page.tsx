'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  BriefcaseBusiness,
  LocationEdit,
  BringToFront,
  CombineIcon,
  PercentSquareIcon,
  ImportIcon,
  ArrowLeft,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

/* ===================== TYPES ===================== */

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
}

interface Payment {
  status?: string;
  amount?: string | number;
  paymentMethod?: string;
  createdAt?: string;
  Plan?: Plan;
  User?: BackendUser;
}

interface InfoFieldProps {
  icon: ReactNode;
  label: string;
  value?: string | number | null;
}

/* ===================== COMPONENT ===================== */

const Profile: React.FC = () => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);

  useEffect(() => {
    const initializeProfile = async (): Promise<void> => {
      try {
        const userString = sessionStorage.getItem('user');
        console.log('userString logs.....', userString);
        setBackendUser(userString ? JSON.parse(userString) : null);
        if (!userString) {
          setError('No user data found. Please log in again.');
          return;
        }

        const storedUser: SessionUser = JSON.parse(userString);
        console.log('storedUser.....', storedUser);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 font-medium">Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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

  return (
    <div className="min-h-screen px-[24.5px] pb-24 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="sticky top-17 bg-white border-b shadow-sm rounded-lg z-20">
        <div className="px-6 py-4 flex items-center gap-3 dark:text-black">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold dark:text-black">Account Overview</h1>
            <p className="text-sm text-slate-600">Manage your profile and subscription details</p>
          </div>
        </div>
      </header>

      <main className="mx-auto py-4">
        <div className="bg-white rounded-2xl border shadow-lg p-6">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>

            {/* PROFILE */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-semibold">
                        {avatarInitials}
                      </div>
                      <div>
                        <CardTitle>{fullName}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {user.accountType ?? 'Standard'}
                        </Badge>
                      </div>
                    </div>

                    {payment?.status && (
                      <Badge className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {payment.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <InfoField
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    value={backendUser?.email}
                  />
                  <InfoField
                    icon={<Phone className="w-4 h-4" />}
                    label="Phone Number"
                    value={user.phone}
                  />
                  <InfoField
                    icon={<BriefcaseBusiness className="w-4 h-4" />}
                    label="Business Name"
                    value={user.businessName}
                  />
                  <InfoField
                    icon={<Calendar className="w-4 h-4" />}
                    label="Member Since"
                    value={backendUser?.created_at}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* SUBSCRIPTION */}
            <TabsContent value="subscription">
              {plan ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="text-green-600 text-lg">
                      {payment?.amount} / {plan.billingCycle}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <InfoField
                      icon={<CreditCard className="w-4 h-4" />}
                      label="Payment Method"
                      value={payment?.paymentMethod}
                    />
                    <InfoField
                      icon={<ImportIcon className="w-4 h-4" />}
                      label="Stripe Product ID"
                      value={plan.stripeProductId}
                    />
                    <InfoField
                      icon={<LocationEdit className="w-4 h-4" />}
                      label="Max Locations"
                      value={plan.maxLocations}
                    />
                    <InfoField
                      icon={<BringToFront className="w-4 h-4" />}
                      label="Max Products"
                      value={plan.maxProducts}
                    />
                    <InfoField
                      icon={<CombineIcon className="w-4 h-4" />}
                      label="Max Offers"
                      value={plan.maxOffers}
                    />
                    <InfoField
                      icon={<PercentSquareIcon className="w-4 h-4" />}
                      label="Max Buyers"
                      value={plan.maxBuyers}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-white">
                      You don't have an active subscription yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

/* ===================== INFO FIELD ===================== */

const InfoField: React.FC<InfoFieldProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-sm text-slate-600 dark:text-white">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white">
        {value ?? 'Not provided'}
      </p>
    </div>
  </div>
);

export default Profile;
