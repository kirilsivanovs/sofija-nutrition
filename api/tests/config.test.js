/**
 * Tests for centralized configuration
 */

const config = require('../src/config');

describe('Centralized Configuration', () => {
    describe('Environment', () => {
        it('should have env configuration', () => {
            expect(config.env).toBeDefined();
            expect(typeof config.env.isProduction).toBe('boolean');
            expect(typeof config.env.isDevelopment).toBe('boolean');
            expect(typeof config.env.isTest).toBe('boolean');
        });

        it('should detect test environment', () => {
            expect(config.env.isTest).toBe(true);
        });

        it('should have API base URL', () => {
            expect(config.env.apiBaseUrl).toBeDefined();
            expect(config.env.apiBaseUrl).toMatch(/^https?:\/\//);
        });
    });

    describe('Tables', () => {
        it('should have all table names defined', () => {
            expect(config.tables).toBeDefined();
            expect(config.tables.bookings).toBe('bookings');
            expect(config.tables.settings).toBe('adminSettings');
            expect(config.tables.services).toBe('Services');
            expect(config.tables.featureFlags).toBe('FeatureFlags');
            expect(config.tables.locks).toBe('slotLocks');
        });
    });

    describe('Cache TTLs', () => {
        it('should have cache configuration', () => {
            expect(config.cache).toBeDefined();
            expect(config.cache.servicesTtlMs).toBe(5 * 60 * 1000);
            expect(config.cache.featureFlagsTtlMs).toBe(2 * 60 * 1000);
            expect(config.cache.scheduleTtlMs).toBe(5 * 60 * 1000);
        });

        it('should have reasonable TTL values', () => {
            // TTLs should be between 1 minute and 1 hour
            const minTtl = 60 * 1000;
            const maxTtl = 60 * 60 * 1000;
            
            expect(config.cache.servicesTtlMs).toBeGreaterThanOrEqual(minTtl);
            expect(config.cache.servicesTtlMs).toBeLessThanOrEqual(maxTtl);
            expect(config.cache.featureFlagsTtlMs).toBeGreaterThanOrEqual(minTtl);
            expect(config.cache.featureFlagsTtlMs).toBeLessThanOrEqual(maxTtl);
        });
    });

    describe('Booking Configuration', () => {
        it('should have booking configuration', () => {
            expect(config.booking).toBeDefined();
            expect(config.booking.lockTtlMs).toBe(30000);
            expect(config.booking.defaultSlotDuration).toBe(60);
        });

        it('should have reasonable lock TTL', () => {
            // Lock should be between 10 seconds and 2 minutes
            expect(config.booking.lockTtlMs).toBeGreaterThanOrEqual(10000);
            expect(config.booking.lockTtlMs).toBeLessThanOrEqual(120000);
        });
    });

    describe('Schedule Configuration', () => {
        it('should have default working hours', () => {
            expect(config.schedule).toBeDefined();
            expect(config.schedule.defaultWorkingHours).toBeDefined();
        });

        it('should have all days of week', () => {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            days.forEach(day => {
                expect(config.schedule.defaultWorkingHours[day]).toBeDefined();
                expect(config.schedule.defaultWorkingHours[day]).toHaveProperty('enabled');
                expect(config.schedule.defaultWorkingHours[day]).toHaveProperty('start');
                expect(config.schedule.defaultWorkingHours[day]).toHaveProperty('end');
            });
        });

        it('should have weekdays enabled by default', () => {
            expect(config.schedule.defaultWorkingHours.monday.enabled).toBe(true);
            expect(config.schedule.defaultWorkingHours.friday.enabled).toBe(true);
        });

        it('should have weekends disabled by default', () => {
            expect(config.schedule.defaultWorkingHours.saturday.enabled).toBe(false);
            expect(config.schedule.defaultWorkingHours.sunday.enabled).toBe(false);
        });

        it('should have timezone', () => {
            expect(config.schedule.timezone).toBe('Europe/Riga');
        });
    });

    describe('Rate Limits', () => {
        it('should have rate limit configuration', () => {
            expect(config.rateLimits).toBeDefined();
            expect(config.rateLimits.createBooking).toBeDefined();
            expect(config.rateLimits.confirmPayment).toBeDefined();
            expect(config.rateLimits.getAvailability).toBeDefined();
            expect(config.rateLimits.admin).toBeDefined();
            expect(config.rateLimits.default).toBeDefined();
        });

        it('should have stricter limits for critical endpoints', () => {
            expect(config.rateLimits.createBooking.maxRequests)
                .toBeLessThan(config.rateLimits.getAvailability.maxRequests);
        });

        it('should have required properties for each limit', () => {
            const limits = ['createBooking', 'confirmPayment', 'getAvailability', 'admin', 'default'];
            limits.forEach(limit => {
                expect(config.rateLimits[limit]).toHaveProperty('windowMs');
                expect(config.rateLimits[limit]).toHaveProperty('maxRequests');
                expect(config.rateLimits[limit]).toHaveProperty('message');
            });
        });
    });

    describe('Branding', () => {
        it('should have branding configuration', () => {
            expect(config.branding).toBeDefined();
            expect(config.branding.name).toBeDefined();
            expect(config.branding.website).toBeDefined();
            expect(config.branding.websiteUrl).toMatch(/^https:\/\//);
            expect(config.branding.email).toBeDefined();
        });
    });

    describe('Payment', () => {
        it('should have payment configuration', () => {
            expect(config.payment).toBeDefined();
            expect(config.payment.bank).toBeDefined();
            expect(config.payment.iban).toBeDefined();
            expect(config.payment.currency).toBe('EUR');
        });

        it('should have valid IBAN format', () => {
            expect(config.payment.iban).toMatch(/^LV\d{2}[A-Z]{4}\d{13}$/);
        });
    });

    describe('Service Prices', () => {
        it('should have service prices', () => {
            expect(config.servicePrices).toBeDefined();
            expect(Object.keys(config.servicePrices).length).toBeGreaterThan(0);
        });

        it('should have free consultation at 0', () => {
            expect(config.servicePrices['free-consultation']).toBe(0);
        });

        it('should have positive prices for paid services', () => {
            Object.entries(config.servicePrices).forEach(([service, price]) => {
                if (service !== 'free-consultation') {
                    expect(price).toBeGreaterThan(0);
                }
            });
        });
    });

    describe('Colors', () => {
        it('should have color configuration', () => {
            expect(config.colors).toBeDefined();
            expect(config.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(config.colors.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('should have RGB values for PDF', () => {
            expect(config.colors.primaryRgb).toBeDefined();
            expect(config.colors.primaryRgb.r).toBeDefined();
            expect(config.colors.primaryRgb.g).toBeDefined();
            expect(config.colors.primaryRgb.b).toBeDefined();
        });
    });

    describe('Default Services', () => {
        it('should have default services', () => {
            expect(config.defaultServices).toBeDefined();
            expect(Array.isArray(config.defaultServices)).toBe(true);
            expect(config.defaultServices.length).toBeGreaterThan(0);
        });

        it('should have required properties for each service', () => {
            config.defaultServices.forEach(service => {
                expect(service).toHaveProperty('id');
                expect(service).toHaveProperty('duration');
                expect(service).toHaveProperty('name');
                expect(service.name).toHaveProperty('lv');
                expect(service.name).toHaveProperty('ru');
                expect(service.name).toHaveProperty('en');
            });
        });
    });

    describe('Valid Service IDs', () => {
        it('should have valid service IDs list', () => {
            expect(config.validServiceIds).toBeDefined();
            expect(Array.isArray(config.validServiceIds)).toBe(true);
            expect(config.validServiceIds).toContain('free-consultation');
            expect(config.validServiceIds).toContain('consultation');
        });

        it('should match service prices keys', () => {
            Object.keys(config.servicePrices).forEach(serviceId => {
                expect(config.validServiceIds).toContain(serviceId);
            });
        });
    });

    describe('Legacy Compatibility', () => {
        it('should have API_BASE_URL for backward compatibility', () => {
            expect(config.API_BASE_URL).toBeDefined();
            expect(config.API_BASE_URL).toBe(config.env.apiBaseUrl);
        });

        it('should have getConfig helper', () => {
            expect(typeof config.getConfig).toBe('function');
            const fullConfig = config.getConfig();
            expect(fullConfig.env).toBeDefined();
            expect(fullConfig.tables).toBeDefined();
            expect(fullConfig.booking).toBeDefined();
        });
    });
});
