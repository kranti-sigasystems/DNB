"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Download,
  ArrowRight,
  Shield,
  Mail,
  Loader2,
  Star,
  Sparkles,
  CreditCard,
  Calendar,
  User,
  Building,
  Clock,
  Home,
  Users,
  Zap,
  AlertCircle,
} from "lucide-react";

import { getPaymentStatus } from "@/actions/payment";
import { sendPaymentConfirmationEmail } from "@/actions/send-payment-email";
import {
  formatDate,
  formatTime,
} from "@/app/(checkout)/utils/formatDateandTime";
import { OrderData, BillingCycle } from "@/types/payment";
import Link from "next/link";
import { openAndPrintReceipt } from "@/components/payment/openReceipt";

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "Verifying Payment", icon: Shield },
    { label: "Processing Order", icon: Zap },
    { label: "Activating Account", icon: Star },
    { label: "Sending Confirmation", icon: Mail },
  ];

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid payment session.");
      setLoading(false);
      return;
    }
    const verifyPayment = async () => {
      try {
        // Simulate step progression
        const stepInterval = setInterval(() => {
          setCurrentStep((prev) => {
            if (prev < steps.length) {
              return prev + 1;
            } else {
              clearInterval(stepInterval);
              return prev;
            }
          });
        }, 1000);

        const res = await getPaymentStatus(sessionId);

        if (!res?.success || !res?.payment) {
          throw new Error(res?.message || "Payment verification failed");
        }

        const payment = res.payment;
        const user = payment?.user;
        const plan = payment?.plan;

        if (!user || !plan) {
          throw new Error(
            "Invalid payment data: missing user or plan information"
          );
        }

        const now = new Date();
        const endDate = new Date(now);
        if (payment.billingCycle === "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        const formatted: OrderData = {
          first_name: user.first_name || "User",
          last_name: user.last_name || "",
          email: user.email || "",
          businessName: payment.businessOwner?.businessName || "",
          planName: plan.name || "",
          planPrice: Number(payment.amount) || 0,
          billingCycle: (payment.billingCycle as BillingCycle) || "yearly",
          currencyCode: plan.currency || "INR",
          currencySymbol:
            CURRENCY_SYMBOL[plan.currency as keyof typeof CURRENCY_SYMBOL] ??
            plan.currency,
          transactionId: payment.stripePaymentId || payment.id || "",
          date: formatDate(now),
          time: formatTime(now),
          planStartDate: formatDate(now),
          planEndDate: formatDate(endDate),
        };

        setOrderData(formatted);

        // Send confirmation email
        try {
          const emailResult = await sendPaymentConfirmationEmail(
            user.email || "",
            `${user.first_name || "User"} ${user.last_name || ""}`.trim(),
            plan.name || "",
            Number(payment.amount) || 0,
            CURRENCY_SYMBOL[plan.currency as keyof typeof CURRENCY_SYMBOL] ??
              plan.currency,
            payment.billingCycle || "yearly",
            payment.stripePaymentId || payment.id || "",
            formatDate(now),
            formatDate(endDate)
          );

          if (emailResult.success) {
            toast.success("Payment verified and confirmation email sent!");
          } else {
            toast.success("Payment verified successfully");
            console.warn("Email sending failed but payment was successful");
          }
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          toast.success("Payment verified successfully");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    verifyPayment();
  }, [sessionId]);
  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Processing Your Payment
            </h1>
            <p className="text-lg text-gray-600">
              Please wait while we verify and activate your subscription...
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Processing Steps */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  Processing Steps
                </h2>

                <div className="space-y-4">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === index + 1;
                    const isCompleted = currentStep > index + 1;
                    const isPending = currentStep < index + 1;

                    return (
                      <div key={index} className="relative">
                        {/* Connecting Line */}
                        {index < steps.length - 1 && (
                          <div
                            className={`absolute left-6 top-16 w-1 h-12 transition-all duration-500 ${
                              isCompleted
                                ? "bg-green-500"
                                : isActive
                                  ? "bg-indigo-600"
                                  : "bg-gray-300"
                            }`}
                          ></div>
                        )}

                        {/* Step Item */}
                        <div
                          className={`flex gap-4 p-4 rounded-xl transition-all duration-500 ${
                            isCompleted
                              ? "bg-green-50 border-2 border-green-200"
                              : isActive
                                ? "bg-indigo-50 border-2 border-indigo-300 scale-105"
                                : "bg-gray-50 border-2 border-gray-200"
                          }`}
                        >
                          {/* Icon Circle */}
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                              isCompleted
                                ? "bg-green-500"
                                : isActive
                                  ? "bg-indigo-600"
                                  : "bg-gray-400"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <Icon
                                className={`w-6 h-6 ${
                                  isActive
                                    ? "animate-pulse text-white"
                                    : "text-white"
                                }`}
                              />
                            )}
                          </div>

                          {/* Step Label */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-semibold text-sm transition-colors duration-300 ${
                                isCompleted
                                  ? "text-green-700"
                                  : isActive
                                    ? "text-indigo-700"
                                    : "text-gray-600"
                              }`}
                            >
                              {step.label}
                            </p>
                            <p
                              className={`text-xs mt-1 transition-colors duration-300 ${
                                isCompleted
                                  ? "text-green-600"
                                  : isActive
                                    ? "text-indigo-600"
                                    : "text-gray-500"
                              }`}
                            >
                              {isCompleted
                                ? "Completed"
                                : isActive
                                  ? "In progress..."
                                  : "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Overall Progress
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {Math.round((currentStep / steps.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(currentStep / steps.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                  Order Summary
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Status</span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">
                      Session ID
                    </span>
                    <span className="font-mono text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                      {sessionId?.substring(0, 12)}...
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      Processing Time
                    </span>
                    <span className="font-semibold text-gray-900">
                      {currentStep * 1}s elapsed
                    </span>
                  </div>
                </div>
              </div>

              {/* What's Happening Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  What's Happening
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-0.5">1.</span>
                    <span>
                      <strong>Verifying Payment:</strong> We're confirming your
                      payment with Stripe to ensure it was processed
                      successfully.
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-0.5">2.</span>
                    <span>
                      <strong>Processing Order:</strong> Your subscription
                      details are being recorded in our system.
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-0.5">3.</span>
                    <span>
                      <strong>Activating Account:</strong> Your premium features
                      are being enabled and your account is being set up.
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-0.5">4.</span>
                    <span>
                      <strong>Sending Confirmation:</strong> A confirmation
                      email with your receipt and login details is being sent.
                    </span>
                  </p>
                </div>
              </div>

              {/* Security Info Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Secure Payment
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Payment processed through Stripe (PCI DSS Level 1 certified)
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Your card information is encrypted and secure
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    No card details are stored on our servers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border-l-4 border-red-500">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Payment Error
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push("/plans")}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your subscription has been activated. You now have full access to
              all premium features.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Payment & Subscription Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Payment Details Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Plan Name</span>
                <span className="font-bold text-gray-900">
                  {orderData.planName}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Amount Paid</span>
                <span className="text-2xl font-bold text-green-600">
                  {orderData.currencySymbol}
                  {orderData.planPrice?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Billing Cycle</span>
                <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                  {orderData.billingCycle}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Payment Date</span>
                <span className="font-semibold text-gray-900">
                  {orderData.date}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Payment Time</span>
                <span className="font-semibold text-gray-900">
                  {orderData.time}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Details Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Subscription Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Start Date</span>
                <span className="font-semibold text-gray-900">
                  {orderData.planStartDate}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Renewal Date</span>
                <span className="font-semibold text-gray-900">
                  {orderData.planEndDate}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Status</span>
                <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Currency</span>
                <span className="font-semibold text-gray-900">
                  {orderData.currencyCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  Transaction ID
                </span>
                <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {orderData.transactionId?.substring(0, 12)}...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  First Name
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {orderData.first_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Last Name
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {orderData.last_name || "N/A"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Email Address
                </p>
                <p className="text-lg font-semibold text-gray-900 break-all">
                  {orderData.email}
                </p>
              </div>
              {orderData.businessName && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Business Name
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {orderData.businessName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              What's Next?
            </h2>
          </div>
          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Mail,
                  title: "Check Your Email",
                  desc: "Confirmation and login details sent",
                },
                {
                  icon: User,
                  title: "Complete Profile",
                  desc: "Add your business information",
                },
                {
                  icon: Building,
                  title: "Setup Products",
                  desc: "Add your products and services",
                },
                {
                  icon: Users,
                  title: "Invite Team",
                  desc: "Add team members to collaborate",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900 text-sm">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 bg-indigo-600 text-white py-4 px-6 rounded-lg font-bold text-base hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
         <button
  onClick={() => openAndPrintReceipt(orderData)}
  className="flex-1 bg-white text-gray-800 py-4 px-6 rounded-lg font-bold
             border-2 border-gray-300 hover:bg-gray-50 transition
             flex items-center justify-center gap-2 shadow-md"
>
  <Download className="w-5 h-5" />
  Download Receipt
</button>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Need Help?</h3>
          <p className="text-gray-600 mb-6">
            If you have any questions about your subscription or need
            assistance, our support team is here to help.
          </p>
          <a
            href="mailto:support@dnb.com"
            className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
          >
            <Link href={"/"}>
              <Mail className="w-5 h-5" />
              support@dnb.com
            </Link>
          </a>
        </div>
      </div>
    </div>
  );
}
