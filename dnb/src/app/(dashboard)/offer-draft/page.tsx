'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OfferDraftSearch } from '@/components/offer-drafts/OfferDraftSearch';
import { OfferDraftTable } from '@/components/offer-drafts/OfferDraftTable';
import { useOfferDrafts } from '@/hooks/use-offer-drafts';
import { useSearch } from '@/hooks/use-search';
import type { OfferDraftSearchParams } from '@/types/offer-draft';

export default function OfferDraftsPage() {
  const router = useRouter();
  
  const {
    data,
    loading,
    paginationLoading,
    actionLoading,
    fetchOfferDrafts,
    handleDeleteOfferDraft,
  } = useOfferDrafts();

  // Use centralized search hook
  const { searchFilters, isSearching, handleSearch, handleClearSearch } = useSearch<OfferDraftSearchParams>({
    onFetch: (filters, isSearch) => {
      fetchOfferDrafts({
        ...filters,
        pageIndex: 0,
        pageSize: data?.pageSize || 10,
      }, isSearch);
    },
    initialFilters: {},
  });

  // Initial data fetch
  useEffect(() => {
    fetchOfferDrafts({
      pageIndex: 0,
      pageSize: 10,
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchOfferDrafts({
      ...searchFilters,
      pageIndex: page,
      pageSize: data?.pageSize || 10,
    }, false, true);
  }, [fetchOfferDrafts, searchFilters, data?.pageSize]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    fetchOfferDrafts({
      ...searchFilters,
      pageIndex: 0,
      pageSize,
    }, false, true);
  }, [fetchOfferDrafts, searchFilters]);

  const handleView = useCallback((draftNo: number) => {
    router.push(`/offer-draft/${draftNo}`);
  }, [router]);

  const handleAddDraft = useCallback(() => {
    router.push('/offer-draft/new');
  }, [router]);

  const handleDelete = useCallback(async (draftNo: number) => {
    await handleDeleteOfferDraft(draftNo);
  }, [handleDeleteOfferDraft]);

  if (loading && !isSearching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading offer drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Offer Drafts</h1>
        </div>
        <Button onClick={() => router.push('/offer-draft/new')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Offer Draft
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-3">
          <OfferDraftSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
            loading={isSearching}
          />
        </CardContent>
      </Card>

      {/* Offer Drafts Table */}
      <OfferDraftTable
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
        onAddDraft={handleAddDraft}
        isRefreshing={actionLoading}
      />
    </div>
  );
}