'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, MapPin, Building2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { getLocationById, deleteLocation } from '@/actions/location.actions';
import { getStoredSession } from '@/utils/auth';
import type { Location } from '@/types/location';

interface LocationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function LocationDetailPage({ params }: LocationDetailPageProps) {
  const router = useRouter();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const { showAlert, AlertDialog } = useAlertDialog();
  
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load location data
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const session = getStoredSession();
        if (!session || !session.accessToken) {
          router.push('/login');
          return;
        }

        const result = await getLocationById(id);
        if (result.success && result.data) {
          setLocation(result.data);
        } else {
          showError(result.error || 'Location not found');
          router.push('/locations');
        }
      } catch (error) {
        console.error('Error loading location:', error);
        showError('Failed to load location');
        router.push('/locations');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadLocation();
    }
  }, [id, router, showError]);

  const handleEdit = () => {
    router.push(`/locations/${id}/edit`);
  };

  const handleDelete = () => {
    if (!location) return;

    showAlert({
      title: 'Delete Location',
      description: `Are you sure you want to delete "${location.city}, ${location.country}"? This action cannot be undone.`,
      action: 'delete',
      itemName: `${location.city}, ${location.country}`,
      onConfirm: async () => {
        try {
          setIsDeleting(true);
          const session = getStoredSession();
          if (!session || !session.accessToken) {
            router.push('/login');
            return;
          }

          const result = await deleteLocation(location.id);
          if (result.success) {
            showSuccess('Location deleted successfully!');
            
            // Navigate back to locations page after a short delay
            setTimeout(() => {
              router.push('/locations');
            }, 1000);
          } else {
            showError(result.error || 'Failed to delete location');
          }
        } catch (error) {
          console.error('Error deleting location:', error);
          showError('Failed to delete location');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const handleBack = () => {
    router.push('/locations');
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
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
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
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
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

  if (!location) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Location Not Found</h3>
          <p className="text-muted-foreground mb-4">The location you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/locations')}>
            Back to Locations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Alert Dialog */}
      <AlertDialog />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

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
              <div className="p-2 bg-green-50 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Location Details</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  View location information
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Location Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Location Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Basic details about this location</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">City</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-base font-medium">{location.city}</span>
                    </div>
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">State</label>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-base font-medium">{location.state}</span>
                    </div>
                  </div>

                  {/* Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Location Code</label>
                    <Badge variant="secondary" className="font-mono text-sm">
                      {location.code}
                    </Badge>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Country</label>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-base font-medium">{location.country}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <p className="text-sm text-muted-foreground">Creation and modification details</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <p className="text-base">
                      {new Date(location.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-base">
                      {new Date(location.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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