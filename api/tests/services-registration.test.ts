/**
 * Tests for Service Registration
 */

const { Container } = require('../src/container');

describe('Service Registration', () => {
    let testContainer;

    beforeEach(() => {
        // Create fresh container for each test
        testContainer = new Container();
    });

    describe('Auto-registration on import', () => {
        it('should auto-register services when importing services.ts', () => {
            // Import services.ts which calls registerServices() automatically
            const { container, registerServices } = require('../src/services');

            // Verify registerServices function exists
            expect(registerServices).toBeDefined();
            expect(typeof registerServices).toBe('function');

            // Verify all services are auto-registered in the global container
            expect(container.has('config')).toBe(true);
            expect(container.has('translations')).toBe(true);
            expect(container.has('bookingRepository')).toBe(true);
            expect(container.has('emailService')).toBe(true);
            expect(container.has('pdfService')).toBe(true);
            expect(container.has('holidayService')).toBe(true);
            expect(container.has('availabilityService')).toBe(true);
            expect(container.has('bookingService')).toBe(true);
        });

        it('should allow manual registerServices() call', () => {
            const { registerServices } = require('../src/services');
            
            // Create new container
            const newContainer = new Container();
            
            // registerServices should work without errors
            expect(() => registerServices()).not.toThrow();
        });

        it('should register holidayService with isLatvianHoliday', () => {
            const { container } = require('../src/services');

            const holidayService = container.resolve('holidayService');

            expect(holidayService).toBeDefined();
            expect(holidayService.isLatvianHoliday).toBeDefined();
            expect(typeof holidayService.isLatvianHoliday).toBe('function');
        });
    });

    describe('registerServices', () => {
        it('should register all core services', () => {
            // Manually register same services as services.js
            const config = require('../src/config');
            const translations = require('../src/translations');
            const bookingRepository = require('../src/services/bookingRepository');
            const emailService = require('../src/services/emailService');
            const pdfService = require('../src/services/pdfService');
            const availabilityService = require('../src/services/availabilityService');
            const bookingService = require('../src/services/bookingService');

            testContainer.register('config', () => config, { singleton: true });
            testContainer.register('translations', () => translations, { singleton: true });
            testContainer.register('bookingRepository', () => bookingRepository, { singleton: true });
            testContainer.register('emailService', () => emailService, { singleton: true });
            testContainer.register('pdfService', () => pdfService, { singleton: true });
            testContainer.register('availabilityService', () => availabilityService, { singleton: true });
            testContainer.register('bookingService', () => bookingService, { singleton: true });

            // Verify all services are registered
            expect(testContainer.has('config')).toBe(true);
            expect(testContainer.has('translations')).toBe(true);
            expect(testContainer.has('bookingRepository')).toBe(true);
            expect(testContainer.has('emailService')).toBe(true);
            expect(testContainer.has('pdfService')).toBe(true);
            expect(testContainer.has('availabilityService')).toBe(true);
            expect(testContainer.has('bookingService')).toBe(true);
        });

        it('should resolve config service', () => {
            const config = require('../src/config');
            testContainer.register('config', () => config, { singleton: true });

            const resolved = testContainer.resolve('config');

            expect(resolved.branding).toBeDefined();
            expect(resolved.branding.name).toBe('Sofija Ivanova');
        });

        it('should resolve translations service', () => {
            const translations = require('../src/translations');
            testContainer.register('translations', () => translations, { singleton: true });

            const resolved = testContainer.resolve('translations');

            expect(resolved.getTranslation).toBeDefined();
            expect(typeof resolved.getTranslation).toBe('function');
        });

        it('should resolve bookingRepository service', () => {
            const bookingRepository = require('../src/services/bookingRepository');
            testContainer.register('bookingRepository', () => bookingRepository, { singleton: true });

            const resolved = testContainer.resolve('bookingRepository');

            expect(resolved.generateBookingId).toBeDefined();
            expect(resolved.generatePaymentToken).toBeDefined();
            expect(resolved.saveBooking).toBeDefined();
        });

        it('should resolve emailService', () => {
            const emailService = require('../src/services/emailService');
            testContainer.register('emailService', () => emailService, { singleton: true });

            const resolved = testContainer.resolve('emailService');

            expect(resolved.isConfigured).toBeDefined();
            expect(resolved.sendClientConfirmation).toBeDefined();
        });

        it('should resolve bookingService', () => {
            const bookingService = require('../src/services/bookingService');
            testContainer.register('bookingService', () => bookingService, { singleton: true });

            const resolved = testContainer.resolve('bookingService');

            expect(resolved.createBooking).toBeDefined();
            expect(resolved.BookingError).toBeDefined();
            expect(resolved.BookingErrorCodes).toBeDefined();
        });

        it('should resolve availabilityService', () => {
            const availabilityService = require('../src/services/availabilityService');
            testContainer.register('availabilityService', () => availabilityService, { singleton: true });

            const resolved = testContainer.resolve('availabilityService');

            expect(resolved.getAvailability).toBeDefined();
            expect(resolved.isSlotAvailable).toBeDefined();
            expect(resolved.getServiceSettings).toBeDefined();
        });
    });

    describe('singleton behavior', () => {
        it('should return same config instance', () => {
            const config = require('../src/config');
            testContainer.register('config', () => config, { singleton: true });

            const first = testContainer.resolve('config');
            const second = testContainer.resolve('config');

            expect(first).toBe(second);
        });
    });
});
