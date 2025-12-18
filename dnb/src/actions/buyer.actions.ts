'use server';

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://digital-negotiation-book-server.vercel.app/api';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  
  // Try multiple possible cookie names for the access token
  let accessToken = cookieStore.get('accessToken')?.value || 
                   cookieStore.get('authToken')?.value ||
                   cookieStore.get('token')?.value;
  
  if (!accessToken) {
    console.warn('⚠️ Buyer - No access token found in any cookie variant');
  }
  
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

// Get current buyer ID from session
async function getCurrentBuyerId() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('user')?.value;
  
  if (!userCookie) {
    throw new Error('User session not found');
  }
  
  const user = JSON.parse(userCookie);
  const buyerId = user?.buyerId || user?.id;
  
  if (!buyerId) {
    throw new Error('Buyer ID not found in session');
  }
  
  return buyerId;
}

// Get buyer profile
export async function getBuyerProfile() {
  
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/buyer/profile`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('💥 Buyer getBuyerProfile error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get buyer profile' 
    };
  }
}

// Update buyer profile
export async function updateBuyerProfile(profileData: {
  contactName?: string;
  contactEmail?: string;
  buyersCompanyName?: string;
  country?: string;
  [key: string]: any;
}) {
  
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/buyer/profile`;

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('💥 Buyer updateBuyerProfile error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update buyer profile' 
    };
  }
}

// Get buyer dashboard data
export async function getBuyerDashboard() {
  
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/buyer/dashboard`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('💥 Buyer getBuyerDashboard error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get buyer dashboard' 
    };
  }
}

// Get buyer offers
export async function getBuyerOffers(params: {
  pageIndex?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  
  try {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params.pageIndex !== undefined) queryParams.append('pageIndex', params.pageIndex.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
    if (params.status) queryParams.append('status', params.status);

    const url = `${API_BASE_URL}/buyer/offers?${queryParams}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('💥 Buyer getBuyerOffers error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get buyer offers' 
    };
  }
}

// Create new offer
export async function createOffer(offerData: {
  businessOwnerId: string;
  offerAmount: number;
  message?: string;
  [key: string]: any;
}) {
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/buyer/create-offer`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(offerData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('💥 Buyer createOffer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create offer' 
    };
  }
}

// Update offer
export async function updateOffer(offerId: string, offerData: {
  offerAmount?: number;
  message?: string;
  status?: string;
  [key: string]: any;
}) {
  
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/buyer/offer/${offerId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(offerData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('💥 Buyer updateOffer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update offer' 
    };
  }
}

// Delete offer
export async function deleteOffer(offerId: string) {
  console.log('🗑️ deleteOffer called for ID:', offerId);
  
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/buyer/offer/${offerId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('💥 Buyer deleteOffer error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete offer' 
    };
  }
}