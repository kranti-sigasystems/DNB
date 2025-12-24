"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart3, TrendingUp, Activity, Users, Building2, UserCheck, UserX, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/data-table/status-badge";
import { StatCards, ActivityCard, SimpleStatCard } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useAlertDialog } from "@/components/ui/alert-dialog";
import { getDashboardData, searchDashboardData, updateUserStatus } from "@/actions/dashboard.actions";
import { ensureAuthenticated } from "@/utils/tokenManager";
import { debugAuthState } from "@/utils/debugAuth";
import { attemptSessionRestore, shouldRedirectToLogin } from "@/utils/sessionRestore";

import { USER_ROLES, type UserRole } from "@/lib/constants/dashboard";
import { getUserRoleLabel, formatUserName, hasActiveFilters } from "@/lib/utils/dashboard.utils";
import { usePagination } from "@/lib/hooks/usePagination";

import type { DashboardData, SearchFilters } from "@/types/dashboard";
import type { DataTableColumn, DataTableAction } from "@/components/ui/data-table/types";
import type { User } from "@/utils/auth";

interface OptimizedDashboardProps {
  user: User | null;
}

export function OptimizedDashboard({ user }: OptimizedDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const { showAlert, AlertDialog } = useAlertDialog();

  const userRole: UserRole = (user?.userRole as UserRole) || USER_ROLES.GUEST;

  const handlePageChange = useCallback(async (page: number, pageSize: number) => {
    if (userRole === USER_ROLES.GUEST) {
      return;
    }

    try {
      const authToken = await ensureAuthenticated();
      const params = { pageIndex: page, pageSize, ...searchFilters };

      const result = hasActiveFilters(searchFilters)
        ? await searchDashboardData(userRole, params, authToken)
        : await getDashboardData(userRole, params, authToken);

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        toast.error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('❌ Dashboard pagination error:', error);
      toast.error('Failed to fetch dashboard data');
    }
  }, [userRole, searchFilters]);

  // Pagination hook
  const pagination = usePagination({
    totalItems: dashboardData?.stats.totalItems || 0,
    onPageChange: handlePageChange,
  });

  // Fetch dashboard data
  const fetchDashboardData = useCallback(
    async (filters: SearchFilters = {}, pageIndex = 0, pageSize = 10) => {
      
      if (userRole === USER_ROLES.GUEST) {
        return;
      }

      // Don't show full loading if we're just refreshing data
      setIsLoading(prev => {
        // Only set loading to true if we don't have data yet
        return dashboardData === null ? true : prev;
      });
      
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
        console.error('❌ Dashboard fetch error:', error);
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
    [userRole] // Remove dashboardData from dependencies to prevent infinite loop
  );

  // Handle search
  const handleSearch = useCallback(
    async (query: string) => {
      const filters: SearchFilters = query ? { email: query } : {};
      setSearchFilters(filters);
      
      // Reset pagination and fetch data
      if (userRole === USER_ROLES.GUEST) {
        return;
      }

      try {
        const authToken = await ensureAuthenticated();
        const params = { pageIndex: 0, pageSize: 10, ...filters };

        const result = hasActiveFilters(filters)
          ? await searchDashboardData(userRole, params, authToken)
          : await getDashboardData(userRole, params, authToken);

        if (result.success && result.data) {
          setDashboardData(result.data);
        } else {
          toast.error(result.error || 'Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('❌ Dashboard search error:', error);
        toast.error('Failed to fetch dashboard data');
      }
    },
    [userRole]
  );

  // Handle user actions with confirmation
  const handleUserAction = useCallback(
    (userId: string, action: 'activate' | 'deactivate' | 'delete', userName: string) => {
      
      const actionMessages = {
        activate: {
          title: 'Activate User',
          description: 'Are you sure you want to activate this user? They will be able to access the system.',
        },
        deactivate: {
          title: 'Deactivate User',
          description: 'Are you sure you want to deactivate this user? They will lose access to the system.',
        },
        delete: {
          title: 'Delete User',
          description: 'Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data.',
        },
      };

      const config = actionMessages[action];
      
      showAlert({
        title: config.title,
        description: config.description,
        action: action,
        itemName: userName,
        onConfirm: async () => {
          try {
            const authToken = await ensureAuthenticated();
            const result = await updateUserStatus(userRole, userId, action, authToken);

            if (result.success) {
              toast.success(`Successfully ${action}d user`);
              // Refresh data after action
              const params = { pageIndex: pagination.currentPage, pageSize: pagination.pageSize, ...searchFilters };
              const refreshResult = hasActiveFilters(searchFilters)
                ? await searchDashboardData(userRole, params, authToken)
                : await getDashboardData(userRole, params, authToken);

              if (refreshResult.success && refreshResult.data) {
                setDashboardData(refreshResult.data);
              }
            } else {
              toast.error(result.error || `Failed to ${action} user`);
            }
          } catch (error) {
            console.error('🎯 Action execution failed:', error);
            toast.error(`Failed to ${action} user`);
          }
        },
      });
    },
    [userRole, searchFilters, pagination.currentPage, pagination.pageSize, showAlert]
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
      onClick: (item) => handleUserAction(item.id, 'activate', formatUserName(item)),
      hidden: (item) => item.status === 'active',
    },
    {
      label: 'Deactivate',
      icon: UserX,
      onClick: (item) => handleUserAction(item.id, 'deactivate', formatUserName(item)),
      hidden: (item) => item.status !== 'active',
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: (item) => handleUserAction(item.id, 'delete', formatUserName(item)),
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

  // Fetch data when user role changes - only run once when component mounts or userRole changes
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (userRole !== USER_ROLES.GUEST && isMounted) {
        await fetchDashboardData();
      } else if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [userRole]); // Remove fetchDashboardData from dependencies

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
      <div className="dashboard-container">
        {/* Page Header - Mobile Optimized with enhanced light theme */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/30 shadow-sm">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your {getUserRoleLabel(userRole, true).toLowerCase()}.
            </p>
          </div>
        </div>

        {/* Stats Grid - Mobile Responsive with enhanced styling */}
        <div className="transition-opacity duration-300 ease-in-out mb-6">
          <StatCards data={statsData} columns={3} />
        </div>

        {/* Data Table - Mobile Optimized with enhanced card styling */}
        <div className="transition-opacity duration-300 ease-in-out mb-6">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm overflow-hidden">
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
        </div>

        {/* Activity Overview Cards - Mobile Responsive Grid with enhanced styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-300 ease-in-out">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm overflow-hidden">
            <ActivityCard
              title="Recent Activity"
              icon={TrendingUp}
              activities={recentActivities}
            />
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm overflow-hidden">
            <SimpleStatCard
              title="Growth Rate"
              icon={BarChart3}
              items={growthMetrics}
            />
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm overflow-hidden">
            <SimpleStatCard
              title="Quick Stats"
              icon={Activity}
              items={quickStats}
            />
          </div>
        </div>
      </div>
      
      {/* Alert Dialog */}
      <AlertDialog />
    </div>
  );
}