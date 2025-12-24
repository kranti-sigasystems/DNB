'use server';

import { DashboardData, PaginationParams, SearchFilters } from '@/types/dashboard';
export async function getDashboardData(
  userRole: string,
  params: PaginationParams & SearchFilters = { pageIndex: 0, pageSize: 10 },
  authToken?: string
): Promise<{ success: boolean; data?: DashboardData; error?: string }> {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    // Check if this is a search request (has any search filters)
    const hasSearchFilters = Boolean(
      params.email || 
      params.status || 
      params.country || 
      params.isVerified !== undefined ||
      params.businessName ||
      params.first_name ||
      params.last_name ||
      params.phoneNumber ||
      params.postalCode ||
      params.contactName ||
      params.buyersCompanyName ||
      params.productName ||
      params.locationName
    );
    
    let result: any;
    
    if (hasSearchFilters) {
      result = await searchDashboardData(userRole, params, authToken);
      return result;
    } else {
      switch (userRole) {
        case 'super_admin':
          // Import and use superadmin actions
          const { getAllBusinessOwners } = await import('./superadmin.actions');
          result = await getAllBusinessOwners({
            pageIndex: params.pageIndex,
            pageSize: params.pageSize,
            withBuyers: true, // Include buyers data for dashboard
          }, authToken);
          break;
          
        case 'business_owner':
          // Import and use business owner actions
          const { getAllBuyers } = await import('./business-owner.actions');
          result = await getAllBuyers({
            pageIndex: params.pageIndex,
            pageSize: params.pageSize,
          }, authToken);
          break;
          
        default:
          return { success: false, error: 'Invalid user role' };
      }
    }

    if (!result || !result.success) {
      return { 
        success: false, 
        error: result?.error || 'Failed to fetch data' 
      };
    }

    // Handle different response structures
    const responseData = result.data || {};
    let apiData: any = {};
    
    // Check if the response has nested data structure
    if (responseData.data) {
      apiData = responseData.data;
    } else {
      apiData = responseData;
    }

    const dashboardData: DashboardData = {
      data: apiData?.data || apiData?.businessOwners || apiData?.buyers || [],
      stats: {
        totalItems: apiData?.totalItems || 0,
        totalActive: apiData?.totalActive || 0,
        totalInactive: apiData?.totalInactive || 0,
        totalDeleted: apiData?.totalDeleted || 0,
        totalPending: apiData?.totalPending || 0,
        revenueGrowth: apiData?.revenueGrowth || 0,
        userGrowth: apiData?.userGrowth || 0,
      },
      totalPages: apiData?.totalPages || Math.ceil((apiData?.totalItems || 0) / params.pageSize),
      pageIndex: apiData?.pageIndex ?? apiData?.page ?? params.pageIndex,
      pageSize: apiData?.pageSize ?? apiData?.limit ?? params.pageSize,
    };

    return { success: true, data: dashboardData };
  } catch (error) {
    console.error('❌ getDashboardData error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' 
    };
  }
}

export async function searchDashboardData(
  userRole: string,
  filters: SearchFilters & PaginationParams,
  authToken?: string
): Promise<{ success: boolean; data?: DashboardData; error?: string }> {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    let result: any;
    
    switch (userRole) {
      case 'super_admin':
        // Import and use superadmin search
        const { searchBusinessOwners } = await import('./superadmin.actions');
        
        // Calculate offset from pageIndex and pageSize
        const offset = (filters.pageIndex || 0) * (filters.pageSize || 10);
        
        result = await searchBusinessOwners({
          limit: filters.pageSize,
          offset: offset,
          email: filters.email,
          status: filters.status,
          businessName: filters.businessName,
          first_name: filters.first_name,
          last_name: filters.last_name,
          phoneNumber: filters.phoneNumber,
          postalCode: filters.postalCode,
        }, authToken);
        break;
        
      case 'business_owner':
        // Import and use business owner search
        const { searchBuyers } = await import('./business-owner.actions');
        result = await searchBuyers({
          page: filters.pageIndex,
          limit: filters.pageSize,
          email: filters.email,
          status: filters.status,
          country: filters.country,
          isVerified: filters.isVerified,
        }, authToken);
        break;
        
      default:
        return { success: false, error: 'Invalid user role' };
    }

    if (!result || !result.success) {
      return { 
        success: false, 
        error: result?.error || 'Failed to search data' 
      };
    }

    // Handle different response structures
    const responseData = result.data || {};
    let apiData: any = {};
    
    // Check if the response has nested data structure
    if (responseData.data) {
      apiData = responseData.data;
    } else {
      apiData = responseData;
    }

    const dashboardData: DashboardData = {
      data: apiData?.data || apiData?.businessOwners || apiData?.buyers || [],
      stats: {
        totalItems: apiData?.totalItems || 0,
        totalActive: apiData?.totalActive || 0,
        totalInactive: apiData?.totalInactive || 0,
        totalDeleted: apiData?.totalDeleted || 0,
        totalPending: apiData?.totalPending || 0,
        revenueGrowth: apiData?.revenueGrowth || 0,
        userGrowth: apiData?.userGrowth || 0,
      },
      totalPages: apiData?.totalPages || Math.ceil((apiData?.totalItems || 0) / (filters.pageSize || 10)),
      pageIndex: apiData?.pageIndex ?? apiData?.page ?? filters.pageIndex,
      pageSize: apiData?.pageSize ?? apiData?.limit ?? filters.pageSize,
    };

    return { success: true, data: dashboardData };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search dashboard data' 
    };
  }
}

export async function updateUserStatus(
  userRole: string,
  userId: string,
  action: 'activate' | 'deactivate' | 'delete',
  authToken?: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    let result: any;
    
    switch (userRole) {
      case 'super_admin':
        switch (action) {
          case 'activate':
            const { activateBusinessOwner } = await import('./superadmin.actions');
            result = await activateBusinessOwner(userId, authToken);
            break;
          case 'deactivate':
            const { deactivateBusinessOwner } = await import('./superadmin.actions');
            result = await deactivateBusinessOwner(userId, authToken);
            break;
          case 'delete':
            const { deleteBusinessOwner } = await import('./superadmin.actions');
            result = await deleteBusinessOwner(userId, authToken);
            break;
        }
        break;
        
      case 'business_owner':
        switch (action) {
          case 'activate':
            const { activateBuyer } = await import('./business-owner.actions');
            result = await activateBuyer(userId, authToken);
            break;
          case 'deactivate':
            const { deactivateBuyer } = await import('./business-owner.actions');
            result = await deactivateBuyer(userId, authToken);
            break;
          case 'delete':
            const { deleteBuyer } = await import('./business-owner.actions');
            result = await deleteBuyer(userId, authToken);
            break;
        }
        break;
        
      default:
        return { success: false, error: 'Invalid user role' };
    }

    return result || { success: false, error: 'No result from action' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user status' 
    };
  }
}