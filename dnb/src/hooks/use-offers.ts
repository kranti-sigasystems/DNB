import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStoredSession } from '@/utils/auth';
import {
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  sendOfferEmail,
} from '@/actions/offer.actions';

interface UseOffersOptions {
  authToken?: string;
}

export interface OfferSearchParams {
  offerName?: string;
  businessName?: string;
  productName?: string;
  status?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface OffersResponse {
  data: any[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

export function useOffers(options: UseOffersOptions = {}) {
  const [data, setData] = useState<OffersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const getAuthToken = useCallback(() => {
    if (options.authToken) return options.authToken;
    const session = getStoredSession();
    return session?.accessToken;
  }, [options.authToken]);

  const fetchOffers = useCallback(
    async (
      params: OfferSearchParams = {},
      isSearch = false,
      isPagination = false,
      showLoading = true
    ) => {
      try {
        const authToken = getAuthToken();
        
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        if (isPagination) {
          setPaginationLoading(true);
        } else if (showLoading && !isSearch) {
          setLoading(true);
        }
        
        // Call the server action with auth token
        const response = await getAllOffers(params, authToken);
        setData(response);
      } catch (error: any) {
        console.error('❌ Error fetching offers:', error);
        showError(error.message || 'Failed to fetch offers');
        setData(null);
      } finally {
        setLoading(false);
        setPaginationLoading(false);
      }
    },
    [getAuthToken, showError]
  );

  const handleUpdateOffer = useCallback(
    async (offerId: number, updateData: any): Promise<boolean> => {
      try {
        setActionLoading(true);
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await updateOffer(offerId, updateData, authToken);
        
        if (result.success) {
          showSuccess('Offer updated successfully!');
          // Refresh the list
          await fetchOffers({
            pageIndex: data?.pageIndex || 0,
            pageSize: data?.pageSize || 10,
          });
          return true;
        } else {
          showError(result.error || 'Failed to update offer');
          return false;
        }
      } catch (error: any) {
        console.error('Error updating offer:', error);
        showError(error.message || 'Failed to update offer');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [getAuthToken, showError, showSuccess, fetchOffers, data]
  );

  const handleDeleteOffer = useCallback(
    async (offerId: number): Promise<void> => {
      try {
        setActionLoading(true);
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await deleteOffer(offerId, authToken);
        
        if (result.success) {
          showSuccess('Offer deleted successfully!');
          // Refresh the list
          await fetchOffers({
            pageIndex: data?.pageIndex || 0,
            pageSize: data?.pageSize || 10,
          });
        } else {
          showError(result.error || 'Failed to delete offer');
        }
      } catch (error: any) {
        console.error('Error deleting offer:', error);
        showError(error.message || 'Failed to delete offer');
      } finally {
        setActionLoading(false);
      }
    },
    [getAuthToken, showError, showSuccess, fetchOffers, data]
  );

  const handleGetOfferById = useCallback(
    async (offerId: number): Promise<any> => {
      try {
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await getOfferById(offerId, authToken);
        
        if (result.success && result.data) {
          return result;
        } else {
          showError(result.error || 'Failed to fetch offer');
          return null;
        }
      } catch (error: any) {
        console.error('Error fetching offer:', error);
        showError(error.message || 'Failed to fetch offer');
        return null;
      }
    },
    [getAuthToken, showError]
  );

  const handleSendOfferEmail = useCallback(
    async (emailData: any): Promise<boolean> => {
      try {
        setActionLoading(true);
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await sendOfferEmail(emailData, authToken);
        
        if (result.success) {
          showSuccess('Email sent successfully!');
          return true;
        } else {
          showError(result.error || 'Failed to send email');
          return false;
        }
      } catch (error: any) {
        console.error('Error sending email:', error);
        showError(error.message || 'Failed to send email');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [getAuthToken, showError, showSuccess]
  );

  return {
    data,
    loading,
    paginationLoading,
    actionLoading,
    fetchOffers,
    handleUpdateOffer,
    handleDeleteOffer,
    handleGetOfferById,
    handleSendOfferEmail,
  };
}