'use client';

import React from 'react';
import { useEffect, useState, use } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { BUYER_FORM_FIELDS } from '@/config/buyerFormConfig';
import { validateBuyerData, ValidationMessages } from '@/utils/validation';
import { getBuyerById, updateBuyer, getProducts, getLocations } from '@/actions/business-owner.actions';
import { getStoredSession } from '@/utils/auth';
import type { Buyer, CreateBuyerData, Product, Location } from '@/types/buyer';

interface EditBuyerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBuyerPage({ params }: EditBuyerPageProps) {
  const router = useRouter();
  const { toasts, success: showSuccess, error: showError, removeToast } = useToast();
  const { showAlert, AlertDialog } = useAlertDialog();
  
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  
  // State management
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<CreateBuyerData>({
    contactName: '',
    email: '',
    contactEmail: '',
    contactPhone: '',
    buyersCompanyName: '',
    productName: '',
    locationName: '',
    registrationNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    taxId: '',
    countryCode: '',
  });
  
  const [originalData, setOriginalData] = useState<CreateBuyerData | null>(null);
  
  // Products and locations
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Simple change detection
  useEffect(() => {
    if (originalData) {
      const changes = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changes);
    }
  }, [formData, originalData]);

  // Load initial data (products and locations)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const session = getStoredSession();
        if (!session || !session.accessToken) {
          router.push('/login');
          return;
        }

        // Load products
        setProductsLoading(true);
        const productsResponse = await getProducts(session.accessToken, 0, 100);
        if (productsResponse.success && productsResponse.data) {
          const products = productsResponse.data.data.map(product => ({
            ...product,
            sku: product.sku || null,
            createdAt: typeof product.createdAt === 'string' ? product.createdAt : product.createdAt.toISOString(),
            updatedAt: typeof product.updatedAt === 'string' ? product.updatedAt : product.updatedAt.toISOString(),
          }));
          setProducts(products);
        }
        setProductsLoading(false);

        // Load locations
        setLocationsLoading(true);
        const locationsResponse = await getLocations(session.accessToken, 0, 100);
        if (locationsResponse.success && locationsResponse.data) {
          const locations = locationsResponse.data.data.map(location => ({
            ...location,
            createdAt: typeof location.createdAt === 'string' ? location.createdAt : location.createdAt.toISOString(),
            updatedAt: typeof location.updatedAt === 'string' ? location.updatedAt : location.updatedAt.toISOString(),
          }));
          setLocations(locations);
        }
        setLocationsLoading(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setProductsLoading(false);
        setLocationsLoading(false);
      }
    };

    loadInitialData();
  }, [router]);

  // Fetch buyer data and populate form
  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        setPageLoading(true);
        const session = getStoredSession();
        
        if (!session || !session.accessToken) {
          router.push('/login');
          return;
        }

        const result = await getBuyerById(id, session.accessToken);
        if (result.success && result.data) {
          const buyer = result.data.buyer;
          setBuyer(buyer);
          
          // Update form data with buyer information
          const buyerFormData: CreateBuyerData = {
            contactName: buyer.contactName || '',
            email: buyer.email || '',
            contactEmail: buyer.contactEmail || '',
            contactPhone: buyer.contactPhone || '',
            buyersCompanyName: buyer.buyersCompanyName || '',
            productName: buyer.productName || '',
            locationName: buyer.locationName || '',
            registrationNumber: buyer.registrationNumber || '',
            address: buyer.address || '',
            city: buyer.city || '',
            state: buyer.state || '',
            country: buyer.country || 'India',
            postalCode: buyer.postalCode || '',
            taxId: '',
            countryCode: '',
          };
          
          setFormData(buyerFormData);
          setOriginalData(buyerFormData);
        } else {
          showError(result.error || 'Buyer not found');
          router.push('/users');
        }
      } catch (error) {
        console.error('Error fetching buyer:', error);
        showError('Failed to load buyer data');
        router.push('/users');
      } finally {
        setPageLoading(false);
      }
    };

    if (id) {
      fetchBuyer();
    }
  }, [id, router, showError]);

  // Set selected product when products are loaded and buyer data is available
  useEffect(() => {
    if (buyer && products.length > 0 && buyer.productName && !selectedProduct) {
      const product = products.find(p => p.productName === buyer.productName);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [buyer, products, selectedProduct]);

  // Set selected location when locations are loaded and buyer data is available
  useEffect(() => {
    if (buyer && locations.length > 0 && buyer.locationName && !selectedLocation) {
      const location = locations.find(l => l.locationName === buyer.locationName);
      if (location) {
        setSelectedLocation(location);
      }
    }
  }, [buyer, locations, selectedLocation]);

  // Update form field
  const updateField = (name: keyof CreateBuyerData, value: string) => {
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

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    updateField('productName', product.productName);
  };

  // Handle location selection
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    
    // For table display, use minimal location info (just country or city, country)
    let locationDisplayName = '';
    
    // Priority: City, Country (most concise)
    if (location.city && location.country) {
      locationDisplayName = `${location.city}, ${location.country}`;
    } else if (location.country) {
      locationDisplayName = location.country;
    } else if (location.city) {
      locationDisplayName = location.city;
    } else if (location.locationName) {
      locationDisplayName = location.locationName;
    } else {
      locationDisplayName = 'Unknown Location';
    }

    // Update multiple fields at once
    updateField('locationName', locationDisplayName);
    updateField('country', location.country || '');
    updateField('state', location.state || '');
    updateField('city', location.city || '');
    updateField('address', location.address || '');
    updateField('postalCode', location.postalCode || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!buyer) return;
    
    // Check if there are any changes
    if (!hasChanges) {
      showError('No changes detected. Please modify the form before updating.');
      return;
    }
    
    // Validate form
    const validation = validateBuyerData(formData);
    
    if (!validation.isValid) {
      const requiredFieldsCount = validation.errors.filter(e => e.message === ValidationMessages.required).length;
      const otherErrors = validation.errors.filter(e => e.message !== ValidationMessages.required);
      
      let errorMessage = '';
      if (requiredFieldsCount > 0) {
        const missingFields = validation.errors
          .filter(e => e.message === ValidationMessages.required)
          .map(e => {
            const fieldLabels: Record<string, string> = {
              contactName: 'Contact Name',
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

    // Show confirmation dialog
    showAlert({
      title: 'Update Buyer',
      description: 'Are you sure you want to update this buyer information?',
      action: 'update',
      itemName: `${formData.contactName} (${formData.buyersCompanyName})`,
      onConfirm: async () => {
        try {
          setIsSaving(true);
          const session = getStoredSession();
          if (!session || !session.accessToken) {
            router.push('/login');
            return;
          }

          const updateData = {
            ...formData,
            productName: selectedProduct?.productName || formData.productName,
            locationName: selectedLocation?.locationName || formData.locationName,
          };

          await updateBuyer(buyer.id, updateData, session.accessToken);
          showSuccess('Buyer updated successfully!');
          
          // Navigate back to users page after a short delay
          setTimeout(() => {
            router.push('/users');
          }, 1000);
        } catch (error) {
          console.error('Error updating buyer:', error);
          showError('Failed to update buyer. Please try again.');
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
        router.push('/users');
      }
    } else {
      router.push('/users');
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

  if (!buyer) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <UserCircle2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Buyer Not Found</h3>
          <p className="text-muted-foreground mb-4">The buyer you're trying to edit doesn't exist.</p>
          <Button onClick={() => router.push('/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSaving} message="Updating buyer..." />

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
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Edit Buyer</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Update buyer information
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
                                {selectedProduct ? selectedProduct.productName : formData.productName || "Select a product"}
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
                                onClick={() => handleProductSelect(product)}
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
                                onClick={() => handleLocationSelect(location)}
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
                      Update Buyer {!hasChanges && '(No Changes)'}
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