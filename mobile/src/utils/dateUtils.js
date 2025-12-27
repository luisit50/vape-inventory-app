import { differenceInDays, parseISO, parse, isValid, format } from 'date-fns';

// Helper function to parse various date formats
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Clean the string and fix malformed dates like 01/027/2026 -> 01/27/2026
  let cleaned = String(dateString).trim();
  
  // Fix dates with extra leading zeros: 01/027/2026 -> 01/27/2026 or 012/27/2026 -> 12/27/2026
  cleaned = cleaned.replace(/(\d{1,2})\/0+(\d{1,2})\/(\d{4})/g, '$1/$2/$3');
  cleaned = cleaned.replace(/0+(\d{1,2})\/(\d{1,2})\/(\d{4})/g, '$1/$2/$3');
  
  try {
    // Try parsing as ISO format first (YYYY-MM-DD)
    let date = parseISO(cleaned);
    if (isValid(date) && date.getFullYear() > 1900) return date;
    
    // Try MM/DD/YYYY format
    date = parse(cleaned, 'MM/dd/yyyy', new Date());
    if (isValid(date) && date.getFullYear() > 1900) return date;
    
    // Try M/D/YYYY format (single digit month/day)
    date = parse(cleaned, 'M/d/yyyy', new Date());
    if (isValid(date) && date.getFullYear() > 1900) return date;
    
    // Try M/DD/YYYY format
    date = parse(cleaned, 'M/dd/yyyy', new Date());
    if (isValid(date) && date.getFullYear() > 1900) return date;
    
    // Try MM/D/YYYY format
    date = parse(cleaned, 'MM/d/yyyy', new Date());
    if (isValid(date) && date.getFullYear() > 1900) return date;
    
    // Try DD-MM-YYYY format
    date = parse(cleaned, 'dd-MM-yyyy', new Date());
    if (isValid(date) && date.getFullYear() > 1900) return date;
    
    // Try YYYY-MM-DD format explicitly
    date = parse(cleaned, 'yyyy-MM-dd', new Date());
    if (isValid(date) && date.getFullYear() > 1900) return date;
    
    // Try as a direct Date constructor
    date = new Date(cleaned);
    if (isValid(date) && !isNaN(date.getTime()) && date.getFullYear() > 1900) return date;
  } catch (error) {
    // Silent fail
  }
  
  return null;
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseDate(dateString);
    if (!date || !isValid(date)) return dateString; // Return original if can't parse
    
    return format(date, 'MM/dd/yyyy');
  } catch (error) {
    return dateString; // Return original on error
  }
};

export const getExpirationStatus = (expirationDate) => {
  if (!expirationDate) return { status: 'unknown', color: '#999', label: 'Unknown' };
  
  try {
    const expDate = parseDate(expirationDate);
    
    if (!expDate) {
      return { status: 'unknown', color: '#999', label: 'Invalid date' };
    }
    
    const daysUntilExpiration = differenceInDays(expDate, new Date());
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', color: '#000', label: 'Expired' };
    } else if (daysUntilExpiration <= 7) {
      return { status: 'critical', color: '#f44336', label: `${daysUntilExpiration}d left` };
    } else if (daysUntilExpiration <= 30) {
      return { status: 'warning', color: '#FFC107', label: `${daysUntilExpiration}d left` };
    } else {
      return { status: 'good', color: '#4CAF50', label: 'Good' };
    }
  } catch (error) {
    return { status: 'unknown', color: '#999', label: 'Invalid date' };
  }
};
