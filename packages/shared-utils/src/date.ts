import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateString: string, formatString: string = 'MMM dd, yyyy') => {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, formatString) : 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

export const formatDateTime = (dateString: string) => {
  return formatDate(dateString, 'MMM dd, yyyy HH:mm');
};