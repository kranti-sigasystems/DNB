"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";

import {
  validateCheckoutForm,
  validateSingleField,
} from "../utils/validateCheckoutForm";

import { useCheckUniqueFieldQuery } from "@/hooks/checkUniqueFiledQuery";
import OrderSummary from "./components/OrderSummary";
import SelectedPlanCard from "./components/selectedPlanCard";

import {
  CheckoutFormData,
  FormErrors,
  BillingCycle,
  Plan,
} from "@/types/checkout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, User } from "lucide-react";
import Footer from "@/components/features/home/components/Footer";
import Link from "next/link";

/* -------------------- Component -------------------- */

export default function CheckoutPage() {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<CheckoutFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phoneNumber: "",
    businessName: "",
    registrationNumber: "",
    country: "",
    state: "",
    city: "",
    address: "",
    postalCode: "",
    taxId: "",
    website: "",
  });

  /* -------------------- Load Plan from Storage -------------------- */

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedPlanData");

    if (!stored) {
      setTimeout(() => {
        router.replace("/plans");
      }, 1000);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const plan = parsed.selectedPlan;

      if (!plan || !plan.id) {
        router.replace("/plans");
        return;
      }

      // Ensure the plan has all required properties
      const planWithPrice = {
        ...plan,
        key: plan.key || plan.id, // Use key if available, otherwise use id
        price:
          parsed.billingCycle === "yearly"
            ? plan.priceYearly
            : plan.priceMonthly,
        currency: plan.currency || "INR",
        maxUsers: plan.maxUsers || plan.maxBuyers || 50,
        maxProducts: plan.maxProducts || 50,
        maxOffers: plan.maxOffers || 100,
        maxBuyers: plan.maxBuyers || 50,
      };
      setSelectedPlan(planWithPrice);
      setBillingCycle(parsed.billingCycle || "monthly");
    } catch (error) {
      console.error("Error parsing plan data:", error);
      router.replace("/plans");
    }
  }, [router]);

  /* -------------------- Unique Checks -------------------- */

  const emailCheck = useCheckUniqueFieldQuery("email", formData.email);
  const businessCheck = useCheckUniqueFieldQuery(
    "businessName",
    formData.businessName
  );
  const regCheck = useCheckUniqueFieldQuery(
    "registrationNumber",
    formData.registrationNumber
  );

  const uniqueErrors: FormErrors = {
    email: emailCheck.data?.exists ? emailCheck.data.message : "",
    businessName: businessCheck.data?.exists ? businessCheck.data.message : "",
    registrationNumber: regCheck.data?.exists ? regCheck.data.message : "",
  };

  /* -------------------- Handlers -------------------- */

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Type-safe field validation
    const validFieldNames: (keyof CheckoutFormData)[] = [
      "first_name",
      "last_name",
      "email",
      "password",
      "phoneNumber",
      "businessName",
      "registrationNumber",
      "country",
      "state",
      "city",
      "address",
      "postalCode",
      "taxId",
      "website",
    ];

    if (validFieldNames.includes(name as keyof CheckoutFormData)) {
      const fieldError = validateSingleField(
        name as keyof CheckoutFormData,
        value
      );

      setErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedPlan) return;

    // Validate form data
    const validationErrors = validateCheckoutForm(formData);

    // Check for unique field errors
    const combinedErrors = {
      ...validationErrors,
      ...uniqueErrors,
    };

    setErrors(combinedErrors);

    // Check if there are any validation errors
    const hasErrors = Object.values(combinedErrors).some(
      (error) => error && error.trim() !== ""
    );

    if (hasErrors) {
      const errorFields = Object.entries(combinedErrors)
        .filter(([_, error]) => error && error.trim() !== "")
        .map(([field, _]) => field.replace("_", " "))
        .join(", ");

      toast.error(`Please fix the errors in: ${errorFields}`);

      // Scroll to the first error field
      const firstErrorField = Object.keys(combinedErrors).find(
        (key) => combinedErrors[key]
      );
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
      return;
    }

    // Store form data for the OrderSummary component to access
    sessionStorage.setItem("checkoutFormData", JSON.stringify(formData));

    toast.success(
      "Form validated successfully! Click 'Complete Purchase' to proceed."
    );
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading checkout...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            If this takes too long, please select a plan first.
          </p>
        </div>
      </div>
    );
  }

  const calculateTotal = () =>
    billingCycle === "monthly"
      ? selectedPlan.priceMonthly
      : selectedPlan.priceYearly;

  /* -------------------- JSX -------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <SelectedPlanCard
              selectedPlan={selectedPlan}
              billingCycle={billingCycle}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <Card className="shadow-md border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg dark:text-white">
                        Personal Information
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">
                        Enter your personal details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="first_name"
                      >
                        First Name *
                      </Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Your First Name"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.first_name ? "border-red-500" : ""}`}
                      />
                      {errors.first_name && (
                        <p className="text-xs text-red-500">
                          {errors.first_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="last_name"
                      >
                        Last Name *
                      </Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Your Last Name"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.last_name ? "border-red-500" : ""}`}
                      />
                      {errors.last_name && (
                        <p className="text-xs text-red-500">
                          {errors.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="email"
                      >
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${
                          errors.email || uniqueErrors.email
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {(errors.email || uniqueErrors.email) && (
                        <p className="text-xs text-red-500">
                          {errors.email || uniqueErrors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="phoneNumber"
                      >
                        Phone Number *
                      </Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.phoneNumber ? "border-red-500" : ""}`}
                      />
                      {errors.phoneNumber && (
                        <p className="text-xs text-red-500">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label
                      className="m-1 dark:text-slate-200"
                      htmlFor="password"
                    >
                      Password *
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a secure password"
                      className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.password ? "border-red-500" : ""}`}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card className="shadow-md border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg dark:text-white">
                        Business Information
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">
                        Provide your business details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="businessName"
                      >
                        Business Name *
                      </Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Your Business Name"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${
                          errors.businessName || uniqueErrors.businessName
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {(errors.businessName || uniqueErrors.businessName) && (
                        <p className="text-xs text-red-500">
                          {errors.businessName || uniqueErrors.businessName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="registrationNumber"
                        className="m-1 dark:text-slate-200"
                      >
                        Registration Number *
                      </Label>
                      <Input
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="REG12345"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${
                          errors.registrationNumber ||
                          uniqueErrors.registrationNumber
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {(errors.registrationNumber ||
                        uniqueErrors.registrationNumber) && (
                        <p className="text-xs text-red-500">
                          {errors.registrationNumber ||
                            uniqueErrors.registrationNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="taxId"
                      >
                        Tax ID
                      </Label>
                      <Input
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                        placeholder="TAX12345"
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="website"
                      >
                        Website
                      </Label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.website ? "border-red-500" : ""}`}
                      />
                      {errors.website && (
                        <p className="text-xs text-red-500">{errors.website}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card className="shadow-md border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg dark:text-white">
                        Billing Address
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">
                        Provide your billing details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="address"
                      className="m-1 dark:text-slate-200"
                    >
                      Address *
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main Street"
                      className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.address ? "border-red-500" : ""}`}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500">{errors.address}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="m-1 dark:text-slate-200" htmlFor="city">
                        City *
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Mumbai"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.city ? "border-red-500" : ""}`}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-500">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="state"
                      >
                        State *
                      </Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Maharashtra"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.state ? "border-red-500" : ""}`}
                      />
                      {errors.state && (
                        <p className="text-xs text-red-500">{errors.state}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="country"
                      >
                        Country *
                      </Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="India"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.country ? "border-red-500" : ""}`}
                      />
                      {errors.country && (
                        <p className="text-xs text-red-500">{errors.country}</p>
                      )}
                    </div>
                    <div>
                      <Label
                        className="m-1 dark:text-slate-200"
                        htmlFor="postalCode"
                      >
                        Postal Code *
                      </Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="400001"
                        className={`dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 ${errors.postalCode ? "border-red-500" : ""}`}
                      />
                      {errors.postalCode && (
                        <p className="text-xs text-red-500">
                          {errors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          <OrderSummary
            selectedPlan={selectedPlan}
            billingCycle={billingCycle}
            calculateTotal={calculateTotal}
            formData={formData}
          />
        </div>
      </main>
      {/* ---------------------------------------------
   Checkout Assurance & Information
---------------------------------------------- */}
      <section className="mt-5 mb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
            {/* Header */}
            <div className="px-6 py-8 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                What happens after checkout?
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                A quick overview of how your subscription is activated, how
                billing works, and how we keep your data secure.
              </p>
            </div>

            {/* Steps */}
            <div className="px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Instant Account Setup",
                  description:
                    "Your account is created automatically using the details you provided. No manual setup required.",
                },
                {
                  step: "02",
                  title: "Plan Activated Immediately",
                  description:
                    "Your selected plan becomes active right away with full access to features and limits.",
                },
                {
                  step: "03",
                  title: "Confirmation & Invoice",
                  description:
                    "You’ll receive a confirmation email with login credentials and a downloadable invoice.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6"
                >
                  <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Support CTA */}
            <div className="px-6 py-6 bg-slate-50 dark:bg-slate-800 rounded-b-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Need help before completing payment?
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Our support team is available during business hours.
                  Enterprise customers receive priority assistance.
                </p>
              </div>

              <Link href="/contact" className="inline-block">
                <Button variant="outline" className="w-full md:w-auto">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
