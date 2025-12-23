import { z } from 'zod';

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  name: /^[a-zA-Z\s\-'\.]{2,50}$/,
  businessName: /^[a-zA-Z0-9\s\-'\.&,]{2,100}$/,
  productCode: /^[A-Z0-9\-_]{2,20}$/,
  sku: /^[A-Z0-9\-_]{1,50}$/,
  species: /^[a-zA-Z\s\-'\.]{2,50}$/,
  size: /^[a-zA-Z0-9\s\-\/\+\*\.]{1,20}$/, // Allows alphanumeric, spaces, and symbols like /, +, *, -
  zipCode: /^[0-9]{5,10}$/,
  city: /^[a-zA-Z\s\-'\.]{2,50}$/,
  state: /^[a-zA-Z\s\-'\.]{2,50}$/,
  country: /^[a-zA-Z\s\-'\.]{2,50}$/,
  address: /^[a-zA-Z0-9\s\-'\.#,\/]{5,200}$/,
};

// Validation messages
export const ValidationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  name: 'Name should contain only letters, spaces, hyphens, apostrophes, and dots (2-50 characters)',
  businessName: 'Business name should contain letters, numbers, spaces, and common symbols (2-100 characters)',
  productCode: 'Product code should contain uppercase letters, numbers, hyphens, and underscores (2-20 characters)',
  sku: 'SKU should contain uppercase letters, numbers, hyphens, and underscores (1-50 characters)',
  species: 'Species name should contain only letters, spaces, hyphens, apostrophes, and dots (2-50 characters)',
  size: 'Size can contain letters, numbers, spaces, and symbols like /, +, *, - (1-20 characters)',
  zipCode: 'Please enter a valid zip code (5-10 digits)',
  city: 'City name should contain only letters, spaces, hyphens, apostrophes, and dots (2-50 characters)',
  state: 'State name should contain only letters, spaces, hyphens, apostrophes, and dots (2-50 characters)',
  country: 'Country name should contain only letters, spaces, hyphens, apostrophes, and dots (2-50 characters)',
  address: 'Address should contain letters, numbers, spaces, and common symbols (5-200 characters)',
  minLength: (min: number) => `Must be at least ${min} characters long`,
  maxLength: (max: number) => `Must be no more than ${max} characters long`,
  minValue: (min: number) => `Must be at least ${min}`,
  maxValue: (max: number) => `Must be no more than ${max}`,
};

// Field validation functions
export const validateField = (value: string, type: keyof typeof ValidationPatterns): { isValid: boolean; message?: string } => {
  if (!value || value.trim() === '') {
    return { isValid: false, message: ValidationMessages.required };
  }

  const pattern = ValidationPatterns[type];
  const isValid = pattern.test(value.trim());

  return {
    isValid,
    message: isValid ? undefined : ValidationMessages[type],
  };
};

// Comprehensive validation schemas using Zod
export const ProductValidationSchema = z.object({
  code: z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(20, ValidationMessages.maxLength(20))
    .regex(ValidationPatterns.productCode, ValidationMessages.productCode),
  
  productName: z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(200, ValidationMessages.maxLength(200))
    .regex(/^[a-zA-Z0-9\s\-'\.&,]{2,200}$/, 'Product name should contain letters, numbers, spaces, and common symbols (2-200 characters)'),
  
  species: z.array(z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50))
    .regex(ValidationPatterns.species, ValidationMessages.species)
  ).min(1, 'At least one species is required'),
  
  size: z.array(z.string()
    .min(1, ValidationMessages.minLength(1))
    .max(20, ValidationMessages.maxLength(20))
    .regex(ValidationPatterns.size, ValidationMessages.size)
  ).default([]), // Default to empty array instead of optional
  
  sku: z.string()
    .max(50, ValidationMessages.maxLength(50))
    .regex(ValidationPatterns.sku, ValidationMessages.sku)
    .optional()
    .or(z.literal('')),
});

export const BuyerValidationSchema = z.object({
  // Company Information
  buyersCompanyName: z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(100, ValidationMessages.maxLength(100))
    .regex(ValidationPatterns.businessName, ValidationMessages.businessName),
  
  // Contact Information
  contactName: z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50))
    .regex(ValidationPatterns.name, ValidationMessages.name),
  
  email: z.string()
    .email(ValidationMessages.email)
    .regex(ValidationPatterns.email, ValidationMessages.email),
  
  contactPhone: z.string()
    .min(10, ValidationMessages.minLength(10))
    .max(15, ValidationMessages.maxLength(15))
    .regex(ValidationPatterns.phone, ValidationMessages.phone),
  
  // Address Information
  address: z.string()
    .min(5, ValidationMessages.minLength(5))
    .max(200, ValidationMessages.maxLength(200))
    .regex(ValidationPatterns.address, ValidationMessages.address),
  
  city: z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50))
    .regex(ValidationPatterns.city, ValidationMessages.city),
  
  state: z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50))
    .regex(ValidationPatterns.state, ValidationMessages.state),
  
  country: z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50))
    .regex(ValidationPatterns.country, ValidationMessages.country),
  
  zipCode: z.string()
    .min(5, ValidationMessages.minLength(5))
    .max(10, ValidationMessages.maxLength(10))
    .regex(ValidationPatterns.zipCode, ValidationMessages.zipCode),
});

