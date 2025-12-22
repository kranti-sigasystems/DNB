import { CreateBuyerData } from '@/types/buyer';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validatePostalCode = (postalCode: string): boolean => {
  // Basic postal code validation (alphanumeric, 3-10 characters)
  const postalRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
  return postalRegex.test(postalCode);
};

export const validateBuyerData = (data: CreateBuyerData): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!data.buyersCompanyName?.trim()) {
    errors.push({ field: 'buyersCompanyName', message: 'Company name is required' });
  }

  if (!data.contactName?.trim()) {
    errors.push({ field: 'contactName', message: 'Contact name is required' });
  }

  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (!data.country?.trim()) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  if (!data.countryCode?.trim()) {
    errors.push({ field: 'countryCode', message: 'Country code is required' });
  }

  if (!data.address?.trim()) {
    errors.push({ field: 'address', message: 'Address is required' });
  }

  // Optional field validation
  if (data.contactEmail && !validateEmail(data.contactEmail)) {
    errors.push({ field: 'contactEmail', message: 'Please enter a valid contact email address' });
  }

  if (data.contactPhone && !validatePhone(data.contactPhone)) {
    errors.push({ field: 'contactPhone', message: 'Please enter a valid phone number' });
  }

  if (data.postalCode && !validatePostalCode(data.postalCode)) {
    errors.push({ field: 'postalCode', message: 'Please enter a valid postal code' });
  }

  // Length validations
  if (data.buyersCompanyName && data.buyersCompanyName.length > 100) {
    errors.push({ field: 'buyersCompanyName', message: 'Company name must be less than 100 characters' });
  }

  if (data.contactName && data.contactName.length > 50) {
    errors.push({ field: 'contactName', message: 'Contact name must be less than 50 characters' });
  }

  if (data.address && data.address.length > 500) {
    errors.push({ field: 'address', message: 'Address must be less than 500 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeString = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') {
    if (value.name) return String(value.name);
    if (value.code) return String(value.code);
    if (value.label) return String(value.label);
    return JSON.stringify(value);
  }
  return String(value).trim();
};

export const sanitizeBuyerData = (data: any): CreateBuyerData => {
  return {
    contactName: sanitizeString(data.contactName),
    email: sanitizeString(data.email),
    contactEmail: sanitizeString(data.contactEmail),
    contactPhone: sanitizeString(data.contactPhone),
    buyersCompanyName: sanitizeString(data.buyersCompanyName),
    registrationNumber: sanitizeString(data.registrationNumber),
    taxId: sanitizeString(data.taxId),
    productName: sanitizeString(data.productName),
    locationName: sanitizeString(data.locationName),
    country: sanitizeString(data.country),
    state: sanitizeString(data.state),
    city: sanitizeString(data.city),
    address: sanitizeString(data.address),
    postalCode: sanitizeString(data.postalCode),
    countryCode: sanitizeString(data.countryCode),
  };
};