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
      name: 'country', 
      label: 'Country', 
      required: true,
      placeholder: 'Enter country'
    },
  ],
  contact: [
    { 
      name: 'firstName', 
      label: 'First Name', 
      required: true,
      placeholder: 'Enter first name'
    },
    { 
      name: 'lastName', 
      label: 'Last Name', 
      required: true,
      placeholder: 'Enter last name'
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
    { 
      name: 'contactEmail', 
      label: 'Alternate Email (Optional)',
      type: 'email',
      placeholder: 'Enter alternate email address'
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