export const AuthValidationSchema = z.object({
  email: z.string()
    .email(ValidationMessages.email)
    .regex(ValidationPatterns.email, ValidationMessages.email),
  
  password: z.string()
    .min(8, ValidationMessages.minLength(8))
    .max(100, ValidationMessages.maxLength(100))
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  businessName: z.string()
    .min(2, ValidationMessages.minLength(2))
    .max(100, ValidationMessages.maxLength(100))
    .regex(ValidationPatterns.businessName, ValidationMessages.businessName)
    .optional(),
});

// Real-time validation hook
export const useFieldValidation = () => {
  const validateFieldRealTime = (value: string, type: keyof typeof ValidationPatterns, required: boolean = true): { isValid: boolean; message?: string } => {
    if (!required && (!value || value.trim() === '')) {
      return { isValid: true };
    }
    
    if (required && (!value || value.trim() === '')) {
      return { isValid: false, message: ValidationMessages.required };
    }

    return validateField(value, type);
  };

  return { validateFieldRealTime };
};

// Utility to get validation error class
export const getValidationClass = (isValid: boolean, hasError: boolean): string => {
  if (hasError && !isValid) {
    return 'border-red-500 focus:border-red-500 focus:ring-red-500';
  }
  return '';
};

// Utility to format validation error message
export const formatValidationError = (message?: string): string => {
  return message || '';
};

// Utility to sanitize string input
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' '); // Remove extra whitespace
};

// Utility to sanitize and validate input
export const sanitizeAndValidate = (
  input: string, 
  type: keyof typeof ValidationPatterns, 
  required: boolean = true
): { value: string; isValid: boolean; message?: string } => {
  const sanitized = sanitizeString(input);
  const validation = validateField(sanitized, type);
  
  if (!required && !sanitized) {
    return { value: sanitized, isValid: true };
  }
  
  return {
    value: sanitized,
    isValid: validation.isValid,
    message: validation.message,
  };
};

// Validate buyer data
export const validateBuyerData = (data: any): { isValid: boolean; errors: Array<{ field: string; message: string }> } => {
  const errors: Array<{ field: string; message: string }> = [];

  // Required fields validation
  const requiredFields = [
    { field: 'contactName', type: 'name' as keyof typeof ValidationPatterns },
    { field: 'email', type: 'email' as keyof typeof ValidationPatterns },
    { field: 'contactPhone', type: 'phone' as keyof typeof ValidationPatterns },
    { field: 'buyersCompanyName', type: 'businessName' as keyof typeof ValidationPatterns },
    { field: 'address', type: 'address' as keyof typeof ValidationPatterns },
    { field: 'city', type: 'city' as keyof typeof ValidationPatterns },
    { field: 'state', type: 'state' as keyof typeof ValidationPatterns },
    { field: 'country', type: 'country' as keyof typeof ValidationPatterns },
    { field: 'postalCode', type: 'zipCode' as keyof typeof ValidationPatterns },
  ];

  for (const { field, type } of requiredFields) {
    const value = data[field];
    if (!value || value.trim() === '') {
      errors.push({ field, message: ValidationMessages.required });
    } else {
      const validation = validateField(value, type);
      if (!validation.isValid) {
        errors.push({ field, message: validation.message || `Invalid ${field}` });
      }
    }
  }

  // Optional fields validation
  const optionalFields = [
    { field: 'registrationNumber', type: 'businessName' as keyof typeof ValidationPatterns },
    { field: 'taxId', type: 'businessName' as keyof typeof ValidationPatterns },
  ];

  for (const { field, type } of optionalFields) {
    const value = data[field];
    if (value && value.trim() !== '') {
      const validation = validateField(value, type);
      if (!validation.isValid) {
        errors.push({ field, message: validation.message || `Invalid ${field}` });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};