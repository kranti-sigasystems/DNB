'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOfferDrafts } from '@/hooks/use-offer-drafts';
import { useFormChanges } from '@/hooks/use-form-changes';
import type { OfferDraft, OfferDraftFormData } from '@/types/offer-draft';

export default function EditOfferDraftPage() {
  const router = useRouter();
  const params = useParams();
  const draftNo = Number(params.id);
  
  const { handleGetOfferDraftById, handleUpdateOfferDraft } = useOfferDrafts();
  
  const [originalDraft, setOriginalDraft] = useState<OfferDraft | null>(null);
  const [formData, setFormData] = useState<Partial<OfferDraftFormData>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form change tracking - compare current form data with original draft data
  const originalFormData: Partial<OfferDraftFormData> = originalDraft ? {
    fromParty: originalDraft.fromParty,
    origin: originalDraft.origin,
    processor: originalDraft.processor || '',
    plantApprovalNumber: originalDraft.plantApprovalNumber,
    brand: originalDraft.brand,
    draftName: originalDraft.draftName || '',
    offerValidityDate: originalDraft.offerValidityDate 
      ? new Date(originalDraft.offerValidityDate).toISOString().split('T')[0] 
      : '',
    shipmentDate: originalDraft.shipmentDate 
      ? new Date(originalDraft.shipmentDate).toISOString().split('T')[0] 
      : '',
    quantity: originalDraft.quantity || '',
    tolerance: originalDraft.tolerance || '',
    paymentTerms: originalDraft.paymentTerms || '',
    remark: originalDraft.remark || '',
    grandTotal: originalDraft.grandTotal ? Number(originalDraft.grandTotal) : 0,
  } : {};

  const { hasChanges } = useFormChanges(originalFormData, formData);

  useEffect(() => {
    const fetchDraft = async () => {
      if (draftNo) {
        setLoading(true);
        const result = await handleGetOfferDraftById(draftNo);
        if (result) {
          setOriginalDraft(result);
          // Convert to form data format
          const initialFormData: Partial<OfferDraftFormData> = {
            fromParty: result.fromParty,
            origin: result.origin,
            processor: result.processor || '',
            plantApprovalNumber: result.plantApprovalNumber,
            brand: result.brand,
            draftName: result.draftName || '',
            offerValidityDate: result.offerValidityDate 
              ? new Date(result.offerValidityDate).toISOString().split('T')[0] 
              : '',
            shipmentDate: result.shipmentDate 
              ? new Date(result.shipmentDate).toISOString().split('T')[0] 
              : '',
            quantity: result.quantity || '',
            tolerance: result.tolerance || '',
            paymentTerms: result.paymentTerms || '',
            remark: result.remark || '',
            grandTotal: result.grandTotal ? Number(result.grandTotal) : 0,
          };
          setFormData(initialFormData);
        }
        setLoading(false);
      }
    };

    fetchDraft();
  }, [draftNo, handleGetOfferDraftById]);

  const handleInputChange = useCallback((field: keyof OfferDraftFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !hasChanges) return;
    
    setIsSubmitting(true);
    try {
      const success = await handleUpdateOfferDraft(draftNo, formData);
      if (success) {
        router.push(`/offer-draft/${draftNo}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/offer-draft/${draftNo}`);
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

  if (!originalDraft) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Offer Draft Not Found</h2>
          <p className="text-muted-foreground mb-4">The offer draft you're trying to edit doesn't exist.</p>
          <Button onClick={() => router.push('/offer-draft')}>Back to Offer Drafts</Button>
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
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Edit {originalDraft.draftName || `Offer Draft #${originalDraft.draftNo}`}
              </h1>
              <p className="text-muted-foreground">Update offer draft information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromParty">From Party *</Label>
                  <Input
                    id="fromParty"
                    value={formData.fromParty || ''}
                    placeholder="Business owner name"
                    readOnly
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Cannot be changed - always your business name</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin *</Label>
                  <Input
                    id="origin"
                    value={formData.origin || ''}
                    onChange={(e) => handleInputChange('origin', e.target.value)}
                    placeholder="Enter origin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processor">Processor</Label>
                  <Input
                    id="processor"
                    value={formData.processor || ''}
                    onChange={(e) => handleInputChange('processor', e.target.value)}
                    placeholder="Enter processor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plantApprovalNumber">Plant Approval Number *</Label>
                  <Input
                    id="plantApprovalNumber"
                    value={formData.plantApprovalNumber || ''}
                    onChange={(e) => handleInputChange('plantApprovalNumber', e.target.value)}
                    placeholder="Enter plant approval number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    value={formData.brand || ''}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Enter brand"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="draftName">Draft Name</Label>
                  <Input
                    id="draftName"
                    value={formData.draftName || ''}
                    onChange={(e) => handleInputChange('draftName', e.target.value)}
                    placeholder="Enter draft name"
                  />
                  <p className="text-xs text-muted-foreground">You can edit the draft name</p>
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
                <div className="space-y-2">
                  <Label htmlFor="offerValidityDate">Offer Validity Date</Label>
                  <Input
                    id="offerValidityDate"
                    type="date"
                    value={formData.offerValidityDate || ''}
                    onChange={(e) => handleInputChange('offerValidityDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipmentDate">Shipment Date</Label>
                  <Input
                    id="shipmentDate"
                    type="date"
                    value={formData.shipmentDate || ''}
                    onChange={(e) => handleInputChange('shipmentDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    value={formData.quantity || ''}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tolerance">Tolerance</Label>
                  <Input
                    id="tolerance"
                    value={formData.tolerance || ''}
                    onChange={(e) => handleInputChange('tolerance', e.target.value)}
                    placeholder="Enter tolerance"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Textarea
                  id="paymentTerms"
                  value={formData.paymentTerms || ''}
                  onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                  placeholder="Enter payment terms"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remark">Remark</Label>
                <Textarea
                  id="remark"
                  value={formData.remark || ''}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  placeholder="Enter any remarks"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products (Read-only for now) */}
          <Card>
            <CardHeader>
              <CardTitle>Products ({originalDraft.draftProducts?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!originalDraft.draftProducts || originalDraft.draftProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No products added to this draft.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {originalDraft.draftProducts.map((product, index) => (
                    <div key={product.id || index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                          <p className="text-sm">{product.productName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Species</label>
                          <p className="text-sm">{product.species}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Size Breakups</label>
                          <p className="text-sm">{product.sizeBreakups?.length || 0} items</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground">
                    Note: Product details cannot be edited. Create a new draft to modify products.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grand Total */}
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="grandTotal">Grand Total *</Label>
                <Input
                  id="grandTotal"
                  type="number"
                  step="0.01"
                  value={formData.grandTotal || 0}
                  onChange={(e) => handleInputChange('grandTotal', Number(e.target.value))}
                  placeholder="Enter grand total"
                  required
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}