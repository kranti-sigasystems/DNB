export interface Product {
  id: string;
  code: string;
  productName: string;
  species: string[];
  size: string[]; // Always an array
  sku?: string | null;
  ownerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ProductFormData {
  code: string;
  productName: string;
  species: string[];
  size: string[]; // Always an array, never undefined
  sku?: string | null;
}

export interface ProductsResponse {
  data: Product[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

export interface ProductSearchFilters {
  productName?: string;
  code?: string;
  species?: string;
  size?: string;
  query?: string;
}

export interface ProductSearchParams {
  query?: string;
  productName?: string;
  code?: string;
  species?: string;
  size?: string;
  sku?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface CreateProductResponse {
  success: boolean;
  data?: Product | Product[];
  error?: string;
}

export interface ProductActionResponse {
  success: boolean;
  data?: Product;
  error?: string;
}