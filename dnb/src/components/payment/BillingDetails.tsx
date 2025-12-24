// components/payment/BillingDetails.tsx
import { OrderData } from "@/types/payment";
import { CreditCard } from "lucide-react";

export default function BillingDetails({ order }: { order: OrderData }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Billing Details</h3>
      </div>

      <div className="space-y-4 text-sm">
        <Row label="Customer">
          {order.first_name} {order.last_name}
        </Row>

        <Row label="Email">{order.email}</Row>

        <Row label="Plan">{order.planName}</Row>

        <Row label="Billing Cycle" badge>
          {order.billingCycle}
        </Row>

        <Row label="Amount" strong>
          {order.currencySymbol}
          {order.planPrice?.toLocaleString()}
        </Row>

        <Row label="Transaction ID" mono>
          {order.transactionId}
        </Row>

        <Row label="Payment Date">
          {order.date} {order.time}
        </Row>

        <Row label="Valid Period">
          {order.planStartDate} → {order.planEndDate}
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children, strong, mono, badge }: any) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span
        className={[
          strong && "font-bold text-green-600",
          mono && "font-mono text-xs",
          badge &&
            "capitalize bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </span>
    </div>
  );
}
