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

import { CheckoutFormData, FormErrors, BillingCycle, Plan } from "@/types/checkout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, User } from "lucide-react";

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
    console.log('Checkout page loading...');
    const stored = sessionStorage.getItem("selectedPlanData");
    console.log('Stored plan data:', stored);

    if (!stored) {
      console.log('No plan data found, redirecting to plans...');
      // Show loading state briefly before redirecting
      setTimeout(() => {
        router.replace("/plans");
      }, 1000);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      console.log('Parsed plan data:', parsed);
      const plan = parsed.selectedPlan;
      
      if (!plan || !plan.id) {
        console.log('Invalid plan data, redirecting...');
        router.replace("/plans");
        return;
      }
      
      // Ensure the plan has all required properties
      const planWithPrice = {
        ...plan,
        price: parsed.billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly,
        currency: plan.currency || "INR",
        maxUsers: plan.maxUsers || plan.maxBuyers || 50,
        maxProducts: plan.maxProducts || 50,
        maxOffers: plan.maxOffers || 100,
        maxBuyers: plan.maxBuyers || 50,
      };
      
      console.log('Setting plan:', planWithPrice);
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
      'first_name', 'last_name', 'email', 'password', 'phoneNumber',
      'businessName', 'registrationNumber', 'country', 'state', 'city',
      'address', 'postalCode', 'taxId', 'website'
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
    const hasErrors = Object.values(combinedErrors).some(error => error && error.trim() !== "");
    
    if (hasErrors) {
      const errorFields = Object.entries(combinedErrors)
        .filter(([_, error]) => error && error.trim() !== "")
        .map(([field, _]) => field.replace('_', ' '))
        .join(", ");
      
      toast.error(`Please fix the errors in: ${errorFields}`);
      
      // Scroll to the first error field
      const firstErrorField = Object.keys(combinedErrors).find(key => combinedErrors[key]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    // Store form data for the OrderSummary component to access
    sessionStorage.setItem(
      "checkoutFormData",
      JSON.stringify(formData)
    );

    toast.success("Form validated successfully! Click 'Complete Purchase' to proceed.");
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, please select a plan first.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <SelectedPlanCard
              selectedPlan={selectedPlan}
              billingCycle={billingCycle}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <Card className="shadow-md border-slate-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                      <CardDescription>Enter your personal details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="m-1" htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Your First Name"
                        className={errors.first_name ? "border-red-500" : ""}
                      />
                      {errors.first_name && (
                        <p className="text-xs text-red-500">{errors.first_name}</p>
                      )}
                    </div>
                    <div>
                      <Label className="m-1" htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Your Last Name"
                        className={errors.last_name ? "border-red-500" : ""}
                      />
                      {errors.last_name && (
                        <p className="text-xs text-red-500">{errors.last_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="m-1" htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={errors.email || uniqueErrors.email ? "border-red-500" : ""}
                      />
                      {(errors.email || uniqueErrors.email) && (
                        <p className="text-xs text-red-500">{errors.email || uniqueErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label className="m-1" htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        className={errors.phoneNumber ? "border-red-500" : ""}
                      />
                      {errors.phoneNumber && (
                        <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="m-1" htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a secure password"
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card className="shadow-md border-slate-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Business Information</CardTitle>
                      <CardDescription>Provide your business details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="m-1" htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Your Business Name"
                        className={errors.businessName || uniqueErrors.businessName ? "border-red-500" : ""}
                      />
                      {(errors.businessName || uniqueErrors.businessName) && (
                        <p className="text-xs text-red-500">{errors.businessName || uniqueErrors.businessName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="registrationNumber" className="m-1">Registration Number *</Label>
                      <Input
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="REG12345"
                        className={errors.registrationNumber || uniqueErrors.registrationNumber ? "border-red-500" : ""}
                      />
                      {(errors.registrationNumber || uniqueErrors.registrationNumber) && (
                        <p className="text-xs text-red-500">{errors.registrationNumber || uniqueErrors.registrationNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="m-1" htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                        placeholder="TAX12345"
                      />
                    </div>
                    <div>
                      <Label className="m-1" htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className={errors.website ? "border-red-500" : ""}
                      />
                      {errors.website && (
                        <p className="text-xs text-red-500">{errors.website}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card className="shadow-md border-slate-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Billing Address</CardTitle>
                      <CardDescription>Provide your billing details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address" className="m-1">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main Street"
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500">{errors.address}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="m-1" htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Mumbai"
                        className={errors.city ? "border-red-500" : ""}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-500">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <Label className="m-1" htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Maharashtra"
                        className={errors.state ? "border-red-500" : ""}
                      />
                      {errors.state && (
                        <p className="text-xs text-red-500">{errors.state}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="m-1" htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="India"
                        className={errors.country ? "border-red-500" : ""}
                      />
                      {errors.country && (
                        <p className="text-xs text-red-500">{errors.country}</p>
                      )}
                    </div>
                    <div>
                      <Label className="m-1" htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="400001"
                        className={errors.postalCode ? "border-red-500" : ""}
                      />
                      {errors.postalCode && (
                        <p className="text-xs text-red-500">{errors.postalCode}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Submit Button */}
              <Card className="shadow-md border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-base font-semibold"
                    >
                      Validate Information
                    </Button>
                    <p className="text-xs text-slate-500 mt-2">
                      Validate your information, then click "Complete Purchase" to proceed to payment
                    </p>
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
    </div>
  );
}