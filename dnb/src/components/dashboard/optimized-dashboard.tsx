/**
 * Optimized Dashboard Component
 * Clean, reusable dashboard with enterprise-grade architecture
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart3, TrendingUp, Activity, Users, Building2, UserCheck, UserX, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/data-table/status-badge";
import { StatCards, ActivityCard, SimpleStatCard } from "@/components/ui";
import { getDashboardData, searchDashboardData, updateUserStatus } from "@/actions/dashboard.actions";
import { ensureAuthenticated } from "@/utils/tokenManager";
import { debugAuthState } from "@/utils/debugAuth";
import { attemptSessionRestore, shouldRedirectToLogin } from "@/utils/sessionRestore";

import { USER_ROLES } from "@/lib/constants/dashboard";
import { getUserRoleLabel, formatUserName, hasActiveFilters } from "@/lib/utils/dashboard.utils";
import { usePagination } from "@/lib/hooks/usePagination";

import type { DashboardData, SearchFilters } from "@/types/dashboard";
import type { DataTableColumn, DataTableAction } from "@/components/ui/data-table/types";
import type { User } from "@/hooks/use-auth";

interface OptimizedDashboardProps {
  user: User | null;
}

export function OptimizedDashboard({ user }: OptimizedDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const userRole = user?.userRole || USER_ROLES.GUEST;
  const userLabel = getUserRoleLabel(userRole);

  // Pagination hook
  const pagination = usePagination({
    totalItems: dashboardData?.stats.totalItems || 0,
    onPageChange: (page, pageSize) => {
      fetchDashboardData(searchFilters, page, pageSize);
    },
  });

  // Fetch dashboard data
  const fetchDashboardData = useCallback(
    async (filters: SearchFilters = {}, pageIndex = 0, pageSize = 10) => {
      if (userRole === USER_ROLES.GUEST) return;

      setIsLoading(true);
      try {
        const authToken = await ensureAuthenticated();
        const params = { pageIndex, pageSize, ...filters };

        const result = hasActiveFilters(filters)
          ? await searchDashboardData(userRole, params, authToken)
          : await getDashboardData(userRole, params, authToken);

        if (result.success && result.data) {
          setDashboardData(result.data);
        } else {
          toast.error(result.error || 'Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        if (error instanceof Error && error.message.includes('Authentication required')) {
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        } else {
          toast.error('Failed to fetch dashboard data');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [userRole]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      const filters: SearchFilters = query ? { email: query } : {};
      setSearchFilters(filters);
      pagination.actions.reset();
      fetchDashboardData(filters, 0, pagination.pageSize);
    },
    [fetchDashboardData, pagination]
  );

  // Handle user actions
  const handleUserAction = useCallback(
    async (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
      try {
        const authToken = await ensureAuthenticated();
        const result = await updateUserStatus(userRole, userId, action, authToken);

        if (result.success) {
          toast.success(`Successfully ${action}d user`);
          fetchDashboardData(searchFilters, pagination.currentPage, pagination.pageSize);
        } else {
          toast.error(result.error || `Failed to ${action} user`);
        }
      } catch (error) {
        toast.error(`Failed to ${action} user`);
      }
    },
    [userRole, searchFilters, pagination, fetchDashboardData]
  );

  // Table columns configuration
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, item) => (
        <div className="font-medium">
          {item.first_name || item.last_name 
            ? formatUserName(item.first_name, item.last_name)
            : item.contactName || 'Unknown User'
          }
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value, item) => (
        <div className="text-sm text-muted-foreground">
          {value || item.contactEmail || 'No email'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'business',
      label: userRole === USER_ROLES.SUPER_ADMIN ? 'Business Name' : 'Company',
      sortable: true,
      render: (_, item) => (
        <div className="text-sm">
          {item.businessName || item.buyersCompanyName || 'No company'}
        </div>
      ),
    },
  ], [userRole]);

  // Table actions configuration
  const actions: DataTableAction[] = useMemo(() => [
    {
      label: 'Activate',
      icon: UserCheck,
      onClick: (item) => handleUserAction(item.id, 'activate'),
      hidden: (item) => item.status === 'active',
    },
    {
      label: 'Deactivate',
      icon: UserX,
      onClick: (item) => handleUserAction(item.id, 'deactivate'),
      hidden: (item) => item.status !== 'active',
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: (item) => handleUserAction(item.id, 'delete'),
      variant: 'destructive' as const,
    },
  ], [handleUserAction]);

  // Stats data
  const statsData = useMemo(() => [
    {
      name: `Total ${getUserRoleLabel(userRole, true)}`,
      value: (dashboardData?.stats.totalItems || 0).toLocaleString(),
      change: "+12.5%",
      changeType: "positive" as const,
      href: "#",
    },
    {
      name: `Active ${getUserRoleLabel(userRole, true)}`,
      value: (dashboardData?.stats.totalActive || 0).toLocaleString(),
      change: "+8.2%",
      changeType: "positive" as const,
      href: "#",
    },
    {
      name: "Pending Approvals",
      value: (dashboardData?.stats.totalPending || 0).toLocaleString(),
      change: "+15.3%",
      changeType: "positive" as const,
      href: "#",
    },
  ], [dashboardData, userRole]);

  // Activity data
  const recentActivities = useMemo(() => [
    { id: '1', title: 'New user registered', time: '1 hour ago', type: 'success' as const },
    { id: '2', title: 'User updated profile', time: '2 hours ago', type: 'info' as const },
    { id: '3', title: 'Payment processed', time: '3 hours ago', type: 'success' as const },
  ], []);

  const growthMetrics = useMemo(() => [
    { 
      label: 'User Growth', 
      value: `${dashboardData?.stats.userGrowth || 0}%`, 
      color: 'text-green-600' 
    },
    { 
      label: 'Revenue Growth', 
      value: `${dashboardData?.stats.revenueGrowth || 0}%`, 
      color: 'text-indigo-600' 
    },
  ], [dashboardData]);

  const quickStats = useMemo(() => [
    { label: 'Conversion Rate', value: '24.8%' },
    { label: 'Avg. Session Time', value: '4m 32s' },
    { label: 'Bounce Rate', value: '32.5%' },
  ], []);

  // Initialize dashboard
  useEffect(() => {
    const initDashboard = async () => {
      debugAuthState();

      if (!user) {
        const restored = attemptSessionRestore();
        if (!restored && shouldRedirectToLogin()) {
          window.location.href = '/login';
          return;
        }
        setTimeout(() => debugAuthState(), 500);
      }
    };

    initDashboard();
  }, [user]);

  // Fetch data when user role changes
  useEffect(() => {
    if (userRole !== USER_ROLES.GUEST) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [userRole, fetchDashboardData]);

  // Loading state
  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-gray-700 font-medium mt-4">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Page Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your {getUserRoleLabel(userRole, true).toLowerCase()}.
            </p>
          </div>
        </div>

        {/* Stats Grid - Mobile Responsive */}
        <div className="transition-opacity duration-300 ease-in-out">
          <StatCards data={statsData} columns={3} />
        </div>

        {/* Data Table - Mobile Optimized */}
        <div className="transition-opacity duration-300 ease-in-out">
          <DataTable
            data={dashboardData?.data || []}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            searchable
            searchPlaceholder={`Search ${getUserRoleLabel(userRole, true).toLowerCase()}...`}
            onSearch={handleSearch}
            pagination={{
              totalItems: dashboardData?.stats.totalItems || 0,
              totalPages: dashboardData?.totalPages || 1,
              currentPage: pagination.currentPage,
              pageSize: pagination.pageSize,
              onPageChange: pagination.actions.goToPage,
              onPageSizeChange: pagination.actions.changePageSize,
            }}
            emptyState={{
              icon: userRole === USER_ROLES.SUPER_ADMIN ? Building2 : Users,
              title: `No ${getUserRoleLabel(userRole, true).toLowerCase()} found`,
              description: "Try adjusting your search query or filters",
            }}
          />
        </div>

        {/* Activity Overview Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-300 ease-in-out">
          <ActivityCard
            title="Recent Activity"
            icon={TrendingUp}
            activities={recentActivities}
          />
          
          <SimpleStatCard
            title="Growth Rate"
            icon={BarChart3}
            items={growthMetrics}
          />
          
          <SimpleStatCard
            title="Quick Stats"
            icon={Activity}
            items={quickStats}
          />
        </div>
      </div>
    </div>
  );
}