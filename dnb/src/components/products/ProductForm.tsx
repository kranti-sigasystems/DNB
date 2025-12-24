'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, X, Package } from 'lucide-react';
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
import type { Product, ProductFormData } from '@/types/product';

const productSchema = z.object({
  code: z.string().min(1, 'Product code is required').max(50, 'Code must be less than 50 characters'),
  productName: z.string().min(1, 'Product name is required').max(200, 'Name must be less than 200 characters'),
  species: z.array(z.string()).min(1, 'At least one species is required'),
  size: z.array(z.string()).optional(),
  sku: z.string().optional().nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter();
  const { handleCreateProduct, handleUpdateProduct } = useProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speciesInput, setSpeciesInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');

  const isEditing = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: product?.code || '',
      productName: product?.productName || '',
      species: product?.species || [],
      size: product?.size || [],
      sku: product?.sku || '',
    },
  });

  const { watch, setValue, getValues } = form;
  const watchedSpecies = watch('species');
  const watchedSize = watch('size');

  const handleAddSpecies = () => {
    if (speciesInput.trim()) {
      const currentSpecies = getValues('species') || [];
      if (!currentSpecies.includes(speciesInput.trim())) {
        setValue('species', [...currentSpecies, speciesInput.trim()]);
        setSpeciesInput('');
      } else {
        toast.error('Species already added');
      }
    }
  };

  const handleRemoveSpecies = (speciesToRemove: string) => {
    const currentSpecies = getValues('species') || [];
    setValue('species', currentSpecies.filter(s => s !== speciesToRemove));
  };

  const handleAddSize = () => {
    if (sizeInput.trim()) {
      const currentSizes = getValues('size') || [];
      if (!currentSizes.includes(sizeInput.trim())) {
        setValue('size', [...currentSizes, sizeInput.trim()]);
        setSizeInput('');
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
    try {
      setIsSubmitting(true);

      const formData: ProductFormData = {
        code: data.code.trim(),
        productName: data.productName.trim(),
        species: data.species,
        size: data.size || [], // Always provide an array
        sku: data.sku?.trim() || null,
      };

      let result;
      if (isEditing && product) {
        result = await handleUpdateProduct(product.id, formData);
      } else {
        result = await handleCreateProduct(formData);
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/products');
        }
      }
    } catch (error: any) {
      console.error('Error submitting product form:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/products');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <CardTitle>
            {isEditing ? 'Edit Product' : 'Create New Product'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter product code (e.g., FISH001)"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Name */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter product name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Species */}
            <FormField
              control={form.control}
              name="species"
              render={() => (
                <FormItem>
                  <FormLabel>Species *</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter species name"
                        value={speciesInput}
                        onChange={(e) => setSpeciesInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSpecies();
                          }
                        }}
                        disabled={isSubmitting}
                      />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Size */}
            <FormField
              control={form.control}
              name="size"
              render={() => (
                <FormItem>
                  <FormLabel>Size (Optional)</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter size (e.g., Large, Medium, Small)"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSize();
                          }
                        }}
                        disabled={isSubmitting}
                      />
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Update Product' : 'Create Product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}