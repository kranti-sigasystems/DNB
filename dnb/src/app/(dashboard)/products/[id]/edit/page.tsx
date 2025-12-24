'use client';

import React from 'react';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Fish,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/use-products';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ValidationPatterns, ValidationMessages, getValidationClass } from '@/utils/validation';
import type { Product, ProductFormData as ProductFormDataType } from '@/types/product';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface ProductFormValues {
  code: string;
  productName: string;
  species: string[];
  size: string[];
  sku: string;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const { handleGetProduct, handleUpdateProduct } = useProducts();
  const { showAlert, AlertDialog } = useAlertDialog();
  const [product, setProduct] = useState<Product | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [speciesInput, setSpeciesInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [codeCheckLoading, setCodeCheckLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Unwrap the params Promise using React.use()
  const { id } = use(params);

  // Form data
  const [formData, setFormData] = useState<ProductFormValues>({
    code: '',
    productName: '',
    species: [],
    size: [],
    sku: '',
  });

  const [originalData, setOriginalData] = useState<ProductFormValues | null>(null);

  // Simple change detection
  useEffect(() => {
    if (originalData) {
      const changes = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changes);
    }
  }, [formData, originalData]);

  // Fetch product data and populate form
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setPageLoading(true);
        const result = await handleGetProduct(id);
        if (result.success && 'data' in result && result.data) {
          const productData = result.data;
          setProduct(productData);
          
          // Update form data with product information
          const productFormData: ProductFormValues = {
            code: productData.code || '',
            productName: productData.productName || '',
            species: productData.species || [],
            size: productData.size || [],
            sku: productData.sku || '',
          };
          
          setFormData(productFormData);
          setOriginalData(productFormData);
        } else {
          toast.error('Product not found');
          router.push('/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
        router.push('/products');
      } finally {
        setPageLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, handleGetProduct, router]);

  // Update form field
  const updateField = (name: keyof ProductFormValues, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Real-time validation for individual fields
  const validateInput = (value: string, pattern: keyof typeof ValidationPatterns, fieldName: string, required: boolean = true) => {
    if (!required && (!value || value.trim() === '')) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
      return true;
    }
    
    if (required && (!value || value.trim() === '')) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: ValidationMessages.required }));
      return false;
    }

    const regex = ValidationPatterns[pattern];
    const isValid = regex.test(value.trim());
    
    if (!isValid) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: ValidationMessages[pattern] }));
      return false;
    } else {
      setFieldErrors(prev => ({ ...prev, [fieldName]: '' }));
      return true;
    }
  };

  // Check for duplicate product code (excluding current product)
  const checkDuplicateCode = React.useCallback(async (code: string) => {
    if (!code || code.trim().length < 2 || !product) return;
    
    // Skip check if code hasn't changed
    if (code.trim().toUpperCase() === product.code.toUpperCase()) {
      setFieldErrors(prev => ({ ...prev, code: '' }));
      return true;
    }
    
    try {
      setCodeCheckLoading(true);
      
      // Get auth token from session storage
      const session = JSON.parse(sessionStorage.getItem('session') || '{}');
      const authToken = session.accessToken;
      
      if (!authToken) {
        console.error('No auth token available');
        return false;
      }
      
      const response = await fetch('/api/products/check-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ code: code.trim().toUpperCase(), excludeId: product.id }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.exists) {
          setFieldErrors(prev => ({ 
            ...prev, 
            code: `Product code "${code.toUpperCase()}" already exists. Please use a different code.` 
          }));
          return false;
        } else {
          setFieldErrors(prev => ({ ...prev, code: '' }));
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking duplicate code:', error);
    } finally {
      setCodeCheckLoading(false);
    }
  }, [product]);

  // Debounced code check
  const debouncedCodeCheck = React.useCallback(
    debounce((code: string) => checkDuplicateCode(code), 500),
    [checkDuplicateCode]
  );

  const handleAddSpecies = () => {
    if (speciesInput.trim()) {
      if (!validateInput(speciesInput, 'species', 'speciesInput')) {
        return;
      }

      const currentSpecies = formData.species || [];
      if (!currentSpecies.includes(speciesInput.trim())) {
        updateField('species', [...currentSpecies, speciesInput.trim()]);
        setSpeciesInput('');
        setFieldErrors(prev => ({ ...prev, speciesInput: '' }));
      } else {
        toast.error('Species already added');
      }
    } else {
      setFieldErrors(prev => ({ ...prev, speciesInput: ValidationMessages.required }));
    }
  };

  const handleRemoveSpecies = (speciesToRemove: string) => {
    const currentSpecies = formData.species || [];
    updateField('species', currentSpecies.filter(s => s !== speciesToRemove));
  };

  const handleAddSize = () => {
    if (sizeInput.trim()) {
      if (!validateInput(sizeInput, 'size', 'sizeInput', false)) {
        return;
      }

      const currentSizes = formData.size || [];
      if (!currentSizes.includes(sizeInput.trim())) {
        updateField('size', [...currentSizes, sizeInput.trim()]);
        setSizeInput('');
        setFieldErrors(prev => ({ ...prev, sizeInput: '' }));
      } else {
        toast.error('Size already added');
      }
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    const currentSizes = formData.size || [];
    updateField('size', currentSizes.filter(s => s !== sizeToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    // Check if there are any changes
    if (!hasChanges) {
      toast.error('No changes detected. Please modify the form before updating.');
      return;
    }

    // Basic validation
    if (!formData.code.trim()) {
      setFieldErrors(prev => ({ ...prev, code: ValidationMessages.required }));
      return;
    }
    if (!formData.productName.trim()) {
      setFieldErrors(prev => ({ ...prev, productName: ValidationMessages.required }));
      return;
    }
    if (!formData.species || formData.species.length === 0) {
      toast.error('At least one species is required');
      return;
    }

    // Show confirmation dialog
    showAlert({
      title: 'Update Product',
      description: 'Are you sure you want to update this product?',
      action: 'update',
      itemName: `${formData.productName} (${formData.code})`,
      onConfirm: async () => {
        try {
          setIsSaving(true);
          
          const updateData: ProductFormDataType = {
            code: formData.code.trim().toUpperCase(),
            productName: formData.productName.trim(),
            species: formData.species,
            size: formData.size,
            sku: formData.sku?.trim().toUpperCase() || null,
          };

          const result = await handleUpdateProduct(product.id, updateData);
          
          if (result.success) {
            toast.success('Product updated successfully!');
            
            // Navigate back to product detail page after a short delay
            setTimeout(() => {
              router.push(`/products/${product.id}`);
            }, 1000);
          } else {
            console.error('❌ Product update failed:', result.error);
            
            // Check if it's a duplicate code error
            if (result.error?.includes('already exist')) {
              setFieldErrors(prev => ({ 
                ...prev, 
                code: result.error || 'Product code already exists' 
              }));
              toast.error('Product code already exists. Please use a different code.');
            } else {
              toast.error(result.error || 'Failed to update product');
            }
          }
        } catch (error: any) {
          console.error('❌ Error updating product:', error);
          toast.error(error.message || 'Failed to update product');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  // Handle back navigation
  const handleBack = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/products');
      }
    } else {
      router.push('/products');
    }
  };

  if (pageLoading) {
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
          </div>
        </header>

        {/* Form Skeleton */}
        <main className="py-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Product Not Found</h3>
          <p className="text-muted-foreground mb-4">The product you're trying to edit doesn't exist.</p>
          <Button onClick={() => router.push('/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSaving} message="Updating product..." />

      {/* Alert Dialog */}
      <AlertDialog />

      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border shadow-sm z-20 rounded-xl mb-6">
        <div className="py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3 ml-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Edit Product</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Update product information
                  {hasChanges && <span className="text-orange-600 ml-2">• Unsaved changes</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Basic Information</CardTitle>
                      <p className="text-sm text-muted-foreground">Essential product details and identification</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Product Code */}
                    <div className="space-y-2">
                      <Label htmlFor="code">
                        Product Code <span className="text-red-500">*</span>
                        <span className="text-xs text-muted-foreground ml-2">(Must be unique)</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="code"
                          placeholder="Enter product code (e.g., FISH001)"
                          value={formData.code}
                          disabled={isSaving}
                          className={getValidationClass(true, !!fieldErrors.code)}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            updateField('code', value);
                            validateInput(value, 'productCode', 'code');
                            
                            // Check for duplicates after validation passes
                            if (value.length >= 2) {
                              debouncedCodeCheck(value);
                            }
                          }}
                        />
                        {codeCheckLoading && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                      {fieldErrors.code && (
                        <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{fieldErrors.code}</span>
                        </div>
                      )}
                    </div>

                    {/* SKU */}
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU (Optional)</Label>
                      <Input
                        id="sku"
                        placeholder="Enter SKU"
                        value={formData.sku || ''}
                        disabled={isSaving}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          updateField('sku', value);
                          if (value.trim()) {
                            validateInput(value, 'sku', 'sku', false);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    {/* Product Name */}
                    <div className="space-y-2">
                      <Label htmlFor="productName">
                        Product Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="productName"
                        placeholder="Enter product name"
                        value={formData.productName}
                        disabled={isSaving}
                        onChange={(e) => {
                          updateField('productName', e.target.value);
                          validateInput(e.target.value, 'businessName', 'productName');
                        }}
                      />
                      {fieldErrors.productName && (
                        <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{fieldErrors.productName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Species Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Fish className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Species Information</CardTitle>
                      <p className="text-sm text-muted-foreground">Add species associated with this product</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>
                      Species <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter species name"
                            value={speciesInput}
                            onChange={(e) => {
                              setSpeciesInput(e.target.value);
                              if (e.target.value.trim()) {
                                validateInput(e.target.value, 'species', 'speciesInput');
                              } else {
                                setFieldErrors(prev => ({ ...prev, speciesInput: '' }));
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSpecies();
                              }
                            }}
                            disabled={isSaving}
                            className={getValidationClass(true, !!fieldErrors.speciesInput)}
                          />
                          {fieldErrors.speciesInput && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>{fieldErrors.speciesInput}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddSpecies}
                          disabled={!speciesInput.trim() || isSaving}
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {formData.species && formData.species.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.species.map((species, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {species}
                              <button
                                type="button"
                                onClick={() => handleRemoveSpecies(species)}
                                disabled={isSaving}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Size Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Layers className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Size Information (Optional)</CardTitle>
                      <p className="text-sm text-muted-foreground">Add available sizes for this product (supports alphanumeric and symbols like /)</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter size (e.g., 20/30, Large, XL, 40-50)"
                            value={sizeInput}
                            onChange={(e) => {
                              setSizeInput(e.target.value);
                              if (e.target.value.trim()) {
                                validateInput(e.target.value, 'size', 'sizeInput', false);
                              } else {
                                setFieldErrors(prev => ({ ...prev, sizeInput: '' }));
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSize();
                              }
                            }}
                            disabled={isSaving}
                            className={getValidationClass(true, !!fieldErrors.sizeInput)}
                          />
                          {fieldErrors.sizeInput && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>{fieldErrors.sizeInput}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddSize}
                          disabled={!sizeInput.trim() || isSaving}
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {formData.size && formData.size.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.size.map((size, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              {size}
                              <button
                                type="button"
                                onClick={() => handleRemoveSize(size)}
                                disabled={isSaving}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving || !hasChanges}
                  className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Product {!hasChanges && '(No Changes)'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}