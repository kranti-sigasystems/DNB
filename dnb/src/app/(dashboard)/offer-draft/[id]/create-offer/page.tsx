'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, X, Package, Building2, MapPin, Calendar, User, Mail, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useOfferDrafts } from '@/hooks/use-offer-drafts';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { useTheme } from '@/providers/ThemeProvider';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import { createOffer, getNextOfferName, sendOfferEmail } from '@/actions/offer.actions';
import { getBuyersForOffer, getLocationsForOffer, debugGetAllBuyers } from '@/actions/offer-helpers.actions';
import { getStoredSession } from '@/utils/auth';
import { testBuyerCreation, testBuyerFetching } from '@/actions/test-buyer-creation.actions';
import { ValidationPatterns, ValidationMessages, getValidationClass } from '@/utils/validation';
import type { OfferDraft } from '@/types/offer-draft';

interface CreateOfferFormData {
  offerName: string;
  buyerId: string;
  toParty: string;
  destination: string;
  offerValidityDate: string;
  shipmentDate: string;
  paymentTerms: string;
  remark: string;
  sendEmail: boolean;
  emailSubject: string;
  emailMessage: string;
}

const EMPTY_FORM: CreateOfferFormData = {
  offerName: '',
  buyerId: '',
  toParty: '',
  destination: '',
  offerValidityDate: '',
  shipmentDate: '',
  paymentTerms: '',
  remark: '',
  sendEmail: false,
  emailSubject: '',
  emailMessage: '',
};

