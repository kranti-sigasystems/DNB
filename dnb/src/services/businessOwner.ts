import { apiClient } from "@/utils/apiClient";
import { AxiosRequestConfig } from "axios";

interface AuthConfigExtra {
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

interface BuyerFilters {
  country?: string;
  productName?: string;
  locationName?: string;
  status?: string;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

interface PaginationParams {
  pageIndex?: number;
  pageSize?: number;
  filters?: Record<string, any>;
}

interface BuyerData {
  [key: string]: any;
}

interface UniqueCheckParams {
  [key: string]: any;
}

const authConfig = (extra: AuthConfigExtra = {}): AxiosRequestConfig => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
    ...extra.headers,
  },
  withCredentials: true,
  ...extra,
});

const api = {
  get: (url: string, params?: any) => apiClient.get(url, authConfig({ params })),
  post: (url: string, data?: any) => apiClient.post(url, data, authConfig()),
  put: (url: string, data?: any) => apiClient.put(url, data, authConfig()),
  patch: (url: string, data: any = {}) => apiClient.patch(url, data, authConfig()),
  delete: (url: string) => apiClient.delete(url, authConfig()),
};

export const businessOwnerService = {
  getAllBuyers: ({ pageIndex = 0, pageSize = 10, filters = {} }: PaginationParams = {}) =>
    api.get("/business-owner/get-all-buyers", {
      pageIndex,
      pageSize,
      ...filters,
    }),

  getBuyersList: () => {
    return api.get("/business-owner/get-buyers-list");
  },

  getBuyerById: (id: string) => {
    if (!id) throw new Error("Buyer ID is required");
    return api.get(`/business-owner/get-buyer/${id}`);
  },

  searchBuyers: (ownerId: string, filters: BuyerFilters = {}) => {
    const query: Record<string, any> = {};
    if (filters.country) query.country = filters.country;
    if (filters.productName) query.productName = filters.productName;
    if (filters.locationName) query.locationName = filters.locationName;
    if (filters.status) query.status = filters.status;
    if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;
    if (filters.page !== undefined) query.page = filters.page;
    if (filters.limit !== undefined) query.limit = filters.limit;

    return api.get(`/business-owner/${ownerId}/buyers/search`, { query });
  },

  getPaymentById: (paymentId: string) => {
    if (!paymentId) throw new Error("Payment ID is required");
    return api.get(`/payments/${paymentId}`);
  },

  checkRegistrationNumber: (registrationNumber: string) => {
    if (!registrationNumber)
      throw new Error("Registration number is required");
    return api.get(
      `/business-owner/check-registration/${registrationNumber}`
    );
  },

  addBuyer: (buyerData: BuyerData) => {
    if (!buyerData) throw new Error("Buyer data is required");
    return api.post("/business-owner/add-buyer", buyerData);
  },

  updateBuyer: (buyerId: string, buyerData: BuyerData) => {
    if (!buyerId) throw new Error("Buyer ID is required");
    if (!buyerData || typeof buyerData !== "object")
      throw new Error("Valid buyer data is required");

    const sanitizedData = { ...buyerData };
    delete sanitizedData.createdAt;
    delete sanitizedData.updatedAt;
    delete sanitizedData.id;
    return api.patch(`/business-owner/edit-buyer/${buyerId}/edit`, sanitizedData);
  },

  activateBuyer: (buyerId: string) => {
    if (!buyerId) throw new Error("Buyer ID is required");
    return api.patch(`/business-owner/activate-buyer/${buyerId}/activate`);
  },

  deactivateBuyer: (buyerId: string) => {
    if (!buyerId) throw new Error("Buyer ID is required");
    return api.patch(`/business-owner/deactivate-buyer/${buyerId}/deactivate`);
  },

  deleteBuyer: (buyerId: string) => {
    if (!buyerId) throw new Error("Buyer ID is required");
    return api.delete(`/business-owner/delete-buyer/${buyerId}`);
  },

  getProductById: (productId: string) => {
    if (!productId) throw new Error("Product ID is required");
    return api.get(`/product/get-product/${productId}`);
  },

  // ✅ uniqueness check (GET)
  checkUnique: async (params: UniqueCheckParams) => {
    try {
      const res = await api.get("/business-owner/check-unique", { params });
      return res;
    } catch (err) {
      throw err;
    }
  },
};

