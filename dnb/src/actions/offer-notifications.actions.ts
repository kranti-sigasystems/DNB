'use server';

import { prisma } from '@/lib/prisma';
import { generateOfferNotificationTemplate } from '@/utils/emailTemplate';
import { sendEmailWithRetry } from '@/services/email.service';

export async function sendOfferNotification({
  offerId,
  buyerIds,
  isCounterOffer = false,
  versionNo,
  message
}: {
  offerId: string;
  buyerIds: string[];
  isCounterOffer?: boolean;
  versionNo?: number;
  message?: string;
}) {
  try {
    // Get offer details
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(offerId) },
      include: {
        businessOwner: {
          select: { businessName: true, email: true }
        }
      }
    });

    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    // Get buyers
    const buyers = await prisma.buyer.findMany({
      where: { 
        id: { in: buyerIds },
        is_deleted: false
      },
      select: {
        id: true,
        email: true,
        contactName: true,
        buyersCompanyName: true
      }
    });

    if (buyers.length === 0) {
      return { success: false, error: 'No valid buyers found' };
    }

    const loginUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/offers/${offerId}`;
    const emailErrors: any[] = [];

    // Send email to each buyer
    for (const buyer of buyers) {
      if (!buyer.email) continue;

      try {
        const emailHtml = generateOfferNotificationTemplate({
          offerName: offer.offerName,
          fromParty: offer.fromParty || offer.businessOwner?.businessName || 'Business',
          toParty: buyer.buyersCompanyName || buyer.contactName || 'Buyer',
          isCounterOffer,
          versionNo,
          quantity: offer.quantity?.toString(),
          grandTotal: offer.grandTotal?.toString(),
          shipmentDate: offer.shipmentDate?.toISOString().split('T')[0],
          loginUrl
        });

        const subject = isCounterOffer 
          ? `Counter Offer: ${offer.offerName} (Version ${versionNo})`
          : `New Offer: ${offer.offerName}`;

        await sendEmailWithRetry({
          to: buyer.email,
          subject,
          html: emailHtml,
          from: offer.businessOwner?.email
        });
      } catch (emailError) {
        console.error(`Failed to send offer email to ${buyer.email}:`, emailError);
        emailErrors.push({
          buyerId: buyer.id,
          buyerEmail: buyer.email,
          error: emailError
        });
      }
    }

    return {
      success: true,
      data: {
        sentCount: buyers.length - emailErrors.length,
        totalBuyers: buyers.length,
        errors: emailErrors
      }
    };
  } catch (error) {
    console.error('Error sending offer notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send offer notifications' 
    };
  }
}

export async function sendOfferStatusNotification({
  offerId,
  buyerId,
  status,
  message
}: {
  offerId: string;
  buyerId: string;
  status: 'confirmed' | 'rejected' | 'negotiating';
  message?: string;
}) {
  try {
    // Get offer and buyer details
    const [offer, buyer] = await Promise.all([
      prisma.offer.findUnique({
        where: { id: parseInt(offerId) },
        include: {
          businessOwner: {
            select: { businessName: true, email: true }
          }
        }
      }),
      prisma.buyer.findUnique({
        where: { id: buyerId },
        select: {
          email: true,
          contactName: true,
          buyersCompanyName: true,
          businessOwnerId: true
        }
      })
    ]);

    if (!offer || !buyer) {
      return { success: false, error: 'Offer or buyer not found' };
    }

    const statusMessages = {
      confirmed: {
        subject: `Offer Confirmed: ${offer.offerName} ✅`,
        title: 'Offer Confirmed',
        message: 'The offer has been confirmed and accepted.'
      },
      rejected: {
        subject: `Offer Rejected: ${offer.offerName} ❌`,
        title: 'Offer Rejected',
        message: 'The offer has been rejected.'
      },
      negotiating: {
        subject: `Offer Under Negotiation: ${offer.offerName} 💬`,
        title: 'Offer Negotiation',
        message: 'The offer is currently under negotiation.'
      }
    };

    const statusConfig = statusMessages[status];
    const loginUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/offers/${offerId}`;

    // Notify business owner
    if (offer.businessOwner?.email) {
      try {
        const emailHtml = generateOfferNotificationTemplate({
          offerName: offer.offerName,
          fromParty: buyer.buyersCompanyName || buyer.contactName || 'Buyer',
          toParty: offer.businessOwner.businessName || 'Business Owner',
          isCounterOffer: false,
          quantity: offer.quantity?.toString(),
          grandTotal: offer.grandTotal?.toString(),
          shipmentDate: offer.shipmentDate?.toISOString().split('T')[0],
          loginUrl
        });

        await sendEmailWithRetry({
          to: offer.businessOwner.email,
          subject: statusConfig.subject,
          html: emailHtml,
          from: buyer.email || undefined
        });

      } catch (emailError) {
        console.error('Failed to send status notification to business owner:', emailError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending offer status notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send status notification' 
    };
  }
}