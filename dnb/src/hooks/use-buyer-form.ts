'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreateBuyerData, 
  Product, 
  Location, 
  PlanUsage,
  ApiResponse 
} from '@/types/buyer';
import { createBuyer, getProducts, getLocations, getPlanUsage } from '@/actions/buyer.actions';
import { sanitizeString } from '@/utils/validation';

interface UseBuyerFormReturn {
  // Form data
  formData: CreateBuyerData;
  setFormData: (data: CreateBuyerData) => void;
  updateField: (name: keyof CreateBuyerData, value: string) => void;
  
  // Products
  products: Product[];
  productsLoading: boolean;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  
  // Locations
  locations: Location[];
  locationsLoading: boolean;
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;
  
  // Plan usage
  planUsage: PlanUsage | null;
  remainingBuyers: number;
  
  // Form submission
  loading: boolean;
  errors: Record<string, string>;
  submitForm: () => Promise<void>;
  
  // UI state
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
}

export function useBuyerForm(): UseBuyerFormReturn {
  const router = useRouter();
  
  // Get user from session storage
  const [user] = useState(() => {
    if (typeof window !== 'undefined') {
      const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    }
    return {};
  });

  // Get auth token
  const [authToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
    }
    return '';
  });

  // Form data
  const [formData, setFormData] = useState<CreateBuyerData>({
    contactName: '',
    email: '',
    contactEmail: '',
    contactPhone: '',
    buyersCompanyName: '',
    registrationNumber: '',
    taxId: '',
    productName: '',
    locationName: '',
    country: '',
    state: '',
    city: '',
    address: '',
    postalCode: '',
    countryCode: '',
  });

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Locations state
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Plan usage state
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);
  const [remainingBuyers, setRemainingBuyers] = useState(0);

  // Form submission state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!authToken) return;

      try {
        // Load products
        setProductsLoading(true);
        console.log('🔄 useBuyerForm - Loading products with authToken:', authToken ? 'Present' : 'Missing');
        const productsResponse = await getProducts(authToken, 0, 100); // pageIndex=0, pageSize=100
        console.log('📦 useBuyerForm - Products response:', productsResponse);
        if (productsResponse.success && productsResponse.data) {
          console.log('📦 useBuyerForm - Setting products:', productsResponse.data.data);
          setProducts(productsResponse.data.data);
        } else {
          console.error('❌ useBuyerForm - Failed to load products:', productsResponse.message);
        }
        setProductsLoading(false);

        // Load locations
        setLocationsLoading(true);
        console.log('🔄 useBuyerForm - Loading locations with authToken:', authToken ? 'Present' : 'Missing');
        const locationsResponse = await getLocations(authToken, 0, 100); // pageIndex=0, pageSize=100
        console.log('📍 useBuyerForm - Locations response:', locationsResponse);
        if (locationsResponse.success && locationsResponse.data) {
          console.log('📍 useBuyerForm - Setting locations:', locationsResponse.data.data);
          setLocations(locationsResponse.data.data);
        } else {
          console.error('❌ useBuyerForm - Failed to load locations:', locationsResponse.message);
        }
        setLocationsLoading(false);

        // Load plan usage
        const usageResponse = await getPlanUsage(authToken);
        if (usageResponse.success && usageResponse.data) {
          setPlanUsage(usageResponse.data);
          setRemainingBuyers(usageResponse.data.buyers?.remaining || 0);
        }

      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadData();
  }, [authToken]);

  // Update form field
  const updateField = (name: keyof CreateBuyerData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: sanitizeString(value)
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
  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      productName: product?.productName || ''
    }));
  };

  // Handle location selection
  const handleLocationSelect = (location: Location | null) => {
    setSelectedLocation(location);
    
    if (location) {
      // Build location display name
      let locationDisplayName = '';
      if (location.locationName) locationDisplayName += location.locationName + ', ';
      if (location.address) locationDisplayName += location.address + ', ';
      if (location.city) locationDisplayName += location.city;
      if (location.state) {
        if (locationDisplayName.endsWith(', ')) {
          locationDisplayName += location.state;
        } else {
          locationDisplayName += ', ' + location.state;
        }
      }
      if (location.postalCode) locationDisplayName += ' ' + location.postalCode;
      if (location.country) {
        if (locationDisplayName.length > 0) {
          locationDisplayName += ', ' + location.country;
        } else {
          locationDisplayName += location.country;
        }
      }

      // Clean up display name
      const cleanedLocationName = locationDisplayName
        .replace(/,(\s*,)+/g, ',')
        .replace(/,+\s*$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      setFormData(prev => ({
        ...prev,
        locationName: cleanedLocationName,
        country: location.country || '',
        state: location.state || '',
        city: location.city || '',
        address: location.address || '',
        postalCode: location.postalCode || ''
      }));
    }
  };

  // Submit form
  const submitForm = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Validate required product selection
      if (!formData.productName) {
        setErrors({ productName: 'Please select a product' });
        setLoading(false);
        return;
      }

      // Create buyer
      const result = await createBuyer(formData, authToken);
      
      if (result.success) {
        // Reset form
        setFormData({
          contactName: '',
          email: '',
          contactEmail: '',
          contactPhone: '',
          buyersCompanyName: '',
          registrationNumber: '',
          taxId: '',
          productName: '',
          locationName: '',
          country: '',
          state: '',
          city: '',
          address: '',
          postalCode: '',
          countryCode: '',
        });
        setSelectedProduct(null);
        setSelectedLocation(null);
        
        // Navigate back to users page
        setTimeout(() => {
          router.push('/users');
        }, 1000);
        
      } else {
        setErrors({ general: result.error || result.message });
      }

    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors({ general: 'Failed to create buyer. Please try again.' });
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return {
    // Form data
    formData,
    setFormData,
    updateField,
    
    // Products
    products,
    productsLoading,
    selectedProduct,
    setSelectedProduct: handleProductSelect,
    
    // Locations
    locations,
    locationsLoading,
    selectedLocation,
    setSelectedLocation: handleLocationSelect,
    
    // Plan usage
    planUsage,
    remainingBuyers,
    
    // Form submission
    loading,
    errors,
    submitForm,
    
    // UI state
    showConfirmDialog,
    setShowConfirmDialog,
  };
}