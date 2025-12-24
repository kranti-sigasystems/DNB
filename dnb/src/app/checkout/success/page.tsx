"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Download,
  ArrowRight,
  Shield,
  Mail,
  Gift,
  Loader2,
  Star,
  Sparkles,
  CreditCard,
  Calendar,
  User,
  Building,
  Clock,
  Zap,
} from "lucide-react";
import { useAppDispatch } from "@/hooks/redux";
import { getAllPlans } from "@/services/plansService";
import {
  formatDate,
  formatTime,
} from "@/app/(checkout)/utils/formatDateandTime";
import useAuth from "@/hooks/use-auth";
import { getPaymentStatus } from "@/actions/payment";
import {
  setPaymentId,
  setPaymentStatus,
} from "@/app/store/slices/paymentSlice";

type PaymentStatus = "processing" | "success" | "error";
type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
}

interface OrderData {
  businessName?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phoneNumber?: string;
  registrationNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  planId?: string;
  planName?: string;
  planPrice?: number;
  billingCycle?: BillingCycle;
  currencyCode?: string;
  currencySymbol?: string;
  date?: string;
  time?: string;
  planStartDate?: string;
  planEndDate?: string;
  transactionId?: string;
  isUpgrade?: boolean;
}

const CURRENCY_SYMBOL = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

const getNextBillingDate = (cycle: BillingCycle) => {
  const now = new Date();
  const next = new Date(now);
  cycle === "yearly"
    ? next.setFullYear(now.getFullYear() + 1)
    : next.setMonth(now.getMonth() + 1);
  return next;
};

const getInitialOrderData = (): OrderData => {
  try {
    const rawData = sessionStorage.getItem("pendingBusinessData");
    return rawData ? (JSON.parse(rawData) as OrderData) : {};
  } catch {
    return {};
  }
};

