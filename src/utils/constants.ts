/**
 * Shared Constants
 * 
 * DRY Principle: Single source of truth for all constants
 * Used across the application to eliminate duplication
 */

// ============================================
// API Configuration
// ============================================

export const API_CONFIG = {
    BASE_URL: import.meta.env.PUBLIC_API_BASE_URL || '',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
} as const;

// ============================================
// API Endpoints
// ============================================

export const ENDPOINTS = {
    // Public endpoints
    AVAILABILITY: '/api/availability',
    BOOKINGS: '/api/bookings',
    CONFIRM_PAYMENT: '/api/confirm-payment',
    
    // Admin endpoints
    ADMIN: {
        BOOKINGS: '/api/dashboard/bookings',
        SCHEDULE: '/api/dashboard/schedule',
        SERVICES: '/api/dashboard/services',
        BLOCKED_DATES: '/api/dashboard/blocked-dates',
        VACATIONS: '/api/dashboard/vacations',
        HOLIDAYS: '/api/dashboard/holidays',
        SETTINGS: '/api/dashboard/settings',
    },
} as const;

// ============================================
// Booking Configuration
// ============================================

export const BOOKING_CONFIG = {
    MIN_BOOKING_NOTICE_HOURS: 24,
    MAX_BOOKING_DAYS_AHEAD: 90,
    DEFAULT_CONSULTATION_DURATION: 60, // minutes
    SLOT_INTERVAL: 30, // minutes
} as const;

// ============================================
// Service IDs
// ============================================

export const SERVICE_IDS = {
    INITIAL: 'initial',
    FOLLOWUP: 'followup',
    PACKAGE_3: 'package3',
    PACKAGE_5: 'package5',
    CONSULTATION: 'consultation',
} as const;

// ============================================
// Status Values
// ============================================

export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
} as const;

export const CONSULTATION_FORMAT = {
    ONLINE: 'online',
    IN_PERSON: 'in-person',
} as const;

// ============================================
// Date/Time Constants
// ============================================

export const DATE_FORMAT = {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'DD.MM.YYYY',
    DISPLAY_LONG: 'DD. MMMM YYYY',
} as const;

export const TIME_FORMAT = {
    DISPLAY: 'HH:MM',
} as const;

export const WEEKDAYS = {
    LV: ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'],
    LV_SHORT: ['Sv', 'P', 'O', 'T', 'C', 'Pk', 'S'],
    EN: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    EN_SHORT: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const;

export const MONTHS = {
    LV: [
        'Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs',
        'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'
    ],
    EN: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ],
} as const;

// ============================================
// Validation Rules
// ============================================

export const VALIDATION = {
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
        PATTERN: /^[a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ\s\-']+$/,
        ERROR_MESSAGE: 'Lūdzu, ievadiet derīgu vārdu',
    },
    EMAIL: {
        MAX_LENGTH: 254,
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        ERROR_MESSAGE: 'Lūdzu, ievadiet derīgu e-pasta adresi',
    },
    PHONE: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 15,
        PATTERN: /^[\d\s\+\-\(\)]+$/,
        ERROR_MESSAGE: 'Lūdzu, ievadiet derīgu tālruņa numuru',
    },
    MESSAGE: {
        MAX_LENGTH: 500,
    },
} as const;

// ============================================
// UI Constants
// ============================================

export const UI = {
    ANIMATION_DURATION: 300, // ms
    TOAST_DURATION: 5000, // ms
    MODAL_Z_INDEX: 1000,
    MOBILE_BREAKPOINT: 768, // px
    TABLET_BREAKPOINT: 1024, // px
} as const;

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
    LANGUAGE: 'preferred_language',
    THEME: 'preferred_theme',
    COOKIE_CONSENT: 'cookie_consent',
} as const;

// ============================================
// Admin Constants
// ============================================

export const ADMIN = {
    AUTH_COOKIE: 'StaticWebAppsAuthCookie',
    SESSION_TIMEOUT: 3600000, // 1 hour in ms
    CALENDAR_MONTHS_TO_SHOW: 3,
    TABLE_PAGE_SIZE: 50,
} as const;

// ============================================
// Color Constants
// ============================================

export const COLORS = {
    PRIMARY: '#2d4e3f',
    PRIMARY_DARK: '#1f3529',
    SECONDARY: '#8c5e3a',
    ACCENT: '#c17943',
    SUCCESS: '#22c55e',
    WARNING: '#facc15',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
    MUTED: '#6b7280',
} as const;

// ============================================
// Error Codes
// ============================================

export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SLOT_TAKEN: 'SLOT_TAKEN',
    SLOT_LOCKED: 'SLOT_LOCKED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
} as const;

// ============================================
// Type Exports
// ============================================

export type ServiceId = typeof SERVICE_IDS[keyof typeof SERVICE_IDS];
export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];
export type ConsultationFormat = typeof CONSULTATION_FORMAT[keyof typeof CONSULTATION_FORMAT];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
