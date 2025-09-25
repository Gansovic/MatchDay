import { format, parseISO, isValid } from 'date-fns';
export const formatDate = (dateString, formatString = 'MMM dd, yyyy') => {
    try {
        const date = parseISO(dateString);
        return isValid(date) ? format(date, formatString) : 'Invalid date';
    }
    catch (_a) {
        return 'Invalid date';
    }
};
export const formatDateTime = (dateString) => {
    return formatDate(dateString, 'MMM dd, yyyy HH:mm');
};
