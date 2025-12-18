"use client";

import { Users, TrendingUp, Activity, BarChart3, DollarSign } from "lucide-react";
import { StatCards, SimpleStatCard, ActivityCard } from "@/components/ui";

// Example 1: Sales Dashboard
export function SalesDashboard() {
  const salesData = [
    {
      name: "Monthly Revenue",
      value: "$34,125",
      change: "+6.1%",
      changeType: "positive" as const,
      href: "/sales/revenue",
      description: "Compared to last month",
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      name: "New Customers",
      value: "1,247",
      change: "+19.2%",
      changeType: "positive" as const,
      href: "/customers",
      icon: <Users className="w-4 h-4" />
    },
    {
      name: "Conversion Rate",
      value: "11.3%",
      change: "-1.2%",
      changeType: "negative" as const,
      href: "/analytics/conversion"
    }
  ];

  return (
    <div className="space-y-6">
      <StatCards data={salesData} columns={3} />
    </div>
  );
}

// Example 2: Analytics Overview
export function AnalyticsOverview() {
  const performanceMetrics = [
    { label: "Page Views", value: "45,678", color: "text-blue-600" },
    { label: "Unique Visitors", value: "12,345" },
    { label: "Avg. Session Duration", value: "4m 32s", color: "text-green-600" }
  ];

  const engagementMetrics = [
    { label: "Click-through Rate", value: "3.2%" },
    { label: "Bounce Rate", value: "28.5%", color: "text-red-600" },
    { label: "Return Visitors", value: "67.8%", color: "text-green-600" }
  ];

  const recentEvents = [
    {
      id: "1",
      title: "High traffic spike detected",
      time: "30 minutes ago",
      type: "info" as const
    },
    {
      id: "2",
      title: "New campaign launched successfully",
      time: "2 hours ago", 
      type: "success" as const
    },
    {
      id: "3",
      title: "Server response time increased",
      time: "4 hours ago",
      type: "warning" as const
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SimpleStatCard
        title="Performance Metrics"
        icon={BarChart3}
        items={performanceMetrics}
      />
      
      <SimpleStatCard
        title="Engagement"
        icon={TrendingUp}
        items={engagementMetrics}
      />
      
      <ActivityCard
        title="System Events"
        icon={Activity}
        activities={recentEvents}
      />
    </div>
  );
}

// Example 3: Compact Stats (without footer)
export function CompactStats() {
  const compactData = [
    {
      name: "Active Users",
      value: "2,847",
      change: "+5.2%",
      changeType: "positive" as const,
      href: "#"
    },
    {
      name: "Server Uptime",
      value: "99.9%",
      change: "0%",
      changeType: "positive" as const,
      href: "#"
    }
  ];

  return (
    <StatCards 
      data={compactData} 
      columns={2} 
      showFooter={false}
      className="mb-4"
    />
  );
}