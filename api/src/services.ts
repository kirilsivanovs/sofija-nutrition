/**
 * Service Registration
 * 
 * Registers all application services in the DI container.
 * Import this file once at application startup.
 */

import { container } from './container';

// Services
import * as bookingRepository from './services/bookingRepository';
import * as emailService from './services/emailService';
import * as pdfService from './services/pdfService';
import { isLatvianHoliday } from './services/latvianHolidays';

// Import service classes/functions
import * as availabilityService from './services/availabilityService';
import * as bookingService from './services/bookingService';

// Utils
import translations from './translations';
import config from './config';

export interface HolidayService {
    isLatvianHoliday: typeof isLatvianHoliday;
}

/**
 * Register all services
 */
export function registerServices(): void {
    // Configuration (singleton)
    container.register('config', () => config, { singleton: true });
    container.register('translations', () => translations, { singleton: true });

    // Low-level services (singletons)
    container.register('bookingRepository', () => bookingRepository, { singleton: true });
    container.register('emailService', () => emailService, { singleton: true });
    container.register('pdfService', () => pdfService, { singleton: true });
    container.register<HolidayService>('holidayService', () => ({ isLatvianHoliday }), { singleton: true });

    // High-level services (singletons)
    container.register('availabilityService', () => availabilityService, { singleton: true });
    container.register('bookingService', () => bookingService, { singleton: true });
}

// Auto-register on import
registerServices();

export { container };
