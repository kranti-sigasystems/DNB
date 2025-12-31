export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  status: 'active' | 'inactive';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  userRole: 'super_admin' | 'business_owner' | 'buyer';
}

export interface BusinessOwner extends User {
  businessName: string;
  registrationNumber?: string;
  postalCode?: string;
  userId: string;
}

export interface Buyer extends User {
  contactName?: string;
  contactEmail?: string | null;
  contactPhone?: string;
  buyersCompanyName?: string;
  registrationNumber?: string;
  taxId?: string;
  countryCode?: string;
  productName?: string;
  locationName?: string;
  businessOwnerId?: string;
  postalCode?: string;
}

export interface UsersResponse {
  data: BusinessOwner[] | Buyer[];
  totalItems: number;
  totalPages: number;
  totalActive: number;
  totalInactive: number;
  totalDeleted: number;
  pageIndex: number;
  pageSize: number;
}

export interface SearchFilters {
  query?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  businessName?: string;
  phoneNumber?: string;
  postalCode?: string;
  status?: 'active' | 'inactive';
  productName?: string;
  locationName?: string;
  contactName?: string;
  buyersCompanyName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
}

export interface SearchParams extends SearchFilters, PaginationParams {}

export interface UserAction {
  id: string;
  label: string;
  type: 'view' | 'edit' | 'activate' | 'deactivate' | 'delete';
  variant?: 'default' | 'destructive' | 'outline';
}

export interface SearchField {
  name: keyof SearchFilters;
  label: string;
  type: 'text' | 'select' | 'email' | 'date' | 'number';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}