'use server';

import { apiClient } from '@/utils/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://digital-negotiation-book-server.vercel.app/api';

// Get all business owners - matches your backend controller
export async function getAllBusinessOwners(params: {
  pageIndex?: number;
  pageSize?: number;
  withBuyers?: boolean;
  email?: string;
  status?: string;
  country?: string;
  isVerified?: boolean;
} = {}, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const queryParams = new URLSearchParams();
    
    // Match your backend controller parameters
    if (params.pageIndex !== undefined) queryParams.append('pageIndex', params.pageIndex.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
    if (params.withBuyers !== undefined) queryParams.append('withBuyers', params.withBuyers.toString());
    if (params.email) queryParams.append('email', params.email);
    if (params.status) queryParams.append('status', params.status);
    if (params.country) queryParams.append('country', params.country);
    if (params.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString());

    const url = `/superadmin/business-owners?${queryParams}`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch business owners' 
    };
  }
}

// Search business owners - matches your backend searchBusinessOwners repository method
export async function searchBusinessOwners(filters: {
  page?: number;
  limit?: number;
  offset?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  businessName?: string;
  phoneNumber?: string;
  postalCode?: string;
  status?: string;
}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const queryParams = new URLSearchParams();
    
    // Match your backend repository search parameters
    if (filters.first_name) queryParams.append('first_name', filters.first_name);
    if (filters.last_name) queryParams.append('last_name', filters.last_name);
    if (filters.email) queryParams.append('email', filters.email);
    if (filters.businessName) queryParams.append('businessName', filters.businessName);
    if (filters.phoneNumber) queryParams.append('phoneNumber', filters.phoneNumber);
    if (filters.postalCode) queryParams.append('postalCode', filters.postalCode);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString());
    if (filters.offset !== undefined) queryParams.append('offset', filters.offset.toString());

    const url = `/superadmin/business-owners/search?${queryParams}`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search business owners' 
    };
  }
}

// Activate business owner
export async function activateBusinessOwner(businessOwnerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/superadmin/business-owner/${businessOwnerId}/activate`;
    const result = await apiClient.patch(url, undefined, authToken);
    
    return result;
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to activate business owner' 
    };
  }
}

// Deactivate business owner
export async function deactivateBusinessOwner(businessOwnerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/superadmin/business-owner/${businessOwnerId}/deactivate`;
    const result = await apiClient.patch(url, undefined, authToken);
    
    return result;
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deactivate business owner' 
    };
  }
}

// Delete business owner
export async function deleteBusinessOwner(businessOwnerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/superadmin/business-owner/${businessOwnerId}`;
    const result = await apiClient.delete(url, authToken);
    
    return result;
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete business owner' 
    };
  }
}

// Get business owner by ID
export async function getBusinessOwnerById(businessOwnerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/superadmin/business-owner/${businessOwnerId}`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get business owner' 
    };
  }
}

// Update business owner
export async function updateBusinessOwner(businessOwnerId: string, updateData: {
  businessName?: string;
  email?: string;
  status?: string;
  [key: string]: any;
}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/superadmin/business-owner/${businessOwnerId}`;
    const result = await apiClient.patch(url, updateData, authToken);
    
    return result;
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update business owner' 
    };
  }
}