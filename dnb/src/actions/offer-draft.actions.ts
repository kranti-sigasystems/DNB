'use server';

import { prisma } from '@/lib/prisma';
import { ensureAuthenticated } from '@/utils/tokenManager';
import { decodeTokenClient } from '@/utils/token-utils';
import type { 
  OfferDraftFormData,
  OfferDraftsResponse,
  OfferDraftSearchParams,
  CreateOfferDraftResponse,
  OfferDraftActionResponse
} from '@/types/offer-draft';

/**
 * Get business owner ID from auth token
 */
async function getBusinessOwnerIdFromToken(authToken: string): Promise<string> {
  const decoded = decodeTokenClient(authToken);
  
  if (!decoded?.businessOwnerId && !decoded?.ownerId) {
    throw new Error('Business owner ID not found in token');
  }
  
  return decoded.businessOwnerId || decoded.ownerId!;
}

/**
 * Validate size breakups total against grand total
 */
function validateSizeBreakups(products: any[], grandTotal: number): string | null {
  if (!Array.isArray(products)) {
    return "Products must be an array";
  }

  let totalBreakupSum = 0;
  for (const product of products) {
    if (!Array.isArray(product.sizeBreakups)) {
      return `Product ${product.productName} must have size breakups array`;
    }

    const productBreakupSum = product.sizeBreakups.reduce(
      (sum: number, item: any) => sum + Number(item?.breakup || 0),
      0
    );
    totalBreakupSum += productBreakupSum;
  }

  if (totalBreakupSum !== Number(grandTotal)) {
    return `Validation failed: Sum of all size breakups (${totalBreakupSum}) does not equal grand total (${grandTotal})`;
  }

  return null; // Valid
}

/**
 * Get all offer drafts for the authenticated business owner
 */
