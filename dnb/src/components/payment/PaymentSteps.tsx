// components/payment/PaymentSteps.tsx
import { CheckCircle } from "lucide-react";

const STEPS = [
  "Payment verified",
  "Account created",
  "Subscription activated",
  "Email confirmation sent",
];

export default function PaymentSteps() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-6">Setup Progress</h3>

      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <p className="font-medium text-gray-900">{step}</p>
              <p className="text-sm text-gray-500">Completed successfully</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
