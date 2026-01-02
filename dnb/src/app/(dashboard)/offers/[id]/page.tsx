'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trash2, 
  Package, 
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useOffers } from '@/hooks/use-offers';
import type { Offer } from '@/types/offer.ts';

interface OfferDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OfferDetailPage({ params }: OfferDetailPageProps) {
  const router = useRouter();
  const { handleGetOfferById, handleDeleteOffer } = useOffers();
  const { showAlert, AlertDialog } = useAlertDialog();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
  // Unwrap the params Promise using React.use()
  const { id } = use(params);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setLoading(true);
        const offerId = parseInt(id);
        const result = await handleGetOfferById(offerId);
        if (result && result.success && result.data) {
          setOffer(result.data);
        } else {
          router.push('/offers');
        }
      } catch (error) {
        console.error('Error fetching offer:', error);
        router.push('/offers');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOffer();
    }
  }, [id, handleGetOfferById, router]);

  const handleDelete = () => {
    if (!offer) return;

    showAlert({
      title: 'Delete Offer',
      description: 'Are you sure you want to delete this offer? This action cannot be undone.',
      action: 'delete',
      itemName: offer.offerName,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await handleDeleteOffer(offer.id);
          router.push('/offers');
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="sticky top-0 bg-background border-b border-border shadow-sm z-20 rounded-xl mb-6">
          <div className="py-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-20" />
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-3 ml-3">
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="py-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Offer Not Found</h3>
          <p className="text-muted-foreground mb-4">The offer you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/offers')}>
            Back to Offers
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(offer.offerValidityDate) < new Date();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={deleting} message="Deleting offer..." />

      {/* Alert Dialog */}
      <AlertDialog />

      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border shadow-sm z-20 rounded-xl mb-6">
        <div className="py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3 ml-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">View Offer</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Offer details and information</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={deleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Essential offer details and identification</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Offer Name</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">{offer.offerName}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            {offer.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">From Party</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">{offer.fromParty}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">To Party</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">{offer.toParty}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Origin</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">{offer.origin}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Destination</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">{offer.destination}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">{offer.brand}</p>
                    </div>
                  </div>

                  {offer.processor && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Processor</label>
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="font-medium text-foreground">{offer.processor}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Plant Approval Number</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">{offer.plantApprovalNumber}</p>
                    </div>
                  </div>

                  {offer.quantity && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="font-medium text-foreground">{offer.quantity}</p>
                      </div>
                    </div>
                  )}

                  {offer.tolerance && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Tolerance</label>
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="font-medium text-foreground">{offer.tolerance}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dates Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Important Dates</CardTitle>
                    <p className="text-sm text-muted-foreground">Offer validity and shipment dates</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Offer Validity Date</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">
                        {new Date(offer.offerValidityDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {offer.shipmentDate && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Shipment Date</label>
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="font-medium text-foreground">
                          {new Date(offer.shipmentDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">
                        {new Date(offer.createdAt || new Date()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {offer.updatedAt && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="font-medium text-foreground">
                          {new Date(offer.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Products</CardTitle>
                    <p className="text-sm text-muted-foreground">Products included in this offer</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Number of Products</label>
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    <p className="font-medium text-foreground">
                      {offer.products?.length || 0} product{(offer.products?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Financial Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Offer value and payment details</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Grand Total</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground text-lg">
                        ₹{Number(offer.grandTotal || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {offer.paymentTerms && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="font-medium text-foreground">{offer.paymentTerms}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            {offer.remark && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Remarks</CardTitle>
                      <p className="text-sm text-muted-foreground">Additional notes and remarks</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground whitespace-pre-wrap">{offer.remark}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
