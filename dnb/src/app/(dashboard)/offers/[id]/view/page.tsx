'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
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
  Eye,
  Mail,
  MailCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/providers/ThemeProvider';
import { getOfferById } from '@/actions/offer.actions';

interface Offer {
  id: number;
  offerName: string;
  businessName: string;
  fromParty: string;
  toParty: string;
  destination: string;
  origin: string;
  processor?: string;
  plantApprovalNumber: string;
  brand: string;
  draftName?: string;
  offerValidityDate: Date;
  shipmentDate?: Date;
  grandTotal: number;
  quantity?: string;
  tolerance?: string;
  paymentTerms?: string;
  remark?: string;
  status: string;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  buyer: {
    buyersCompanyName: string;
    contactName: string;
    contactEmail: string;
    country?: string;
    city?: string;
    state?: string;
  } | null;
  products: any[];
}

export default function ViewOfferPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = Number(params.id);
  const { theme } = useTheme();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      if (offerId) {
        setLoading(true);
        try {
          const result = await getOfferById(offerId);
          if (result.success && result.data) {
            setOffer(result.data);
          } else {
            console.error('Failed to fetch offer:', result.error);
          }
        } catch (error) {
          console.error('Error fetching offer:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOffer();
  }, [offerId]);

  const handleBack = () => {
    router.push('/offers');
  };

  const handleCopyOfferNumber = () => {
    navigator.clipboard.writeText(`#${offer?.id}`);
    // Simple notification
    const notification = document.createElement('div');
    notification.textContent = 'Offer number copied to clipboard';
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
  };

  const getStatusBadge = () => {
    if (!offer) return null;
    
    const isExpired = new Date(offer.offerValidityDate) < new Date();
    
    if (isExpired) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    
    const statusConfig = {
      open: { variant: 'default' as const, color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800', icon: CheckCircle },
      closed: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800', icon: FileText },
    };
    
    const config = statusConfig[offer.status as keyof typeof statusConfig] || statusConfig.open;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Loading Offer</h3>
            <p className="text-muted-foreground">Please wait while we fetch the offer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Offer Not Found</h2>
            <p className="text-muted-foreground">The offer you're looking for doesn't exist or may have been removed.</p>
          </div>
          <Button onClick={handleBack} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(offer.offerValidityDate) < new Date();

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
                  Back to Offers
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
                          {offer.offerName}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          From {offer.fromParty}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Offer ID:</span>
                        <button
                          onClick={handleCopyOfferNumber}
                          className="flex items-center gap-1 text-sm font-mono bg-muted px-2 py-1 rounded-md hover:bg-muted/80 transition-colors"
                        >
                          #{offer.id}
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      {getStatusBadge()}
                      {offer.emailSent && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                          <MailCheck className="w-3 h-3 mr-1" />
                          Email Sent
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(offer.createdAt).toLocaleDateString('en-US', { 
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
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Validity Warning */}
          {isExpired && (
            <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-400">Offer Expired</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This offer expired on {new Date(offer.offerValidityDate).toLocaleDateString()}. 
                      Please contact the seller for updated pricing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form-style Content */}
          <div className="space-y-8">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  Offer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      From Party
                    </Label>
                    <Input
                      value={offer.fromParty}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      To Party
                    </Label>
                    <Input
                      value={offer.toParty}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Origin
                    </Label>
                    <Input
                      value={offer.origin}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Destination
                    </Label>
                    <Input
                      value={offer.destination}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Brand
                    </Label>
                    <Input
                      value={offer.brand}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Plant Approval Number
                    </Label>
                    <Input
                      value={offer.plantApprovalNumber}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20"
                    />
                  </div>

                  {offer.processor && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Processor
                      </Label>
                      <Input
                        value={offer.processor}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20"
                      />
                    </div>
                  )}

                  {offer.quantity && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Quantity
                      </Label>
                      <Input
                        value={offer.quantity}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20"
                      />
                    </div>
                  )}

                  {offer.tolerance && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Tolerance
                      </Label>
                      <Input
                        value={offer.tolerance}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Offer Validity Date
                    </Label>
                    <Input
                      type="date"
                      value={new Date(offer.offerValidityDate).toISOString().split('T')[0]}
                      readOnly
                      className={`bg-muted/50 border-muted-foreground/20 ${isExpired ? 'text-red-600 font-semibold' : ''}`}
                    />
                    {isExpired && (
                      <p className="text-sm text-red-600">⚠️ This offer has expired</p>
                    )}
                  </div>
                  
                  {offer.shipmentDate && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Shipment Date
                      </Label>
                      <Input
                        type="date"
                        value={new Date(offer.shipmentDate).toISOString().split('T')[0]}
                        readOnly
                        className="bg-muted/50 border-muted-foreground/20"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary" />
                  Products ({offer.products?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!offer.products || offer.products.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Products</h3>
                    <p className="text-muted-foreground">This offer doesn't have any products listed.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {offer.products.map((product, index) => (
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
                                      {product.sizeBreakups.some((sb: any) => sb.condition) && (
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground border-b border-border">Condition</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.sizeBreakups.map((breakup: any, breakupIndex: number) => (
                                      <tr key={breakup.id || breakupIndex} className="hover:bg-muted/30 dark:hover:bg-muted/20">
                                        <td className="py-3 px-4 text-sm font-medium text-foreground border-b border-border/50">{breakup.size}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground border-b border-border/50">{breakup.breakup.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-sm font-semibold text-foreground border-b border-border/50">₹{Number(breakup.price).toLocaleString()}</td>
                                        {product.sizeBreakups.some((sb: any) => sb.condition) && (
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

            {/* Terms & Conditions */}
            {(offer.paymentTerms || offer.remark) && (
              <Card className="shadow-sm">
                <CardHeader className="bg-muted/30 dark:bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    Terms & Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {offer.paymentTerms && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Payment Terms
                      </Label>
                      <Textarea
                        value={offer.paymentTerms}
                        readOnly
                        rows={4}
                        className="bg-muted/50 border-muted-foreground/20 resize-none"
                      />
                    </div>
                  )}

                  {offer.remark && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Remarks
                      </Label>
                      <Textarea
                        value={offer.remark}
                        readOnly
                        rows={4}
                        className="bg-muted/50 border-muted-foreground/20 resize-none"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Total */}
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
                    ₹{Number(offer.grandTotal).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-sm border-2 border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-900/20">
                <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-400">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    If you have any questions about this offer or would like to proceed, please contact:
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">{offer.fromParty}</h4>
                    <p className="text-sm text-muted-foreground">
                      Please reach out to discuss terms, delivery schedules, or any other requirements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}