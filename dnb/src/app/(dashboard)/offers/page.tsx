'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OfferSearch } from '@/components/offers/OfferSearch';
import { OfferTable } from '@/components/offers/OfferTable';
import { useOffers } from '@/hooks/use-offers';
import { useSearch } from '@/hooks/use-search';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import type { OfferSearchParams } from '@/hooks/use-offers';

export default function OffersPage() {
  const router = useRouter();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  
  // Use the offers hook
  const {
    data,
    loading,
    paginationLoading,
    actionLoading,
    fetchOffers,
    handleDeleteOffer,
  } = useOffers();

  // Use centralized search hook
  const { searchFilters, isSearching, handleSearch, handleClearSearch } = useSearch<OfferSearchParams>({
    onFetch: (filters, isSearch) => {
      fetchOffers({
        ...filters,
        pageIndex: 0,
        pageSize: data?.pageSize || 10,
      }, isSearch, false, !isSearch);
    },
    initialFilters: {},
  });

  // Initial data fetch
  useEffect(() => {
    fetchOffers({
      pageIndex: 0,
      pageSize: 10,
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchOffers({
      ...searchFilters,
      pageIndex: page,
      pageSize: data?.pageSize || 10,
    }, false, true, false);
  }, [fetchOffers, searchFilters, data?.pageSize]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    fetchOffers({
      ...searchFilters,
      pageIndex: 0,
      pageSize,
    }, false, true, false);
  }, [fetchOffers, searchFilters]);

  const handleView = useCallback((offerId: number) => {
    router.push(`/offers/${offerId}`);
  }, [router]);

  const handleAddOffer = useCallback(() => {
    router.push('/offer-draft');
  }, [router]);

  const handleDelete = useCallback(async (offerId: number) => {
    await handleDeleteOffer(offerId);
  }, [handleDeleteOffer]);

  if (loading && !isSearching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Offers</h1>
        </div>
        <Button onClick={() => router.push('/offer-draft')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Offer
        </Button>
      </div>

      {/* Search Section - Same structure as other pages */}
      <Card>
        <CardContent className="p-3">
          <OfferSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
            loading={isSearching}
          />
        </CardContent>
      </Card>

      {/* Offers Table */}
      <OfferTable
        data={data?.data || []}
        isLoading={loading || isSearching || paginationLoading}
        totalItems={data?.totalItems || 0}
        totalPages={data?.totalPages || 0}
        pageIndex={data?.pageIndex || 0}
        pageSize={data?.pageSize || 10}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onView={handleView}
        onDelete={handleDelete}
        onAddOffer={handleAddOffer}
        isRefreshing={actionLoading}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}