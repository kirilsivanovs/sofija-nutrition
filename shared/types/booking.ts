/**
 * Booking-related TypeScript types
 * Shared between frontend and backend
 */

import type { BookingStatus, ServiceType } from '../utils/constants';

/**
 * Main booking entity
 */
export interface Booking {
    id: string;
    date: string; // yyyy-mm-dd
    time: string; // HH:MM
    service: ServiceType;
    name: string;
    email: string;
    phone: string;
    message?: string;
    status: BookingStatus;
    paymentConfirmed: boolean;
    paymentIntentId?: string;
    createdAt: string; // ISO timestamp
    updatedAt?: string; // ISO timestamp
}

/**
 * Booking creation data (without system-generated fields)
 */
export interface CreateBookingData {
    date: string;
    time: string;
    service: ServiceType;
    name: string;
    email: string;
    phone: string;
    message?: string;
}

/**
 * Booking update data (partial)
 */
export interface UpdateBookingData {
    status?: BookingStatus;
    paymentConfirmed?: boolean;
    paymentIntentId?: string;
}

/**
 * Booking filter criteria
 */
export interface BookingFilters {
    startDate?: string;
    endDate?: string;
    status?: BookingStatus;
    service?: ServiceType;
    email?: string;
}

/**
 * Booking statistics
 */
export interface BookingStats {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    byService: Record<ServiceType, number>;
}

/**
 * Time slot availability
 */
export interface TimeSlot {
    time: string; // HH:MM
    available: boolean;
    reason?: 'booked' | 'outside-hours' | 'blocked' | 'holiday' | 'vacation';
}

/**
 * Day availability
 */
export interface DayAvailability {
    date: string; // yyyy-mm-dd
    available: boolean;
    slots: TimeSlot[];
    reason?: 'weekend' | 'holiday' | 'vacation' | 'blocked' | 'fully-booked';
}