export default function PaymentSuccess() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { login: setSession } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<PaymentStatus>("processing");
  const [orderData, setOrderData] = useState<OrderData>(getInitialOrderData());
  const [availablePlans, setAvailablePlans] = useState<Record<string, Plan>>(
    {}
  );
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean>(false);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);

  const hasRun = useRef(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await getAllPlans();
        const planMap: Record<string, Plan> = {};

        plans.forEach((p) => {
          planMap[p.id] = p;
        });

        setAvailablePlans(planMap);
      } catch (err) {
        console.error("Failed to load plans:", err);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || paymentVerified) return;

      try {
        const result = await getPaymentStatus(sessionId);

        if (result?.success) {
          setPaymentVerified(true);

          const paymentData = result.payment;
          const user = paymentData?.user;
          const plan = paymentData?.plan;

          if (paymentData && user && plan) {
            const updatedOrderData: OrderData = {
              ...orderData,
              planId: paymentData.planId || "",
              planName: plan.name || "",
              planPrice: Number(paymentData.amount) || 0,
              currencyCode: plan.currency || "INR",
              currencySymbol:
                CURRENCY_SYMBOL[
                  plan.currency as keyof typeof CURRENCY_SYMBOL
                ] || "₹",
              transactionId: paymentData.id || "",
              email: user.email || "",
              first_name: user.first_name || "",
              last_name: user.last_name || "",
              billingCycle:
                (paymentData.billingCycle as BillingCycle) || "yearly",
            };

            setOrderData(updatedOrderData);
            sessionStorage.setItem(
              "pendingBusinessData",
              JSON.stringify(updatedOrderData)
            );
          }

          toast.success("Payment verified successfully!");
          sessionStorage.removeItem("checkoutFormData");
        } else {
          throw new Error(result?.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setSetupError("Payment verification failed. Please contact support.");
        setStatus("error");
      }
    };

    verifyPayment();
  }, [sessionId, paymentVerified, orderData]);

  const handlePaymentSuccess = async () => {
    if (hasRun.current || !paymentVerified) return;
    hasRun.current = true;

    const sessionData = getInitialOrderData();
    const plan =
      sessionData.planId && availablePlans[sessionData.planId]
        ? availablePlans[sessionData.planId]
        : undefined;

    if (!plan) {
      setSetupError("Plan information not found. Please contact support.");
      setStatus("error");
      return;
    }

    const billingCycle: BillingCycle =
      (sessionData.billingCycle as BillingCycle) || "yearly";
    const now = new Date();
    const nextBilling = getNextBillingDate(billingCycle);

    const formattedData: OrderData = {
      ...sessionData,
      planName: plan.name,
      planPrice:
        billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly,
      billingCycle,
      currencyCode: plan.currency,
      currencySymbol:
        CURRENCY_SYMBOL[plan.currency as keyof typeof CURRENCY_SYMBOL] || "₹",
      date: formatDate(now),
      time: formatTime(now),
      planStartDate: formatDate(now),
      planEndDate: formatDate(nextBilling),
    };

    setOrderData(formattedData);

    try {
      // Smooth progress animation
      const steps = [
        { delay: 800, step: 1 },
        { delay: 1200, step: 2 },
        { delay: 1000, step: 3 },
        { delay: 800, step: 4 },
      ];

      for (const { delay, step } of steps) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        setCurrentStep(step);
      }

      // Final completion
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProcessingComplete(true);

      dispatch(setPaymentId(formattedData.transactionId || null));
      dispatch(setPaymentStatus("success"));

      // Smooth transition to success
      setTimeout(() => {
        setStatus("success");
        toast.success("🎉 Welcome to Digital Negotiation Book!");
      }, 800);
    } catch (err) {
      console.error(err);
      setSetupError(
        "Payment processing completed, but setup encountered an issue."
      );
      dispatch(setPaymentStatus("error"));
      setStatus("error");
    } finally {
      sessionStorage.setItem("orderData", JSON.stringify(formattedData));
    }
  };

  useEffect(() => {
    if (!Object.keys(availablePlans).length || !paymentVerified) return;
    handlePaymentSuccess();
  }, [availablePlans, paymentVerified]);

  const handleGoToDashboard = useCallback(async () => {
    try {
      sessionStorage.removeItem("pendingBusinessData");
      sessionStorage.removeItem("orderData");
      router.push("/dashboard");
      toast.success("Welcome to your dashboard!");
    } catch (err) {
      console.error("Navigation error:", err);
      toast.error("Navigation failed. Please try again.");
    }
  }, [router]);

  const handleReturnToPricing = useCallback(() => {
    sessionStorage.removeItem("pendingBusinessData");
    sessionStorage.removeItem("orderData");
    router.push("/plans");
  }, [router]);

  // Generate beautiful receipt
  const generateReceipt = () => {
    const receiptWindow = window.open("", "_blank");
    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Receipt - Digital Negotiation Book</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 40px 20px;
            line-height: 1.6;
        }
        .receipt {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top:h: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
        }
        .logo { 
            font-size: 32px; 
            font-weight: 800; 
            margin-bottom: 12px; 
            position: relative;
            z-index: 1;
        }
        .subtitle { 
            opacity: 0.95; 
            font-size: 18px; 
            font-weight: 500;
            position: relative;
            z-index: 1;
        }
        .content { padding: 50px 40px; }
        .section { margin-bottom: 40px; }
        .section-title { 
            font-size: 20px; 
            font-weight: 700; 
            color: #1f2937; 
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { 
            color: #6b7280; 
            font-weight: 600; 
            font-size: 15px;
        }
        .detail-value { 
            color: #1f2937; 
            font-weight: 700; 
            font-size: 15px;
        }
        .amount { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
        }
        .amount::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: slide 2s infinite;
        }
        @keyframes slide {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .amount-label { 
            font-size: 16px; 
            opacity: 0.9; 
            margin-bottom: 8px; 
            font-weight: 500;
        }
        .amount-value { 
            font-size: 42px; 
            font-weight: 900; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .footer {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            opacity: 0.9; 
            margin-bottom: 8px;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.8;
        }
        .success-badge {
            display: inline-flex;
            align-items: center;
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            color: #166534;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 25px;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
        }
        .icon { margin-right: 8px; }
        @media print {
            body { background: white; padding: 0; }
            .receipt { box-shadow: none; }
            .header::before, .amount::before { display: none; }
        }
        @media (max-width: 640px) {
            .content { padding: 30px 25px; }
            .header { padding: 40px 25px; }
            .logo { font-size: 28px; }
            .amount-value { font-size: 36px; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">✨ Digital Negotiation Book</div>
            <div class="subtitle">Premium Payment Receipt</div>
        </div>
        
        <div class="content">
            <div style="text-align: center;">
                <div class="success-badge">
                    <span class="icon">✅</span> Payment Successfully Processed
                </div>
            </div>
            
            <div class="amount">
                <div class="amount-label">Total Amount Paid</div>
                <div class="amount-value">${orderData.currencySymbol}${orderData.planPrice?.toLocaleString()}</div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>📋</span> Subscription Details
                </div>
                <div class="detail-row">
                    <span class="detail-label">Plan Name</span>
                    <span class="detail-value">${orderData.planName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Billing Cycle</span>
                    <span class="detail-value">${orderData.billingCycle?.charAt(0).toUpperCase()}${orderData.billingCycle?.slice(1)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Valid From</span>
                    <span class="detail-value">${orderData.planStartDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Valid Until</span>
                    <span class="detail-value">${orderData.planEndDate}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>💳</span> Payment Information
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction ID</span>
                    <span class="detail-value">${orderData.transactionId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Date</span>
                    <span class="detail-value">${orderData.date} at ${orderData.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method</span>
                    <span class="detail-value">Stripe (Secure Payment)</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Currency</span>
                    <span class="detail-value">${orderData.currencyCode}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>👤</span> Customer Information
                </div>
                <div class="detail-row">
                    <span class="detail-label">Name</span>
                    <span class="detail-value">${orderData.first_name} ${orderData.last_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${orderData.email}</span>
                </div>
                ${
                  orderData.businessName
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Business</span>
                    <span class="detail-value">${orderData.businessName}</span>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        
        <div class="footer">
            <p><strong>🚀 Digital Negotiation Book</strong></p>
            <p>This receipt confirms your successful payment and premium subscription activation.</p>
            <p>For support and assistance, contact us at <strong>support@dnb.com</strong></p>
            <p>&copy; ${new Date().getFullYear()} Digital Negotiation Book. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    receiptWindow?.document.write(receiptHTML);
    receiptWindow?.document.close();
    setTimeout(() => receiptWindow?.print(), 500);
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl max-w-md w-full animate-fade-in border border-red-100">
          <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Session
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            No payment session found. Please try again.
          </p>
          <button
            onClick={() => router.push("/plans")}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  if (status === "processing") {
    const steps = [
      {
        icon: Shield,
        label: "Verifying Payment",
        description: "Confirming your payment with Stripe secure servers",
        color: "blue",
      },
      {
        icon: Mail,
        label: "Sending Confirmation",
        description: "Preparing your welcome email and account details",
        color: "green",
      },
      {
        icon: User,
        label: "Setting Up Account",
        description: "Creating your personalized business profile",
        color: "purple",
      },
      {
        icon: Sparkles,
        label: "Finalizing Setup",
        description: "Activating premium features and subscription",
        color: "orange",
      },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 max-w-5xl w-full mx-auto border border-white/20">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                {processingComplete ? (
                  <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white animate-bounce" />
                ) : (
                  <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white animate-spin" />
                )}
              </div>
              {processingComplete && (
                <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-xl">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              )}

              {/* Floating particles animation */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
                <div className="absolute top-8 right-8 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-50"></div>
                <div className="absolute bottom-6 left-8 w-2 h-2 bg-indigo-400 rounded-full animate-bounce opacity-70"></div>
                <div className="absolute bottom-4 right-4 w-2 h-2 bg-pink-400 rounded-full animate-ping opacity-50"></div>
              </div>

              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-20"></div>
              <div
                className="absolute inset-4 rounded-full border-2 border-purple-200 animate-ping opacity-30"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3 leading-tight">
              {processingComplete ? "Almost Ready!" : "Processing Payment"}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {processingComplete
                ? "Your account is being finalized..."
                : "Please wait while we set up your account..."}
            </p>

            {/* Progress bar */}
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 mb-8 sm:mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index + 1;
              const isCompleted = currentStep > index + 1;
              const isPending = currentStep < index + 1;

              return (
                <div
                  key={index}
                  className={`relative flex items-center p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl transition-all duration-700 transform ${
                    isActive
                      ? "bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 scale-105 shadow-2xl"
                      : isCompleted
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-xl"
                        : "bg-gray-50 border-2 border-gray-200 opacity-60"
                  }`}
                >
                  {/* Connecting line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-8 sm:left-12 lg:left-16 top-full w-1 h-4 sm:h-6 lg:h-8 transition-colors duration-1000 ${
                        isCompleted
                          ? "bg-green-300"
                          : isActive
                            ? "bg-blue-300"
                            : "bg-gray-200"
                      }`}
                    ></div>
                  )}

                  {/* Step Icon */}
                  <div
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                      isCompleted
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl"
                        : isActive
                          ? "bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 shadow-xl"
                          : "bg-gray-300"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                    ) : isActive ? (
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white animate-pulse" />
                    ) : (
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-500" />
                    )}

                    {/* Animated ring for active step */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 rounded-2xl border-4 border-blue-300 animate-ping opacity-75"></div>
                        <div className="absolute inset-2 rounded-xl border-2 border-purple-400 animate-pulse opacity-50"></div>
                      </>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="ml-4 sm:ml-6 lg:ml-8 flex-1 min-w-0">
                    <h3
                      className={`text-base sm:text-lg font-semibold transition-colors duration-300 mb-1 ${
                        isCompleted
                          ? "text-green-800"
                          : isActive
                            ? "text-blue-800"
                            : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </h3>
                    <p
                      className={`text-sm sm:text-base transition-colors duration-300 leading-relaxed ${
                        isCompleted
                          ? "text-green-600"
                          : isActive
                            ? "text-blue-600"
                            : "text-gray-400"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Loading indicator for active step */}
                  {isActive && (
                    <div className="ml-2 sm:ml-4 flex-shrink-0">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Completion checkmark */}
                  {isCompleted && (
                    <div className="ml-2 sm:ml-4 flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Plan Info */}
          {orderData.planName && (
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-purple-200 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">
                      Selected Plan
                    </h3>
                  </div>
                  <p className="text-purple-700 font-bold text-base sm:text-lg lg:text-xl mb-1">
                    {orderData.planName}
                  </p>
                  <p className="text-purple-600 text-sm sm:text-base">
                    Premium features included
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-900 mb-2">
                    {orderData.currencySymbol}
                    {orderData.planPrice?.toLocaleString()}
                  </div>
                  <div className="text-sm sm:text-base text-purple-600 capitalize bg-purple-100 px-4 py-2 rounded-full inline-block font-semibold">
                    {orderData.billingCycle} billing
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional info */}
          <div className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm sm:text-base text-gray-500 bg-gray-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>This usually takes 30-60 seconds</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in border border-red-100">
          <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Setup Failed
          </h1>
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {setupError}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleReturnToPricing}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              Return to Plans
            </button>
            <button
              onClick={() =>
                (window.location.href = `mailto:support@dnb.com?subject=Payment Issue - Session ${sessionId}`)
              }
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100">
      <div className="container  px-4 py-8">
        {/* Celebration Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white p-8  rounded-t-3xl text-center overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -left-4 w-16 h-16 sm:w-24 sm:h-24 bg-white bg-opacity-10 rounded-full animate-bounce"></div>
            <div className="absolute top-8 right-8 w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
            <div
              className="absolute bottom-4 left-1/4 w-14 h-14 sm:w-20 sm:h-20 bg-white bg-opacity-10 rounded-full animate-bounce"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-white bg-opacity-10 rounded-full animate-ping"></div>
          </div>

          <div className="relative z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 animate-fade-in">
              🎉 Payment Successful!
            </h1>
            <p
              className="text-lg sm:text-xl lg:text-2xl opacity-90 animate-fade-in mb-6"
              style={{ animationDelay: "0.2s" }}
            >
              Welcome to Digital Negotiation Book
            </p>
            <div
              className="inline-flex items-center bg-white bg-opacity-20 rounded-full px-4 sm:px-6 py-2 sm:py-3 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Star className="w-5 h-5 mr-2" />
              <span className="font-semibold text-sm sm:text-base">
                Premium Member
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-b-3xl shadow-2xl overflow-hidden">
          <div className="sm:p-8 lg:p-12">
            {/* Success Message */}
            <div className="text-center  sm:mb-12">
              <div className="inline-flex items-center bg-green-100 text-green-800 px-4 sm:px-6 sm:py-3 rounded-full font-semibold mb-4 text-sm sm:text-base">
                <CheckCircle className="w-5 h-5 mr-2" />
                Subscription Activated Successfully
              </div>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Your payment has been processed and your account is ready to
                use. Check your email for confirmation and next steps.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
              {/* Payment Details Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Payment Details
                  </h2>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-200">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">
                      Plan
                    </span>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">
                      {orderData.planName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-200">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">
                      Amount
                    </span>
                    <span className="font-bold text-xl sm:text-2xl text-green-600">
                      {orderData.currencySymbol}
                      {orderData.planPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-200">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">
                      Billing Cycle
                    </span>
                    <span className="font-semibold  capitalize bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {orderData.billingCycle}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-200">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">
                      Payment Date
                    </span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                      {orderData.date}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 sm:py-4">
                    <span className="text-gray-600 font-medium text-sm sm:text-base">
                      Transaction ID
                    </span>
                    <span className="font-mono text-xs sm:text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {orderData.transactionId?.substring(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-blue-200 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    What's Next?
                  </h2>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      icon: Mail,
                      text: "Check your email for confirmation",
                      color: "green",
                    },
                    {
                      icon: User,
                      text: "Complete your business profile",
                      color: "blue",
                    },
                    {
                      icon: Building,
                      text: "Add your products and services",
                      color: "purple",
                    },
                    {
                      icon: Sparkles,
                      text: "Create your first negotiation",
                      color: "orange",
                    },
                    {
                      icon: Calendar,
                      text: "Invite team members",
                      color: "pink",
                    },
                  ].map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 sm:mr-4 ${
                            step.color === "green"
                              ? "bg-green-100 text-green-600"
                              : step.color === "blue"
                                ? "bg-blue-100 text-blue-600"
                                : step.color === "purple"
                                  ? "bg-purple-100 text-purple-600"
                                  : step.color === "orange"
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-pink-100 text-pink-600"
                          }`}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-gray-700 font-medium text-sm sm:text-base">
                          {step.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 sm:mt-12">
              <button
                onClick={handleGoToDashboard}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-2xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-120"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={generateReceipt}
                className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 py-3 sm:py-4 px-6 sm:px-8 rounded-2xl font-bold text-base sm:text-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Download Receipt</span>
              </button>
            </div>

            {/* Footer Info */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-sm sm:text-base text-gray-500">
                <div>
                  <strong>Session ID:</strong>
                  <br />
                  <span className="font-mono text-xs sm:text-sm">
                    {sessionId?.substring(0, 20)}...
                  </span>
                </div>
                <div>
                  <strong>Payment Method:</strong>
                  <br />
                  Stripe (Secure)
                </div>
                <div>
                  <strong>Support:</strong>
                  <br />
                  <a
                    href="mailto:support@dnb.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@dnb.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
