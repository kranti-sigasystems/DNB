/**
 * Draft Name Generator Utility
 * 
 * Generates standardized offer draft names based on current date and sequence number
 */

export interface DraftNameOptions {
  prefix?: string;
  includeDate?: boolean;
  dateFormat?: 'YYYY-MM-DD' | 'YYYYMMDD' | 'DD-MM-YYYY';
  sequenceLength?: number;
  separator?: string;
}

/**
 * Generate a standardized offer draft name
 * @param sequenceNumber The next sequence number for the draft
 * @param options Configuration options for the draft name format
 * @returns Generated draft name string
 */
export function generateDraftName(
  sequenceNumber: number,
  options: DraftNameOptions = {}
): string {
  const {
    prefix = 'OD',
    includeDate = true,
    dateFormat = 'YYYY-MM-DD',
    sequenceLength = 3,
    separator = '-'
  } = options;

  const parts: string[] = [prefix];
  
  if (includeDate) {
    const currentDate = new Date();
    let dateString: string;
    
    switch (dateFormat) {
      case 'YYYYMMDD':
        dateString = currentDate.toISOString().split('T')[0].replace(/-/g, '');
        break;
      case 'DD-MM-YYYY':
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        dateString = `${day}-${month}-${year}`;
        break;
      case 'YYYY-MM-DD':
      default:
        dateString = currentDate.toISOString().split('T')[0];
        break;
    }
    
    parts.push(dateString);
  }
  
  // Add sequence number with padding
  const paddedSequence = String(sequenceNumber).padStart(sequenceLength, '0');
  parts.push(paddedSequence);
  
  return parts.join(separator);
}

/**
 * Generate offer draft name in the specific format: "sequence/DD-MM-YY"
 * @param sequenceNumber The next sequence number for the draft
 * @returns Generated draft name in format like "20/30-12-25"
 */
export function generateOfferDraftName(sequenceNumber: number): string {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const year = String(currentDate.getFullYear()).slice(-2); // Get last 2 digits of year
  
  return `${sequenceNumber}/${day}-${month}-${year}`;
}

/**
 * Generate draft name with business-specific prefix
 * @param sequenceNumber The next sequence number
 * @param businessName Business name to create prefix from
 * @param options Additional options
 * @returns Generated draft name with business prefix
 */
export function generateBusinessDraftName(
  sequenceNumber: number,
  businessName: string,
  options: Omit<DraftNameOptions, 'prefix'> = {}
): string {
  // Create prefix from business name (first 2-3 letters, uppercase)
  const businessPrefix = businessName
    .replace(/[^a-zA-Z]/g, '') // Remove non-letters
    .substring(0, 3)
    .toUpperCase();
  
  const prefix = businessPrefix ? `${businessPrefix}-OD` : 'OD';
  
  return generateDraftName(sequenceNumber, {
    ...options,
    prefix,
  });
}

/**
 * Parse a draft name to extract components
 * @param draftName The draft name to parse
 * @returns Parsed components or null if invalid format
 */
export function parseDraftName(draftName: string): {
  prefix?: string;
  date?: string;
  sequence: number;
} | null {
  try {
    // Handle new format: "20/30-12-25" (sequence/DD-MM-YY)
    if (draftName.includes('/')) {
      const parts = draftName.split('/');
      if (parts.length === 2) {
        const sequence = parseInt(parts[0], 10);
        const datePart = parts[1];
        
        if (!isNaN(sequence)) {
          return {
            sequence,
            date: datePart,
          };
        }
      }
    }
    
    // Handle old format: "OD-YYYY-MM-DD-001"
    const parts = draftName.split('-');
    
    if (parts.length < 2) {
      return null;
    }
    
    const prefix = parts[0];
    const sequence = parseInt(parts[parts.length - 1], 10);
    
    if (isNaN(sequence)) {
      return null;
    }
    
    const result: any = { prefix, sequence };
    
    // If there are 3 parts, middle one is likely the date
    if (parts.length === 3) {
      result.date = parts[1];
    }
    
    return result;
  } catch (error) {
    return null;
  }
}

/**
 * Parse offer draft name in the specific format: "sequence/DD-MM-YY"
 * @param draftName The draft name to parse
 * @returns Parsed components or null if invalid format
 */
export function parseOfferDraftName(draftName: string): {
  sequence: number;
  day: number;
  month: number;
  year: number;
} | null {
  try {
    if (!draftName.includes('/')) {
      return null;
    }
    
    const parts = draftName.split('/');
    if (parts.length !== 2) {
      return null;
    }
    
    const sequence = parseInt(parts[0], 10);
    const datePart = parts[1]; // Should be "DD-MM-YY"
    
    if (isNaN(sequence)) {
      return null;
    }
    
    const dateParts = datePart.split('-');
    if (dateParts.length !== 3) {
      return null;
    }
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10) + 2000; // Convert YY to YYYY
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }
    
    return { sequence, day, month, year };
  } catch (error) {
    return null;
  }
}

/**
 * Validate if a draft name follows the expected format
 * @param draftName The draft name to validate
 * @returns Boolean indicating if the format is valid
 */
export function isValidDraftNameFormat(draftName: string): boolean {
  // Check for new format first: "20/30-12-25"
  const newFormatParsed = parseOfferDraftName(draftName);
  if (newFormatParsed) {
    return true;
  }
  
  // Fallback to old format
  return parseDraftName(draftName) !== null;
}

/**
 * Get the next sequence number from a list of existing draft names
 * @param existingNames Array of existing draft names
 * @returns Next sequence number to use
 */
export function getNextSequenceNumber(existingNames: string[]): number {
  let maxSequence = 0;
  
  for (const name of existingNames) {
    // Try new format first
    const newFormatParsed = parseOfferDraftName(name);
    if (newFormatParsed && newFormatParsed.sequence > maxSequence) {
      maxSequence = newFormatParsed.sequence;
      continue;
    }
    
    // Fallback to old format
    const parsed = parseDraftName(name);
    if (parsed && parsed.sequence > maxSequence) {
      maxSequence = parsed.sequence;
    }
  }
  
  return maxSequence + 1;
}