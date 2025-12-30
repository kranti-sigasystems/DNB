export interface SizeBreakup {
  id?: string;
  size: string;
  breakup: number;
  price: number; // Will be converted from Decimal to number
  condition?: string;
  sizeDetails?: string;
  breakupDetails?: string;
  priceDetails?: string;
  conditionDetails?: string;
}

export interface OfferDraftProduct {
  id?: string;
  productId: string;
  productName: string;
  species: string;
  packing?: string;
  sizeDetails?: string;
  breakupDetails?: string;
  priceDetails?: string;
  conditionDetails?: string;
  sizeBreakups: SizeBreakup[];
}

export interface OfferDraft {
  draftNo?: number;
  businessOwnerId: string;
  fromParty: string;
  origin: string;
  processor?: string;
  plantApprovalNumber: string;
  brand: string;
  draftName?: string;
  offerValidityDate?: string | Date;
  shipmentDate?: string | Date;
  quantity?: string;
  tolerance?: string;
  paymentTerms?: string;
  remark?: string;
  grandTotal?: number | null; // Will be converted from Decimal to number
  // status?: 'open' | 'close'; // Temporarily commented out
  isDeleted?: boolean;
  deletedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  draftProducts?: OfferDraftProduct[];
}

export interface OfferDraftFormData {
  fromParty: string;
  origin: string;
  processor?: string;
  plantApprovalNumber: string;
  brand: string;
  draftName?: string;
  offerValidityDate?: string;
  shipmentDate?: string;
  quantity?: string;
  tolerance?: string;
  paymentTerms?: string;
  remark?: string;
  grandTotal: number;
  products: OfferDraftProduct[];
}

export interface OfferDraftsResponse {
  data: OfferDraft[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

export interface OfferDraftSearchParams {
  draftNo?: string | number;
  draftName?: string;
  productName?: string;
  status?: 'open' | 'close';
  pageIndex?: number;
  pageSize?: number;
}

export interface CreateOfferDraftResponse {
  success: boolean;
  data?: OfferDraft;
  error?: string;
}

export interface OfferDraftActionResponse {
  success: boolean;
  data?: OfferDraft;
  error?: string;
}

export interface OfferDraftSearchFilters {
  draftNo?: string;
  draftName?: string;
  productName?: string;
  // status?: string; // Temporarily disabled
}