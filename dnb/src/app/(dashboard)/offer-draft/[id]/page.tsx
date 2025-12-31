'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Package, 
  MapPin, 
  Building2, 
  FileText, 
  DollarSign,
  Clock,
  User,
  Truck,
  Copy,
  Download,
  Share2,
  Sun,
  Moon,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useOfferDrafts } from '@/hooks/use-offer-drafts';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { useTheme } from '@/providers/ThemeProvider';
import type { OfferDraft } from '@/types/offer-draft';

export default function ViewOfferDraftPage() {
  const router = useRouter();
  const params = useParams();
  const draftNo = Number(params.id);
  const { theme, toggleTheme } = useTheme();
  
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

  const handleCopyDraftNumber = () => {
    navigator.clipboard.writeText(`#${draft?.draftNo}`);
    // Simple notification without external toast library
    const notification = document.createElement('div');
    notification.textContent = 'Draft number copied to clipboard';
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
  };

  const getStatusBadge = () => {
    // Since status is commented out in the type, we'll always show as draft
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
      <FileText className="w-3 h-3 mr-1" />
      Draft
    </Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Loading Offer Draft</h3>
            <p className="text-muted-foreground">Please wait while we fetch the details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Offer Draft Not Found</h2>
            <p className="text-muted-foreground">The offer draft you're looking for doesn't exist or may have been deleted.</p>
          </div>
          <Button onClick={handleBack} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offer Drafts
          </Button>
        </div>
      </div>
    );
  }

  const totalProducts = draft.draftProducts?.length || 0;
  const totalValue = draft.grandTotal || 0;

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Drafts
                </Button>
              </div>
            </div>

            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 dark:bg-primary/10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">
                          View Offer Draft
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {draft.draftName || `Draft #${draft.draftNo}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Draft No:</span>
                        <button
                          onClick={handleCopyDraftNumber}
                          className="flex items-center gap-1 text-sm font-mono bg-muted px-2 py-1 rounded-md hover:bg-muted/80 transition-colors"
                        >
                          #{draft.draftNo}
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      {getStatusBadge()}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(draft.createdAt!).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/offer-draft/${draftNo}/create-offer`)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Package className="w-4 h-4" />
                      Create Offer
                    </Button>
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
              </CardHeader>
            </Card>
          </div>

          {/* Form-style Content */}
          <div className="space-y-8">
            {/* Basic Information Form Section */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fromParty" className="text-sm font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      From Party
                    </Label>
                    <Input
                      id="fromParty"
                      value={draft.fromParty}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="origin" className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Origin
                    </Label>
                    <Input
                      id="origin"
                      value={draft.origin}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Brand
                    </Label>
                    <Input
                      id="brand"
                      value={draft.brand}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                    />
                  </div>

                  {draft.processor && (
                    <div className="space-y-2">
                      <Label htmlFor="processor" className="text-sm font-semibold">
                        Processor
                      </Label>
                      <Input
                        id="processor"
                        value={draft.processor}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="plantApprovalNumber" className="text-sm font-semibold">
                      Plant Approval Number
                    </Label>
                    <Input
                      id="plantApprovalNumber"
                      value={draft.plantApprovalNumber}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                    />
                  </div>

                  {draft.quantity && (
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Quantity
                      </Label>
                      <Input
                        id="quantity"
                        value={draft.quantity}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                  )}

                  {draft.tolerance && (
                    <div className="space-y-2">
                      <Label htmlFor="tolerance" className="text-sm font-semibold">
                        Tolerance
                      </Label>
                      <Input
                        id="tolerance"
                        value={draft.tolerance}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dates Form Section */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {draft.offerValidityDate && (
                    <div className="space-y-2">
                      <Label htmlFor="offerValidityDate" className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Offer Validity Date
                      </Label>
                      <Input
                        id="offerValidityDate"
                        type="date"
                        value={new Date(draft.offerValidityDate).toISOString().split('T')[0]}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                  )}
                  
                  {draft.shipmentDate && (
                    <div className="space-y-2">
                      <Label htmlFor="shipmentDate" className="text-sm font-semibold flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Shipment Date
                      </Label>
                      <Input
                        id="shipmentDate"
                        type="date"
                        value={new Date(draft.shipmentDate).toISOString().split('T')[0]}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products Form Section */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary" />
                  Products ({totalProducts})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!draft.draftProducts || draft.draftProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Products Added</h3>
                    <p className="text-muted-foreground">This offer draft doesn't have any products yet.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {draft.draftProducts.map((product, index) => (
                      <div key={product.id || index} className="border border-border rounded-lg p-6 bg-muted/20 dark:bg-muted/10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-foreground">Product {index + 1}</h4>
                          <Badge variant="secondary" className="ml-auto">
                            {product.species}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Product Name</Label>
                            <Input
                              value={product.productName}
                              readOnly
                              className="bg-muted/50 border-muted-foreground/20"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Species</Label>
                            <Input
                              value={product.species}
                              readOnly
                              className="bg-muted/50 border-muted-foreground/20"
                            />
                          </div>
                          
                          {product.packing && (
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-sm font-semibold">Packing</Label>
                              <Input
                                value={product.packing}
                                readOnly
                                className="bg-muted/50 border-muted-foreground/20"
                              />
                            </div>
                          )}
                        </div>

                        {product.sizeBreakups && product.sizeBreakups.length > 0 && (
                          <div className="space-y-4">
                            <Separator />
                            <div>
                              <Label className="text-sm font-semibold mb-4 block">Size Breakups</Label>
                              <div className="overflow-x-auto">
                                <table className="w-full border border-border rounded-lg">
                                  <thead>
                                    <tr className="bg-muted/50 dark:bg-muted/30">
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground border-b border-border">Size</th>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground border-b border-border">Breakup</th>
                                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground border-b border-border">Price</th>
                                      {product.sizeBreakups.some(sb => sb.condition) && (
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground border-b border-border">Condition</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.sizeBreakups.map((breakup, breakupIndex) => (
                                      <tr key={breakup.id || breakupIndex} className="hover:bg-muted/30 dark:hover:bg-muted/20">
                                        <td className="py-3 px-4 text-sm font-medium text-foreground border-b border-border/50">{breakup.size}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground border-b border-border/50">{breakup.breakup.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-sm font-semibold text-foreground border-b border-border/50">₹{Number(breakup.price).toLocaleString()}</td>
                                        {product.sizeBreakups.some(sb => sb.condition) && (
                                          <td className="py-3 px-4 text-sm text-muted-foreground border-b border-border/50">{breakup.condition || '-'}</td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms & Conditions Form Section */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {draft.paymentTerms && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Payment Terms
                    </Label>
                    <Textarea
                      id="paymentTerms"
                      value={draft.paymentTerms}
                      readOnly
                      rows={4}
                      className="bg-muted/50 border-muted-foreground/20 focus:border-primary resize-none"
                    />
                  </div>
                )}

                {draft.remark && (
                  <div className="space-y-2">
                    <Label htmlFor="remark" className="text-sm font-semibold">
                      Remarks
                    </Label>
                    <Textarea
                      id="remark"
                      value={draft.remark}
                      readOnly
                      rows={4}
                      className="bg-muted/50 border-muted-foreground/20 focus:border-primary resize-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Form Section */}
            {draft.grandTotal && (
              <Card className="shadow-sm border-2 border-primary/20">
                <CardHeader className="bg-primary/5 dark:bg-primary/10">
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <DollarSign className="w-5 h-5" />
                    Grand Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Total Amount</Label>
                    <div className="text-4xl font-bold text-primary bg-primary/5 dark:bg-primary/10 p-4 rounded-lg text-center">
                      ₹{Number(draft.grandTotal).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AlertDialog />
    </>
  );
}