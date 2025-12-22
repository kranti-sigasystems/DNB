'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPaymentStatus } from '@/actions/payment';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  console.log('session id log from success page.....', sessionId);
  useEffect(() => {
    console.log('Log session id...', sessionId);
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const checkPayment = async () => {
      try {
        setLoading(true);
        console.log('coming incheckPayment......');
        const result = await getPaymentStatus(sessionId);
        console.log('Payment verification result:', result);
        if (result.success) {
          setPaymentData(result);
          // Clear checkout data from session storage
          sessionStorage.removeItem('selectedPlanData');
          sessionStorage.removeItem('checkoutFormData');
          sessionStorage.removeItem('pendingBusinessData');
        } else {
          setError(result.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-blue-700">Verifying Payment</h2>
              <p className="text-gray-600">Please wait while we confirm your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-blue-600">Paymednt Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/plans')} variant="outline">
                Back to Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { payment, session } = paymentData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <p className="text-gray-600">Your subscription has been activated</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Plan:</span>
                <p className="font-medium">{payment.plan.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <p className="font-medium">
                  {payment.currency} {(payment.amount / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Billing Cycle:</span>
                <p className="font-medium capitalize">{payment.billingCycle.toLowerCase()}</p>
              </div>
              <div>
                <span className="text-gray-500">Payment ID:</span>
                <p className="font-medium text-xs">{payment.id}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-800">What's Next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your account has been activated</li>
              <li>• You can now access all {payment.plan.name} plan features</li>
              <li>• Check your email for the receipt and welcome information</li>
              <li>• Visit your dashboard to get started</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard
            </Button>
            <Button onClick={() => router.push('/profile')} variant="outline" className="flex-1">
              View Profile
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Session ID: {sessionId}</p>
            <p>Need help? Contact our support team</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