export async function getOfferDrafts(
  params: OfferDraftSearchParams = {},
  authToken?: string
): Promise<OfferDraftsResponse> {
  try {
    const token = authToken || await ensureAuthenticated();
    const businessOwnerId = await getBusinessOwnerIdFromToken(token);
    
    // Check if offer draft models exist in Prisma client
    if (!prisma.offerDraft) {
      console.warn('⚠️ OfferDraft models not found in Prisma client. Please run: npx prisma db push && npx prisma generate');
      return {
        data: [],
        totalItems: 0,
        totalPages: 0,
        pageIndex: 0,
        pageSize: 10,
      };
    }
    
    const { pageIndex = 0, pageSize = 10, ...filters } = params;
    const skip = pageIndex * pageSize;
    
    // Build where clause
    const where: any = { 
      businessOwnerId,
      isDeleted: false
    };
    
    if (filters.draftNo) {
      where.draftNo = Number(filters.draftNo);
    }
    
    if (filters.draftName) {
      where.draftName = {
        contains: filters.draftName,
        mode: 'insensitive',
      };
    }
    
    // Handle product name search
    if (filters.productName) {
      const productNameFilter = filters.productName.trim();
      
      // Find matching draft products first
      const matchingDraftProducts = await prisma.offerDraftProduct.findMany({
        where: {
          productName: {
            contains: productNameFilter,
            mode: 'insensitive',
          },
        },
        select: { draftNo: true },
        distinct: ['draftNo'],
      });
      
      const draftNumbers = matchingDraftProducts.map(d => d.draftNo);
      
      if (draftNumbers.length > 0) {
        where.draftNo = {
          in: draftNumbers,
        };
      } else {
        // No matching products found, return empty result
        return {
          data: [],
          totalItems: 0,
          totalPages: 0,
          pageIndex,
          pageSize,
        };
      }
    }
    
    // Get offer drafts with pagination
    let offerDrafts = [];
    let totalItems = 0;
    
    try {
      const [draftsResult, countResult] = await Promise.all([
        prisma.offerDraft.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            draftProducts: {
              include: {
                sizeBreakups: true,
              },
            },
          },
        }),
        prisma.offerDraft.count({ where }),
      ]);
      
      offerDrafts = draftsResult;
      totalItems = countResult;
    } catch (dbError: any) {
      console.error('❌ Database query error:', dbError);
      
      // Check if it's a table not found error
      if (dbError.message?.includes('does not exist') || 
          dbError.message?.includes('Unknown field') ||
          dbError.message?.includes('deletedAt')) {
        console.warn('⚠️ OfferDraft tables not found in database. Please run the SQL script or: npx prisma db push');
        return {
          data: [],
          totalItems: 0,
          totalPages: 0,
          pageIndex,
          pageSize,
        };
      }
      
      throw dbError; // Re-throw if it's a different error
    }
    
    // Convert Decimal fields to numbers for client serialization
    const serializedOfferDrafts = offerDrafts.map((draft: any) => ({
      ...draft,
      grandTotal: draft.grandTotal ? Number(draft.grandTotal) : null,
      processor: draft.processor || undefined, // Convert null to undefined
      draftName: draft.draftName || undefined, // Convert null to undefined
      quantity: draft.quantity || undefined,
      tolerance: draft.tolerance || undefined,
      paymentTerms: draft.paymentTerms || undefined,
      remark: draft.remark || undefined,
      offerValidityDate: draft.offerValidityDate || undefined, // Convert null to undefined
      shipmentDate: draft.shipmentDate || undefined, // Convert null to undefined
      deletedAt: draft.deletedAt || undefined, // Convert null to undefined
      draftProducts: draft.draftProducts.map((product: any) => ({
        ...product,
        sizeBreakups: product.sizeBreakups.map((breakup: any) => ({
          ...breakup,
          price: Number(breakup.price),
        })),
      })),
    }));
    
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      data: serializedOfferDrafts,
      totalItems,
      totalPages,
      pageIndex,
      pageSize,
    };
  } catch (error: any) {
    console.error('❌ Error fetching offer drafts:', error);
    
    // If it's a Prisma model error, return empty data with a helpful message
    if (error.message?.includes('offerDraft') || error.message?.includes('Unknown arg')) {
      console.warn('⚠️ OfferDraft models not found. Please run: npx prisma db push && npx prisma generate');
      return {
        data: [],
        totalItems: 0,
        totalPages: 0,
        pageIndex: 0,
        pageSize: 10,
      };
    }
    
    throw new Error(error.message || 'Failed to fetch offer drafts');
  }
}

/**
 * Get a single offer draft by ID
 */
