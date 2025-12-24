'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductSearch } from '@/components/products/ProductSearch';
import { ProductTable } from '@/components/products/ProductTable';
import { useProducts } from '@/hooks/use-products';
import type { ProductSearchParams } from '@/types/product';

export default function ProductsPage() {
  const router = useRouter();
  const [searchFilters, setSearchFilters] = useState<ProductSearchParams>({});
  
  const {
    data,
    loading,
    searchLoading,
    paginationLoading,
    actionLoading,
    fetchProducts,
    handleDeleteProduct,
  } = useProducts();

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

  const handleSearch = useCallback((filters: ProductSearchParams) => {
    setSearchFilters(filters);
    fetchProducts({
      ...filters,
      pageIndex: 0,
      pageSize: data?.pageSize || 10,
    }, true);
  }, [fetchProducts, data?.pageSize]);

  const handleClearSearch = useCallback(() => {
    setSearchFilters({});
    fetchProducts({
      pageIndex: 0,
      pageSize: data?.pageSize || 10,
    });
  }, [fetchProducts, data?.pageSize]);

  const handleView = useCallback((productId: string) => {
    router.push(`/products/${productId}`);
  }, [router]);

  const handleEdit = useCallback((productId: string) => {
    router.push(`/products/${productId}/edit`);
  }, [router]);

  const handleDelete = useCallback(async (productId: string) => {
    await handleDeleteProduct(productId);
  }, [handleDeleteProduct]);

  if (loading && !searchLoading) {
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
      {/* Search */}
      <ProductSearch
        onSearch={handleSearch}
        onClear={handleClearSearch}
        loading={searchLoading}
      />

      {/* Products Table */}
      <ProductTable
        data={data?.data || []}
        isLoading={loading || searchLoading || paginationLoading}
        totalItems={data?.totalItems || 0}
        totalPages={data?.totalPages || 0}
        pageIndex={data?.pageIndex || 0}
        pageSize={data?.pageSize || 10}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isRefreshing={actionLoading}
      />
    </div>
  );
}