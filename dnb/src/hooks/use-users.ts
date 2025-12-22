'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  getUsersData, 
  activateUser, 
  deactivateUser, 
  deleteUser 
} from '@/actions/users.actions';
import type { 
  UsersResponse, 
  SearchParams, 
  BusinessOwner, 
  Buyer 
} from '@/types/users';

interface UseUsersProps {
  userRole: 'super_admin' | 'business_owner';
  authToken: string;
}

export function useUsers({ userRole, authToken }: UseUsersProps) {

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentSearchFilters, setCurrentSearchFilters] = useState<SearchParams>({});

  // Log data changes
  useEffect(() => {
    
  }, [data, loading, searchLoading, paginationLoading]);

  const fetchUsers = useCallback(async (params: SearchParams, isSearch = false, isPagination = false) => {

    try {
      if (isSearch) setSearchLoading(true);
      if (isPagination) setPaginationLoading(true);
      if (!isSearch && !isPagination) setLoading(true);

      // Store current search filters for use in action handlers
      setCurrentSearchFilters(params);

      // Check if we have any search filters
      const { pageIndex, pageSize, ...filters } = params;
      const hasFilters = Object.values(filters).some(value => 
        value !== undefined && value !== null && value !== ''
      );

      // Get current user ID from session storage
      let currentUserId: string | undefined;
      try {
        const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          currentUserId = user.id || user.userId;
        }
      } catch (error) {
        
      }

      const response = await getUsersData(userRole, params, authToken, currentUserId);

      setData(response);
    } catch (error: any) {
      
      toast.error(error.message || 'Failed to fetch users');
      setData(null);
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setPaginationLoading(false);
    }
  }, [userRole, authToken]);

  const handleActivate = useCallback(async (userId: string) => {
    try {
      setActionLoading(true);
      await activateUser(userRole, userId, authToken);
      toast.success('User activated successfully');
      
      // Refresh data from server instead of updating local state
      if (data) {
        await fetchUsers({
          ...currentSearchFilters,
          pageIndex: data.pageIndex,
          pageSize: data.pageSize,
        });
      }
    } catch (error: any) {
      console.error('Error in handleActivate:', error);
      toast.error(error.message || 'Failed to activate user');
    } finally {
      setActionLoading(false);
    }
  }, [userRole, authToken, data, fetchUsers, currentSearchFilters]);

  const handleDeactivate = useCallback(async (userId: string) => {
    try {
      setActionLoading(true);
      await deactivateUser(userRole, userId, authToken);
      toast.success('User deactivated successfully');
      
      // Refresh data from server instead of updating local state
      if (data) {
        await fetchUsers({
          ...currentSearchFilters,
          pageIndex: data.pageIndex,
          pageSize: data.pageSize,
        });
      }
    } catch (error: any) {
      console.error('Error in handleDeactivate:', error);
      toast.error(error.message || 'Failed to deactivate user');
    } finally {
      setActionLoading(false);
    }
  }, [userRole, authToken, data, fetchUsers, currentSearchFilters]);

  const handleDelete = useCallback(async (userId: string) => {
    try {
      setActionLoading(true);
      await deleteUser(userRole, userId, authToken);
      toast.success('User deleted successfully');
      
      // Refresh data from server instead of updating local state
      if (data) {
        await fetchUsers({
          ...currentSearchFilters,
          pageIndex: data.pageIndex,
          pageSize: data.pageSize,
        });
      }
    } catch (error: any) {
      console.error('Error in handleDelete:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  }, [userRole, authToken, data, fetchUsers, currentSearchFilters]);

  return {
    data,
    loading,
    searchLoading,
    paginationLoading,
    actionLoading,
    fetchUsers,
    handleActivate,
    handleDeactivate,
    handleDelete,
  };
}