/**
 * Service Registration
 * 
 * Registers all application services in the DI container.
 * Import this file once at application startup.
 */

const { container } = require('./container');

// Services
const bookingRepository = require('./services/bookingRepository');
const emailService = require('./services/emailService');
const pdfService = require('./services/pdfService');
const { isLatvianHoliday } = require('./services/latvianHolidays');
const featureFlags = require('./services/featureFlags');

// Import service classes/functions
const availabilityService = require('./services/availabilityService');
const bookingService = require('./services/bookingService');

// Utils
const translations = require('./translations');
const config = require('./config');

/**
 * Register all services
 */
function registerServices() {
    // Configuration (singleton)
    container.register('config', () => config, { singleton: true });
    container.register('translations', () => translations, { singleton: true });

    // Low-level services (singletons)
    container.register('bookingRepository', () => bookingRepository, { singleton: true });
    container.register('emailService', () => emailService, { singleton: true });
    container.register('pdfService', () => pdfService, { singleton: true });
    container.register('featureFlags', () => featureFlags, { singleton: true });
    container.register('holidayService', () => ({ isLatvianHoliday }), { singleton: true });

    // High-level services (singletons)
    container.register('availabilityService', () => availabilityService, { singleton: true });
    container.register('bookingService', () => bookingService, { singleton: true });
}

// Auto-register on import
registerServices();

module.exports = { container, registerServices };
