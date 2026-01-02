export interface OfferProduct {
  id: string;
  offerId: number;
  productId: string;
  productName: string;
  species: string;
  packing?: string;
  sizeDetails?: string;
  breakupDetails?: string;
  priceDetails?: string;
  conditionDetails?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Offer {
  id: number;
  businessOwnerId: string;
  offerName: string;
  businessName: string;
  fromParty: string;
  toParty: string;
  buyerId?: string | null;
  origin: string;
  processor?: string;
  plantApprovalNumber: string;
  destination: string;
  brand: string;
  draftName?: string;
  offerValidityDate: string | Date;
  shipmentDate?: string | Date;
  grandTotal?: number;
  quantity?: string;
  tolerance?: string;
  paymentTerms?: string;
  remark?: string;
  status: string;
  packing?: string;
  sizeBreakups?: any[];
  total?: number;
  isDeleted?: boolean;
  deletedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  buyer?: {
    id: string;
    buyersCompanyName?: string;
    contactName?: string;
    contactEmail?: string;
  } | null;
  products?: OfferProduct[];
}

export interface OffersResponse {
  data: Offer[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

export interface OfferSearchParams {
  offerName?: string;
  toParty?: string;
  destination?: string;
  status?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface CreateOfferResponse {
  success: boolean;
  data?: Offer;
  error?: string;
}

export interface OfferActionResponse {
  success: boolean;
  data?: Offer;
  error?: string;
}
