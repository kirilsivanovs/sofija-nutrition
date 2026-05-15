/**
 * Mock constants for frontend-ts tests
 * Avoids import.meta.env issue in Jest
 */

export const API_CONFIG = {
  BASE_URL: '',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const ENDPOINTS = {
  AVAILABILITY: '/api/availability',
  BOOKINGS: '/api/bookings',
  CONFIRM_PAYMENT: '/api/confirm-payment',
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

export const BOOKING_CONFIG = {
  MIN_BOOKING_NOTICE_HOURS: 24,
  MAX_BOOKING_DAYS_AHEAD: 90,
  DEFAULT_CONSULTATION_DURATION: 60,
  SLOT_INTERVAL: 30,
} as const;

export const SERVICE_IDS = {
  INITIAL: 'initial',
  FOLLOWUP: 'followup',
  PACKAGE_3: 'package3',
  PACKAGE_5: 'package5',
  CGM_DIAGNOSTIC: 'cgm-diagnostic',
  CONSULTATION: 'consultation',
  FREE_CONSULTATION: 'free-consultation',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

export const CONSULTATION_FORMAT = {
  ONLINE: 'online',
  IN_PERSON: 'in-person',
} as const;

export const DATE_FORMAT = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD.MM.YYYY',
  DISPLAY_LONG: 'DD. MMMM YYYY',
} as const;

export const TIME_FORMAT = { DISPLAY: 'HH:MM' } as const;

export const WEEKDAYS = {
  LV: ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'],
  LV_SHORT: ['Sv', 'P', 'O', 'T', 'C', 'Pk', 'S'],
  EN: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  EN_SHORT: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const;

export const MONTHS = {
  LV: ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'],
  EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
} as const;

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

export const UI = {
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 5000,
  MODAL_Z_INDEX: 1000,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;

export const STORAGE_KEYS = {
  LANGUAGE: 'preferred_language',
  THEME: 'preferred_theme',
  COOKIE_CONSENT: 'cookie_consent',
} as const;

export const ADMIN = {
  AUTH_COOKIE: 'StaticWebAppsAuthCookie',
  SESSION_TIMEOUT: 3600000,
  CALENDAR_MONTHS_TO_SHOW: 3,
  TABLE_PAGE_SIZE: 50,
} as const;
