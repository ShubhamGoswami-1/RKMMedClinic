/**
 * Format a date object to a string in the format 'YYYY-MM-DD'
 * @param date Date object to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format a date object to a display-friendly string (e.g., 'Jan 15, 2023')
 * @param date Date object to format
 * @returns Formatted date string for display
 */
export const formatDisplayDate = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Calculate the number of days between two dates (inclusive)
 * @param startDate Start date
 * @param endDate End date
 * @returns Number of days between the dates (inclusive)
 */
export const calculateDaysBetween = (startDate: Date, endDate: Date): number => {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns True if the date is in the past, false otherwise
 */
export const isDatePast = (date: Date): boolean => {
  if (!date || isNaN(date.getTime())) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  return compareDate < today;
};

/**
 * Get today's date as a string in the format 'YYYY-MM-DD'
 * @returns Today's date as a string
 */
export const getTodayString = (): string => {
  return formatDate(new Date());
};
