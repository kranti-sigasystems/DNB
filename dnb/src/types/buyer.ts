export interface Buyer {
  id: string;
  contactName: string;
  email: string;
  contactEmail?: string;
  contactPhone?: string;
  buyersCompanyName?: string;
  registrationNumber?: string;
  taxId?: string;
  productName?: string;
  locationName?: string;
  businessOwnerId: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  countryCode: string;
  status: 'active' | 'inactive';
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuyerData {
  contactName: string;
  email: string;
  contactEmail?: string;
  contactPhone?: string;
  buyersCompanyName?: string;
  registrationNumber?: string;
  taxId?: string;
  productName?: string;
  locationName?: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  countryCode: string;
}

export interface Product {
  id: string;
  code: string;
  productName: string;
  species: string[];
  size?: string[];
  sku?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  locationName: string;
  code: string;
  city: string;
  state: string;
  country: string;
  address: string;
  postalCode: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerFormField {
  name: keyof CreateBuyerData;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export interface BuyerFormFields {
  company: BuyerFormField[];
  contact: BuyerFormField[];
  address: BuyerFormField[];
}

export interface PlanUsage {
  buyers: {
    used: number;
    remaining: number;
    limit: number;
  };
  products: {
    used: number;
    remaining: number;
    limit: number;
  };
  locations: {
    used: number;
    remaining: number;
    limit: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}