import { FC } from 'react';
import {
  CheckCircle,
  Mail,
  Building2,
  ArrowRight,
  XCircle,
  Shield,
  Download,
  Clock,
  Receipt,
  FileCheck,
  Printer,
  Sparkles,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PaymentStatus = 'processing' | 'success' | 'error';

export interface OrderData {
  businessName?: string;
  planName?: string;
  billingCycle?: string;
  planPrice?: number;
  cardType?: string;
  cardLast4?: string;
  transactionId?: string;
  email?: string;
  nextBilling?: string;
  invoicePdf?: string;
}

export interface PaymentStatusViewProps {
  status: PaymentStatus;
  orderData: OrderData;
  currentStep: number;
  setupError: string | null;
  handleGoToDashboard: () => void;
  handleReturnToPricing: () => void;
  handlePrintReceipt: () => void;
  formatPrice: (price: number | string) => string;
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export const PaymentStatusView: FC<PaymentStatusViewProps> = ({
  status,
  orderData,
  currentStep,
  setupError,
  handleGoToDashboard,
  handleReturnToPricing,
  handlePrintReceipt,
  formatPrice,
}) => {
  /* =============================== PROCESSING ============================== */

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-7xl">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-white text-xl sm:text-2xl mb-1">Setting Up Your Account</h1>
                  <p className="text-blue-100 text-sm">{orderData.businessName}</p>
                </div>
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-0">
              <div className="lg:col-span-3 p-6 sm:p-10">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Estimated time: 30 seconds</span>
                  </div>
                  <h2 className="text-lg text-gray-800">Account Setup Progress</h2>
                </div>

                {[
                  { step: 1, label: 'Payment Verification', icon: Shield },
                  { step: 2, label: 'Workspace Provisioning', icon: Building2 },
                  { step: 3, label: 'Feature Activation', icon: Sparkles },
                  { step: 4, label: 'Account Credentials', icon: Mail },
                ].map(({ step, label, icon: Icon }) => {
                  const isComplete = currentStep > step;
                  const isActive = currentStep === step;

                  return (
                    <div key={step} className="flex gap-4 mb-6">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isComplete ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="text-white" />
                        ) : isActive ? (
                          <Loader2 className="text-white animate-spin" />
                        ) : (
                          <Icon className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-gray-900">{label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-2 bg-gray-50 p-6 sm:p-10 border-l">
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-base mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Payment Summary
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Plan</p>
                      <p>{orderData.planName}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Billing Cycle</p>
                      <p className="capitalize">{orderData.billingCycle}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-xl">{formatPrice(orderData.planPrice ?? 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================ SUCCESS ================================ */

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl p-10">
          <div className="text-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl text-gray-900">Setup Complete</h1>
            <p className="text-gray-500">Welcome to {orderData.businessName}</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGoToDashboard}
              className="w-full bg-blue-600 text-white py-4 rounded-xl flex justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight />
            </Button>

            <Button
              onClick={handlePrintReceipt}
              className="w-full border py-4 rounded-xl flex justify-center gap-2"
            >
              <Printer />
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================= ERROR ================================= */

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl p-10">
          <div className="text-center mb-6">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl text-gray-900">Setup Failed</h1>
            <p className="text-red-600 mt-2">{setupError}</p>
          </div>

          <div className="space-y-4">
            <Button onClick={handleReturnToPricing} className="w-full border py-4 rounded-xl">
              Return to Home
            </Button>

            <Button
              onClick={() =>
                window.open(
                  `mailto:support@yourcompany.com?subject=Payment Issue - ${orderData.transactionId}`,
                  '_self'
                )
              }
              className="w-full bg-blue-600 text-white py-4 rounded-xl flex justify-center gap-2"
            >
              <UserCheck />
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentStatusView;
