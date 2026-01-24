/**
 * API Configuration
 * Central place for all configuration constants
 */

module.exports = {
    // API URLs
    API_BASE_URL: process.env.API_BASE_URL || 'https://sofija-nutrition-api.azurewebsites.net',
    
    // Branding
    branding: {
        name: 'Sofija Ivanova',
        website: 'www.sofija-nutrition.lv',
        websiteUrl: 'https://www.sofija-nutrition.lv',
        email: 'onboarding@resend.dev' // Replace with real domain when verified
    },
    
    // Service prices in EUR
    servicePrices: {
        'initial': 65,
        'followup': 45,
        'package3': 150,
        'package5': 220,
        'cgm-diagnostic': 150,
        'consultation': 80,
        'free-consultation': 0
    },
    
    // Design system colors (used in emails and PDF)
    colors: {
        primary: '#2d5a4a',
        primaryRgb: { r: 0.176, g: 0.353, b: 0.29 },
        accent: '#d4a574',
        accentRgb: { r: 0.831, g: 0.647, b: 0.455 },
        success: '#4CAF50',
        error: '#c62828',
        warning: '#ef6c00'
    },
    
    // Payment info for invoices
    payment: {
        bank: 'Swedbank',
        iban: 'LV00HABA0000000000000' // Replace with real IBAN
    }
};
