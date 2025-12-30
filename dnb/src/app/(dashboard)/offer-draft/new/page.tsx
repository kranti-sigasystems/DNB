'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useOfferDrafts } from '@/hooks/use-offer-drafts';
import { useFormChanges } from '@/hooks/use-form-changes';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { SizeBreakupSection, EMPTY_SIZE_BREAKUP } from '@/components/offer-drafts';
import { getProducts } from '@/actions/product.actions';
import { getLatestDraftNo } from '@/actions/offer-draft.actions';
import { getStoredSession } from '@/utils/auth';
import { ensureAuthenticated } from '@/utils/tokenManager';
import { generateOfferDraftName } from '@/utils/draft-name-generator';
import { useFormErrorFocus, createProductErrorConfigs, getErrorInputProps } from '@/utils/form-error-focus';
import type { OfferDraftFormData, OfferDraftProduct, SizeBreakup } from '@/types/offer-draft';
import type { Product } from '@/types/product';

const EMPTY_PRODUCT: OfferDraftProduct = {
  productId: '',
  productName: '',
  species: '',
  packing: '',
  sizeDetails: '',
  breakupDetails: '',
  priceDetails: '',
  conditionDetails: '',
  sizeBreakups: [{ ...EMPTY_SIZE_BREAKUP }],
};

