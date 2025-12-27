import { parseISO, differenceInDays, parse, isValid } from 'date-fns';

// Helper function to parse various date formats
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Try parsing as ISO format first (YYYY-MM-DD)
  let date = parseISO(dateString);
  if (isValid(date)) return date;
  
  // Try MM/DD/YYYY format
  date = parse(dateString, 'MM/dd/yyyy', new Date());
  if (isValid(date)) return date;
  
  // Try M/D/YYYY format
  date = parse(dateString, 'M/d/yyyy', new Date());
  if (isValid(date)) return date;
  
  // Try DD-MM-YYYY format
  date = parse(dateString, 'dd-MM-yyyy', new Date());
  if (isValid(date)) return date;
  
  // Try YYYY-MM-DD format explicitly
  date = parse(dateString, 'yyyy-MM-dd', new Date());
  if (isValid(date)) return date;
  
  // Try as a direct Date constructor
  date = new Date(dateString);
  if (isValid(date)) return date;
  
  return null;
};

export const getExpirationStatus = (expirationDate) => {
  if (!expirationDate) {
    return {
      status: 'unknown',
      color: '#999',
      bgColor: '#f5f5f5',
      label: 'Unknown',
    };
  }

  try {
    const expDate = parseDate(expirationDate);
    if (!expDate) {
      return {
        status: 'unknown',
        color: '#999',
        bgColor: '#f5f5f5',
        label: 'Invalid date',
      };
    }
    
    const daysUntilExpiration = differenceInDays(expDate, new Date());

    if (daysUntilExpiration < 0) {
      return {
        status: 'expired',
        color: '#000',
        bgColor: '#ffebee',
        label: 'Expired',
        days: daysUntilExpiration,
      };
    } else if (daysUntilExpiration <= 7) {
      return {
        status: 'critical',
        color: '#f44336',
        bgColor: '#ffcdd2',
        label: `${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''} left`,
        days: daysUntilExpiration,
      };
    } else if (daysUntilExpiration <= 30) {
      return {
        status: 'warning',
        color: '#FFC107',
        bgColor: '#fff9c4',
        label: `${daysUntilExpiration} days left`,
        days: daysUntilExpiration,
      };
    } else {
      return {
        status: 'good',
        color: '#4CAF50',
        bgColor: '#c8e6c9',
        label: 'Good',
        days: daysUntilExpiration,
      };
    }
  } catch (error) {
    return {
      status: 'unknown',
      color: '#999',
      bgColor: '#f5f5f5',
      label: 'Invalid date',
    };
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = parseDate(dateString);
    if (!date || !isValid(date)) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};
