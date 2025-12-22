import { toast } from 'react-hot-toast';

/* -------------------------------------------------------------------------- */
/*                               Date Formatting                              */
/* -------------------------------------------------------------------------- */

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/* -------------------------------------------------------------------------- */
/*                          Offer / Shipment Validation                        */
/* -------------------------------------------------------------------------- */

export const validateOfferDates = (
  offerValidityDate?: Date | string | null,
  shipmentDate?: Date | string | null
): string | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validity: Date | null = offerValidityDate ? new Date(offerValidityDate) : null;

  const shipment: Date | null = shipmentDate ? new Date(shipmentDate) : null;

  if (validity && validity < today) {
    return 'Offer validity date cannot be earlier than today.';
  }

  if (shipment && shipment < today) {
    return 'Shipment date cannot be earlier than today.';
  }

  if (shipment && validity && shipment < validity) {
    return 'Shipment date cannot be earlier than offer validity date.';
  }

  return null;
};

/* -------------------------------------------------------------------------- */
/*                             Header Formatting                               */
/* -------------------------------------------------------------------------- */

export const formatHeader = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char: string) => char.toUpperCase());
};
