export interface Location {
  id: string;
  locationName?: string;
  city: string;
  state: string;
  code: string;
  country: string;
  address?: string;
  postalCode?: string;
  ownerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateLocationData {
  locationName?: string;
  city: string;
  state: string;
  code: string;
  country: string;
  address?: string;
  postalCode?: string;
}

export interface UpdateLocationData {
  locationName?: string;
  city?: string;
  state?: string;
  code?: string;
  country?: string;
  address?: string;
  postalCode?: string;
}

export interface LocationFormField {
  name: keyof CreateLocationData;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export interface LocationSearchFilters {
  page?: number;
  limit?: number;
  query?: string;
  locationName?: string;
  city?: string;
  state?: string;
  country?: string;
  code?: string;
  address?: string;
}

export interface PaginatedLocationResponse {
  data: Location[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}