export default function CreateOfferPage() {
  const router = useRouter();
  const params = useParams();
  const draftNo = Number(params.id);
  const { theme } = useTheme();
  
  const { handleGetOfferDraftById } = useOfferDrafts();
  const { showAlert, AlertDialog } = useAlertDialog();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  
  const [draft, setDraft] = useState<OfferDraft | null>(null);
  const [formData, setFormData] = useState<CreateOfferFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load draft details
        const draftResult = await handleGetOfferDraftById(draftNo);
        setDraft(draftResult);
        
        // Load next offer name
        const offerNameResult = await getNextOfferName();
        
        // Load buyers and locations
        // Get auth token from client side
        const session = getStoredSession();
        const authToken = session?.accessToken;
        
        if (!authToken) {
          showError('Authentication required. Please log in again.');
          return;
        }
        
        try {
          const buyersResult = await getBuyersForOffer({ pageIndex: 0, pageSize: 100 }, authToken);
          
          if (buyersResult.success) {
            setBuyers(buyersResult.data || []);
          } else {
            console.error('Failed to load buyers:', buyersResult.error);
            showError(`Failed to load buyers: ${buyersResult.error}`);
          }
          
          // Debug: Also fetch all buyers to see what's in the system
          const debugResult = await debugGetAllBuyers(authToken);
        } catch (error) {
          console.error('Error loading buyers:', error);
          showError('Error loading buyers');
        }
        
        try {
          const locationsResult = await getLocationsForOffer({ pageIndex: 0, pageSize: 100 }, authToken);
          
          if (locationsResult.success) {
            setLocations(locationsResult.data || []);
          } else {
            console.error('Failed to load locations:', locationsResult.error);
            showError(`Failed to load locations: ${locationsResult.error}`);
          }
        } catch (error) {
          console.error('Error loading locations:', error);
          showError('Error loading locations');
        }
        
        // Set initial form data
        setFormData(prev => ({
          ...prev,
          offerName: offerNameResult.offerName || `Offer-${draftNo}`,
          offerValidityDate: draftResult?.offerValidityDate ? 
            new Date(draftResult.offerValidityDate).toISOString().split('T')[0] : '',
          shipmentDate: draftResult?.shipmentDate ? 
            new Date(draftResult.shipmentDate).toISOString().split('T')[0] : '',
          paymentTerms: draftResult?.paymentTerms || '',
          remark: draftResult?.remark || '',
          emailSubject: `New Offer: ${offerNameResult.offerName || `Offer-${draftNo}`}`,
          emailMessage: `Dear Valued Partner,\n\nWe are pleased to present our new offer for your consideration.\n\nOffer Details:\n- Offer Name: ${offerNameResult.offerName || `Offer-${draftNo}`}\n- Products: ${draftResult?.draftProducts?.length || 0} items\n- Total Value: ₹${Number(draftResult?.grandTotal || 0).toLocaleString()}\n\nPlease review the attached offer details and let us know if you have any questions.\n\nBest regards,\n${draftResult?.fromParty || 'Your Business Team'}`,
        }));
        
      } catch (error) {
        console.error('Failed to load data:', error);
        showError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (draftNo) {
      loadData();
    }
  }, [draftNo, handleGetOfferDraftById, showError]);

  const handleInputChange = useCallback((field: keyof CreateOfferFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [validationErrors]);

  const handleBuyerSelect = useCallback((buyerId: string) => {
    const selectedBuyerData = buyers.find(buyer => buyer.id === buyerId);
    setSelectedBuyer(selectedBuyerData);
    setFormData(prev => ({
      ...prev,
      buyerId,
      toParty: selectedBuyerData?.buyersCompanyName || '',
    }));
    
    // Clear validation error
    if (validationErrors.buyerId) {
      setValidationErrors(prev => ({ ...prev, buyerId: '' }));
    }
  }, [buyers, validationErrors]);

  const handleLocationSelect = useCallback((locationId: string) => {
    const selectedLocation = locations.find(loc => loc.id === locationId);
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        destination: `${selectedLocation.city}, ${selectedLocation.state}, ${selectedLocation.country?.name || selectedLocation.country}`,
      }));
    }
  }, [locations]);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!formData.offerName.trim()) {
      errors.offerName = ValidationMessages.required;
    }
    
    if (!formData.buyerId) {
      errors.buyerId = 'Please select a buyer';
    }
    
    if (!formData.destination.trim()) {
      errors.destination = 'Please select a destination';
    }
    
    // Email validation if sending email
    if (formData.sendEmail) {
      if (!formData.emailSubject.trim()) {
        errors.emailSubject = ValidationMessages.required;
      }
      
      if (!formData.emailMessage.trim()) {
        errors.emailMessage = ValidationMessages.required;
      }
      
      if (!selectedBuyer?.contactEmail && !selectedBuyer?.email) {
        errors.buyerId = 'Selected buyer must have an email address to send offer';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedBuyer]);

  const handleCreateOffer = useCallback(async () => {
    if (!validateForm()) {
      showError('Please fix the validation errors before proceeding.');
      return;
    }

    setCreating(true);
    try {
      // Get auth token for server actions
      const session = getStoredSession();
      const authToken = session?.accessToken;
      
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }

      const offerData = {
        ...formData,
        draftNo,
        businessOwnerId: draft?.businessOwnerId,
        fromParty: draft?.fromParty,
        origin: draft?.origin,
        processor: draft?.processor,
        plantApprovalNumber: draft?.plantApprovalNumber,
        brand: draft?.brand,
        quantity: draft?.quantity,
        tolerance: draft?.tolerance,
        grandTotal: draft?.grandTotal ? Number(draft.grandTotal) : undefined,
        products: draft?.draftProducts || [],
      };

      const result = await createOffer(draftNo, offerData, authToken);
      
      if (!result) {
        throw new Error('No response received from offer creation. Please check if database models are properly generated.');
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create offer');
      }

      // Send email if requested
      if (formData.sendEmail && selectedBuyer && result.data?.offer) {
        try {
          const emailResult = await sendOfferEmail({
            offerId: result.data.offer.id,
            buyerEmail: selectedBuyer.contactEmail || selectedBuyer.email,
            buyerName: selectedBuyer.contactName || selectedBuyer.buyersCompanyName,
            subject: formData.emailSubject,
            message: formData.emailMessage,
          }, authToken);
          
          if (emailResult.success) {
            showSuccess('Offer created and email sent successfully!');
          } else {
            showSuccess('Offer created successfully, but email failed to send.');
            console.warn('Email send failed:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Email send error:', emailError);
          showSuccess('Offer created successfully, but email failed to send.');
        }
      } else {
        showSuccess('Offer created successfully!');
      }
      
      // Navigate to offers page after a short delay
      setTimeout(() => {
        router.push('/offers');
      }, 1500);
      
    } catch (error: any) {
      console.error('Failed to create offer:', error);
      showError(error.message || 'Failed to create offer. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [formData, validateForm, draftNo, draft, selectedBuyer, router, showSuccess, showError]);

  const handleBack = () => {
    router.push(`/offer-draft/${draftNo}`);
  };

  // Debug function to test buyer creation and fetching
  const handleTestBuyers = async () => {
    try {
      const session = getStoredSession();
      const authToken = session?.accessToken;
      
      if (!authToken) {
        showError('Authentication required');
        return;
      }

      // Decode token to get business owner ID
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(authToken) as any;
      const businessOwnerId = decoded?.businessOwnerId || decoded?.id;
      
      if (!businessOwnerId) {
        showError('Business owner ID not found');
        return;
      }

      // Test buyer fetching
      const fetchResult = await testBuyerFetching(authToken);
      
      // Test buyer creation
      const createResult = await testBuyerCreation(businessOwnerId, authToken);
      
      if (createResult.success) {
        showSuccess('Test buyer created successfully! Check console for details.');
        // Reload buyers
        const buyersResult = await getBuyersForOffer({ pageIndex: 0, pageSize: 100 }, authToken);
        if (buyersResult.success) {
          setBuyers(buyersResult.data || []);
        }
      } else {
        showError(`Test failed: ${createResult.error}`);
      }
    } catch (error: any) {
      console.error('Test error:', error);
      showError(`Test error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Loading Draft Details</h3>
            <p className="text-muted-foreground">Please wait while we prepare the offer creation form...</p>
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
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Draft Not Found</h2>
            <p className="text-muted-foreground">The offer draft you're trying to create an offer from doesn't exist.</p>
          </div>
          <Button onClick={handleBack} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Draft
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Draft
              </Button>
            </div>

            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 dark:bg-primary/10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">
                          Create Offer
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          From Draft #{draft.draftNo} - {draft.draftName || 'Untitled Draft'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                        <Package className="w-3 h-3 mr-1" />
                        {draft.draftProducts?.length || 0} Products
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        ₹{Number(draft.grandTotal || 0).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Form */}
          <form className="space-y-6">
            {/* Offer Details */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary" />
                  Offer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="offerName" className="text-sm font-semibold">
                      Offer Name *
                    </Label>
                    <Input
                      id="offerName"
                      value={formData.offerName}
                      onChange={(e) => handleInputChange('offerName', e.target.value)}
                      className={`${validationErrors.offerName ? 'border-red-500' : ''}`}
                      placeholder="e.g., Offer-2024-001"
                    />
                    {validationErrors.offerName && (
                      <p className="text-sm text-red-500">{validationErrors.offerName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerId" className="text-sm font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      To Party (Buyer) *
                    </Label>
                    <Select value={formData.buyerId} onValueChange={handleBuyerSelect}>
                      <SelectTrigger className={`${validationErrors.buyerId ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select buyer company" />
                      </SelectTrigger>
                      <SelectContent>
                        {buyers.length > 0 ? (
                          buyers.map((buyer) => (
                            <SelectItem key={buyer.id} value={buyer.id}>
                              {buyer.buyersCompanyName || buyer.contactName || buyer.email}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-muted-foreground text-sm">
                            No buyers found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.buyerId && (
                      <p className="text-sm text-red-500">{validationErrors.buyerId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination" className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Destination *
                    </Label>
                    <Select onValueChange={handleLocationSelect}>
                      <SelectTrigger className={`${validationErrors.destination ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select destination location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.length > 0 ? (
                          locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {`${location.city}, ${location.state}, ${location.country?.name || location.country}`}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-muted-foreground text-sm">
                            No locations found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {formData.destination && (
                      <p className="text-sm text-muted-foreground">Selected: {formData.destination}</p>
                    )}
                    {validationErrors.destination && (
                      <p className="text-sm text-red-500">{validationErrors.destination}</p>
                    )}
                  </div>
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
                    <Label htmlFor="offerValidityDate" className="text-sm font-semibold">
                      Offer Validity Date
                    </Label>
                    <Input
                      id="offerValidityDate"
                      type="date"
                      value={formData.offerValidityDate}
                      onChange={(e) => handleInputChange('offerValidityDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shipmentDate" className="text-sm font-semibold">
                      Shipment Date
                    </Label>
                    <Input
                      id="shipmentDate"
                      type="date"
                      value={formData.shipmentDate}
                      onChange={(e) => handleInputChange('shipmentDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products from Draft */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary" />
                  Products ({draft?.draftProducts?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!draft?.draftProducts || draft.draftProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Products Added</h3>
                    <p className="text-muted-foreground">This offer draft doesn't have any products yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {draft.draftProducts.map((product, index) => (
                      <div key={product.id || index} className="border border-border rounded-lg p-4 bg-muted/20 dark:bg-muted/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-foreground">Product {index + 1}</h4>
                          <Badge variant="secondary" className="ml-auto">
                            {product.species}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          <div className="space-y-3">
                            <Separator />
                            <div>
                              <Label className="text-sm font-semibold mb-3 block">Size Breakups</Label>
                              <div className="overflow-x-auto">
                                <table className="w-full border border-border rounded-lg">
                                  <thead>
                                    <tr className="bg-muted/50 dark:bg-muted/30">
                                      <th className="text-left py-2 px-3 text-sm font-semibold text-foreground border-b border-border">Size</th>
                                      <th className="text-left py-2 px-3 text-sm font-semibold text-foreground border-b border-border">Breakup</th>
                                      <th className="text-left py-2 px-3 text-sm font-semibold text-foreground border-b border-border">Price</th>
                                      {product.sizeBreakups.some(sb => sb.condition) && (
                                        <th className="text-left py-2 px-3 text-sm font-semibold text-foreground border-b border-border">Condition</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.sizeBreakups.map((breakup, breakupIndex) => (
                                      <tr key={breakup.id || breakupIndex} className="hover:bg-muted/30 dark:hover:bg-muted/20">
                                        <td className="py-2 px-3 text-sm font-medium text-foreground border-b border-border/50">{breakup.size}</td>
                                        <td className="py-2 px-3 text-sm text-muted-foreground border-b border-border/50">{breakup.breakup.toLocaleString()}</td>
                                        <td className="py-2 px-3 text-sm font-semibold text-foreground border-b border-border/50">₹{Number(breakup.price).toLocaleString()}</td>
                                        {product.sizeBreakups.some(sb => sb.condition) && (
                                          <td className="py-2 px-3 text-sm text-muted-foreground border-b border-border/50">{breakup.condition || '-'}</td>
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
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="text-sm font-semibold">
                      Payment Terms
                    </Label>
                    <Textarea
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                      rows={3}
                      placeholder="Enter payment terms and conditions..."
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remark" className="text-sm font-semibold">
                      Remarks
                    </Label>
                    <Textarea
                      id="remark"
                      value={formData.remark}
                      onChange={(e) => handleInputChange('remark', e.target.value)}
                      rows={3}
                      placeholder="Enter any additional remarks or notes..."
                      className="resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Notification */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 dark:bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  Email Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmail"
                    checked={formData.sendEmail}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ ...prev, sendEmail: checked as boolean }));
                    }}
                  />
                  <Label htmlFor="sendEmail" className="text-sm font-medium cursor-pointer">
                    Send offer via email to buyer
                  </Label>
                </div>

                {selectedBuyer && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Selected Buyer:</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{selectedBuyer.contactName || selectedBuyer.buyersCompanyName}</p>
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedBuyer.contactEmail || selectedBuyer.email || 'No email address'}
                      </p>
                    </div>
                    {!selectedBuyer.contactEmail && !selectedBuyer.email && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ This buyer doesn't have an email address. Email cannot be sent.
                      </div>
                    )}
                  </div>
                )}

                {formData.sendEmail && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailSubject" className="text-sm font-semibold">
                        Email Subject *
                      </Label>
                      <Input
                        id="emailSubject"
                        value={formData.emailSubject}
                        onChange={(e) => handleInputChange('emailSubject', e.target.value)}
                        className={getValidationClass(true, !!validationErrors.emailSubject)}
                        placeholder="Enter email subject"
                      />
                      {validationErrors.emailSubject && (
                        <p className="text-sm text-red-500">{validationErrors.emailSubject}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailMessage" className="text-sm font-semibold">
                        Email Message *
                      </Label>
                      <Textarea
                        id="emailMessage"
                        value={formData.emailMessage}
                        onChange={(e) => handleInputChange('emailMessage', e.target.value)}
                        rows={8}
                        className={getValidationClass(true, !!validationErrors.emailMessage)}
                        placeholder="Enter your email message..."
                      />
                      {validationErrors.emailMessage && (
                        <p className="text-sm text-red-500">{validationErrors.emailMessage}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        This message will be sent along with the offer details as an attachment.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Draft Summary */}
            <Card className="shadow-sm border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-primary/10">
                <CardTitle className="flex items-center gap-2 text-lg text-primary">
                  <Package className="w-5 h-5" />
                  Draft Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-muted-foreground">From Party:</span>
                    <p className="text-foreground">{draft.fromParty}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Origin:</span>
                    <p className="text-foreground">{draft.origin}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Brand:</span>
                    <p className="text-foreground">{draft.brand}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Products:</span>
                    <p className="text-foreground">{draft.draftProducts?.length || 0} items</p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Total Value:</span>
                    <p className="text-foreground font-semibold">₹{Number(draft.grandTotal || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-sm mt-8 -mx-4 px-4 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Ready to create offer</span>
                {formData.sendEmail && selectedBuyer?.contactEmail && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Mail className="w-3 h-3" />
                    <span>Email will be sent</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestBuyers}
                  className="flex items-center gap-2 bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                >
                  🧪 Test Buyers
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={creating}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOffer}
                  disabled={creating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {formData.sendEmail ? 'Creating & Sending...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {formData.sendEmail ? (
                        <Send className="w-4 h-4 mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {formData.sendEmail ? 'Create & Send Offer' : 'Create Offer'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <LoadingOverlay isVisible={creating} message={formData.sendEmail ? "Creating offer and sending email..." : "Creating offer..."} />
    </>
  );
}