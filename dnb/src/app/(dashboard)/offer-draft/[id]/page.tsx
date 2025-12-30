'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOfferDrafts } from '@/hooks/use-offer-drafts';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import type { OfferDraft } from '@/types/offer-draft';

export default function ViewOfferDraftPage() {
  const router = useRouter();
  const params = useParams();
  const draftNo = Number(params.id);
  
  const { handleGetOfferDraftById, handleDeleteOfferDraft } = useOfferDrafts();
  const { showAlert, AlertDialog } = useAlertDialog();
  
  const [draft, setDraft] = useState<OfferDraft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDraft = async () => {
      if (draftNo) {
        setLoading(true);
        const result = await handleGetOfferDraftById(draftNo);
        setDraft(result);
        setLoading(false);
      }
    };

    fetchDraft();
  }, [draftNo, handleGetOfferDraftById]);

  const handleEdit = () => {
    router.push(`/offer-draft/${draftNo}/edit`);
  };

  const handleDelete = () => {
    showAlert({
      title: 'Delete Offer Draft',
      description: 'Are you sure you want to delete this offer draft? This action cannot be undone.',
      action: 'delete',
      itemName: draft?.draftName || `Draft #${draftNo}`,
      onConfirm: async () => {
        await handleDeleteOfferDraft(draftNo);
        router.push('/offer-draft');
      },
    });
  };

  const handleBack = () => {
    router.push('/offer-draft');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-green-600 fill-green-600';
      case 'close':
        return 'text-gray-600 fill-gray-500';
      default:
        return 'text-gray-600 fill-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading offer draft...</p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Offer Draft Not Found</h2>
          <p className="text-muted-foreground mb-4">The offer draft you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>Back to Offer Drafts</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {draft.draftName || `Offer Draft #${draft.draftNo}`}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {/* <span className={`flex items-center gap-1 font-semibold text-sm ${getStatusColor(draft.status || 'open')}`}>
                  <Circle className="w-3 h-3" />
                  {(draft.status || 'open').charAt(0).toUpperCase() + (draft.status || 'open').slice(1)}
                </span> */}
                <span className="text-muted-foreground text-sm">
                  • Created {new Date(draft.createdAt!).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Draft Number</label>
                <p className="text-sm font-mono">#{draft.draftNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">From Party</label>
                <p className="text-sm">{draft.fromParty}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Origin</label>
                <p className="text-sm">{draft.origin}</p>
              </div>
              {draft.processor && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Processor</label>
                  <p className="text-sm">{draft.processor}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plant Approval Number</label>
                <p className="text-sm">{draft.plantApprovalNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <p className="text-sm">{draft.brand}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates and Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Dates and Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draft.offerValidityDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Offer Validity Date</label>
                  <p className="text-sm">{new Date(draft.offerValidityDate).toLocaleDateString()}</p>
                </div>
              )}
              {draft.shipmentDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shipment Date</label>
                  <p className="text-sm">{new Date(draft.shipmentDate).toLocaleDateString()}</p>
                </div>
              )}
              {draft.quantity && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                  <p className="text-sm">{draft.quantity}</p>
                </div>
              )}
              {draft.tolerance && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tolerance</label>
                  <p className="text-sm">{draft.tolerance}</p>
                </div>
              )}
            </div>
            {draft.paymentTerms && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
                <p className="text-sm whitespace-pre-wrap">{draft.paymentTerms}</p>
              </div>
            )}
            {draft.remark && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Remark</label>
                <p className="text-sm whitespace-pre-wrap">{draft.remark}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({draft.draftProducts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!draft.draftProducts || draft.draftProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No products added to this draft.</p>
              </div>
            ) : (
              draft.draftProducts.map((product, index) => (
                <div key={product.id || index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Product {index + 1}</h4>
                    <Badge variant="secondary">{product.species}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                      <p className="text-sm">{product.productName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Species</label>
                      <p className="text-sm">{product.species}</p>
                    </div>
                    {product.packing && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Packing</label>
                        <p className="text-sm">{product.packing}</p>
                      </div>
                    )}
                  </div>

                  {product.sizeBreakups && product.sizeBreakups.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h5 className="font-medium mb-3">Size Breakups</h5>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Size</th>
                                <th className="text-left p-2">Breakup</th>
                                <th className="text-left p-2">Price</th>
                                {product.sizeBreakups.some(sb => sb.condition) && (
                                  <th className="text-left p-2">Condition</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {product.sizeBreakups.map((breakup, breakupIndex) => (
                                <tr key={breakup.id || breakupIndex} className="border-b">
                                  <td className="p-2">{breakup.size}</td>
                                  <td className="p-2">{breakup.breakup.toLocaleString()}</td>
                                  <td className="p-2">₹{Number(breakup.price).toLocaleString()}</td>
                                  {product.sizeBreakups.some(sb => sb.condition) && (
                                    <td className="p-2">{breakup.condition || '-'}</td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Total */}
        {draft.grandTotal && (
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ₹{Number(draft.grandTotal).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog />
    </>
  );
}