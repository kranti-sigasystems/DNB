'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Package, 
  Fish,
  Layers,
  Tag,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useProducts } from '@/hooks/use-products';
import type { Product } from '@/types/product';

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const { handleGetProduct, handleDeleteProduct } = useProducts();
  const { showAlert, AlertDialog } = useAlertDialog();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
  // Unwrap the params Promise using React.use()
  const { id } = use(params);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const result = await handleGetProduct(id);
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

    if (id) {
      fetchProduct();
    }
  }, [id, handleGetProduct, router]);

  const handleEdit = () => {
    router.push(`/products/${id}/edit`);
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
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="py-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
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
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
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
      <LoadingOverlay isVisible={deleting} message="Deleting product..." />

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
                <h1 className="text-lg sm:text-xl font-bold text-foreground">View Product</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Product details and information</p>
              </div>
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
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Card>
          <CardContent className="p-6 space-y-6">
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Product Code</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">{product.code}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">
                        {product.sku || '--'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    <p className="font-medium text-foreground">{product.productName}</p>
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
                    <p className="text-sm text-muted-foreground">Species associated with this product</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Species</label>
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    {product.species.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {product.species.map((species, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Fish className="w-3 h-3" />
                            {species}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No species specified</p>
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
                    <CardTitle>Size Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Available sizes for this product</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Sizes</label>
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    {product.size && product.size.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {product.size.map((size, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {size}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No sizes specified</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Timeline Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Creation and modification dates</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <p className="font-medium text-foreground">
                        {new Date(product.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}