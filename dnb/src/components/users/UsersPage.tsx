'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSearch } from './UserSearch';
import { UsersTable } from './UsersTable';
import { useUsers } from '@/hooks/use-users';
import type { 
  BusinessOwner, 
  Buyer, 
  SearchFilters,
  SearchField
} from '@/types/users';

interface UsersPageProps {
  userRole: 'super_admin' | 'business_owner';
  authToken: string;
}

export function UsersPage({ userRole, authToken }: UsersPageProps) {

  const router = useRouter();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  
  const {
    data,
    loading,
    searchLoading,
    paginationLoading,
    actionLoading,
    fetchUsers,
    handleActivate,
    handleDeactivate,
    handleDelete,
  } = useUsers({ userRole, authToken });

  // Log data whenever it changes
  useEffect(() => {
    if (data) {

      // Log each user individually for detailed inspection
      if (Array.isArray(data.data)) {
        data.data.forEach((user, index) => {
          
        });
      } else {
        
      }
    } else {
      
    }
  }, [data, userRole]);

  // Initial data fetch
  useEffect(() => {
    
    fetchUsers({
      pageIndex: 0,
      pageSize: 10,
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    
    fetchUsers({
      ...searchFilters,
      pageIndex: page,
      pageSize: data?.pageSize || 10,
    }, false, true);
  }, [fetchUsers, searchFilters, data?.pageSize]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    
    fetchUsers({
      ...searchFilters,
      pageIndex: 0,
      pageSize,
    }, false, true);
  }, [fetchUsers, searchFilters]);

  const handleSearch = useCallback((filters: SearchFilters) => {
    
    setSearchFilters(filters);
    fetchUsers({
      ...filters,
      pageIndex: 0,
      pageSize: data?.pageSize || 10,
    }, true);
  }, [fetchUsers, data?.pageSize]);

  const handleClearSearch = useCallback(() => {
    
    setSearchFilters({});
    fetchUsers({
      pageIndex: 0,
      pageSize: data?.pageSize || 10,
    });
  }, [fetchUsers, data?.pageSize]);

  const handleRefresh = useCallback(() => {
    
    fetchUsers({
      ...searchFilters,
      pageIndex: data?.pageIndex || 0,
      pageSize: data?.pageSize || 10,
    });
  }, [fetchUsers, searchFilters, data?.pageIndex, data?.pageSize]);

  // Define search fields based on user role
  const searchFields: SearchField[] = userRole === 'super_admin' 
    ? [
        { name: 'first_name', label: 'First Name', type: 'text', placeholder: 'Enter first name' },
        { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Enter last name' },
        { name: 'email', label: 'Email', type: 'text', placeholder: 'Enter email' },
        { name: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Enter business name' },
        { name: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: 'Enter phone number' },
        { name: 'postalCode', label: 'Postal Code', type: 'text', placeholder: 'Enter postal code' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        },
      ]
    : [
        { name: 'email', label: 'Email', type: 'text', placeholder: 'Enter email' },
        { name: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Enter business name' },
        { name: 'productName', label: 'Product Name', type: 'text', placeholder: 'Enter product name' },
        { name: 'locationName', label: 'Location Name', type: 'text', placeholder: 'Enter location name' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        },
      ];

  const pageTitle = userRole === 'super_admin' ? 'Business Owners' : 'Buyers';
  const addButtonText = userRole === 'super_admin' ? 'Add Business Owner' : 'Add Buyer';
  const addRoute = '/users/new';

  if (loading && !searchLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        </div>
        <Button onClick={() => router.push('/users/new')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {addButtonText}
        </Button>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dashboard-card-blue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{data.totalItems}</div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card-green">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{data.totalActive}</div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card-yellow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{data.totalInactive}</div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card-orange">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deleted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange">{data.totalDeleted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table with integrated search */}
      <UsersTable
        data={data?.data || []}
        userRole={userRole}
        isLoading={loading || searchLoading || paginationLoading}
        totalItems={data?.totalItems || 0}
        totalPages={data?.totalPages || 0}
        pageIndex={data?.pageIndex || 0}
        pageSize={data?.pageSize || 10}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        // Pass search props
        searchFields={searchFields}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        searchLoading={searchLoading}
        // Pass action loading state
        isRefreshing={actionLoading}
      />
    </div>
  );
}