"use client";

import useAuth from "@/hooks/use-auth";
import { OptimizedDashboard } from "@/components/dashboard/optimized-dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  
  return <OptimizedDashboard user={user} />;
}