export default function NewOfferDraftPage() {
  const router = useRouter();
  const { handleCreateOfferDraft } = useOfferDrafts();
  const { focusOnError } = useFormErrorFocus();
  
  const [formData, setFormData] = useState<OfferDraftFormData>({
    fromParty: '',
    origin: '',
    processor: '',
    plantApprovalNumber: '',
    brand: '',
    draftName: '',
    offerValidityDate: '',
    shipmentDate: '',
    quantity: '',
    tolerance: '',
    paymentTerms: '',
    remark: '',
    grandTotal: 0,
    products: [{ ...EMPTY_PRODUCT }],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Initial empty data for comparison - will be updated with auto-populated values
  const [initialData, setInitialData] = useState<OfferDraftFormData>({
    fromParty: '',
    origin: '',
    processor: '',
    plantApprovalNumber: '',
    brand: '',
    draftName: '',
    offerValidityDate: '',
    shipmentDate: '',
    quantity: '',
    tolerance: '',
    paymentTerms: '',
    remark: '',
    grandTotal: 0,
    products: [{
      productId: '',
      productName: '',
      species: '',
      packing: '',
      sizeDetails: '',
      breakupDetails: '',
      priceDetails: '',
      conditionDetails: '',
      sizeBreakups: [{ ...EMPTY_SIZE_BREAKUP }],
    }],
  });

  // Form change tracking
  const { hasChanges } = useFormChanges(initialData, formData);

  // Validation function
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // Basic required fields
    if (!formData.fromParty.trim()) {
      errors.fromParty = 'From Party is required';
    }
    if (!formData.origin.trim()) {
      errors.origin = 'Origin is required';
    }
    if (!formData.plantApprovalNumber.trim()) {
      errors.plantApprovalNumber = 'Plant Approval Number is required';
    }
    if (!formData.brand.trim()) {
      errors.brand = 'Brand is required';
    }
    if (!formData.draftName?.trim()) {
      errors.draftName = 'Draft Name is required';
    }
    if (formData.grandTotal <= 0) {
      errors.grandTotal = 'Grand Total must be greater than 0';
    }

    // Date validations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formData.offerValidityDate) {
      const offerDate = new Date(formData.offerValidityDate);
      offerDate.setHours(0, 0, 0, 0);
      
      if (offerDate < today) {
        errors.offerValidityDate = 'Offer validity date cannot be earlier than today';
      }
    }

    if (formData.shipmentDate) {
      const shipmentDate = new Date(formData.shipmentDate);
      shipmentDate.setHours(0, 0, 0, 0);
      
      if (shipmentDate < today) {
        errors.shipmentDate = 'Shipment date cannot be earlier than today';
      }

      if (formData.offerValidityDate) {
        const offerDate = new Date(formData.offerValidityDate);
        offerDate.setHours(0, 0, 0, 0);
        
        if (shipmentDate < offerDate) {
          errors.shipmentDate = 'Shipment date cannot be earlier than offer validity date';
        }
      }
    }

    // Calculate total breakup amount and validate against grand total
    let totalBreakupQuantity = 0;
    let hasValidProducts = false;

    // Validate products
    formData.products.forEach((product, index) => {
      if (!product.productId) {
        errors[`product_${index}_productId`] = 'Product selection is required';
      }
      if (!product.species) {
        errors[`product_${index}_species`] = 'Species selection is required';
      }
      
      // Validate size breakups and calculate total quantity
      if (product.sizeBreakups.length === 0) {
        errors[`product_${index}_sizeBreakups`] = 'At least one size breakup is required';
      } else {
        let hasValidBreakup = false;
        let productBreakupTotal = 0;
        
        product.sizeBreakups.forEach((breakup) => {
          if (breakup.size && breakup.breakup > 0 && breakup.price > 0) {
            hasValidBreakup = true;
            hasValidProducts = true;
            productBreakupTotal += breakup.breakup; // Just add the breakup quantity, don't multiply by price
          }
        });
        
        totalBreakupQuantity += productBreakupTotal;
        
        if (!hasValidBreakup) {
          errors[`product_${index}_sizeBreakups`] = 'At least one complete size breakup (size, breakup, price) is required';
        }
      }
    });

    // Validate total breakup quantity against grand total
    if (hasValidProducts && formData.grandTotal > 0) {
      const tolerance = 0.01; // Allow small floating point differences
      if (Math.abs(totalBreakupQuantity - formData.grandTotal) > tolerance) {
        errors.grandTotalMismatch = `Total breakup quantity (${totalBreakupQuantity}) must equal Grand Total (${formData.grandTotal})`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Clear validation error for a specific field
  const clearValidationError = useCallback((field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingInitialData(true);
        const session = getStoredSession();
        if (session?.accessToken && session?.user) {
          // Get authenticated token
          const authToken = await ensureAuthenticated();
          
          // Get business name from session data (faster)
          const businessName = String(session.user?.businessName || '');
          
          // Load latest draft number and products in parallel
          const [latestDraftResponse, productsResponse] = await Promise.all([
            getLatestDraftNo(authToken),
            getProducts({ pageIndex: 0, pageSize: 500 }, authToken)
          ]);

          // Generate next draft name with current date and sequential number
          const nextDraftNo = (latestDraftResponse?.lastDraftNo || 0) + 1;
          const defaultDraftName = generateOfferDraftName(nextDraftNo);
          
          // Only auto-populate draft name and from party
          const autoPopulatedData: Partial<OfferDraftFormData> = {
            fromParty: businessName || 'Business Owner',
            draftName: defaultDraftName,
          };
          
          setFormData(prev => {
            const updated = { ...prev, ...autoPopulatedData };
            return updated;
          });

          // Update initial data to match auto-populated values
          setInitialData(prev => ({
            ...prev,
            ...autoPopulatedData
          }));

          // Set products
          if (productsResponse && productsResponse.data) {
            setProducts(productsResponse.data || []);
          } else {
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoadingInitialData(false);
        setLoadingProducts(false);
      }
    };

    loadInitialData();
  }, []);

  const handleInputChange = useCallback((field: keyof OfferDraftFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearValidationError(field);
  }, [clearValidationError]);

  // Handle numeric input changes with validation
  const handleNumericInputChange = useCallback((field: keyof OfferDraftFormData, value: string) => {
    // Allow empty string for clearing the field
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: 0 }));
      clearValidationError(field);
      return;
    }
    
    // Parse the number
    const numValue = parseFloat(value);
    
    // Only update if it's a valid positive number
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData(prev => ({ ...prev, [field]: numValue }));
      clearValidationError(field);
    }
    // If negative or invalid, don't update the state (keeps previous value)
  }, [clearValidationError]);

  const handleProductChange = useCallback((index: number, field: keyof OfferDraftProduct, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      newProducts[index] = { ...newProducts[index], [field]: value };
      return { ...prev, products: newProducts };
    });
    clearValidationError(`product_${index}_${field}`);
  }, [clearValidationError]);

  const handleProductSelect = useCallback((index: number, productId: string) => {
    // Skip if it's a disabled option
    if (productId === 'loading' || productId === 'no-products') {
      return;
    }
    
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      // Filter out empty species
      const validSpecies = selectedProduct.species.filter(s => s && s.trim() !== '');
      const defaultSpecies = validSpecies.length > 0 ? validSpecies[0] : '';
      
      setFormData(prev => {
        const newProducts = [...prev.products];
        newProducts[index] = {
          ...newProducts[index],
          productId,
          productName: selectedProduct.productName,
          species: defaultSpecies,
        };
        return { ...prev, products: newProducts };
      });
      
      // Clear validation errors for this product
      clearValidationError(`product_${index}_productId`);
      if (defaultSpecies) {
        clearValidationError(`product_${index}_species`);
      }
    }
  }, [products, clearValidationError]);

  const handleSizeBreakupChange = useCallback((productIndex: number, breakupIndex: number, field: keyof SizeBreakup, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      const newSizeBreakups = [...newProducts[productIndex].sizeBreakups];
      newSizeBreakups[breakupIndex] = { ...newSizeBreakups[breakupIndex], [field]: value };
      newProducts[productIndex] = { ...newProducts[productIndex], sizeBreakups: newSizeBreakups };
      return { ...prev, products: newProducts };
    });
    clearValidationError(`product_${productIndex}_sizeBreakups`);
  }, [clearValidationError]);

  // Handle numeric size breakup changes with validation
  const handleSizeBreakupNumericChange = useCallback((productIndex: number, breakupIndex: number, field: 'breakup' | 'price', value: string) => {
    // Allow empty string for clearing the field
    if (value === '') {
      setFormData(prev => {
        const newProducts = [...prev.products];
        const newSizeBreakups = [...newProducts[productIndex].sizeBreakups];
        newSizeBreakups[breakupIndex] = { ...newSizeBreakups[breakupIndex], [field]: 0 };
        newProducts[productIndex] = { ...newProducts[productIndex], sizeBreakups: newSizeBreakups };
        return { ...prev, products: newProducts };
      });
      clearValidationError(`product_${productIndex}_sizeBreakups`);
      return;
    }
    
    // Parse the number
    const numValue = parseFloat(value);
    
    // Only update if it's a valid positive number
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData(prev => {
        const newProducts = [...prev.products];
        const newSizeBreakups = [...newProducts[productIndex].sizeBreakups];
        newSizeBreakups[breakupIndex] = { ...newSizeBreakups[breakupIndex], [field]: numValue };
        newProducts[productIndex] = { ...newProducts[productIndex], sizeBreakups: newSizeBreakups };
        return { ...prev, products: newProducts };
      });
      clearValidationError(`product_${productIndex}_sizeBreakups`);
    }
    // If negative or invalid, don't update the state (keeps previous value)
  }, [clearValidationError]);

  const addProduct = useCallback(() => {
    setFormData(prev => ({ ...prev, products: [...prev.products, { ...EMPTY_PRODUCT }] }));
  }, []);

  const removeProduct = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.length > 1 ? prev.products.filter((_, i) => i !== index) : [{ ...EMPTY_PRODUCT }]
    }));
  }, []);

  const addSizeBreakup = useCallback((productIndex: number) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      newProducts[productIndex] = {
        ...newProducts[productIndex],
        sizeBreakups: [...newProducts[productIndex].sizeBreakups, { ...EMPTY_SIZE_BREAKUP }],
      };
      return { ...prev, products: newProducts };
    });
  }, []);

  const removeSizeBreakup = useCallback((productIndex: number, breakupIndex: number) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      const currentBreakups = newProducts[productIndex].sizeBreakups;
      newProducts[productIndex] = {
        ...newProducts[productIndex],
        sizeBreakups: currentBreakups.length > 1 
          ? currentBreakups.filter((_, i) => i !== breakupIndex)
          : [{ ...EMPTY_SIZE_BREAKUP }],
      };
      return { ...prev, products: newProducts };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate form before submission
    if (!validateForm()) {
      // Check if there's a grand total mismatch error and show popup
      if (validationErrors.grandTotalMismatch) {
        alert(validationErrors.grandTotalMismatch);
        return;
      }
      
      // Create product-specific error configs
      const productConfigs = formData.products.flatMap((_, index) => 
        createProductErrorConfigs(index)
      );
      
      // Focus on the first error using the centralized utility
      focusOnError(validationErrors, productConfigs);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await handleCreateOfferDraft(formData);
      if (success) {
        router.push('/offer-draft');
      }
    } catch (error: any) {
      console.error('Error creating offer draft:', error);
      
      // Check if it's a duplicate name error
      if (error.message?.includes('already exists')) {
        setValidationErrors(prev => ({
          ...prev,
          draftName: 'A draft with this name already exists. Please choose a different name.'
        }));
        
        // Focus on draft name field using the utility
        focusOnError({ draftName: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      router.push('/offer-draft');
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    router.push('/offer-draft');
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

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
              <h1 className="text-2xl font-bold text-foreground">Create Offer Draft</h1>
              <p className="text-muted-foreground">Create a new offer draft with products and pricing</p>
            </div>
          </div>
        </div>

        {loadingInitialData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading initial data...</p>
            </div>
          </div>
        ) : (
          <>
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
                        onChange={(e) => handleInputChange('fromParty', e.target.value)}
                        placeholder={loadingInitialData ? "Loading..." : "Business owner name"}
                        readOnly
                        required
                        {...getErrorInputProps('fromParty', validationErrors)}
                        className="bg-muted text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">Automatically set to your business name</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin *</Label>
                      <Input
                        id="origin"
                        value={formData.origin}
                        onChange={(e) => handleInputChange('origin', e.target.value)}
                        placeholder="Enter origin"
                        required
                        {...getErrorInputProps('origin', validationErrors)}
                      />
                      {validationErrors.origin && (
                        <p className="text-xs text-red-600">{validationErrors.origin}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="processor">Processor</Label>
                      <Input
                        id="processor"
                        value={formData.processor}
                        onChange={(e) => handleInputChange('processor', e.target.value)}
                        placeholder="Enter processor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plantApprovalNumber">Plant Approval Number *</Label>
                      <Input
                        id="plantApprovalNumber"
                        value={formData.plantApprovalNumber}
                        onChange={(e) => handleInputChange('plantApprovalNumber', e.target.value)}
                        placeholder="Enter plant approval number"
                        required
                        data-error={!!validationErrors.plantApprovalNumber}
                        className={validationErrors.plantApprovalNumber ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {validationErrors.plantApprovalNumber && (
                        <p className="text-xs text-red-600">{validationErrors.plantApprovalNumber}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand *</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="Enter brand"
                        required
                        data-error={!!validationErrors.brand}
                        className={validationErrors.brand ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {validationErrors.brand && (
                        <p className="text-xs text-red-600">{validationErrors.brand}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="draftName">Draft Name</Label>
                      <Input
                        id="draftName"
                        value={formData.draftName || ''}
                        onChange={(e) => handleInputChange('draftName', e.target.value)}
                        placeholder={loadingInitialData ? "Generating..." : "Enter draft name"}
                        className={validationErrors.draftName ? "border-red-500 focus:border-red-500" : ""}
                        required
                        data-error={!!validationErrors.draftName}
                      />
                      {validationErrors.draftName && (
                        <p className="text-xs text-red-600">{validationErrors.draftName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Auto-generated in format: sequence/DD-MM-YY (e.g., 20/30-12-25)</p>
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
                        value={formData.offerValidityDate}
                        onChange={(e) => handleInputChange('offerValidityDate', e.target.value)}
                        data-error={!!validationErrors.offerValidityDate}
                        className={validationErrors.offerValidityDate ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {validationErrors.offerValidityDate && (
                        <p className="text-xs text-red-600">{validationErrors.offerValidityDate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipmentDate">Shipment Date</Label>
                      <Input
                        id="shipmentDate"
                        type="date"
                        value={formData.shipmentDate}
                        onChange={(e) => handleInputChange('shipmentDate', e.target.value)}
                        data-error={!!validationErrors.shipmentDate}
                        className={validationErrors.shipmentDate ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {validationErrors.shipmentDate && (
                        <p className="text-xs text-red-600">{validationErrors.shipmentDate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tolerance">Tolerance</Label>
                      <Input
                        id="tolerance"
                        value={formData.tolerance}
                        onChange={(e) => handleInputChange('tolerance', e.target.value)}
                        placeholder="Enter tolerance"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Textarea
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                      placeholder="Enter payment terms"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remark">Remark</Label>
                    <Textarea
                      id="remark"
                      value={formData.remark}
                      onChange={(e) => handleInputChange('remark', e.target.value)}
                      placeholder="Enter any remarks"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Grand Total */}
              <Card>
                <CardHeader>
                  <CardTitle>Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="grandTotal">Grand Total *</Label>
                      <Input
                        id="grandTotal"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.grandTotal || ''}
                        onChange={(e) => handleNumericInputChange('grandTotal', e.target.value)}
                        placeholder="Enter grand total"
                        required
                        data-error={!!validationErrors.grandTotal}
                        className={validationErrors.grandTotal ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {validationErrors.grandTotal && (
                        <p className="text-xs text-red-600">{validationErrors.grandTotal}</p>
                      )}
                      {validationErrors.grandTotalMismatch && (
                        <p className="text-xs text-red-600">{validationErrors.grandTotalMismatch}</p>
                      )}
                    </div>
                    
                    {/* Show current breakup total for comparison */}
                    {formData.products.some(p => p.sizeBreakups.some(sb => sb.breakup > 0 && sb.price > 0)) && (
                      <div className="bg-muted p-3 rounded text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Current Breakup Total:</span>
                          <span className="font-semibold">
                            {formData.products.reduce((total, product) => 
                              total + product.sizeBreakups.reduce((productTotal, breakup) => 
                                productTotal + (breakup.breakup || 0), 0), 0
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Products & Size Details</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProduct}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No products added yet. Click "Add Product" to get started.</p>
                    </div>
                  ) : (
                    formData.products.map((product, productIndex) => {
                      const selectedProduct = products.find(p => p.id === product.productId);
                      const availableSpecies = selectedProduct?.species.filter(s => s && s.trim() !== '') || [];

                      return (
                        <div key={productIndex} className="border rounded-lg p-4 space-y-4 bg-card" data-product-index={productIndex}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-card-foreground">Product {productIndex + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(productIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Product Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Product *</Label>
                              <Select
                                value={product.productId}
                                onValueChange={(value) => handleProductSelect(productIndex, value)}
                              >
                                <SelectTrigger 
                                  data-error={!!validationErrors[`product_${productIndex}_productId`]}
                                  className={validationErrors[`product_${productIndex}_productId`] ? "border-red-500 focus:border-red-500" : ""}
                                >
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingProducts ? (
                                    <SelectItem value="loading" disabled>Loading products...</SelectItem>
                                  ) : products.length === 0 ? (
                                    <SelectItem value="no-products" disabled>No products available</SelectItem>
                                  ) : (
                                    products.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.productName}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              {validationErrors[`product_${productIndex}_productId`] && (
                                <p className="text-xs text-red-600">{validationErrors[`product_${productIndex}_productId`]}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2" data-field="species">
                              <Label>Species *</Label>
                              <Select
                                value={product.species}
                                onValueChange={(value) => handleProductChange(productIndex, 'species', value)}
                                disabled={!product.productId}
                              >
                                <SelectTrigger 
                                  data-error={!!validationErrors[`product_${productIndex}_species`]}
                                  className={validationErrors[`product_${productIndex}_species`] ? "border-red-500 focus:border-red-500" : ""}
                                >
                                  <SelectValue placeholder="Select species" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSpecies.length === 0 ? (
                                    <SelectItem value="no-species" disabled>No species available</SelectItem>
                                  ) : (
                                    availableSpecies
                                      .filter(species => species && species.trim() !== '') // Filter out empty species
                                      .map((species, index) => (
                                        <SelectItem key={index} value={species}>
                                          {species}
                                        </SelectItem>
                                      ))
                                  )}
                                </SelectContent>
                              </Select>
                              {validationErrors[`product_${productIndex}_species`] && (
                                <p className="text-xs text-red-600">{validationErrors[`product_${productIndex}_species`]}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Packing</Label>
                              <Input
                                value={product.packing}
                                onChange={(e) => handleProductChange(productIndex, 'packing', e.target.value)}
                                placeholder="Enter packing details"
                              />
                            </div>
                          </div>
                          <Separator />

                          {/* Size Breakup Section */}
                          <SizeBreakupSection
                            sizeBreakups={product.sizeBreakups}
                            onSizeBreakupChange={(breakupIndex, field, value) => 
                              handleSizeBreakupChange(productIndex, breakupIndex, field, value)
                            }
                            onSizeBreakupNumericChange={(breakupIndex, field, value) => 
                              handleSizeBreakupNumericChange(productIndex, breakupIndex, field, value)
                            }
                            onAddSizeBreakup={() => addSizeBreakup(productIndex)}
                            onRemoveSizeBreakup={(breakupIndex) => removeSizeBreakup(productIndex, breakupIndex)}
                            productIndex={productIndex}
                            className="size-breakup-section"
                          />
                          {validationErrors[`product_${productIndex}_sizeBreakups`] && (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-sm text-red-600">{validationErrors[`product_${productIndex}_sizeBreakups`]}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </form>
          </>
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50 lg:left-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || loadingInitialData}
              className="flex items-center gap-2 min-w-[140px]"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : loadingInitialData ? 'Loading...' : 'Create Draft'}
            </Button>
          </div>
        </div>
      </div>

      {/* Add bottom padding to prevent content from being hidden behind sticky bar */}
      <div className="h-20"></div>

      <UnsavedChangesDialog 
        isOpen={showUnsavedDialog}
        onClose={handleContinueEditing}
        onDiscard={handleDiscardChanges}
        onContinueEditing={handleContinueEditing}
      />
    </>
  );
}