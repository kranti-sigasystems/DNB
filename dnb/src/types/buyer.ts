export interface Buyer {
  id: string;
  contactName: string;
  email: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  buyersCompanyName?: string | null;
  productName?: string | null;
  locationName?: string | null;
  businessOwnerId: string;
  status: string;
  is_deleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  phoneNumber?: string | null;
  businessName?: string | null;
  registrationNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  postalCode?: string | null;
}

export interface CreateBuyerData {
  firstName: string;
  lastName: string;
  email: string;
  contactEmail?: string;
  contactPhone?: string;
  phoneNumber?: string;
  buyersCompanyName?: string;
  businessName?: string;
  registrationNumber?: string;
  productName?: string;
  locationName?: string;
  country: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
}

export interface Product {
  id: string;
  code: string;
  productName: string;
  species: string[];
  size: string[];
  sku: string | null;
  ownerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Location {
  id: string;
  locationName: string | null;
  code: string;
  city: string;
  state: string;
  country: string;
  address: string | null;
  postalCode: string | null;
  ownerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
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