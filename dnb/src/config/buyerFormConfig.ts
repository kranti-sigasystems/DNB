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
      placeholder: 'Enter tax identification number'
    },
    { 
      name: 'countryCode', 
      label: 'Country Code',
      placeholder: 'Enter country code (e.g., US, IN, UK)'
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
      name: 'contactPhone', 
      label: 'Phone Number',
      required: true,
      type: 'tel',
      placeholder: 'Enter phone number'
    },
  ],
  address: [
    { 
      name: 'state', 
      label: 'State/Province',
      required: true,
      placeholder: 'Enter state or province'
    },
    { 
      name: 'city', 
      label: 'City',
      required: true,
      placeholder: 'Enter city'
    },
    { 
      name: 'postalCode', 
      label: 'Postal Code',
      required: true,
      placeholder: 'Enter postal code'
    },
  ],
};