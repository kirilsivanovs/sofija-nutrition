/**
 * Centralized Configuration
 * Single source of truth for all API configuration values
 * 
 * @module config
 */

import type {
  EnvConfig,
  TableNames,
  CacheConfig,
  BookingConfig,
  ScheduleConfig,
  RateLimitsConfig,
  BrandingConfig,
  PaymentConfig,
  ServicePrices,
  ColorsConfig,
  DefaultService,
  DaySchedule
} from '../types';

// ============================================
// Environment Configuration
// ============================================

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  apiBaseUrl: process.env.API_BASE_URL || 'https://sofija-nutrition-api.azurewebsites.net'
};

// ============================================
// Azure Table Storage Configuration
// ============================================

export const tables: TableNames = {
  bookings: 'bookings',
  settings: 'adminSettings',
  services: 'Services',
  servicesHistory: 'ServicesHistory',
  featureFlags: 'FeatureFlags',
  locks: 'slotLocks'
};

// ============================================
// Cache Configuration
// ============================================

export const cache: CacheConfig = {
  // Service settings cache TTL (5 minutes)
  servicesTtlMs: 5 * 60 * 1000,
  
  // Feature flags cache TTL (2 minutes - shorter for faster response to changes)  
  featureFlagsTtlMs: 2 * 60 * 1000,
  
  // Schedule cache TTL (5 minutes)
  scheduleTtlMs: 5 * 60 * 1000
};

// ============================================
// Booking Configuration
// ============================================

export const booking: BookingConfig = {
  // Slot lock TTL (30 seconds) - prevents double booking during payment
  slotLockDurationMs: 30000,
  lockTtlMs: 30000,
  
  // Default slot duration in minutes
  defaultSlotDuration: 60,
  
  // Confirmation code length
  confirmationCodeLength: 6,
  
  // Maximum bookings per day per service
  maxBookingsPerDay: 10,
  
  // Minimum advance booking (hours)
  minBookingAdvanceHours: 2,
  
  // Maximum advance booking (days)
  maxBookingAdvanceDays: 90
};

// ============================================
// Working Hours Configuration
// ============================================

export const schedule: ScheduleConfig = {
  timezone: 'Europe/Riga',
  slotDurationMinutes: 60,
  breakBetweenSlotsMinutes: 0,
  defaultWorkingHours: {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '09:00', end: '14:00' },
    sunday: { enabled: false, start: '09:00', end: '14:00' }
  }
};

// ============================================
// Rate Limiting Configuration
// ============================================

export const rateLimits: RateLimitsConfig = {
  // Booking creation - strict limits
  createBooking: {
    windowMs: 60000,      // 1 minute
    maxRequests: 5,       // 5 bookings per minute per IP
    message: 'Too many booking attempts. Please try again in a minute.'
  },
  
  // Payment confirmation
  confirmPayment: {
    windowMs: 60000,
    maxRequests: 10,
    message: 'Too many confirmation attempts.'
  },
  
  // Availability check - higher limit for calendar updates
  getAvailability: {
    windowMs: 60000,
    maxRequests: 60,      // 60 requests per minute
    message: 'Too many requests. Please slow down.'
  },
  
  // Admin endpoints (protected by auth)
  admin: {
    windowMs: 60000,
    maxRequests: 100,
    message: 'Rate limit exceeded for admin operations.'
  },
  
  // Default fallback
  default: {
    windowMs: 60000,
    maxRequests: 100,
    message: 'Too many requests.'
  }
};

// ============================================
// Branding Configuration
// ============================================

export const branding: BrandingConfig = {
  name: 'Sofija Ivanova',
  website: 'www.sofija-nutrition.lv',
  websiteUrl: 'https://www.sofija-nutrition.lv',
  email: 'onboarding@resend.dev', // Replace with real domain when verified
  emailDomain: 'resend.dev',
  phone: '+371 20000000',
  address: 'Rīga, Latvija',
  registrationNumber: '75650061277'
};

// ============================================
// Payment Configuration
// ============================================

export const payment: PaymentConfig = {
  bank: 'Swedbank',
  bankName: 'Swedbank',
  iban: 'LV00HABA0000000000000', // Replace with real IBAN
  swift: 'HABALV22',
  recipientName: 'Sofija Ivanova',
  currency: 'EUR'
};

// ============================================
// Service Prices (EUR)
// ============================================

export const servicePrices: ServicePrices = {
  'initial': 65,
  'followup': 45,
  'package3': 150,
  'package5': 220,
  'cgm-diagnostic': 150,
  'consultation': 80,
  'free-consultation': 0
};

// ============================================
// Design Colors (for emails and PDF)
// ============================================

export const colors: ColorsConfig = {
  primary: '#2d5a4a',
  primaryRgb: { r: 0.176, g: 0.353, b: 0.29 },
  secondary: '#f5f5f5',
  accent: '#d4a574',
  accentRgb: { r: 0.831, g: 0.647, b: 0.455 },
  success: '#4CAF50',
  error: '#c62828',
  warning: '#ef6c00'
};

// ============================================
// Default Services (fallback when DB unavailable)
// ============================================

export const defaultServices: DefaultService[] = [
  {
    id: 'cgm-diagnostic',
    duration: 60,
    name: {
      lv: 'CGM diagnostika (60 min)',
      ru: 'CGM-диагностика (60 мин)',
      en: 'CGM Diagnostic (60 min)'
    }
  },
  {
    id: 'consultation',
    duration: 60,
    name: {
      lv: 'Uztura konsultācija (60 min)',
      ru: 'Консультация по питанию (60 мин)',
      en: 'Nutrition Consultation (60 min)'
    }
  },
  {
    id: 'free-consultation',
    duration: 15,
    name: {
      lv: 'Bezmaksas iepazīšanās saruna (15 min)',
      ru: 'Бесплатная ознакомительная беседа (15 мин)',
      en: 'Free Introduction Call (15 min)'
    }
  }
];

// ============================================
// Valid Service IDs
// ============================================

export const validServiceIds: readonly string[] = [
  'initial',
  'followup', 
  'package3',
  'package5',
  'cgm-diagnostic',
  'consultation',
  'free-consultation'
] as const;

// ============================================
// Legacy Exports (CommonJS compatibility)
// ============================================

// Config object for default export
const config = {
  env,
  tables,
  cache,
  booking,
  schedule,
  rateLimits,
  branding,
  payment,
  servicePrices,
  colors,
  defaultServices,
  validServiceIds,
  
  // Legacy compatibility
  API_BASE_URL: env.apiBaseUrl,
  
  // Helper to get full config object
  getConfig() {
    return {
      env,
      tables,
      cache,
      booking,
      schedule,
      rateLimits,
      branding,
      payment,
      servicePrices,
      colors,
      defaultServices,
      validServiceIds
    };
  }
};

// Default export for ES modules
export default config;

// For backward compatibility with existing JS code
module.exports = config;
