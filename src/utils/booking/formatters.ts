/**
 * Booking Formatting Utilities
 * 
 * SOLID: Single Responsibility - only formats booking data for display
 * DRY: Centralized formatting logic
 */

import { WEEKDAYS, MONTHS, DATE_FORMAT } from '../constants';

// ============================================
// Date Formatting
// ============================================

/**
 * Format date to display format (DD.MM.YYYY)
 */
export function formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    } catch {
        return dateString;
    }
}

/**
 * Format date to long format (DD. MMMM YYYY)
 */
export function formatDateLong(dateString: string, language: 'lv' | 'en' = 'lv'): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = MONTHS[language.toUpperCase() as 'LV' | 'EN'][date.getMonth()];
        const year = date.getFullYear();

        return `${day}. ${month} ${year}`;
    } catch {
        return dateString;
    }
}

/**
 * Get weekday name from date
 */
export function getWeekdayName(
    dateString: string,
    language: 'lv' | 'en' = 'lv',
    short: boolean = false
): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const dayIndex = date.getDay();
        const weekdays = short
            ? WEEKDAYS[`${language.toUpperCase()}_SHORT` as 'LV_SHORT' | 'EN_SHORT']
            : WEEKDAYS[language.toUpperCase() as 'LV' | 'EN'];

        return weekdays[dayIndex];
    } catch {
        return '';
    }
}

/**
 * Format date with weekday (Pirmdiena, 15. Janvāris 2026)
 */
export function formatDateWithWeekday(dateString: string, language: 'lv' | 'en' = 'lv'): string {
    if (!dateString) return '';

    const weekday = getWeekdayName(dateString, language);
    const dateLong = formatDateLong(dateString, language);

    return `${weekday}, ${dateLong}`;
}

// ============================================
// Time Formatting
// ============================================

/**
 * Format time to HH:MM
 */
export function formatTime(timeString: string): string {
    if (!timeString) return '';

    // Already in HH:MM format
    if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
    }

    // Try to parse and format
    try {
        const [hours, minutes] = timeString.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } catch {
        return timeString;
    }
}

/**
 * Format time range (09:00 - 10:00)
 */
export function formatTimeRange(startTime: string, durationMinutes: number = 60): string {
    if (!startTime) return '';

    try {
        const [hours, minutes] = startTime.split(':').map(Number);
        const start = formatTime(startTime);

        // Calculate end time
        let endHours = hours;
        let endMinutes = minutes + durationMinutes;

        while (endMinutes >= 60) {
            endHours++;
            endMinutes -= 60;
        }

        const end = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

        return `${start} - ${end}`;
    } catch {
        return startTime;
    }
}

// ============================================
// Price Formatting
// ============================================

/**
 * Format price to EUR display
 */
export function formatPrice(price: number): string {
    return `€${price.toFixed(2)}`;
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithCurrency(price: number, currency: string = 'EUR'): string {
    if (currency === 'EUR') {
        return formatPrice(price);
    }

    return `${price.toFixed(2)} ${currency}`;
}

// ============================================
// Service Formatting
// ============================================

/**
 * Format consultation format for display
 */
export function formatConsultationFormat(format: 'online' | 'in-person', language: 'lv' | 'en' = 'lv'): string {
    const formats = {
        lv: {
            online: 'Online',
            'in-person': 'Klātienē',
        },
        en: {
            online: 'Online',
            'in-person': 'In Person',
        },
    };

    return formats[language][format] || format;
}

// ============================================
// Status Formatting
// ============================================

/**
 * Format booking status for display
 */
export function formatBookingStatus(status: 'pending' | 'confirmed' | 'cancelled', language: 'lv' | 'en' = 'lv'): string {
    const statuses = {
        lv: {
            pending: 'Gaida apstiprinājumu',
            confirmed: 'Apstiprināts',
            cancelled: 'Atcelts',
        },
        en: {
            pending: 'Pending',
            confirmed: 'Confirmed',
            cancelled: 'Cancelled',
        },
    };

    return statuses[language][status] || status;
}

/**
 * Get status color class
 */
export function getStatusColorClass(status: 'pending' | 'confirmed' | 'cancelled'): string {
    const colors = {
        pending: 'text-warning',
        confirmed: 'text-success',
        cancelled: 'text-error',
    };

    return colors[status] || '';
}

// ============================================
// Combined Formatting
// ============================================

/**
 * Format complete booking summary
 */
export function formatBookingSummary(booking: {
    date: string;
    time: string;
    service: string;
    consultationFormat: 'online' | 'in-person';
    price: number;
}, language: 'lv' | 'en' = 'lv'): string {
    const dateLine = formatDateWithWeekday(booking.date, language);
    const timeLine = formatTime(booking.time);
    const formatLine = formatConsultationFormat(booking.consultationFormat, language);
    const priceLine = formatPrice(booking.price);

    return `${dateLine}, ${timeLine}\n${booking.service}\n${formatLine}\n${priceLine}`;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if date is today
 */
export function isToday(dateString: string): boolean {
    if (!dateString) return false;

    try {
        const date = new Date(dateString);
        const today = new Date();

        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    } catch {
        return false;
    }
}

/**
 * Check if date is weekend
 */
export function isWeekend(dateString: string): boolean {
    if (!dateString) return false;

    try {
        const date = new Date(dateString);
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    } catch {
        return false;
    }
}

/**
 * Get relative date description (Today, Tomorrow, etc.)
 */
export function getRelativeDateDescription(dateString: string, language: 'lv' | 'en' = 'lv'): string | null {
    if (!dateString) return null;

    try {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateToCheck = new Date(date);
        dateToCheck.setHours(0, 0, 0, 0);

        if (dateToCheck.getTime() === today.getTime()) {
            return language === 'lv' ? 'Šodien' : 'Today';
        }

        if (dateToCheck.getTime() === tomorrow.getTime()) {
            return language === 'lv' ? 'Rīt' : 'Tomorrow';
        }

        return null;
    } catch {
        return null;
    }
}

// ============================================
// Exports
// ============================================

export {
    formatDate,
    formatDateLong,
    formatDateWithWeekday,
    formatTime,
    formatTimeRange,
    formatPrice,
    formatPriceWithCurrency,
    formatConsultationFormat,
    formatBookingStatus,
    formatBookingSummary,
    getStatusColorClass,
    getWeekdayName,
    isToday,
    isWeekend,
    getRelativeDateDescription,
};
