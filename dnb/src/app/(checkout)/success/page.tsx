'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

// import { generateReceiptHTML } from '../utils/sendReceipt';
import { becomeBusinessOwner } from '@/services/paymentService';
import useAuth from '@/hooks/use-auth';
import { login } from '@/services/authService';
import { getAllPlans } from '@/services/plansService';
import { formatDate, formatTime } from '../utils/formatDateandTime';
import PaymentStatusView from '../utils/statusPayment';
import { setPaymentId, setPaymentStatus } from '@/app/store/slices/paymentSlice';
import { useRouter } from 'next/navigation';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type BillingCycle = 'monthly' | 'yearly';

type CurrencyCode = 'INR' | 'USD' | 'EUR' | string;

interface PlanInfo {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: CurrencyCode;
}

type PlanMap = Record<string, PlanInfo>;

interface SessionOrderData {
  planId?: string;
  billingCycle?: BillingCycle;
  businessName?: string;
  email?: string;
  password?: string;
  isUpgrade?: boolean;
  [key: string]: unknown;
}

interface FinalOrderData extends SessionOrderData {
  planName: string;
  planPrice: number;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  date: string;
  time: string;
  planStartDate: string;
  planEndDate: string;
  country: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

const getNextBillingDate = (cycle: BillingCycle): Date => {
  const now = new Date();
  const next = new Date(now);

  cycle === 'yearly' ? next.setFullYear(now.getFullYear() + 1) : next.setMonth(now.getMonth() + 1);

  return next;
};

const getInitialOrderData = (): SessionOrderData => {
  try {
    const rawData = sessionStorage.getItem('pendingBusinessData');
    return rawData ? (JSON.parse(rawData) as SessionOrderData) : {};
  } catch {
    return {};
  }
};

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

const PaymentSuccess: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [orderData, setOrderData] = useState<SessionOrderData>({});
  const [availablePlans, setAvailablePlans] = useState<PlanMap>({});
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);

  const hasRun = useRef<boolean>(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { login: setSession } = useAuth();

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  /* ----------------------------- Load Plans -------------------------------- */

  useEffect(() => {
    const loadPlans = async (): Promise<void> => {
      try {
        const plans = await getAllPlans();

        const planMap: PlanMap = plans.reduce((acc: PlanMap, p: any): PlanMap => {
          acc[p.id] = {
            name: p.name,
            priceMonthly: p.priceMonthly,
            priceYearly: p.priceYearly,
            currency: p.currency || 'INR',
          };
          return acc;
        }, {});

        setAvailablePlans(planMap);
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    };

    loadPlans();
  }, []);

  /* ----------------------------- Print Receipt ----------------------------- */

  const handlePrintReceipt = (): void => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    // const htmlContent = generateReceiptHTML(orderData, formatPrice);
    // receiptWindow.document.write(htmlContent);
    // receiptWindow.document.close();

    setTimeout(() => receiptWindow.print(), 250);
  };

  /* -------------------------- Business Creation ----------------------------- */

  const handleBusinessCreation = async (): Promise<void> => {
    if (hasRun.current) return;
    hasRun.current = true;

    const sessionData = getInitialOrderData();
    const planId = sessionData.planId as string;
    const billingCycle: BillingCycle = sessionData.billingCycle || 'monthly';

    const planInfo = availablePlans[planId];

    if (!planInfo) {
      console.warn('Plan info missing for ID:', planId);
      return;
    }

    const now = new Date();
    const nextBillingDate = getNextBillingDate(billingCycle);

    const formattedData: FinalOrderData = {
      ...sessionData,
      planId,
      billingCycle,
      planName: planInfo.name,
      country: sessionData.country as string,
      planPrice: billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly,
      currencyCode: planInfo.currency,
      currencySymbol: CURRENCY_SYMBOL[planInfo.currency] ?? CURRENCY_SYMBOL.INR,
      date: formatDate(now),
      time: formatTime(now),
      planStartDate: formatDate(now),
      planEndDate: formatDate(nextBillingDate),
    };

    setOrderData(formattedData);

    try {
      for (let i = 1; i <= 4; i++) {
        setCurrentStep(i);
        await new Promise((r) => setTimeout(r, 600));
      }

      const res = await becomeBusinessOwner(formattedData as any);

      if (res?.success && res?.data) {
        dispatch(setPaymentId(res.data.paymentId ?? null));
        dispatch(setPaymentStatus('success'));
        setStatus('success');
        setIsSetupComplete(true);
        toast.success('Payment verified successfully!');
      } else {
        setSetupError(res?.message || 'Account creation failed.');
        dispatch(setPaymentStatus('error'));
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setSetupError('Network error. Payment is safe, setup pending.');
      dispatch(setPaymentStatus('error'));
      setStatus('error');
    } finally {
      sessionStorage.setItem('orderData', JSON.stringify(formattedData));
    }
  };

  /* ---------------------------- Upgrade Flow -------------------------------- */

  const handleUpgradeSuccess = async (): Promise<void> => {
    try {
      setStatus('processing');
      setCurrentStep(1);

      await new Promise((r) => setTimeout(r, 1000));

      setCurrentStep(2);
      toast.success('Your plan has been upgraded successfully!');
      setStatus('success');
      setIsSetupComplete(true);
    } catch {
      setSetupError('Error updating plan');
      setStatus('error');
    }
  };

  /* ----------------------------- Flow Decision ------------------------------ */

  useEffect(() => {
    const sessionData = getInitialOrderData();
    const isUpgrade = Boolean(sessionData?.isUpgrade);

    if (Object.keys(availablePlans).length) {
      isUpgrade ? handleUpgradeSuccess() : handleBusinessCreation();
    }
  }, [availablePlans]);

  /* ----------------------------- Dashboard ---------------------------------- */

  const handleGoToDashboard = useCallback(async (): Promise<void> => {
    try {
      const savedOrder: SessionOrderData = JSON.parse(sessionStorage.getItem('orderData') || '{}');

      if (!savedOrder?.email || !savedOrder?.password) {
        toast.error('Session expired, please log in manually.');
        router.push('/login');
        return;
      }

      const stored = await login({
        businessName: savedOrder.businessName as string,
        email: savedOrder.email as string,
        password: savedOrder.password as string,
      });

      const { accessToken, refreshToken, tokenPayload } = stored?.data || {};
      if (!accessToken || !tokenPayload) {
        throw new Error('Invalid login response');
      }

      setSession(
        {
          accessToken,
          refreshToken: refreshToken ?? null,
          user: tokenPayload,
        },
        { remember: true }
      );

      sessionStorage.removeItem('pendingBusinessData');
      toast.success(`Welcome, ${tokenPayload.name || 'User'}!`);

      router.push('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      toast.error('Login failed, please try again.');
    }
  }, [router.push, setSession]);

  /* ----------------------------- Return ------------------------------------- */

  const handleReturnToPricing = useCallback((): void => {
    sessionStorage.removeItem('pendingBusinessData');
    router.push('/');
  }, [router.push]);

  /* ----------------------------- Render ------------------------------------- */

  return (
    <PaymentStatusView
      status={status}
      orderData={orderData}
      currentStep={currentStep}
      setupError={setupError}
      handleGoToDashboard={handleGoToDashboard}
      handleReturnToPricing={handleReturnToPricing}
      handlePrintReceipt={handlePrintReceipt}
      // isSetupComplete={isSetupComplete}
      formatPrice={(p: number | string) =>
        `${(orderData as any)?.currencySymbol ?? '₹'}${Number(p || 0).toFixed(2)}`
      }
    />
  );
};

export default PaymentSuccess;
