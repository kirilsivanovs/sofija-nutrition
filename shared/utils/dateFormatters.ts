/**
 * Shared date and time formatting utilities
 * Used across frontend and backend to ensure consistent formatting
 */

/**
 * Converts ISO date (yyyy-mm-dd) to European format (dd/mm/yyyy)
 * @param dateStr - Date string in yyyy-mm-dd format
 * @returns Date string in dd/mm/yyyy format
 * @example formatDate('2024-02-01') // '01/02/2024'
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Converts European format (dd/mm/yyyy) to ISO format (yyyy-mm-dd)
 * @param dateStr - Date string in dd/mm/yyyy format
 * @returns Date string in yyyy-mm-dd format
 * @example formatDateReverse('01/02/2024') // '2024-02-01'
 */
export function formatDateReverse(dateStr: string): string {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

/**
 * Ensures time is in 24-hour HH:MM format
 * @param timeStr - Time string
 * @returns Time string in HH:MM format
 * @example formatTime('9:5') // '09:05'
 * @example formatTime('09:05 AM') // '09:05'
 */
export function formatTime(timeStr: string): string {
    if (!timeStr) return '';
    
    // Remove AM/PM if present
    const cleanTime = timeStr.replace(/\s?(AM|PM|am|pm)/g, '');
    
    const [hours, minutes] = cleanTime.split(':');
    const h = hours.padStart(2, '0');
    const m = (minutes || '00').padStart(2, '0');
    
    return `${h}:${m}`;
}

/**
 * Converts Date object to ISO date string (yyyy-mm-dd)
 * @param date - Date object
 * @returns Date string in yyyy-mm-dd format
 * @example formatDateISO(new Date(2024, 1, 1)) // '2024-02-01'
 */
export function formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats date for display with day name
 * @param dateStr - Date string in yyyy-mm-dd format
 * @param locale - Locale for day names (default: 'lv-LV')
 * @returns Formatted date string with day name
 * @example formatDateWithDay('2024-02-01', 'lv-LV') // 'Ceturtdiena, 01/02/2024'
 */
export function formatDateWithDay(dateStr: string, locale: string = 'lv-LV'): string {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const dayNames: Record<string, string[]> = {
        'lv-LV': ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'],
        'en-US': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    
    const dayName = dayNames[locale]?.[date.getDay()] || '';
    return `${dayName}, ${formatDate(dateStr)}`;
}
