"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  const router = useRouter();

  const handleRetryCheckout = () => {
    // Check if we have stored checkout data
    const storedPlan = sessionStorage.getItem("selectedPlanData");
    const storedForm = sessionStorage.getItem("checkoutFormData");
    
    if (storedPlan && storedForm) {
      router.push("/checkout");
    } else {
      router.push("/plans");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Payment Cancelled</CardTitle>
          <p className="text-gray-600">Your payment was cancelled and no charges were made</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="font-semibold mb-2 text-yellow-800">What happened?</h3>
            <p className="text-sm text-yellow-700">
              You cancelled the payment process before it was completed. 
              Your subscription was not activated and no payment was processed.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-800">Ready to try again?</h3>
            <p className="text-sm text-blue-700 mb-3">
              Your form data is still saved. You can continue where you left off.
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All your information is preserved</li>
              <li>• Choose a different payment method</li>
              <li>• Contact support if you need help</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRetryCheckout}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Try Payment Again
            </Button>
            
            <Button 
              onClick={() => router.push("/plans")}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Need assistance?</p>
            <Button 
              onClick={() => router.push("/contact")}
              variant="link"
              className="text-sm"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}