export async function getOfferDraftById(
  draftNo: number,
  authToken?: string
): Promise<OfferDraftActionResponse> {
  try {
    const token = authToken || await ensureAuthenticated();
    const businessOwnerId = await getBusinessOwnerIdFromToken(token);
    
    // Check if offer draft models exist in Prisma client
    if (!prisma.offerDraft) {
      return {
        success: false,
        error: 'OfferDraft models not found. Please run: npx prisma db push && npx prisma generate',
      };
    }
    
    const offerDraft = await prisma.offerDraft.findFirst({
      where: {
        draftNo,
        businessOwnerId,
        isDeleted: false,
      },
      include: {
        draftProducts: {
          include: {
            sizeBreakups: true,
          },
        },
      },
    });
    
    if (!offerDraft) {
      return {
        success: false,
        error: 'Offer draft not found',
      };
    }
    
    // Convert Decimal fields to numbers for client serialization
    const serializedOfferDraft = {
      ...offerDraft,
      grandTotal: offerDraft.grandTotal ? Number(offerDraft.grandTotal) : null,
      processor: offerDraft.processor || undefined, // Convert null to undefined
      draftName: offerDraft.draftName || undefined, // Convert null to undefined
      quantity: offerDraft.quantity || undefined,
      tolerance: offerDraft.tolerance || undefined,
      paymentTerms: offerDraft.paymentTerms || undefined,
      remark: offerDraft.remark || undefined,
      offerValidityDate: offerDraft.offerValidityDate || undefined, // Convert null to undefined
      shipmentDate: offerDraft.shipmentDate || undefined, // Convert null to undefined
      deletedAt: offerDraft.deletedAt || undefined, // Convert null to undefined
      draftProducts: offerDraft.draftProducts.map((product: any) => ({
        ...product,
        sizeBreakups: product.sizeBreakups.map((breakup: any) => ({
          ...breakup,
          price: Number(breakup.price),
        })),
      })),
    };
    
    return {
      success: true,
      data: serializedOfferDraft,
    };
  } catch (error: any) {
    console.error('❌ Error fetching offer draft:', error);
    
    // If it's a Prisma model error, return helpful message
    if (error.message?.includes('offerDraft') || error.message?.includes('Unknown arg')) {
      return {
        success: false,
        error: 'OfferDraft models not found. Please run: npx prisma db push && npx prisma generate',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to fetch offer draft',
    };
  }
}

/**
 * Create new offer draft
 */
export async function createOfferDraft(
  draftData: OfferDraftFormData,
  authToken?: string
): Promise<CreateOfferDraftResponse> {
  try {
    const token = authToken || await ensureAuthenticated();
    const businessOwnerId = await getBusinessOwnerIdFromToken(token);
    
    // Check if offer draft models exist in Prisma client
    if (!prisma.offerDraft) {
      return {
        success: false,
        error: 'OfferDraft models not found. Please run: npx prisma db push && npx prisma generate',
      };
    }
    
    // Validate required fields
    if (!draftData.fromParty || !draftData.origin || !draftData.plantApprovalNumber || !draftData.brand) {
      return {
        success: false,
        error: 'From party, origin, plant approval number, and brand are required',
      };
    }
    
    if (!draftData.products || draftData.products.length === 0) {
      return {
        success: false,
        error: 'At least one product is required',
      };
    }
    
    // Validate size breakups
    const validationError = validateSizeBreakups(draftData.products, draftData.grandTotal);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }
    
    // Check for duplicate draft name if provided
    if (draftData.draftName) {
      const existingDraft = await prisma.offerDraft.findFirst({
        where: {
          draftName: draftData.draftName.trim(),
          businessOwnerId,
          isDeleted: false,
        },
      });
      
      if (existingDraft) {
        return {
          success: false,
          error: `A draft with the name "${draftData.draftName}" already exists.`,
        };
      }
    }
    
    // Create offer draft with products and size breakups in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the offer draft
      const offerDraft = await tx.offerDraft.create({
        data: {
          businessOwnerId,
          fromParty: draftData.fromParty,
          origin: draftData.origin,
          processor: draftData.processor,
          plantApprovalNumber: draftData.plantApprovalNumber,
          brand: draftData.brand,
          draftName: draftData.draftName,
          offerValidityDate: draftData.offerValidityDate ? new Date(draftData.offerValidityDate) : null,
          shipmentDate: draftData.shipmentDate ? new Date(draftData.shipmentDate) : null,
          quantity: draftData.quantity,
          tolerance: draftData.tolerance,
          paymentTerms: draftData.paymentTerms,
          remark: draftData.remark,
          grandTotal: draftData.grandTotal,
        },
      });
      
      // Create draft products (with detail fields)
      for (const product of draftData.products) {
        const draftProduct = await tx.offerDraftProduct.create({
          data: {
            draftNo: offerDraft.draftNo,
            productId: product.productId,
            productName: product.productName,
            species: product.species,
            packing: product.packing || '',
            sizeDetails: product.sizeDetails || '',
            breakupDetails: product.breakupDetails || '',
            priceDetails: product.priceDetails || '',
            conditionDetails: product.conditionDetails || '',
          },
        });
        
        // Create size breakups with detail fields
        if (product.sizeBreakups && product.sizeBreakups.length > 0) {
          await tx.offerDraftSizeBreakup.createMany({
            data: product.sizeBreakups.map(sb => ({
              offerDraftProductId: draftProduct.id,
              size: sb.size,
              breakup: sb.breakup,
              price: sb.price,
              condition: sb.condition || '',
            })),
          });
        }
      }
      
      // Return the complete offer draft with relations
      const result = await tx.offerDraft.findUnique({
        where: { draftNo: offerDraft.draftNo },
        include: {
          draftProducts: {
            include: {
              sizeBreakups: true,
            },
          },
        },
      });
      
      // Convert Decimal fields to numbers for client serialization
      if (result) {
        return {
          ...result,
          grandTotal: result.grandTotal ? Number(result.grandTotal) : null,
          processor: result.processor || undefined, // Convert null to undefined
          draftName: result.draftName || undefined, // Convert null to undefined
          quantity: result.quantity || undefined,
          tolerance: result.tolerance || undefined,
          paymentTerms: result.paymentTerms || undefined,
          remark: result.remark || undefined,
          offerValidityDate: result.offerValidityDate || undefined, // Convert null to undefined
          shipmentDate: result.shipmentDate || undefined, // Convert null to undefined
          deletedAt: result.deletedAt || undefined, // Convert null to undefined
          draftProducts: result.draftProducts.map((product: any) => ({
            ...product,
            sizeBreakups: product.sizeBreakups.map((breakup: any) => ({
              ...breakup,
              price: Number(breakup.price),
            })),
          })),
        };
      }
      
      return result;
    });
    
    return {
      success: true,
      data: result!,
    };
  } catch (error: any) {
    console.error('❌ Error creating offer draft:', error);
    
    // If it's a Prisma model error, return helpful message
    if (error.message?.includes('offerDraft') || error.message?.includes('Unknown arg')) {
      return {
        success: false,
        error: 'OfferDraft models not found. Please run: npx prisma db push && npx prisma generate',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create offer draft',
    };
  }
}

