/**
 * Shared constants
 * Used across frontend and backend to ensure consistency
 */

/**
 * Date format constants
 */
export const DATE_FORMATS = {
    ISO: 'yyyy-mm-dd',
    EUROPEAN: 'dd/mm/yyyy',
    US: 'mm/dd/yyyy',
    DISPLAY: 'DD/MM/YYYY',
} as const;

/**
 * Time format constants
 */
export const TIME_FORMATS = {
    TWENTY_FOUR_HOUR: 'HH:MM',
    TWELVE_HOUR: 'hh:MM AM/PM',
} as const;

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
        PATTERN: /^[a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ\s\-']+$/,
    },
    EMAIL: {
        MAX_LENGTH: 254,
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PHONE: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 15,
        PATTERN: /^\+?[0-9]{8,15}$/,
    },
    TIME_SLOT: {
        MIN_DURATION_MINUTES: 30,
        MAX_DURATION_MINUTES: 480, // 8 hours
        ALLOWED_INTERVALS: [15, 30, 60], // minutes
    },
    BOOKING: {
        MAX_ADVANCE_DAYS: 90,
        MIN_ADVANCE_HOURS: 24,
    },
} as const;

/**
 * Booking status constants
 */
export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

/**
 * Service type constants
 */
export const SERVICE_TYPES = {
    CGM_DIAGNOSTIC: 'cgm-diagnostic',
    CONSULTATION: 'consultation',
    FOLLOW_UP: 'follow-up',
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

/**
 * Day names in Latvian
 */
export const DAY_NAMES_LV = {
    MONDAY: 'Pirmdiena',
    TUESDAY: 'Otrdiena',
    WEDNESDAY: 'Trešdiena',
    THURSDAY: 'Ceturtdiena',
    FRIDAY: 'Piektdiena',
    SATURDAY: 'Sestdiena',
    SUNDAY: 'Svētdiena',
} as const;

/**
 * Day names mapping for schedule
 */
export const SCHEDULE_DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
] as const;

export type ScheduleDay = typeof SCHEDULE_DAYS[number];

/**
 * Error codes
 */
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
    PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * API response status codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
} as const;
