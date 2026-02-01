/**
 * Shared TypeScript types for frontend
 * Ensures type safety across the application
 */

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

// ============================================
// Booking Types
// ============================================

export interface BookingData {
    serviceId: string;
    date: string;
    time: string;
    consultationFormat: 'online' | 'in-person';
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    message?: string;
    language: 'lv' | 'ru' | 'en';
}

export interface AdminBooking {
    id: string;
    partitionKey: string;
    rowKey: string;
    service: string;
    date: string;
    time: string;
    name: string;
    email: string;
    phone?: string;
    consultationFormat: 'online' | 'in-person';
    status: 'pending' | 'confirmed' | 'cancelled';
    price: number;
    message?: string;
    createdAt: string;
}

// ============================================
// Availability Types
// ============================================

export interface AvailabilityData {
    date: string;
    slots: TimeSlot[];
    isHoliday?: boolean;
    holidayName?: string;
    isWeekend?: boolean;
    isVacation?: boolean;
    isBlocked?: boolean;
}

export interface TimeSlot {
    time: string;
    available: boolean;
    booked?: boolean;
}

// ============================================
// Schedule Types
// ============================================

export interface DaySchedule {
    enabled: boolean;
    start: string;
    end: string;
}

export interface WeekSchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

// ============================================
// Service Types
// ============================================

export interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
    description?: string;
    enabled: boolean;
}

// ============================================
// Vacation Types
// ============================================

export interface VacationPeriod {
    start: string;
    end: string;
    description?: string;
}

// ============================================
// Translation Types
// ============================================

export type Language = 'lv' | 'ru' | 'en';

export interface Translations {
    calendar: {
        title: string;
        selectDate: string;
        selectTime: string;
        noSlots: string;
        weekdays: string[];
        months: string[];
        today: string;
        selectedLabel: string;
    };
    form: {
        serviceLabel: string;
        formatLabel: string;
        nameLabel: string;
        emailLabel: string;
        phoneLabel: string;
        messageLabel: string;
        submitButton: string;
    };
    messages: {
        success: string;
        error: string;
        loading: string;
    };
}
