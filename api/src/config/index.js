/**
 * Centralized Configuration
 * Single source of truth for all API configuration values
 * 
 * @module config
 */

// ============================================
// Environment Configuration
// ============================================

const env = {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    
    // Azure Storage
    azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    
    // API
    apiBaseUrl: process.env.API_BASE_URL || 'https://sofija-nutrition-api.azurewebsites.net'
};

// ============================================
// Azure Table Storage Configuration
// ============================================

const tables = {
    bookings: 'bookings',
    settings: 'adminSettings',
    services: 'Services',
    featureFlags: 'FeatureFlags',
    locks: 'slotLocks'
};

// ============================================
// Cache Configuration
// ============================================

const cache = {
    // Service settings cache TTL (5 minutes)
    servicesTtlMs: 5 * 60 * 1000,
    
    // Feature flags cache TTL (2 minutes - shorter for faster response to changes)  
    featureFlagsTtlMs: 2 * 60 * 1000,
    
    // Schedule settings cache TTL (5 minutes)
    scheduleTtlMs: 5 * 60 * 1000
};

// ============================================
// Booking Configuration
// ============================================

const booking = {
    // Slot lock TTL (30 seconds) - prevents double booking during payment
    lockTtlMs: 30000,
    
    // Default slot duration in minutes
    defaultSlotDuration: 60,
    
    // Minimum advance booking (hours)
    minAdvanceHours: 2,
    
    // Maximum advance booking (days)
    maxAdvanceDays: 90
};

// ============================================
// Working Hours Configuration
// ============================================

const schedule = {
    defaultWorkingHours: {
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: false, start: '09:00', end: '14:00' },
        sunday: { enabled: false, start: '09:00', end: '14:00' }
    },
    
    // Timezone
    timezone: 'Europe/Riga'
};

// ============================================
// Rate Limiting Configuration
// ============================================

const rateLimits = {
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

const branding = {
    name: 'Sofija Ivanova',
    website: 'www.sofija-nutrition.lv',
    websiteUrl: 'https://www.sofija-nutrition.lv',
    email: 'onboarding@resend.dev' // Replace with real domain when verified
};

// ============================================
// Payment Configuration
// ============================================

const payment = {
    bank: 'Swedbank',
    iban: 'LV00HABA0000000000000', // Replace with real IBAN
    currency: 'EUR'
};

// ============================================
// Service Prices (EUR)
// ============================================

const servicePrices = {
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

const colors = {
    primary: '#2d5a4a',
    primaryRgb: { r: 0.176, g: 0.353, b: 0.29 },
    accent: '#d4a574',
    accentRgb: { r: 0.831, g: 0.647, b: 0.455 },
    success: '#4CAF50',
    error: '#c62828',
    warning: '#ef6c00'
};

// ============================================
// Default Services (fallback when DB unavailable)
// ============================================

const defaultServices = [
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

const validServiceIds = [
    'initial',
    'followup', 
    'package3',
    'package5',
    'cgm-diagnostic',
    'consultation',
    'free-consultation'
];

// ============================================
// Export Configuration
// ============================================

module.exports = {
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
    
    // Legacy compatibility - flat exports matching old config.js
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
