'use server';

import { DashboardData, PaginationParams, SearchFilters } from '@/types/dashboard';
export async function getDashboardData(
  userRole: string,
  params: PaginationParams & SearchFilters = { pageIndex: 0, pageSize: 10 },
  authToken?: string
): Promise<{ success: boolean; data?: DashboardData; error?: string }> {
  
  console.log('🎯 getDashboardData called with:', { userRole, params, hasAuthToken: !!authToken });
  
  try {
    if (!authToken) {
      console.log('❌ No authToken provided to getDashboardData');
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
    
    console.log('🔍 Has search filters:', hasSearchFilters);
    
    let result;
    
    if (hasSearchFilters) {
      console.log('🔍 Using search function');
      result = await searchDashboardData(userRole, params, authToken);
      return result;
    } else {
      console.log('📊 Using regular data fetch for role:', userRole);
      switch (userRole) {
        case 'super_admin':
          console.log('👑 Fetching super admin data');
          // Import and use superadmin actions
          const { getAllBusinessOwners } = await import('./superadmin.actions');
          result = await getAllBusinessOwners({
            pageIndex: params.pageIndex,
            pageSize: params.pageSize,
            withBuyers: true, // Include buyers data for dashboard
          }, authToken);
          break;
          
        case 'business_owner':
          console.log('🏢 Fetching business owner data (buyers)');
          // Import and use business owner actions
          const { getAllBuyers } = await import('./business-owner.actions');
          result = await getAllBuyers({
            pageIndex: params.pageIndex,
            pageSize: params.pageSize,
          }, authToken);
          console.log('🏢 getAllBuyers result:', { 
            success: result.success, 
            hasData: !!result.data,
            error: result.error 
          });
          break;
          
        default:
          console.log('❌ Invalid user role:', userRole);
          return { success: false, error: 'Invalid user role' };
      }
    }

    if (!result.success) {
      console.log('❌ Action result failed:', result.error);
      return result;
    }

    console.log('📦 Raw result from action:', {
      success: result.success,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : []
    });

    // Match your exact response structure: response.data.data
    const apiResponse = result.data || {};
    const apiData = apiResponse.data || {};

    console.log('🔧 Processing result structure:', {
      apiResponseKeys: Object.keys(apiResponse),
      apiDataKeys: Object.keys(apiData),
      dataArray: Array.isArray(apiData.data) ? apiData.data.length : 'not array'
    });

    const dashboardData: DashboardData = {
      data: apiData?.data || [],
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
      pageIndex: apiData?.pageIndex ?? params.pageIndex,
      pageSize: apiData?.pageSize ?? params.pageSize,
    };

    console.log('✅ Final dashboard data:', {
      dataCount: dashboardData.data.length,
      stats: dashboardData.stats,
      totalPages: dashboardData.totalPages,
      pageIndex: dashboardData.pageIndex,
      pageSize: dashboardData.pageSize
    });

    console.log('📋 Sample data items:', dashboardData.data.slice(0, 2).map(item => ({
      id: item.id,
      contactName: item.contactName,
      email: item.email,
      buyersCompanyName: item.buyersCompanyName,
      status: item.status
    })));

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
    
    let result;
    
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

    if (!result.success) {
      return result;
    }

    // Match your exact response structure: response.data.data
    const apiResponse = result.data || {};
    const apiData = apiResponse.data || {};

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
      totalPages: apiData?.totalPages || Math.ceil((apiData?.totalItems || 0) / filters.pageSize),
      pageIndex: apiData?.pageIndex ?? filters.pageIndex,
      pageSize: apiData?.pageSize ?? filters.pageSize,
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
    
    let result;
    
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