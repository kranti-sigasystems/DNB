'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPaymentStatus } from '@/actions/payment';
import { CheckCircle, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided. Please try again or contact support.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const checkPayment = async () => {
      if (!isMounted) return;

      try {
        console.log(`Verifying payment for session: ${sessionId} (attempt ${retryCount + 1})`);
        
        const result = await getPaymentStatus(sessionId);
        console.log('Payment verification result:', result);
        
        if (!isMounted) return;

        if (result.success && result.payment) {
          setPaymentData(result);
          setLoading(false);
          // Clear checkout data from session storage
          sessionStorage.removeItem('selectedPlanData');
          sessionStorage.removeItem('checkoutFormData');
          sessionStorage.removeItem('pendingBusinessData');
        } else {
          // If payment not found or still pending, retry up to 10 times
          if (retryCount < 10) {
            setRetryCount(prev => prev + 1);
            // Exponential backoff: 2s, 4s, 6s, 8s, 10s...
            const delay = Math.min(2000 + (retryCount * 2000), 10000);
            retryTimeout = setTimeout(() => {
              if (isMounted) {
                checkPayment();
              }
            }, delay);
          } else {
            setError(result.message || 'Payment verification timed out. Your payment may still be processing. Please check your email for confirmation or contact support.');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        if (!isMounted) return;
        
        if (retryCount < 10) {
          setRetryCount(prev => prev + 1);
          const delay = Math.min(2000 + (retryCount * 2000), 10000);
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              checkPayment();
            }
          }, delay);
        } else {
          setError('Failed to verify payment. Please check your email for confirmation or contact support.');
          setLoading(false);
        }
      }
    };

    // Initial check
    checkPayment();

    // Cleanup function
    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [sessionId, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-blue-700">Verifying Payment</h2>
              <p className="text-gray-600 mb-2">Please wait while we confirm your payment...</p>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500">Attempt {retryCount + 1} of 10</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-red-600">Payment Verification Issue</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={() => router.push('/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
                <Button onClick={() => router.push('/plans')} variant="outline" className="w-full">
                  Back to Plans
                </Button>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm font-medium">Need Help?</p>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  If you completed the payment, check your email for confirmation. 
                  Contact support with session ID: {sessionId?.substring(0, 30)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { payment } = paymentData;

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
                  {payment.currency} {payment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Billing Cycle:</span>
                <p className="font-medium capitalize">{payment.billingCycle}</p>
              </div>
              <div>
                <span className="text-gray-500">Payment ID:</span>
                <p className="font-medium text-xs">{payment.id}</p>
              </div>
              <div>
                <span className="text-gray-500">Customer:</span>
                <p className="font-medium">
                  {payment.user.first_name} {payment.user.last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium text-xs">{payment.user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-800">What's Next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your account has been activated with {payment.plan.name} plan features</li>
              <li>• Check your email for the receipt and welcome information</li>
              <li>• Complete your business profile setup</li>
              <li>• Start creating products and negotiation offers</li>
              <li>• Explore all the features available in your plan</li>
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
              Complete Profile
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Session ID: {sessionId}</p>
            <p>Payment processed securely by Stripe</p>
            <p>Need help? Contact our support team</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}