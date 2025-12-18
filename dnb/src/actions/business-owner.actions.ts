'use server';

import { apiClient } from '@/utils/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://digital-negotiation-book-server.vercel.app/api';

// Get all buyers for business owner
export async function getAllBuyers(params: {
  pageIndex?: number;
  pageSize?: number;
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
    
    // Match your exact API parameter names
    if (params.pageIndex !== undefined) queryParams.append('pageIndex', params.pageIndex.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
    if (params.email) queryParams.append('email', params.email);
    if (params.status) queryParams.append('status', params.status);
    if (params.country) queryParams.append('country', params.country);
    if (params.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString());

    const url = `/business-owner/get-all-buyers?${queryParams}`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner getAllBuyers error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch buyers' 
    };
  }
}

// Search buyers - matches your frontend searchBuyers implementation
export async function searchBuyers(filters: {
  page?: number;
  limit?: number;
  email?: string;
  status?: string;
  country?: string;
  isVerified?: boolean;
  contactName?: string;
  buyersCompanyName?: string;
  productName?: string;
  locationName?: string;
}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const queryParams = new URLSearchParams();
    
    // Match your exact frontend parameter structure
    if (filters.country) queryParams.append('country', filters.country);
    if (filters.productName) queryParams.append('productName', filters.productName);
    if (filters.locationName) queryParams.append('locationName', filters.locationName);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.isVerified !== undefined) queryParams.append('isVerified', filters.isVerified.toString());
    if (filters.page !== undefined) queryParams.append('page', filters.page.toString());
    if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString());

    const url = `/business-owner/buyers/search?${queryParams}`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner searchBuyers error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search buyers' 
    };
  }
}

// Activate buyer - matches your frontend activateBuyer endpoint
export async function activateBuyer(buyerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/business-owner/activate-buyer/${buyerId}/activate`;
    const result = await apiClient.patch(url, undefined, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner activateBuyer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to activate buyer' 
    };
  }
}

// Deactivate buyer - matches your frontend deactivateBuyer endpoint
export async function deactivateBuyer(buyerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/business-owner/deactivate-buyer/${buyerId}/deactivate`;
    const result = await apiClient.patch(url, undefined, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner deactivateBuyer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deactivate buyer' 
    };
  }
}

// Delete buyer - matches your frontend deleteBuyer endpoint
export async function deleteBuyer(buyerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/business-owner/delete-buyer/${buyerId}`;
    const result = await apiClient.delete(url, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner deleteBuyer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete buyer' 
    };
  }
}

// Get buyer by ID - matches your frontend getBuyerById endpoint
export async function getBuyerById(buyerId: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/business-owner/get-buyer/${buyerId}`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner getBuyerById error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get buyer' 
    };
  }
}

// Update buyer - matches your frontend updateBuyer endpoint
export async function updateBuyer(buyerId: string, updateData: {
  contactName?: string;
  contactEmail?: string;
  buyersCompanyName?: string;
  status?: string;
  [key: string]: any;
}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    // Clean the data like your frontend does
    const sanitizedData = { ...updateData };
    delete sanitizedData.createdAt;
    delete sanitizedData.updatedAt;
    delete sanitizedData.id;
    
    const url = `/business-owner/edit-buyer/${buyerId}/edit`;
    const result = await apiClient.patch(url, sanitizedData, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner updateBuyer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update buyer' 
    };
  }
}

// Create new buyer - matches your frontend addBuyer endpoint
export async function createBuyer(buyerData: {
  contactName: string;
  contactEmail: string;
  buyersCompanyName: string;
  country?: string;
  [key: string]: any;
}, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/business-owner/add-buyer`;
    const result = await apiClient.post(url, buyerData, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner createBuyer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create buyer' 
    };
  }
}

// Get buyers list - matches your frontend getBuyersList endpoint
export async function getBuyersList(authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const url = `/business-owner/get-buyers-list`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner getBuyersList error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get buyers list' 
    };
  }
}

// Check registration number uniqueness - matches your frontend checkRegistrationNumber endpoint
export async function checkRegistrationNumber(registrationNumber: string, authToken?: string) {
  
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    if (!registrationNumber) {
      return { success: false, error: 'Registration number is required' };
    }
    
    const url = `/business-owner/check-registration/${registrationNumber}`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner checkRegistrationNumber error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check registration number' 
    };
  }
}

// Check unique fields - matches your frontend checkUnique endpoint
export async function checkUnique(params: Record<string, any>, authToken?: string) {
  try {
    if (!authToken) {
      return { success: false, error: 'Authentication token required' };
    }
    
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `/business-owner/check-unique?${queryParams}`;
    const result = await apiClient.get(url, authToken);
    
    return result;
  } catch (error) {
    console.error('💥 BusinessOwner checkUnique error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check unique fields' 
    };
  }
}