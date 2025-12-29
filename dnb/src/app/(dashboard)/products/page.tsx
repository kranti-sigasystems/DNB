'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductSearch } from '@/components/products/ProductSearch';
import { ProductTable } from '@/components/products/ProductTable';
import { useProducts } from '@/hooks/use-products';
import { useSearch } from '@/hooks/use-search';
import type { ProductSearchParams } from '@/types/product';

export default function ProductsPage() {
  const router = useRouter();
  
  const {
    data,
    loading,
    paginationLoading,
    actionLoading,
    fetchProducts,
    handleDeleteProduct,
  } = useProducts();

  // Use centralized search hook
  const { searchFilters, isSearching, handleSearch, handleClearSearch } = useSearch<ProductSearchParams>({
    onFetch: (filters, isSearch) => {
      fetchProducts({
        ...filters,
        pageIndex: 0,
        pageSize: data?.pageSize || 10,
      }, isSearch);
    },
    initialFilters: {},
  });

  // Initial data fetch
  useEffect(() => {
    fetchProducts({
      pageIndex: 0,
      pageSize: 10,
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchProducts({
      ...searchFilters,
      pageIndex: page,
      pageSize: data?.pageSize || 10,
    }, false, true);
  }, [fetchProducts, searchFilters, data?.pageSize]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    fetchProducts({
      ...searchFilters,
      pageIndex: 0,
      pageSize,
    }, false, true);
  }, [fetchProducts, searchFilters]);

  const handleView = useCallback((productId: string) => {
    router.push(`/products/${productId}`);
  }, [router]);

  const handleEdit = useCallback((productId: string) => {
    router.push(`/products/${productId}/edit`);
  }, [router]);

  const handleAddProduct = useCallback(() => {
    router.push('/products/new');
  }, [router]);

  const handleDelete = useCallback(async (productId: string) => {
    await handleDeleteProduct(productId);
  }, [handleDeleteProduct]);

  if (loading && !isSearching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
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
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
        </div>
        <Button onClick={() => router.push('/products/new')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Search Section - Same structure as location page */}
      <Card>
        <CardContent className="p-3">
          <ProductSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
            loading={isSearching}
          />
        </CardContent>
      </Card>

      {/* Products Table */}
      <ProductTable
        data={data?.data || []}
        isLoading={loading || isSearching || paginationLoading}
        totalItems={data?.totalItems || 0}
        totalPages={data?.totalPages || 0}
        pageIndex={data?.pageIndex || 0}
        pageSize={data?.pageSize || 10}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddProduct={handleAddProduct}
        isRefreshing={actionLoading}
      />
    </div>
  );
}