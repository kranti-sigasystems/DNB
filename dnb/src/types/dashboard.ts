export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  userRole: string;
  businessName?: string;
  businessOwnerId?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  postalCode?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface Buyer {
  id: string;
  contactName: string;
  contactEmail: string | null;
  buyersCompanyName: string;
  registrationNumber?: string;
  taxId?: string;
  countryCode?: string;
  status: 'active' | 'inactive' | 'pending';
  country?: string;
  city?: string;
  state?: string;
  address?: string;
  postalCode?: string;
  isVerified: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalItems: number;
  totalActive: number;
  totalInactive: number;
  totalDeleted: number;
  totalPending: number;
  revenueGrowth: number;
  userGrowth: number;
}

export interface DashboardData {
  data: User[] | Buyer[];
  stats: DashboardStats;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

export interface TableColumn {
  key: string;
  label: string;
  cellRenderer?: (item: any) => React.ReactNode;
}

export interface SearchFilters {
  email?: string;
  status?: string;
  country?: string;
  isVerified?: boolean;
  // SuperAdmin specific filters
  businessName?: string;
  first_name?: string;
  last_name?: string;
  phoneNumber?: string;
  postalCode?: string;
  // Business Owner specific filters
  contactName?: string;
  buyersCompanyName?: string;
  productName?: string;
  locationName?: string;
}

export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
}