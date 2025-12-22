import { BuyerFormFields } from '@/types/buyer';

export const BUYER_FORM_FIELDS: BuyerFormFields = {
  company: [
    { 
      name: 'buyersCompanyName', 
      label: 'Company Name', 
      required: true,
      placeholder: 'Enter company name'
    },
    { 
      name: 'registrationNumber', 
      label: 'Registration Number',
      placeholder: 'Enter registration number'
    },
    { 
      name: 'taxId', 
      label: 'Tax ID',
      placeholder: 'Enter tax ID'
    },
    { 
      name: 'country', 
      label: 'Country', 
      required: true,
      placeholder: 'Enter country'
    },
  ],
  contact: [
    { 
      name: 'contactName', 
      label: 'Contact Name', 
      required: true,
      placeholder: 'Enter contact person name'
    },
    { 
      name: 'email', 
      label: 'Email Address', 
      required: true, 
      type: 'email',
      placeholder: 'Enter email address'
    },
    { 
      name: 'countryCode', 
      label: 'Country Code', 
      required: true,
      placeholder: 'e.g., +1, +91'
    },
    { 
      name: 'contactPhone', 
      label: 'Phone Number',
      type: 'tel',
      placeholder: 'Enter phone number'
    },
  ],
  address: [
    { 
      name: 'state', 
      label: 'State/Province',
      placeholder: 'Enter state or province'
    },
    { 
      name: 'city', 
      label: 'City',
      placeholder: 'Enter city'
    },
    { 
      name: 'postalCode', 
      label: 'Postal Code',
      placeholder: 'Enter postal code'
    },
  ],
};