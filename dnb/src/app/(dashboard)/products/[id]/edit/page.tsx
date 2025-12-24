'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/components/products/ProductForm';
import { useProducts } from '@/hooks/use-products';
import type { Product } from '@/types/product';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const { handleGetProduct } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const result = await handleGetProduct(params.id);
        if (result.success && 'data' in result && result.data) {
          setProduct(result.data);
        } else {
          router.push('/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        router.push('/products');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, handleGetProduct, router]);

  const handleSuccess = () => {
    router.push(`/products/${params.id}`);
  };

  const handleCancel = () => {
    router.push(`/products/${params.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>

        {/* Form Skeleton */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
        </div>
      </div>

      {/* Product Form */}
      <ProductForm
        product={product}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}