/**
 * Update an offer draft
 */
export async function updateOfferDraft(
  draftNo: number,
  draftData: Partial<OfferDraftFormData>,
  authToken?: string
): Promise<OfferDraftActionResponse> {
  try {
    const token = authToken || await ensureAuthenticated();
    const businessOwnerId = await getBusinessOwnerIdFromToken(token);
    
    // Check if draft exists and belongs to owner
    const existingDraft = await prisma.offerDraft.findFirst({
      where: {
        draftNo,
        businessOwnerId,
        isDeleted: false,
      },
    });
    
    if (!existingDraft) {
      return {
        success: false,
        error: 'Offer draft not found',
      };
    }
    
    // Validate dates if provided
    const finalOfferValidityDate = draftData.offerValidityDate 
      ? new Date(draftData.offerValidityDate) 
      : existingDraft.offerValidityDate;
    const finalShipmentDate = draftData.shipmentDate 
      ? new Date(draftData.shipmentDate) 
      : existingDraft.shipmentDate;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (finalOfferValidityDate && finalOfferValidityDate < today) {
      return {
        success: false,
        error: 'Offer validity date cannot be earlier than today.',
      };
    }
    
    if (finalShipmentDate && finalOfferValidityDate && finalShipmentDate < finalOfferValidityDate) {
      return {
        success: false,
        error: 'Shipment date cannot be earlier than the offer validity date.',
      };
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (draftData.fromParty !== undefined) updateData.fromParty = draftData.fromParty;
    if (draftData.origin !== undefined) updateData.origin = draftData.origin;
    if (draftData.processor !== undefined) updateData.processor = draftData.processor;
    if (draftData.plantApprovalNumber !== undefined) updateData.plantApprovalNumber = draftData.plantApprovalNumber;
    if (draftData.brand !== undefined) updateData.brand = draftData.brand;
    if (draftData.draftName !== undefined) updateData.draftName = draftData.draftName;
    if (draftData.offerValidityDate !== undefined) updateData.offerValidityDate = finalOfferValidityDate;
    if (draftData.shipmentDate !== undefined) updateData.shipmentDate = finalShipmentDate;
    if (draftData.quantity !== undefined) updateData.quantity = draftData.quantity;
    if (draftData.tolerance !== undefined) updateData.tolerance = draftData.tolerance;
    if (draftData.paymentTerms !== undefined) updateData.paymentTerms = draftData.paymentTerms;
    if (draftData.remark !== undefined) updateData.remark = draftData.remark;
    if (draftData.grandTotal !== undefined) updateData.grandTotal = draftData.grandTotal;
    
    // Update offer draft
    const updatedDraft = await prisma.offerDraft.update({
      where: { draftNo },
      data: updateData,
      include: {
        draftProducts: {
          include: {
            sizeBreakups: true,
          },
        },
      },
    });
    
    // Convert Decimal fields to numbers for client serialization
    const serializedDraft = {
      ...updatedDraft,
      grandTotal: updatedDraft.grandTotal ? Number(updatedDraft.grandTotal) : null,
      processor: updatedDraft.processor || undefined, // Convert null to undefined
      draftName: updatedDraft.draftName || undefined, // Convert null to undefined
      quantity: updatedDraft.quantity || undefined,
      tolerance: updatedDraft.tolerance || undefined,
      paymentTerms: updatedDraft.paymentTerms || undefined,
      remark: updatedDraft.remark || undefined,
      offerValidityDate: updatedDraft.offerValidityDate || undefined, // Convert null to undefined
      shipmentDate: updatedDraft.shipmentDate || undefined, // Convert null to undefined
      deletedAt: updatedDraft.deletedAt || undefined, // Convert null to undefined
      draftProducts: updatedDraft.draftProducts.map((product: any) => ({
        ...product,
        sizeBreakups: product.sizeBreakups.map((breakup: any) => ({
          ...breakup,
          price: Number(breakup.price),
        })),
      })),
    };
    
    return {
      success: true,
      data: serializedDraft,
    };
  } catch (error: any) {
    console.error('❌ Error updating offer draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to update offer draft',
    };
  }
}

/**
 * Delete an offer draft (soft delete)
 */
export async function deleteOfferDraft(
  draftNo: number,
  authToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = authToken || await ensureAuthenticated();
    const businessOwnerId = await getBusinessOwnerIdFromToken(token);
    
    // Check if draft exists and belongs to owner
    const existingDraft = await prisma.offerDraft.findFirst({
      where: {
        draftNo,
        businessOwnerId,
        isDeleted: false,
      },
    });
    
    if (!existingDraft) {
      return {
        success: false,
        error: 'Offer draft not found',
      };
    }
    
    // Soft delete the offer draft
    await prisma.offerDraft.update({
      where: { draftNo },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Error deleting offer draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete offer draft',
    };
  }
}

/**
 * Update offer draft status - TEMPORARILY DISABLED
 */
export async function updateOfferDraftStatus(
  _draftNo: number,
  _status: 'open' | 'close',
  _authToken?: string
): Promise<OfferDraftActionResponse> {
  // Temporarily disabled due to enum issue
  return {
    success: false,
    error: 'Status update temporarily disabled',
  };
}

/**
 * Get latest draft number for the authenticated business owner
 */
export async function getLatestDraftNo(authToken?: string): Promise<{ lastDraftNo: number | null }> {
  try {
    const token = authToken || await ensureAuthenticated();
    const businessOwnerId = await getBusinessOwnerIdFromToken(token);
    
    const lastDraft = await prisma.offerDraft.findFirst({
      where: {
        businessOwnerId,
        isDeleted: false,
      },
      orderBy: { draftNo: 'desc' },
      select: { draftNo: true },
    });
    
    return {
      lastDraftNo: lastDraft ? lastDraft.draftNo : null,
    };
  } catch (error: any) {
    console.error('❌ Error fetching latest draft number:', error);
    return {
      lastDraftNo: null,
    };
  }
}

/**
 * Search offer drafts
 */
export async function searchOfferDrafts(
  searchParams: OfferDraftSearchParams,
  authToken?: string
): Promise<OfferDraftsResponse> {
  try {
    // Use the same logic as getOfferDrafts since it already handles search
    return await getOfferDrafts(searchParams, authToken);
  } catch (error: any) {
    console.error('❌ Error searching offer drafts:', error);
    throw new Error(error.message || 'Failed to search offer drafts');
  }
}