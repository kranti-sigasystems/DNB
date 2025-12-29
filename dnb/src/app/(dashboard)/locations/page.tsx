'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/ui/data-table/data-table';
import { LocationSearch } from '@/components/locations/LocationSearch';
import { getAllLocations, searchLocations, deleteLocation } from '@/actions/location.actions';
import { getStoredSession } from '@/utils/auth';
import type { Location, LocationSearchFilters } from '@/types/location';

export default function LocationsPage() {
  const router = useRouter();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const { showAlert, AlertDialog } = useAlertDialog();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState<LocationSearchFilters>({});

  const fetchLocations = useCallback(async (filters?: LocationSearchFilters, isSearch = false) => {
    try {
      const session = getStoredSession();
      
      if (!session || !session.accessToken) {
        router.push('/login');
        return;
      }

      if (isSearch) {
        setIsSearching(true);
      }

      let response;
      const hasFilters = filters && Object.values(filters).some(val => 
        val !== undefined && val !== null && val.toString().trim().length > 0
      );

      if (hasFilters) {
        const searchParams = {
          ...filters,
          page: pageIndex,
          limit: pageSize
        };
        response = await searchLocations(searchParams, session.accessToken);
      } else {
        response = await getAllLocations(session.accessToken, pageIndex, pageSize);
      }

      if (response.success && response.data) {
        setLocations(response?.data?.data || []);
        setTotalItems(response.data.totalItems || 0);
      } else {
        console.error('❌ Failed to fetch locations:', response.error);
        
        // If it's an authentication error, redirect to login
        if (response.error?.includes('Business owner not found') || 
            response.error?.includes('Authentication') ||
            response.error?.includes('Please log in again')) {
          showError('Session expired. Please log in again.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }
        
        setLocations([]);
        setTotalItems(0);
        showError(response.error || 'Failed to fetch locations');
      }
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
      setLocations([]);
      setTotalItems(0);
      showError('Failed to fetch locations');
    } finally {
      setLoading(false);
      setIsSearching(false);
      setIsPaginationLoading(false);
    }
  }, [pageIndex, pageSize, router, showError]);

  const handlePageChange = useCallback((newPageIndex: number) => {
    setIsPaginationLoading(true);
    setPageIndex(newPageIndex);
  }, []);

  const handleSearch = useCallback((filters: LocationSearchFilters) => {
    setSearchFilters(filters);
    setPageIndex(0); // Reset to first page when searching
    fetchLocations(filters, true);
  }, [fetchLocations]);

  const handleClearSearch = useCallback(() => {
    setSearchFilters({});
    setPageIndex(0);
    fetchLocations({}, false);
  }, [fetchLocations]);

  const handleDelete = useCallback(async (location: Location) => {
    showAlert({
      title: 'Delete Location',
      description: `Are you sure you want to delete "${location.city}, ${location.country}"? This action cannot be undone.`,
      action: 'delete',
      itemName: `${location.city}, ${location.country}`,
      onConfirm: async () => {
        try {
          const session = getStoredSession();
          if (!session || !session.accessToken) {
            router.push('/login');
            return;
          }

          const result = await deleteLocation(location.id, session.accessToken);
          if (result.success) {
            showSuccess('Location deleted successfully!');
            fetchLocations();
          } else {
            showError(result.error || 'Failed to delete location');
          }
        } catch (error) {
          console.error('Error deleting location:', error);
          showError('Failed to delete location');
        }
      }
    });
  }, [showAlert, showSuccess, showError, router, fetchLocations]);

  useEffect(() => {
    fetchLocations(searchFilters);
  }, [pageIndex, pageSize]);

  const columns = [
    {
      key: 'city',
      label: 'City',
      sortable: true,
      render: (value: string, _item: Location) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'state',
      label: 'State',
      sortable: true,
      render: (value: string) => value,
    },
    {
      key: 'locationName',
      label: 'Location Name',
      sortable: true,
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {value}
        </span>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      sortable: true,
      render: (value: string) => value,
    },
  ];

  if (loading && !isSearching && pageIndex === 0) {
    return (
      <div className="relative min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="sticky top-0 bg-background border-b border-border shadow-sm z-20 rounded-xl mb-6">
          <div className="py-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="py-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Alert Dialog */}
      <AlertDialog />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border shadow-sm z-20 rounded-xl mb-6">
        <div className="py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Locations</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your business locations
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/locations/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        {/* Search Section */}
        <Card>
          <CardContent className="p-3">
            <LocationSearch
              onSearch={handleSearch}
              onClear={handleClearSearch}
              loading={isSearching}
            />
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              All Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={locations}
              columns={columns}
              actions={[
                {
                  label: 'Edit',
                  onClick: (location) => router.push(`/locations/${location.id}/edit`),
                },
                {
                  label: 'Delete',
                  onClick: handleDelete,
                  variant: 'destructive' as const,
                },
              ]}
              isLoading={isPaginationLoading || isSearching}
              searchable={false} // Disable built-in search since we have custom search
              pagination={{
                totalItems,
                totalPages: Math.ceil(totalItems / pageSize),
                currentPage: pageIndex,
                pageSize,
                onPageChange: handlePageChange,
                onPageSizeChange: setPageSize,
              }}
              emptyState={{
                title: "No locations found",
                description: Object.keys(searchFilters).length > 0 
                  ? "No locations match your search criteria. Try adjusting your filters."
                  : "Get started by adding your first location.",
                action: (
                  <Button onClick={() => router.push('/locations/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                ),
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}