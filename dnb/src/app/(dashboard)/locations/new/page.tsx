'use client';

import React, { useState, useEffect } from 'react';
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
import { createLocationWithToken } from '@/actions/location.actions';
import { getStoredSession } from '@/utils/auth';
import type { CreateLocationData } from '@/types/location';

export default function NewLocationPage() {
  const router = useRouter();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const { showAlert, AlertDialog } = useAlertDialog();
  
  const [pageLoading, setPageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<CreateLocationData>({
    locationName: '',
    city: '',
    state: '',
    code: '',
    country: '',
    address: '',
    postalCode: '',
  });

  // No need to load countries since we're using a simple text input
  useEffect(() => {
    setPageLoading(false);
  }, []);

  // Update form field
  const updateField = (name: keyof CreateLocationData, value: string) => {
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
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    }
    
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the validation errors');
      return;
    }
    
    showAlert({
      title: 'Create Location',
      description: 'Are you sure you want to create this location?',
      action: 'create',
      itemName: `${formData.city}, ${formData.country}`,
      onConfirm: async () => {
        try {
          setIsSaving(true);
          const session = getStoredSession();
          if (!session || !session.accessToken) {
            router.push('/login');
            return;
          }

          const result = await createLocationWithToken(formData, session.accessToken);
          
          if (result.success) {
            showSuccess('Location created successfully!');
            
            // Navigate back to locations page after a short delay
            setTimeout(() => {
              router.push('/locations');
            }, 1000);
          } else {
            console.error('Location creation failed:', result.error);
            showError(result.error || 'Failed to create location');
          }
        } catch (error: any) {
          console.error('Error creating location:', error);
          showError(error.message || 'Failed to create location');
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const handleBack = () => {
    router.push('/locations');
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

  return (
    <div className="relative min-h-screen bg-background">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSaving} message="Creating location..." />

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
                <h1 className="text-lg sm:text-xl font-bold text-foreground">New Location</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Add a new business location
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
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-500">{errors.city}</p>
                      )}
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                      <Label htmlFor="state">
                        State <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="state"
                        placeholder="Enter state name"
                        value={formData.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        className={errors.state ? 'border-red-500' : ''}
                      />
                      {errors.state && (
                        <p className="text-sm text-red-500">{errors.state}</p>
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
                        value={formData.code}
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
                        value={formData.country}
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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Location
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