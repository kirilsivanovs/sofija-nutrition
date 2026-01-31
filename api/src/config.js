/**
 * API Configuration - Legacy compatibility layer
 * 
 * @deprecated Use require('./config') instead for new code
 * This file re-exports from the new centralized config for backward compatibility
 */

const config = require('./config/index');

module.exports = {
    // Legacy flat exports
    API_BASE_URL: config.API_BASE_URL,
    branding: config.branding,
    servicePrices: config.servicePrices,
    colors: config.colors,
    payment: config.payment,
    
    // New structured exports
    ...config
};
