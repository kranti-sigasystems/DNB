import type { SearchConfig } from '@/types/search';

export const PRODUCT_SEARCH_CONFIG: SearchConfig = {
  title: 'Search Products',
  quickSearchPlaceholder: 'Search products by name, code, or SKU...',
  quickSearchField: 'query',
  showQuickSearch: true,
  showAdvancedToggle: true,
  defaultExpanded: false,
  fields: [
    {
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name',
    },
    {
      name: 'code',
      label: 'Product Code',
      type: 'text',
      placeholder: 'Enter product code',
    },
    {
      name: 'species',
      label: 'Species',
      type: 'text',
      placeholder: 'Enter species name',
    },
    {
      name: 'size',
      label: 'Size',
      type: 'text',
      placeholder: 'Enter size (e.g., 20/30, Large)',
    },
    {
      name: 'sku',
      label: 'SKU',
      type: 'text',
      placeholder: 'Enter SKU',
    },
  ],
};

export const BUYER_SEARCH_CONFIG: SearchConfig = {
  title: 'Search Buyers',
  quickSearchPlaceholder: 'Search buyers by name, email, or company...',
  quickSearchField: 'query',
  showQuickSearch: true,
  showAdvancedToggle: true,
  defaultExpanded: false,
  fields: [
    {
      name: 'contactName',
      label: 'Contact Name',
      type: 'text',
      placeholder: 'Enter contact name',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter email address',
    },
    {
      name: 'buyersCompanyName',
      label: 'Company Name',
      type: 'text',
      placeholder: 'Enter company name',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'Enter city',
    },
    {
      name: 'state',
      label: 'State',
      type: 'text',
      placeholder: 'Enter state',
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Enter country',
    },
    {
      name: 'productName',
      label: 'Product',
      type: 'text',
      placeholder: 'Enter product name',
    },
  ],
};

export const BUSINESS_OWNER_SEARCH_CONFIG: SearchConfig = {
  title: 'Search Business Owners',
  quickSearchPlaceholder: 'Search by name, email, or business name...',
  quickSearchField: 'query',
  showQuickSearch: true,
  showAdvancedToggle: true,
  defaultExpanded: false,
  fields: [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter first name',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter last name',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter email address',
    },
    {
      name: 'businessName',
      label: 'Business Name',
      type: 'text',
      placeholder: 'Enter business name',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ],
};

export const LOCATION_SEARCH_CONFIG: SearchConfig = {
  title: 'Search Locations',
  quickSearchPlaceholder: 'Search locations by name, code, city, state, or country...',
  quickSearchField: 'query',
  showQuickSearch: true,
  showAdvancedToggle: true,
  defaultExpanded: false,
  fields: [
    {
      name: 'locationName',
      label: 'Location Name',
      type: 'text',
      placeholder: 'Enter location name',
    },
    {
      name: 'code',
      label: 'Location Code',
      type: 'text',
      placeholder: 'Enter location code',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'Enter city',
    },
    {
      name: 'state',
      label: 'State',
      type: 'text',
      placeholder: 'Enter state',
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Enter country',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      placeholder: 'Enter address',
    },
  ],
};

export const OFFER_DRAFT_SEARCH_CONFIG: SearchConfig = {
  title: 'Search Offer Drafts',
  quickSearchPlaceholder: 'Search offer drafts by draft name, draft number, or product...',
  quickSearchField: 'query',
  showQuickSearch: true,
  showAdvancedToggle: true,
  defaultExpanded: false,
  fields: [
    {
      name: 'draftName',
      label: 'Draft Name',
      type: 'text',
      placeholder: 'Enter draft name',
    },
    {
      name: 'draftNo',
      label: 'Draft Number',
      type: 'text',
      placeholder: 'Enter draft number',
    },
    {
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name',
    },
    {
      name: 'fromParty',
      label: 'From Party',
      type: 'text',
      placeholder: 'Enter from party name',
    },
    {
      name: 'origin',
      label: 'Origin',
      type: 'text',
      placeholder: 'Enter origin',
    },
    {
      name: 'brand',
      label: 'Brand',
      type: 'text',
      placeholder: 'Enter brand name',
    },
  ],
};

export const OFFER_SEARCH_CONFIG: SearchConfig = {
  title: 'Search Offers',
  quickSearchPlaceholder: 'Search offers by name, buyer, product, or status...',
  quickSearchField: 'query',
  showQuickSearch: true,
  showAdvancedToggle: true,
  defaultExpanded: false,
  fields: [
    {
      name: 'offerName',
      label: 'Offer Name',
      type: 'text',
      placeholder: 'Enter offer name',
    },
    {
      name: 'buyerName',
      label: 'Buyer Name',
      type: 'text',
      placeholder: 'Enter buyer company name',
    },
    {
      name: 'toParty',
      label: 'To Party',
      type: 'text',
      placeholder: 'Enter to party name',
    },
    {
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'expired', label: 'Expired' },
      ],
    },
    {
      name: 'destination',
      label: 'Destination',
      type: 'text',
      placeholder: 'Enter destination',
    },
    {
      name: 'fromParty',
      label: 'From Party',
      type: 'text',
      placeholder: 'Enter from party name',
    },
  ],
};

export const DASHBOARD_SEARCH_CONFIG: SearchConfig = {
  title: 'Search Dashboard Data',
  quickSearchPlaceholder: 'Search across all data...',
  quickSearchField: 'query',
  showQuickSearch: true,
  showAdvancedToggle: true,
  defaultExpanded: false,
  fields: [
    {
      name: 'type',
      label: 'Data Type',
      type: 'select',
      options: [
        { value: 'buyers', label: 'Buyers' },
        { value: 'products', label: 'Products' },
        { value: 'locations', label: 'Locations' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      name: 'dateFrom',
      label: 'Date From',
      type: 'date',
      placeholder: 'Select start date',
    },
    {
      name: 'dateTo',
      label: 'Date To',
      type: 'date',
      placeholder: 'Select end date',
    },
  ],
};