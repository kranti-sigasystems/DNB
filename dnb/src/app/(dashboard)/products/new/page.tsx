'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Fish,
  Tag,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useProducts } from '@/hooks/use-products';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ProductValidationSchema, ValidationPatterns, ValidationMessages, getValidationClass } from '@/utils/validation';
import { ensureAuthenticated } from '@/utils/tokenManager';
import type { ProductFormData } from '@/types/product';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

type ProductFormValues = z.infer<typeof ProductValidationSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const { handleCreateProduct } = useProducts();
  const { showAlert, AlertDialog } = useAlertDialog();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [speciesInput, setSpeciesInput] = React.useState('');
  const [sizeInput, setSizeInput] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [codeCheckLoading, setCodeCheckLoading] = React.useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductValidationSchema),
    defaultValues: {
      code: '',
      productName: '',
      species: [],
      size: [],
      sku: '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  const { watch, setValue, getValues, formState: { errors } } = form;
  const watchedSpecies = watch('species');
  const watchedSize = watch('size');

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

  // Check for duplicate product code
  const checkDuplicateCode = React.useCallback(async (code: string) => {
    if (!code || code.trim().length < 2) return;
    
    try {
      setCodeCheckLoading(true);
      const authToken = await ensureAuthenticated();
      
      // Use the existing getProducts function to check for duplicates
      const response = await fetch('/api/products/check-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
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
  }, []);

  // Debounced code check
  const debouncedCodeCheck = React.useCallback(
    debounce((code: string) => checkDuplicateCode(code), 500),
    [checkDuplicateCode]
  );

  const handleAddSpecies = () => {
    if (speciesInput.trim()) {
      // Validate species input
      if (!validateInput(speciesInput, 'species', 'speciesInput')) {
        return;
      }

      const currentSpecies = getValues('species') || [];
      if (!currentSpecies.includes(speciesInput.trim())) {
        setValue('species', [...currentSpecies, speciesInput.trim()]);
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
    const currentSpecies = getValues('species') || [];
    setValue('species', currentSpecies.filter(s => s !== speciesToRemove));
  };

  const handleAddSize = () => {
    if (sizeInput.trim()) {
      // Validate size input
      if (!validateInput(sizeInput, 'size', 'sizeInput', false)) {
        return;
      }

      const currentSizes = getValues('size') || [];
      if (!currentSizes.includes(sizeInput.trim())) {
        setValue('size', [...currentSizes, sizeInput.trim()]);
        setSizeInput('');
        setFieldErrors(prev => ({ ...prev, sizeInput: '' }));
      } else {
        toast.error('Size already added');
      }
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    const currentSizes = getValues('size') || [];
    setValue('size', currentSizes.filter(s => s !== sizeToRemove));
  };

  const onSubmit = async (data: ProductFormValues) => {
    const formData: ProductFormData = {
      code: data.code.trim().toUpperCase(),
      productName: data.productName.trim(),
      species: data.species,
      size: data.size && data.size.length > 0 ? data.size : [], // Always provide an array
      sku: data.sku?.trim().toUpperCase() || null,
    };

    // Show confirmation dialog
    showAlert({
      title: 'Add New Product',
      description: 'Are you sure you want to add this product to your catalog?',
      action: 'add',
      itemName: `${formData.productName} (${formData.code})`,
      onConfirm: async () => {
        try {
          setIsSubmitting(true);
          const result = await handleCreateProduct(formData);
          
          if (result.success) {
            toast.success('Product added successfully!');
            
            // Navigate back to products page after a short delay
            setTimeout(() => {
              router.push('/products');
            }, 1000);
          } else {
            console.error('❌ Product creation failed:', result.error);
            
            // Check if it's a duplicate code error
            if (result.error?.includes('already exist')) {
              setFieldErrors(prev => ({ 
                ...prev, 
                code: result.error || 'Product code already exists' 
              }));
              toast.error('Product code already exists. Please use a different code.');
            } else {
              toast.error(result.error || 'Failed to create product');
            }
          }
        } catch (error: any) {
          console.error('❌ Error submitting product form:', error);
          toast.error(error.message || 'Failed to save product');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSubmitting} message="Adding product..." />

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
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Add Product</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Create new product entry</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Product Code <span className="text-red-500">*</span>
                              <span className="text-xs text-muted-foreground ml-2">(Must be unique)</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Enter product code (e.g., FISH001)"
                                  {...field}
                                  disabled={isSubmitting}
                                  className={getValidationClass(true, !!errors.code || !!fieldErrors.code)}
                                  onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    field.onChange(value);
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
                            </FormControl>
                            {(errors.code || fieldErrors.code) && (
                              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>{fieldErrors.code || errors.code?.message}</span>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* SKU */}
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter SKU"
                                {...field}
                                value={field.value || ''}
                                disabled={isSubmitting}
                                className={getValidationClass(true, !!errors.sku)}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  field.onChange(value);
                                  if (value.trim()) {
                                    validateInput(value, 'sku', 'sku', false);
                                  }
                                }}
                              />
                            </FormControl>
                            {errors.sku && (
                              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.sku.message}</span>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6">
                      {/* Product Name */}
                      <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Product Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter product name"
                                {...field}
                                disabled={isSubmitting}
                                className={getValidationClass(true, !!errors.productName)}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  validateInput(e.target.value, 'businessName', 'productName');
                                }}
                              />
                            </FormControl>
                            {errors.productName && (
                              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.productName.message}</span>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    <FormField
                      control={form.control}
                      name="species"
                      render={() => (
                        <FormItem>
                          <FormLabel>
                            Species <span className="text-red-500">*</span>
                          </FormLabel>
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
                                  disabled={isSubmitting}
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
                                disabled={!speciesInput.trim() || isSubmitting}
                                size="sm"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {watchedSpecies && watchedSpecies.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {watchedSpecies.map((species, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {species}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSpecies(species)}
                                      disabled={isSubmitting}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {errors.species && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.species.message}</span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                    <FormField
                      control={form.control}
                      name="size"
                      render={() => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
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
                                  disabled={isSubmitting}
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
                                disabled={!sizeInput.trim() || isSubmitting}
                                size="sm"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {watchedSize && watchedSize.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {watchedSize.map((size, index) => (
                                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                                    {size}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSize(size)}
                                      disabled={isSubmitting}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {errors.size && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.size.message}</span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add Product
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}