'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { useProducts } from '@/hooks/use-products';
import type { Product } from '@/types/product';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const { handleGetProduct, handleDeleteProduct } = useProducts();
  const { showAlert, AlertDialog } = useAlertDialog();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  const handleEdit = () => {
    router.push(`/products/${params.id}/edit`);
  };

  const handleDelete = () => {
    if (!product) return;

    showAlert({
      title: 'Delete Product',
      description: 'Are you sure you want to delete this product? This action cannot be undone.',
      action: 'delete',
      itemName: product.productName,
      onConfirm: async () => {
        setDeleting(true);
        try {
          const result = await handleDeleteProduct(product.id);
          if (result.success) {
            router.push('/products');
          }
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
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
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
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
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-foreground">{product.productName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            disabled={deleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Code</label>
                <p className="text-lg font-semibold text-foreground mt-1">{product.code}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                <p className="text-lg font-semibold text-foreground mt-1">{product.productName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {product.sku || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Species</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.species.map((species, index) => (
                    <Badge key={index} variant="secondary">
                      {species}
                    </Badge>
                  ))}
                </div>
              </div>

              {product.size && product.size.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sizes</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.size.map((size, index) => (
                      <Badge key={index} variant="outline">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {new Date(product.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {new Date(product.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog />
    </div>
  );
}