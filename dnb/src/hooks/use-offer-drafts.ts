import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStoredSession } from '@/utils/auth';
import {
  getOfferDrafts,
  getOfferDraftById,
  createOfferDraft,
  updateOfferDraft,
  deleteOfferDraft,
  updateOfferDraftStatus,
  searchOfferDrafts,
} from '@/actions/offer-draft.actions';
import type {
  OfferDraft,
  OfferDraftFormData,
  OfferDraftsResponse,
  OfferDraftSearchParams,
} from '@/types/offer-draft';

interface UseOfferDraftsOptions {
  authToken?: string;
}

export function useOfferDrafts(options: UseOfferDraftsOptions = {}) {
  const [data, setData] = useState<OfferDraftsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const getAuthToken = useCallback(() => {
    if (options.authToken) return options.authToken;
    const session = getStoredSession();
    return session?.accessToken;
  }, [options.authToken]);

  const fetchOfferDrafts = useCallback(
    async (
      params: OfferDraftSearchParams = {},
      isSearch = false,
      isPagination = false
    ) => {
      try {
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        if (isPagination) {
          setPaginationLoading(true);
        } else if (!isSearch) {
          setLoading(true);
        }

        const response = await getOfferDrafts(params, authToken);
        setData(response);
      } catch (error: any) {
        console.error('Error fetching offer drafts:', error);
        showError(error.message || 'Failed to fetch offer drafts');
        setData(null);
      } finally {
        setLoading(false);
        setPaginationLoading(false);
      }
    },
    [getAuthToken, showError]
  );

  const handleCreateOfferDraft = useCallback(
    async (draftData: OfferDraftFormData): Promise<boolean> => {
      try {
        setActionLoading(true);
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await createOfferDraft(draftData, authToken);
        
        if (result.success) {
          showSuccess('Offer draft created successfully!');
          // Refresh the list
          await fetchOfferDrafts({
            pageIndex: data?.pageIndex || 0,
            pageSize: data?.pageSize || 10,
          });
          return true;
        } else {
          showError(result.error || 'Failed to create offer draft');
          return false;
        }
      } catch (error: any) {
        console.error('Error creating offer draft:', error);
        showError(error.message || 'Failed to create offer draft');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [getAuthToken, showError, showSuccess, fetchOfferDrafts, data]
  );

  const handleUpdateOfferDraft = useCallback(
    async (draftNo: number, draftData: Partial<OfferDraftFormData>): Promise<boolean> => {
      try {
        setActionLoading(true);
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await updateOfferDraft(draftNo, draftData, authToken);
        
        if (result.success) {
          showSuccess('Offer draft updated successfully!');
          // Refresh the list
          await fetchOfferDrafts({
            pageIndex: data?.pageIndex || 0,
            pageSize: data?.pageSize || 10,
          });
          return true;
        } else {
          showError(result.error || 'Failed to update offer draft');
          return false;
        }
      } catch (error: any) {
        console.error('Error updating offer draft:', error);
        showError(error.message || 'Failed to update offer draft');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [getAuthToken, showError, showSuccess, fetchOfferDrafts, data]
  );

  const handleDeleteOfferDraft = useCallback(
    async (draftNo: number): Promise<void> => {
      try {
        setActionLoading(true);
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await deleteOfferDraft(draftNo, authToken);
        
        if (result.success) {
          showSuccess('Offer draft deleted successfully!');
          // Refresh the list
          await fetchOfferDrafts({
            pageIndex: data?.pageIndex || 0,
            pageSize: data?.pageSize || 10,
          });
        } else {
          showError(result.error || 'Failed to delete offer draft');
        }
      } catch (error: any) {
        console.error('Error deleting offer draft:', error);
        showError(error.message || 'Failed to delete offer draft');
      } finally {
        setActionLoading(false);
      }
    },
    [getAuthToken, showError, showSuccess, fetchOfferDrafts, data]
  );

  const handleUpdateStatus = useCallback(
    async (draftNo: number, status: 'open' | 'close'): Promise<void> => {
      try {
        setActionLoading(true);
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await updateOfferDraftStatus(draftNo, status, authToken);
        
        if (result.success) {
          showSuccess(`Offer draft ${status === 'open' ? 'opened' : 'closed'} successfully!`);
          // Refresh the list
          await fetchOfferDrafts({
            pageIndex: data?.pageIndex || 0,
            pageSize: data?.pageSize || 10,
          });
        } else {
          showError(result.error || 'Failed to update offer draft status');
        }
      } catch (error: any) {
        console.error('Error updating offer draft status:', error);
        showError(error.message || 'Failed to update offer draft status');
      } finally {
        setActionLoading(false);
      }
    },
    [getAuthToken, showError, showSuccess, fetchOfferDrafts, data]
  );

  const handleGetOfferDraftById = useCallback(
    async (draftNo: number): Promise<OfferDraft | null> => {
      try {
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const result = await getOfferDraftById(draftNo, authToken);
        
        if (result.success && result.data) {
          return result.data;
        } else {
          showError(result.error || 'Failed to fetch offer draft');
          return null;
        }
      } catch (error: any) {
        console.error('Error fetching offer draft:', error);
        showError(error.message || 'Failed to fetch offer draft');
        return null;
      }
    },
    [getAuthToken, showError]
  );

  return {
    data,
    loading,
    paginationLoading,
    actionLoading,
    fetchOfferDrafts,
    handleCreateOfferDraft,
    handleUpdateOfferDraft,
    handleDeleteOfferDraft,
    handleUpdateStatus,
    handleGetOfferDraftById,
  };
}