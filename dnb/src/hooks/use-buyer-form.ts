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
  validationLoading: Record<string, boolean>;
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
    firstName: '',
    lastName: '',
    email: '',
    contactEmail: '',
    contactPhone: '',
    phoneNumber: '',
    buyersCompanyName: '',
    registrationNumber: '',
    productName: '',
    locationName: '',
    country: '',
    state: '',
    city: '',
    address: '',
    postalCode: '',
    businessName: '',
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
  const [validationLoading, setValidationLoading] = useState<Record<string, boolean>>({});

  const validateField = async (field: string, value: string) => {
    if (!value.trim()) return; // Don't validate empty fields
    
    setValidationLoading(prev => ({ ...prev, [field]: true }));
    
    try {
      // For buyersCompanyName, check uniqueness via backend
      if (field === 'buyersCompanyName') {
        const validToken = await getValidToken();
        if (!validToken) {
          setValidationLoading(prev => ({ ...prev, [field]: false }));
          return;
        }

        // Import the check function
        const { checkBusinessNameUnique } = await import('@/actions/business-owner.actions');
        const result = await checkBusinessNameUnique(value, validToken);
        
        if (result.success && result.data && !result.data.isUnique) {
          setErrors(prev => ({ ...prev, [field]: 'This company name is already in use' }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      } else {
        // For other fields, use the API validation
        const response = await fetch('/api/buyers/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });
        
        const result = await response.json();
        
        if (!result.isValid) {
          const fieldError = result.errors.find((e: any) => e.field === field);
          if (fieldError) {
            setErrors(prev => ({ ...prev, [field]: fieldError.message }));
          }
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setValidationLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  // Debounce validation
  const debounceValidation = (field: string, value: string) => {
    const timeoutId = setTimeout(() => {
      if (['email', 'buyersCompanyName', 'registrationNumber', 'contactPhone'].includes(field)) {
        validateField(field, value);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

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
          // Type cast to handle Date vs string differences and null values
          const locations = locationsResponse.data.data.map(location => ({
            ...location,
            locationName: location.locationName || '',
            address: location.address || '',
            postalCode: location.postalCode || '',
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

  // Update form field with validation
  const updateField = (name: keyof CreateBuyerData, value: string) => {
    const sanitizedValue = sanitizeString(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Clear existing error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (['email', 'buyersCompanyName', 'registrationNumber', 'contactPhone'].includes(name)) {
      debounceValidation(name, sanitizedValue);
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
      const contactName = `${formData.firstName} ${formData.lastName}`.trim();
      const buyerData = {
        contactName: contactName,
        contactEmail: formData.contactEmail || formData.email,
        email: formData.email,
        buyersCompanyName: formData.buyersCompanyName || '',
        businessName: formData.buyersCompanyName || '', // Map to businessName for uniqueness check
        country: formData.country || 'United States',
        contactPhone: formData.contactPhone,
        phoneNumber: formData.contactPhone, // Map to phoneNumber for uniqueness check
        productName: formData.productName,
        locationName: formData.locationName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        registrationNumber: formData.registrationNumber,
      };
      
      const result = await createBuyer(buyerData, validToken);
      
      if (result.success) {
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          contactEmail: '',
          contactPhone: '',
          phoneNumber: '',
          buyersCompanyName: '',
          registrationNumber: '',
          productName: '',
          locationName: '',
          country: '',
          state: '',
          city: '',
          address: '',
          postalCode: '',
          businessName: '',
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
    validationLoading,
    submitForm,
  };
}