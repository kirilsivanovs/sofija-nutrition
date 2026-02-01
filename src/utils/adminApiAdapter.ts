/**
 * Admin API Client Adapter
 * 
 * Bridges the TypeScript API client with browser-based admin panel
 * Provides a simpler API for admin operations
 */

import { adminApi, api, formatAPIError } from './apiClient';

// ============================================
// Booking Operations
// ============================================

/**
 * Load all bookings
 */
export async function loadBookings() {
    try {
        const response = await adminApi.getBookings();
        return response.data?.bookings || [];
    } catch (error) {
        console.error('Failed to load bookings:', formatAPIError(error));
        throw new Error(formatAPIError(error));
    }
}

/**
 * Confirm a booking
 */
export async function confirmBooking(id: string) {
    try {
        await adminApi.updateBookingStatus(id, 'confirmed');
    } catch (error) {
        throw new Error(formatAPIError(error));
    }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(id: string) {
    try {
        await adminApi.updateBookingStatus(id, 'cancelled');
    } catch (error) {
        throw new Error(formatAPIError(error));
    }
}

// ============================================
// Calendar Data Operations
// ============================================

/**
 * Load holidays for a year
 */
export async function loadHolidays(year: number) {
    try {
        const response = await adminApi.getHolidays(year);
        return response.data || {};
    } catch (error) {
        console.error('Failed to load holidays:', formatAPIError(error));
        return {};
    }
}

/**
 * Load schedule settings
 */
export async function loadSchedule() {
    try {
        const response = await adminApi.getAvailability();
        return response.data?.schedule || {};
    } catch (error) {
        console.error('Failed to load schedule:', formatAPIError(error));
        return {};
    }
}

/**
 * Load blocked dates
 */
export async function loadBlockedDates() {
    try {
        const response = await adminApi.getAvailability();
        return response.data?.blockedDates || [];
    } catch (error) {
        console.error('Failed to load blocked dates:', formatAPIError(error));
        return [];
    }
}

/**
 * Load vacation periods
 */
export async function loadVacations() {
    try {
        const response = await adminApi.getAvailability();
        return response.data?.vacationPeriods || [];
    } catch (error) {
        console.error('Failed to load vacations:', formatAPIError(error));
        return [];
    }
}

/**
 * Load all calendar data at once
 */
export async function loadCalendarData(year: number) {
    try {
        // Load availability data once (schedule, blockedDates, vacationPeriods)
        const availabilityResponse = await adminApi.getAvailability();
        const availability = availabilityResponse.data || { schedule: {}, blockedDates: [], vacationPeriods: [] };
        
        // Load bookings and holidays in parallel
        const [bookings, holidays] = await Promise.all([
            loadBookings(),
            loadHolidays(year),
        ]);

        return {
            bookings,
            holidays,
            schedule: availability.schedule,
            blockedDates: new Set(availability.blockedDates),
            vacations: availability.vacationPeriods,
        };
    } catch (error) {
        throw new Error(formatAPIError(error));
    }
}

// ============================================
// Settings Operations
// ============================================

/**
 * Save schedule settings
 */
export async function saveSchedule(schedule: Record<string, any>) {
    try {
        await adminApi.updateSchedule(schedule);
    } catch (error) {
        throw new Error(formatAPIError(error));
    }
}

/**
 * Save service settings
 */
export async function saveServices(services: Record<string, any>) {
    try {
        await adminApi.updateServices(services);
    } catch (error) {
        throw new Error(formatAPIError(error));
    }
}

/**
 * Save blocked dates
 */
export async function saveBlockedDates(dates: string[]) {
    try {
        await adminApi.updateBlockedDates(dates);
    } catch (error) {
        throw new Error(formatAPIError(error));
    }
}

/**
 * Save vacation periods
 */
export async function saveVacations(periods: Array<{ start: string; end: string }>) {
    try {
        await adminApi.updateVacations(periods);
    } catch (error) {
        throw new Error(formatAPIError(error));
    }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Find first upcoming booking
 */
export async function findFirstUpcomingBooking() {
    try {
        const bookings = await loadBookings();
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const upcomingBookings = bookings
            .filter((b: any) => b.date >= todayStr && b.status !== 'cancelled')
            .sort((a: any, b: any) => a.date.localeCompare(b.date));

        return upcomingBookings[0] || null;
    } catch (error) {
        console.error('Failed to find upcoming booking:', formatAPIError(error));
        return null;
    }
}
