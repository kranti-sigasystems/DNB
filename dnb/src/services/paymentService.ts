// This service is now deprecated - use server actions directly
// Keeping for backward compatibility only

import apiClient from '@/utils/apiClient';
import { AxiosError } from 'axios';

export interface PaymentPayload {
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface BusinessOwnerPayload {
  businessName: string;
  email: string;
  phoneNumber?: string;
  country: string;
  [key: string]: any;
}

// Use createCheckoutSession server action directly instead
export const createPayment = async (payload: PaymentPayload): Promise<string> => {
  throw new Error('Use createCheckoutSession server action directly instead of this service');
};

export const becomeBusinessOwner = async (payload: BusinessOwnerPayload) => {
  try {
    // const response = await apiClient.post('/business-owner/become-business-owner', payload, {
    //   withCredentials: true,
    // });

    const response = await apiClient.post('/business-owner/become-business-owner', payload);
    return response.data;
  } catch (err) {
    console.error('Error in becomeBusinessOwner service:', err);
    const error = err as AxiosError<{ message: string }>;
    throw error.response?.data?.message || 'Failed to create business owner';
  }
};

export const checkRegistrationNumber = async (registrationNumber: string) => {
  const res = await apiClient.get(`/business-owner/check-registration/${registrationNumber}`);
  return res.data;
};

export const getPaymentById = async (paymentId: string) => {
  if (!paymentId) throw new Error('Payment ID is required');
  return apiClient.get(`/payments/${paymentId}`);
};

// GET /api/payments/invoice/:userId
// export const getInvoice = async (userId) => {
//     try {
//         // Replace apiClient with your actual HTTP client logic (e.g., fetch or axios)
//         const response = await fetch(`/api/payments/invoice/${userId}`, {
//              method: 'GET',
//              headers: {
//                  'Content-Type': 'application/json',
//                  // Include any necessary authentication headers/cookies
//              },
//              // Assuming this handles cookie inclusion if needed
//              // withCredentials: true,
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || "Failed to fetch invoice");
//         }

//         return await response.json(); // <-- returns { invoicePdf: '...' }
//     } catch (err) {
//         console.error("Error in getInvoice service:", err);
//         // Better error handling for the component
//         throw new Error(err.message || "Failed to get invoice due to network error");
//     }
// };
