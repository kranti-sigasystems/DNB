'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreateBuyerData, 
  Product, 
  Location, 
  PlanUsage,
} from '@/types/buyer';
import { createBuyer, getProducts, getLocations, getPlanUsage } from '@/actions/business-owner.actions';
import { sanitizeString } from '@/utils/validation';
import { getValidToken } from '@/utils/tokenManager';

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

  // Get auth token using token manager (with automatic refresh)
  const [authToken, setAuthToken] = useState<string>('');

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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const validToken = await getValidToken();
        
        if (!validToken) {
          return;
        }
        
        setAuthToken(validToken);
        
        // Load products
        setProductsLoading(true);
        const productsResponse = await getProducts(validToken, 0, 100);
        
        if (productsResponse.success && productsResponse.data) {
          // Type cast to handle null vs undefined differences
          const products = productsResponse.data.data.map(product => ({
            ...product,
            sku: product.sku || null,
            createdAt: typeof product.createdAt === 'string' ? product.createdAt : product.createdAt.toISOString(),
            updatedAt: typeof product.updatedAt === 'string' ? product.updatedAt : product.updatedAt.toISOString(),
          }));
          setProducts(products);
        } else {
          console.error('❌ useBuyerForm - Failed to load products:', productsResponse.error);
        }
        setProductsLoading(false);

        // Load locations
        setLocationsLoading(true);
        const locationsResponse = await getLocations(validToken, 0, 100);
        
        if (locationsResponse.success && locationsResponse.data) {
          // Type cast to handle Date vs string differences
          const locations = locationsResponse.data.data.map(location => ({
            ...location,
            createdAt: typeof location.createdAt === 'string' ? location.createdAt : location.createdAt.toISOString(),
            updatedAt: typeof location.updatedAt === 'string' ? location.updatedAt : location.updatedAt.toISOString(),
          }));
          setLocations(locations);
        } else {
          console.error('❌ useBuyerForm - Failed to load locations:', locationsResponse.error);
        }
        setLocationsLoading(false);

        const usageResponse = await getPlanUsage(validToken);
        if (usageResponse.success && usageResponse.data) {
          setPlanUsage(usageResponse.data);
          setRemainingBuyers(usageResponse.data.buyers?.remaining || 0);
        }

      } catch (error) {
        console.error('❌ useBuyerForm - Failed to load initial data:', error);
        setProductsLoading(false);
        setLocationsLoading(false);
      }
    };

    loadData();
  }, []); // Remove authToken dependency since we get it fresh each time

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

      setFormData(prev => ({
        ...prev,
        locationName: locationDisplayName,
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

      // Get fresh token for submission
      const validToken = await getValidToken();
      if (!validToken) {
        setErrors({ general: 'Authentication expired. Please login again.' });
        setLoading(false);
        return;
      }

      // Create buyer
      const buyerData = {
        contactName: formData.contactName,
        contactEmail: formData.contactEmail || formData.email,
        buyersCompanyName: formData.buyersCompanyName || '',
        country: formData.country || 'United States',
        contactPhone: formData.contactPhone,
        productName: formData.productName,
        locationName: formData.locationName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        registrationNumber: formData.registrationNumber
      };
      
      const result = await createBuyer(buyerData, validToken);
      
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
        setErrors({ general: result.error || 'Failed to create buyer' });
      }

    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors({ general: 'Failed to create buyer. Please try again.' });
    } finally {
      setLoading(false);
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
  };
}