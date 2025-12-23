'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  getProducts, 
  getProductById,
  createProducts,
  updateProduct,
  deleteProduct,
  searchProducts
} from '@/actions/product.actions';
import { ensureAuthenticated } from '@/utils/tokenManager';
import type { 
  ProductsResponse, 
  ProductSearchParams, 
  ProductFormData,
  Product 
} from '@/types/product';

interface UseProductsProps {
  initialPageSize?: number;
}

export function useProducts({ initialPageSize = 10 }: UseProductsProps = {}) {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState<ProductSearchParams>({});

  // Fetch products
  const fetchProducts = useCallback(async (params: ProductSearchParams = {}, isSearch = false, isPagination = false) => {
    try {
      if (isSearch) setSearchLoading(true);
      if (isPagination) setPaginationLoading(true);
      if (!isSearch && !isPagination) setLoading(true);

      // Store current search params for use in action handlers
      setCurrentSearchParams(params);

      const authToken = await ensureAuthenticated();
      const response = await getProducts(params, authToken);

      setData(response);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to fetch products');
      setData(null);
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setPaginationLoading(false);
    }
  }, []);

  // Create product
  const handleCreateProduct = useCallback(async (productData: ProductFormData | ProductFormData[]) => {
    try {
      setActionLoading(true);
      const authToken = await ensureAuthenticated();
      const result = await createProducts(productData, authToken);

      if (result.success) {
        toast.success('Product(s) created successfully');
        
        // Refresh data
        if (data) {
          await fetchProducts({
            ...currentSearchParams,
            pageIndex: data.pageIndex,
            pageSize: data.pageSize,
          });
        }
        
        return result;
      } else {
        toast.error(result.error || 'Failed to create product');
        return result;
      }
    } catch (error: any) {
      console.error('❌ Error in handleCreateProduct:', error);
      toast.error(error.message || 'Failed to create product');
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  }, [data, fetchProducts, currentSearchParams]);

  // Update product
  const handleUpdateProduct = useCallback(async (productId: string, productData: Partial<ProductFormData>) => {
    try {
      setActionLoading(true);
      const authToken = await ensureAuthenticated();
      const result = await updateProduct(productId, productData, authToken);

      if (result.success) {
        toast.success('Product updated successfully');
        
        // Refresh data
        if (data) {
          await fetchProducts({
            ...currentSearchParams,
            pageIndex: data.pageIndex,
            pageSize: data.pageSize,
          });
        }
        
        return result;
      } else {
        toast.error(result.error || 'Failed to update product');
        return result;
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  }, [data, fetchProducts, currentSearchParams]);

  // Delete product
  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      setActionLoading(true);
      const authToken = await ensureAuthenticated();
      const result = await deleteProduct(productId, authToken);

      if (result.success) {
        toast.success('Product deleted successfully');
        
        // Refresh data
        if (data) {
          await fetchProducts({
            ...currentSearchParams,
            pageIndex: data.pageIndex,
            pageSize: data.pageSize,
          });
        }
        
        return result;
      } else {
        toast.error(result.error || 'Failed to delete product');
        return result;
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  }, [data, fetchProducts, currentSearchParams]);

  // Get single product
  const handleGetProduct = useCallback(async (productId: string) => {
    try {
      const authToken = await ensureAuthenticated();
      const result = await getProductById(productId, authToken);
      
      if (!result.success) {
        toast.error(result.error || 'Failed to fetch product');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error(error.message || 'Failed to fetch product');
      return { success: false, error: error.message };
    }
  }, []);

  return {
    data,
    loading,
    searchLoading,
    paginationLoading,
    actionLoading,
    fetchProducts,
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleGetProduct,
  };
}