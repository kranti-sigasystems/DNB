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

  // Log data changes
  useEffect(() => {
    
  }, [data, loading, searchLoading, paginationLoading]);

  const fetchUsers = useCallback(async (params: SearchParams, isSearch = false, isPagination = false) => {

    try {
      if (isSearch) setSearchLoading(true);
      if (isPagination) setPaginationLoading(true);
      if (!isSearch && !isPagination) setLoading(true);

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
      await activateUser(userRole, userId, authToken);
      toast.success('User activated successfully');
      
      // Update local data
      if (data) {
        const updatedData = data.data.map(user => 
          user.id === userId ? { ...user, status: 'active' as const } : user
        );
        
        setData({ ...data, data: updatedData });
      }
    } catch (error: any) {
      
      toast.error(error.message || 'Failed to activate user');
    }
  }, [userRole, authToken, data]);

  const handleDeactivate = useCallback(async (userId: string) => {
    
    try {
      await deactivateUser(userRole, userId, authToken);
      toast.success('User deactivated successfully');
      
      // Update local data
      if (data) {
        const updatedData = data.data.map(user => 
          user.id === userId ? { ...user, status: 'inactive' as const } : user
        );
        
        setData({ ...data, data: updatedData });
      }
    } catch (error: any) {
      
      toast.error(error.message || 'Failed to deactivate user');
    }
  }, [userRole, authToken, data]);

  const handleDelete = useCallback(async (userId: string) => {
    
    try {
      await deleteUser(userRole, userId, authToken);
      toast.success('User deleted successfully');
      
      // Update local data
      if (data) {
        const updatedData = data.data.map(user => 
          user.id === userId ? { ...user, isDeleted: true } : user
        );
        
        setData({ ...data, data: updatedData });
      }
    } catch (error: any) {
      
      toast.error(error.message || 'Failed to delete user');
    }
  }, [userRole, authToken, data]);

  return {
    data,
    loading,
    searchLoading,
    paginationLoading,
    fetchUsers,
    handleActivate,
    handleDeactivate,
    handleDelete,
  };
}