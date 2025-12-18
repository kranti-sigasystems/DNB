import { CheckoutFormData, FormErrors } from "@/types/checkout";

export const validateSingleField = (
  fieldName: keyof CheckoutFormData,
  value: string
): string => {
  const trimmedValue = value.trim();

  switch (fieldName) {
    case 'first_name':
    case 'last_name':
      if (!trimmedValue) return `${fieldName.replace('_', ' ')} is required`;
      if (trimmedValue.length < 2) return `${fieldName.replace('_', ' ')} must be at least 2 characters`;
      return '';

    case 'email':
      if (!trimmedValue) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) return 'Please enter a valid email address';
      return '';

    case 'password':
      if (!trimmedValue) return 'Password is required';
      if (trimmedValue.length < 8) return 'Password must be at least 8 characters';
      return '';

    case 'phoneNumber':
      if (!trimmedValue) return 'Phone number is required';
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(trimmedValue.replace(/\s/g, ''))) return 'Please enter a valid phone number';
      return '';

    case 'businessName':
      if (!trimmedValue) return 'Business name is required';
      if (trimmedValue.length < 2) return 'Business name must be at least 2 characters';
      return '';

    case 'registrationNumber':
      if (!trimmedValue) return 'Registration number is required';
      return '';

    case 'country':
      if (!trimmedValue) return 'Country is required';
      return '';

    case 'state':
      if (!trimmedValue) return 'State is required';
      return '';

    case 'city':
      if (!trimmedValue) return 'City is required';
      return '';

    case 'address':
      if (!trimmedValue) return 'Address is required';
      return '';

    case 'postalCode':
      if (!trimmedValue) return 'Postal code is required';
      return '';

    case 'taxId':
      // Tax ID is optional
      return '';

    // case 'website':
    //   // Website is optional
    //   if (trimmedValue) {
    //     const urlRegex = /^https?:\/\/.+/;
    //     if (!urlRegex.test(trimmedValue)) return 'Please enter a valid website URL';
    //   }
    //   return '';

    default:
      return '';
  }
};

export const validateCheckoutForm = (formData: CheckoutFormData): FormErrors => {
  const errors: FormErrors = {};

  // Validate all fields
  (Object.keys(formData) as Array<keyof CheckoutFormData>).forEach((fieldName) => {
    const error = validateSingleField(fieldName, formData[fieldName]);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};