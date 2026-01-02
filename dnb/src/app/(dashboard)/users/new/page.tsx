'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  UserCircle2,
  MapPin,
  ArrowLeft,
  Save,
  Package,
  MapPinIcon,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBuyerForm } from '@/hooks/use-buyer-form';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { BUYER_FORM_FIELDS } from '@/config/buyerFormConfig';
import { validateBuyerData, ValidationMessages } from '@/utils/validation';

export default function AddBuyerPage() {
  const router = useRouter();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const { showAlert, AlertDialog } = useAlertDialog();
  
  const {
    formData,
    updateField,
    products,
    productsLoading,
    selectedProduct,
    setSelectedProduct,
    locations,
    locationsLoading,
    selectedLocation,
    setSelectedLocation,
    remainingBuyers,
    loading,
    errors,
    validationLoading,
    submitForm,
  } = useBuyerForm();



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    // Validate form
    const validation = validateBuyerData(formData);
    
    if (!validation.isValid) {
      // Create a more user-friendly error message
      const requiredFieldsCount = validation.errors.filter(e => e.message === ValidationMessages.required).length;
      const otherErrors = validation.errors.filter(e => e.message !== ValidationMessages.required);
      
      // Debug: Log specific errors
      
      let errorMessage = '';
      if (requiredFieldsCount > 0) {
        const missingFields = validation.errors
          .filter(e => e.message === ValidationMessages.required)
          .map(e => {
            // Convert field names to user-friendly labels
            const fieldLabels: Record<string, string> = {
              firstName: 'First Name',
              lastName: 'Last Name',
              email: 'Email Address',
              contactPhone: 'Phone Number',
              buyersCompanyName: 'Company Name',
              address: 'Street Address',
              city: 'City',
              state: 'State/Province',
              country: 'Country',
              postalCode: 'Postal Code',
            };
            return fieldLabels[e.field] || e.field;
          })
          .join(', ');
        errorMessage = `Please fill in required fields: ${missingFields}`;
        if (otherErrors.length > 0) {
          errorMessage += ` and fix ${otherErrors.length} validation error${otherErrors.length > 1 ? 's' : ''}`;
        }
      } else if (otherErrors.length > 0) {
        errorMessage = `Please fix validation errors: ${otherErrors.map(e => `${e.field} - ${e.message}`).join(', ')}`;
      }
      
      showError(errorMessage);
      return;
    }

    if (!formData.productName) {
      showError('Please select a product');
      return;
    }

    // Show confirmation dialog
    showAlert({
      title: 'Add New Buyer',
      description: 'Are you sure you want to add this buyer to your system?',
      action: 'add',
      itemName: `${formData.firstName} ${formData.lastName} (${formData.buyersCompanyName})`,
      onConfirm: async () => {
        try {
          await submitForm();
          showSuccess('Buyer added successfully!');
          
          // Navigate back to users page after a short delay
          setTimeout(() => {
            router.push('/users');
          }, 1000);
        } catch (error) {
          showError('Failed to add buyer. Please try again.');
        }
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={loading} message="Adding buyer..." />

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
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3 ml-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Add Buyer</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Create new buyer entry</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Plan Usage Info */}
            <div className="flex items-center gap-2 pt-4 font-bold">
              {remainingBuyers > 0 ? (
                <>
                  <span className="text-green-600 text-lg">Remaining Credits:</span>
                  <span className="text-green-600 text-lg">{remainingBuyers}</span>
                </>
              ) : (
                <>
                  <span className="text-green-600 text-lg">Remaining Credits:</span>
                  <span className="text-red-700 text-lg">Plan limit for adding buyer is exceeded...</span>
                </>
              )}
            </div>



            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Company Information</CardTitle>
                      <p className="text-sm text-muted-foreground">Basic details about the buyer's company</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {BUYER_FORM_FIELDS.company.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                          <Input
                            id={field.name}
                            type={field.type || "text"}
                            placeholder={field.placeholder || field.label}
                            value={formData[field.name]}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className={`${errors[field.name] ? 'border-red-500 focus:border-red-500' : ''} ${
                              validationLoading[field.name] ? 'pr-10' : ''
                            }`}
                          />
                          {validationLoading[field.name] && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        {errors[field.name] && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <span className="text-red-500">⚠️</span>
                            {errors[field.name]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <UserCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Contact Information</CardTitle>
                      <p className="text-sm text-muted-foreground">Primary contact details for communication</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {BUYER_FORM_FIELDS.contact.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                          <Input
                            id={field.name}
                            type={field.type || "text"}
                            placeholder={field.placeholder || field.label}
                            value={formData[field.name]}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className={`${errors[field.name] ? 'border-red-500 focus:border-red-500' : ''} ${
                              validationLoading[field.name] ? 'pr-10' : ''
                            }`}
                          />
                          {validationLoading[field.name] && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        {errors[field.name] && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <span className="text-red-500">⚠️</span>
                            {errors[field.name]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Product Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Product Selection</CardTitle>
                      <p className="text-sm text-muted-foreground">Select the product associated with this buyer</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>
                      Select Product <span className="text-red-500">*</span>
                    </Label>
                    {productsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span className="ml-3 text-muted-foreground">Loading your products...</span>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between h-12 px-4 text-left font-normal hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            type="button"
                          >
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className={!selectedProduct ? 'text-muted-foreground' : 'text-foreground'}>
                                {selectedProduct ? selectedProduct.productName : "Select a product"}
                              </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-72 overflow-y-auto border shadow-lg">
                          <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-foreground">
                            Available Products ({products.length})
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {products.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                              <p className="text-sm text-muted-foreground font-medium">No products found</p>
                              <p className="text-xs text-muted-foreground mt-1">Create products first or contact support</p>
                            </div>
                          ) : (
                            products.map((product) => (
                              <DropdownMenuItem
                                key={product.id}
                                onClick={() => setSelectedProduct(product)}
                                className="px-3 py-3 cursor-pointer hover:bg-accent focus:bg-accent"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="p-1.5 bg-primary/10 rounded-md">
                                    <Package className="w-3 h-3 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground truncate">
                                      {product.productName}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                        {product.code}
                                      </span>
                                      {product.sku && (
                                        <span className="text-xs text-muted-foreground">
                                          SKU: {product.sku}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {selectedProduct?.id === product.id && (
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                  )}
                                </div>
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {errors.productName && (
                      <p className="text-sm text-red-500">{errors.productName}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <MapPinIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Location Selection (Optional)</CardTitle>
                      <p className="text-sm text-muted-foreground">Select a location to auto-fill address fields</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Select Location</Label>
                    {locationsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span className="ml-3 text-muted-foreground">Loading your locations...</span>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between h-12 px-4 text-left font-normal hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            type="button"
                          >
                            <div className="flex items-center gap-3">
                              <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                              <span className={!formData.locationName ? 'text-muted-foreground' : 'text-foreground'}>
                                {formData.locationName || "Select a location (optional)"}
                              </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-72 overflow-y-auto border shadow-lg">
                          <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-foreground">
                            Available Locations ({locations.length})
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {locations.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <MapPinIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                              <p className="text-sm text-muted-foreground font-medium">No locations found</p>
                              <p className="text-xs text-muted-foreground mt-1">Create locations first or contact support</p>
                            </div>
                          ) : (
                            locations.map((location) => (
                              <DropdownMenuItem
                                key={location.id}
                                onClick={() => setSelectedLocation(location)}
                                className="px-3 py-3 cursor-pointer hover:bg-accent focus:bg-accent"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="p-1.5 bg-blue-50 rounded-md">
                                    <MapPinIcon className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground truncate">
                                      {location.locationName || "Unnamed Location"}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                        {location.code}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {location.city}, {location.state}
                                      </span>
                                    </div>
                                  </div>
                                  {selectedLocation?.id === location.id && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                  )}
                                </div>
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Address Details</CardTitle>
                      <p className="text-sm text-muted-foreground">Complete address information</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {BUYER_FORM_FIELDS.address.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id={field.name}
                          type={field.type || "text"}
                          placeholder={field.placeholder || field.label}
                          value={formData[field.name]}
                          onChange={(e) => updateField(field.name, e.target.value)}
                          className={errors[field.name] ? 'border-red-500' : ''}
                        />
                        {errors[field.name] && (
                          <p className="text-sm text-red-500">{errors[field.name]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      rows={4}
                      placeholder="Enter complete street address..."
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500">{errors.address}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add Buyer
                    </>
                  )}
                </Button>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}