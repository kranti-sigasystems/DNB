'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useFormChanges } from '@/hooks/use-form-changes';
import { UnsavedChangesDialog, useUnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { getLocationById, updateLocation } from '@/actions/location.actions';
import { getStoredSession } from '@/utils/auth';
import type { Location, UpdateLocationData } from '@/types/location';

interface EditLocationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditLocationPage({ params }: EditLocationPageProps) {
  const router = useRouter();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const { showAlert, AlertDialog } = useAlertDialog();
  
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  
  const [location, setLocation] = useState<Location | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<UpdateLocationData>({
    locationName: '',
    city: '',
    code: '',
    country: '',
    address: '',
    postalCode: '',
  });

  const [originalData, setOriginalData] = useState<UpdateLocationData>({});

  // Form change tracking
  const {
    hasChanges,
    navigateWithCheck,
    resetChanges,
  } = useFormChanges(originalData, formData, {
    enableUnsavedWarning: true,
    onRouteChange: async () => {
      return new Promise((resolve) => {
        showUnsavedDialog(() => resolve(true));
      });
    },
  });

  const {
    isOpen: isUnsavedDialogOpen,
    showDialog: showUnsavedDialog,
    handleDiscard,
    handleContinueEditing,
    handleClose: closeUnsavedDialog,
  } = useUnsavedChangesDialog();

  // Load location data
  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);
        const session = getStoredSession();
        
        if (!session || !session.accessToken) {
          router.push('/login');
          return;
        }

        const locationResult = await getLocationById(id);

        if (locationResult.success && locationResult.data) {
          const locationData = locationResult.data;
          
          const normalizedLocationData: Location = {
            ...locationData,
            locationName: locationData.locationName ?? undefined,
            address: locationData.address ?? undefined,
            postalCode: locationData.postalCode ?? undefined,
          };
          
          setLocation(normalizedLocationData);
          
          const locationFormData: UpdateLocationData = {
            locationName: locationData.locationName || '',
            city: locationData.city || '',
            code: locationData.code || '',
            country: locationData.country || '',
            address: locationData.address || '',
            postalCode: locationData.postalCode || '',
          };
          
          setFormData(locationFormData);
          setOriginalData(locationFormData);
        } else {
          showError(locationResult.error || 'Location not found');
          router.push('/locations');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load location data');
        router.push('/locations');
      } finally {
        setPageLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, router, showError]);

  // Update form field
  const updateField = (name: keyof UpdateLocationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.code?.trim()) {
      newErrors.code = 'Code is required';
    }
    
    if (!formData.country?.trim()) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) return;
    
    // Check if there are any changes
    if (!hasChanges) {
      showError('No changes detected. Please modify the form before updating.');
      return;
    }
    
    if (!validateForm()) {
      showError('Please fix the validation errors');
      return;
    }
    
    showAlert({
      title: 'Update Location',
      description: 'Are you sure you want to update this location?',
      action: 'update',
      itemName: `${formData.city}, ${formData.country}`,
      onConfirm: async () => {
        try {
          setIsSaving(true);
          const session = getStoredSession();
          if (!session || !session.accessToken) {
            router.push('/login');
            return;
          }

          const result = await updateLocation(location.id, formData);
          
          if (result.success) {
            showSuccess('Location updated successfully!');
            resetChanges();
            
            // Navigate back to locations page after a short delay
            setTimeout(() => {
              router.push('/locations');
            }, 1000);
          } else {
            console.error('Location update failed:', result.error);
            showError(result.error || 'Failed to update location');
          }
        } catch (error: any) {
          console.error('Error updating location:', error);
          showError(error.message || 'Failed to update location');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const handleBack = () => {
    if (hasChanges) {
      showUnsavedDialog(() => {
        router.push('/locations');
      });
    } else {
      router.push('/locations');
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

  if (!location) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Location Not Found</h3>
          <p className="text-muted-foreground mb-4">The location you're trying to edit doesn't exist.</p>
          <Button onClick={() => router.push('/locations')}>
            Back to Locations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSaving} message="Updating location..." />

      {/* Alert Dialog */}
      <AlertDialog />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onClose={closeUnsavedDialog}
        onDiscard={handleDiscard}
        onContinueEditing={handleContinueEditing}
      />

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
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Edit Location</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Update location information
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
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Location Details</CardTitle>
                      <p className="text-sm text-muted-foreground">Basic information about the location</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Location Name */}
                    <div className="space-y-2">
                      <Label htmlFor="locationName">Location Name</Label>
                      <Input
                        id="locationName"
                        placeholder="Enter location name (optional)"
                        value={formData.locationName || ''}
                        onChange={(e) => updateField('locationName', e.target.value)}
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        placeholder="Enter city name"
                        value={formData.city || ''}
                        onChange={(e) => updateField('city', e.target.value)}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-500">{errors.city}</p>
                      )}
                    </div>

                    {/* Code */}
                    <div className="space-y-2">
                      <Label htmlFor="code">
                        Location Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="code"
                        placeholder="Enter location code"
                        value={formData.code || ''}
                        onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                        className={errors.code ? 'border-red-500' : ''}
                      />
                      {errors.code && (
                        <p className="text-sm text-red-500">{errors.code}</p>
                      )}
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="country">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="country"
                        placeholder="Enter country name"
                        value={formData.country || ''}
                        onChange={(e) => updateField('country', e.target.value)}
                        className={errors.country ? 'border-red-500' : ''}
                      />
                      {errors.country && (
                        <p className="text-sm text-red-500">{errors.country}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="Enter address (optional)"
                        value={formData.address || ''}
                        onChange={(e) => updateField('address', e.target.value)}
                      />
                    </div>

                    {/* Postal Code */}
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        placeholder="Enter postal code (optional)"
                        value={formData.postalCode || ''}
                        onChange={(e) => updateField('postalCode', e.target.value)}
                      />
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
                      Update Location {!hasChanges && '(No Changes)'}
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