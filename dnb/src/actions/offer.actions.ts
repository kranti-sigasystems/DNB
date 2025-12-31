'use server';

import { prisma } from '@/lib/prisma';
import { getStoredSession } from '@/utils/auth';
import { revalidatePath } from 'next/cache';
import { sendOfferEmailTemplate } from '@/services/email.service';

export interface CreateOfferData {
  offerName: string;
  buyerId: string;
  toParty: string;
  destination: string;
  offerValidityDate?: string;
  shipmentDate?: string;
  paymentTerms?: string;
  remark?: string;
  draftNo: number;
  businessOwnerId?: string;
  fromParty?: string;
  origin?: string;
  processor?: string;
  plantApprovalNumber?: string;
  brand?: string;
  quantity?: string;
  tolerance?: string;
  grandTotal?: number;
  products?: any[];
}

export interface OfferSearchParams {
  offerName?: string;
  businessName?: string;
  productName?: string;
  buyerName?: string;  // Added for buyer search
  toParty?: string;    // Added for toParty search
  status?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface OfferResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Create a new offer from a draft
 */
export async function createOffer(draftId: number, offerData: CreateOfferData, authToken?: string): Promise<OfferResponse> {
  try {
    // If no authToken provided, try to get from session (fallback)
    let businessOwnerId: string;
    let user: any;
    
    if (authToken) {
      // Decode the token to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        user = decoded;
        
        if (!businessOwnerId) {
          return { success: false, error: 'Business owner ID not found in token' };
        }
      } catch (error) {
        console.error('❌ JWT decode error:', error);
        return { success: false, error: 'Invalid authentication token' };
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }
      user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    // Validate required fields
    if (!offerData.offerName?.trim()) {
      return { success: false, error: 'Offer name is required' };
    }

    if (!offerData.buyerId) {
      return { success: false, error: 'Buyer selection is required' };
    }

    if (!offerData.destination?.trim()) {
      return { success: false, error: 'Destination is required' };
    }

    // Get the draft to copy data from
    let draft;
    try {
      // Check if OfferDraft models exist
      if (prisma.offerDraft) {
        draft = await prisma.offerDraft.findFirst({
          where: {
            draftNo: draftId,
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
      } else {
        console.warn('⚠️ OfferDraft models not found, using fallback data');
        draft = null;
      }
    } catch (error: any) {
      console.error('❌ Error accessing OfferDraft model:', error);
      console.warn('⚠️ Using fallback draft data due to missing models');
      draft = null;
    }

    // If no draft found or models don't exist, create a mock draft from the provided data
    if (!draft) {
      draft = {
        id: `mock-${draftId}`, // Add mock id for logging
        draftNo: draftId,
        businessOwnerId,
        draftName: `Draft-${draftId}`,
        fromParty: offerData.fromParty || 'Unknown Company',
        origin: offerData.origin || 'Unknown Origin',
        processor: offerData.processor || null,
        plantApprovalNumber: offerData.plantApprovalNumber || 'N/A',
        brand: offerData.brand || 'Unknown Brand',
        quantity: offerData.quantity || null,
        tolerance: offerData.tolerance || null,
        offerValidityDate: offerData.offerValidityDate ? new Date(offerData.offerValidityDate) : null,
        shipmentDate: offerData.shipmentDate ? new Date(offerData.shipmentDate) : null,
        paymentTerms: offerData.paymentTerms || null,
        remark: offerData.remark || null,
        grandTotal: offerData.grandTotal || 0,
        draftProducts: offerData.products || [],
      };
    }

    // Verify buyer exists and belongs to the business owner
    const buyer = await prisma.buyer.findFirst({
      where: {
        id: offerData.buyerId,
        businessOwnerId: businessOwnerId, // Fixed: was using ownerId instead of businessOwnerId
        is_deleted: false, // Fixed: was using isDeleted instead of is_deleted
      },
    });

    if (!buyer) {
      console.error('❌ Buyer not found:', { buyerId: offerData.buyerId, businessOwnerId });
      return { success: false, error: 'Buyer not found or access denied' };
    }

    // Create the offer
    let offer;
    try {
      if (!prisma.offer) {
        return { 
          success: false, 
          error: 'Database models not updated. Please run: npx prisma generate' 
        };
      }

      offer = await prisma.offer.create({
        data: {
          businessOwnerId,
          offerName: offerData.offerName,
          businessName: user.businessName || draft.fromParty,
          fromParty: draft.fromParty,
          toParty: offerData.toParty,
          buyerId: offerData.buyerId,
          origin: draft.origin,
          processor: draft.processor,
          plantApprovalNumber: draft.plantApprovalNumber,
          destination: offerData.destination,
          brand: draft.brand,
          draftName: draft.draftName,
          offerValidityDate: offerData.offerValidityDate 
            ? new Date(offerData.offerValidityDate) 
            : (draft.offerValidityDate ? new Date(draft.offerValidityDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // Default to 30 days from now
          shipmentDate: offerData.shipmentDate 
            ? new Date(offerData.shipmentDate) 
            : (draft.shipmentDate ? new Date(draft.shipmentDate) : null),
          grandTotal: draft.grandTotal ? Number(draft.grandTotal) : null,
          quantity: draft.quantity,
          tolerance: draft.tolerance,
          paymentTerms: offerData.paymentTerms || draft.paymentTerms,
          remark: offerData.remark || draft.remark,
          status: 'open',
        },
      });
    } catch (offerError: any) {
      console.error('❌ Error creating offer:', offerError);
      
      // Check if it's a Prisma client issue
      if (offerError.message?.includes('Cannot read properties of undefined')) {
        return { 
          success: false, 
          error: 'Database models not updated. Please run: npx prisma generate to fix this issue.' 
        };
      }
      
      return { 
        success: false, 
        error: `Failed to create offer: ${offerError.message}` 
      };
    }

    // Create offer products
    if (draft.draftProducts && draft.draftProducts.length > 0) {
      
      for (const draftProduct of draft.draftProducts) {
        try {
          if (!prisma.offerProduct) {
            console.warn('⚠️ OfferProduct model not available, skipping product creation');
            continue;
          }

          const offerProduct = await prisma.offerProduct.create({
            data: {
              offerId: offer.id,
              productId: draftProduct.productId || 'unknown',
              productName: draftProduct.productName || 'Unknown Product',
              species: draftProduct.species || 'Unknown',
              packing: draftProduct.packing || null,
              sizeDetails: draftProduct.sizeDetails || null,
              breakupDetails: draftProduct.breakupDetails || null,
              priceDetails: draftProduct.priceDetails || null,
              conditionDetails: draftProduct.conditionDetails || null,
            },
          });

          // Create size breakups for the offer product
          if (draftProduct.sizeBreakups && draftProduct.sizeBreakups.length > 0) {
            if (prisma.offerSizeBreakup) {
              await prisma.offerSizeBreakup.createMany({
                data: draftProduct.sizeBreakups.map((breakup: any) => ({
                  offerProductId: offerProduct.id,
                  size: breakup.size || 'Unknown',
                  breakup: breakup.breakup || 0,
                  price: breakup.price || 0,
                  condition: breakup.condition || null,
                })),
              });
            } else {
              console.warn('⚠️ OfferSizeBreakup model not available, skipping size breakups');
            }
          }
        } catch (productError: any) {
          console.error('❌ Error creating offer product:', productError);
          // Continue with other products even if one fails
        }
      }
    } else {
      console.log('⚠️ No draft products to create');
    }

    revalidatePath('/offers');
    revalidatePath('/offer-draft');

    return {
      success: true,
      data: {
        offer,
        message: 'Offer created successfully',
      },
    };
  } catch (error: any) {
    console.error('❌ Create offer error:', error);
    
    // Ensure we always return a proper response object
    return {
      success: false,
      error: error.message || 'Failed to create offer',
    };
  }
}

/**
 * Get next offer name
 */
export async function getNextOfferName(): Promise<{ offerName: string }> {
  try {
    const session = getStoredSession();
    if (!session?.user) {
      console.warn('No session found in getNextOfferName, using fallback');
      // Fallback to timestamp-based name if no session
      const timestamp = Date.now();
      return { offerName: `OFFER-${timestamp}` };
    }

    const user = session.user as any;
    const businessOwnerId = user.businessOwnerId || user.id;

    if (!businessOwnerId) {
      console.warn('No businessOwnerId found, using fallback');
      const timestamp = Date.now();
      return { offerName: `OFFER-${timestamp}` };
    }

    // Get the latest offer number for this business owner
    const latestOffer = await prisma.offer.findFirst({
      where: {
        businessOwnerId,
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        id: true,
        offerName: true,
      },
    });

    // Generate next offer name
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    let nextNumber = 1;
    if (latestOffer) {
      // Extract number from the latest offer name if it follows a pattern
      const match = latestOffer.offerName.match(/(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      } else {
        nextNumber = latestOffer.id + 1;
      }
    }

    const offerName = `OFFER-${year}${month}${day}-${String(nextNumber).padStart(3, '0')}`;

    return { offerName };
  } catch (error: any) {
    console.error('Get next offer name error:', error);
    // Fallback to timestamp-based name
    const timestamp = Date.now();
    return { offerName: `OFFER-${timestamp}` };
  }
}

/**
 * Get all offers for the authenticated user
 */
export async function getAllOffers(params: OfferSearchParams = {}, authToken?: string): Promise<{
  data: any[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}> {
  try {
    
    // If no authToken provided, try to get from session (fallback)
    let businessOwnerId: string;
    
    if (authToken) {
      // Decode the token to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        if (!businessOwnerId) {
          throw new Error('Business owner ID not found in token');
        }
      } catch (error) {
        console.error('❌ JWT decode error:', error);
        throw new Error('Invalid authentication token');
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        throw new Error('Authentication required');
      }
      const user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    const {
      pageIndex = 0,
      pageSize = 10,
      status,
      offerName,
      businessName,
      productName,
      buyerName,
      toParty,
    } = params;

    const skip = pageIndex * pageSize;

    // Build where clause
    const where: any = {
      businessOwnerId,
      isDeleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (offerName) {
      where.offerName = {
        contains: offerName,
        mode: 'insensitive',
      };
    }

    if (businessName) {
      where.businessName = {
        contains: businessName,
        mode: 'insensitive',
      };
    }

    if (toParty) {
      where.toParty = {
        contains: toParty,
        mode: 'insensitive',
      };
    }

    // Search by buyer name (requires join)
    if (buyerName) {
      where.buyer = {
        OR: [
          {
            buyersCompanyName: {
              contains: buyerName,
              mode: 'insensitive',
            },
          },
          {
            contactName: {
              contains: buyerName,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    // Search by product name (requires join)
    if (productName) {
      where.products = {
        some: {
          productName: {
            contains: productName,
            mode: 'insensitive',
          },
        },
      };
    }

    // Get total count
    const totalItems = await prisma.offer.count({ where });

    // Get offers
    const offers = await prisma.offer.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            buyersCompanyName: true,
            contactName: true,
            contactEmail: true,
          },
        },
        products: {
          include: {
            sizeBreakups: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: offers,
      totalItems,
      totalPages,
      pageIndex,
      pageSize,
    };
  } catch (error: any) {
    console.error('❌ Get all offers error:', error);
    return {
      data: [],
      totalItems: 0,
      totalPages: 0,
      pageIndex: 0,
      pageSize: 10,
    };
  }
}

/**
 * Get offer by ID
 */
export async function getOfferById(offerId: number, authToken?: string): Promise<OfferResponse> {
  try {
    // If no authToken provided, try to get from session (fallback)
    let businessOwnerId: string;
    
    if (authToken) {
      // Decode the token to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        
        if (!businessOwnerId) {
          return { success: false, error: 'Business owner ID not found in token' };
        }
      } catch (error) {
        return { success: false, error: 'Invalid authentication token' };
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }
      const user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        businessOwnerId,
        isDeleted: false,
      },
      include: {
        buyer: {
          select: {
            id: true,
            buyersCompanyName: true,
            contactName: true,
            contactEmail: true,
            country: true,
            city: true,
            state: true,
          },
        },
        products: {
          include: {
            sizeBreakups: true,
          },
        },
      },
    });

    if (!offer) {
      return { success: false, error: 'Offer not found or access denied' };
    }

    return {
      success: true,
      data: offer,
    };
  } catch (error: any) {
    console.error('Get offer by ID error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get offer',
    };
  }
}

/**
 * Update offer
 */
export async function updateOffer(offerId: number, updateData: Partial<CreateOfferData>, authToken?: string): Promise<OfferResponse> {
  try {
    // If no authToken provided, try to get from session (fallback)
    let businessOwnerId: string;
    
    if (authToken) {
      // Decode the token to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        
        if (!businessOwnerId) {
          return { success: false, error: 'Business owner ID not found in token' };
        }
      } catch (error) {
        return { success: false, error: 'Invalid authentication token' };
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }
      const user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    // Check if offer exists and belongs to user
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        businessOwnerId,
        isDeleted: false,
      },
    });

    if (!existingOffer) {
      return { success: false, error: 'Offer not found or access denied' };
    }

    // Update the offer
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        ...(updateData.offerName && { offerName: updateData.offerName }),
        ...(updateData.toParty && { toParty: updateData.toParty }),
        ...(updateData.destination && { destination: updateData.destination }),
        ...(updateData.offerValidityDate && { offerValidityDate: new Date(updateData.offerValidityDate) }),
        ...(updateData.shipmentDate && { shipmentDate: new Date(updateData.shipmentDate) }),
        ...(updateData.paymentTerms && { paymentTerms: updateData.paymentTerms }),
        ...(updateData.remark && { remark: updateData.remark }),
        updatedAt: new Date(),
      },
    });

    revalidatePath('/offers');
    revalidatePath(`/offers/${offerId}`);

    return {
      success: true,
      data: updatedOffer,
    };
  } catch (error: any) {
    console.error('Update offer error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update offer',
    };
  }
}

/**
 * Delete offer (soft delete)
 */
export async function deleteOffer(offerId: number, authToken?: string): Promise<OfferResponse> {
  try {
    // If no authToken provided, try to get from session (fallback)
    let businessOwnerId: string;
    
    if (authToken) {
      // Decode the token to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        
        if (!businessOwnerId) {
          return { success: false, error: 'Business owner ID not found in token' };
        }
      } catch (error) {
        return { success: false, error: 'Invalid authentication token' };
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }
      const user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    // Check if offer exists and belongs to user
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        businessOwnerId,
        isDeleted: false,
      },
    });

    if (!existingOffer) {
      return { success: false, error: 'Offer not found or access denied' };
    }

    // Soft delete the offer
    await prisma.offer.update({
      where: { id: offerId },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/offers');

    return {
      success: true,
      data: { message: 'Offer deleted successfully' },
    };
  } catch (error: any) {
    console.error('Delete offer error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete offer',
    };
  }
}

/**
 * Send offer via email
 */
export async function sendOfferEmail(emailData: {
  offerId: number;
  buyerEmail: string;
  buyerName: string;
  subject: string;
  message: string;
}, authToken?: string): Promise<OfferResponse> {
  try {
    // If no authToken provided, try to get from session (fallback)
    let businessOwnerId: string;
    
    if (authToken) {
      // Decode the token to get business owner ID
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.decode(authToken) as any;
        businessOwnerId = decoded?.businessOwnerId || decoded?.id;
        
        if (!businessOwnerId) {
          return { success: false, error: 'Business owner ID not found in token' };
        }
      } catch (error) {
        return { success: false, error: 'Invalid authentication token' };
      }
    } else {
      // Fallback to session
      const session = getStoredSession();
      if (!session?.user) {
        return { success: false, error: 'Authentication required' };
      }
      const user = session.user as any;
      businessOwnerId = user.businessOwnerId || user.id;
    }

    // Get the offer details
    const offer = await prisma.offer.findFirst({
      where: {
        id: emailData.offerId,
        businessOwnerId,
        isDeleted: false,
      },
      include: {
        buyer: {
          select: {
            buyersCompanyName: true,
            contactName: true,
            contactEmail: true,
          },
        },
        products: {
          include: {
            sizeBreakups: true,
          },
        },
      },
    });

    if (!offer) {
      return { success: false, error: 'Offer not found or access denied' };
    }

    // Send email using the email service
    const emailResult = await sendOfferEmailTemplate({
      buyerEmail: emailData.buyerEmail,
      buyerName: emailData.buyerName,
      subject: emailData.subject,
      message: emailData.message,
      offer: {
        id: offer.id,
        offerName: offer.offerName,
        fromParty: offer.fromParty,
        destination: offer.destination,
        grandTotal: Number(offer.grandTotal || 0),
        offerValidityDate: offer.offerValidityDate,
        products: offer.products || [],
      },
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to send email' };
    }

    return {
      success: true,
      data: { 
        message: 'Email sent successfully',
        messageId: emailResult.messageId,
      },
    };
  } catch (error: any) {
    console.error('Send offer email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Search offers
 */
export async function searchOffers(searchParams: OfferSearchParams): Promise<{
  data: any[];
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}> {
  return getAllOffers(searchParams);
}