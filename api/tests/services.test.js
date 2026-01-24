/**
 * Services Unit Tests
 * Tests for bookingRepository, emailService, pdfService
 */

const path = require('path');
const fs = require('fs');

// Mock dependencies before requiring modules
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn().mockResolvedValue({ data: { id: 'test-email-id' } })
        }
    }))
}));

jest.mock('@azure/data-tables', () => ({
    TableClient: {
        fromConnectionString: jest.fn().mockReturnValue({
            createTable: jest.fn().mockResolvedValue({}),
            createEntity: jest.fn().mockResolvedValue({}),
            getEntity: jest.fn().mockResolvedValue({
                partitionKey: 'bookings',
                rowKey: 'SN-TEST123',
                data: JSON.stringify({ id: 'SN-TEST123', name: 'Test' })
            }),
            updateEntity: jest.fn().mockResolvedValue({})
        })
    }
}));

describe('Booking Repository Service', () => {
    let bookingRepository;
    
    beforeEach(() => {
        jest.resetModules();
        // Clear environment to test in-memory fallback
        delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        bookingRepository = require('../src/services/bookingRepository');
    });

    describe('generateBookingId', () => {
        it('should generate ID with SN- prefix', () => {
            const id = bookingRepository.generateBookingId();
            expect(id).toMatch(/^SN-[A-Z0-9]+$/);
        });

        it('should generate unique IDs over time', async () => {
            const ids = new Set();
            for (let i = 0; i < 5; i++) {
                ids.add(bookingRepository.generateBookingId());
                // Small delay to ensure different timestamps
                await new Promise(r => setTimeout(r, 2));
            }
            expect(ids.size).toBe(5);
        });

        it('should generate IDs of consistent length', () => {
            const id = bookingRepository.generateBookingId();
            expect(id.length).toBeGreaterThanOrEqual(10);
            expect(id.length).toBeLessThanOrEqual(15);
        });
    });

    describe('generatePaymentToken', () => {
        it('should generate token for booking ID', () => {
            const token = bookingRepository.generatePaymentToken('SN-TEST123');
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(10);
        });

        it('should generate different tokens for different IDs', () => {
            const token1 = bookingRepository.generatePaymentToken('SN-TEST123');
            const token2 = bookingRepository.generatePaymentToken('SN-TEST456');
            expect(token1).not.toBe(token2);
        });
    });

    describe('verifyPaymentToken', () => {
        it('should verify valid token', () => {
            const bookingId = 'SN-TEST123';
            const email = 'test@example.com';
            const token = bookingRepository.generatePaymentToken(bookingId, email);
            const result = bookingRepository.verifyPaymentToken(token, bookingId, email);
            expect(result).toBe(true);
        });

        it('should reject invalid token', () => {
            const result = bookingRepository.verifyPaymentToken('invalid-token', 'SN-123', 'test@test.com');
            expect(result).toBe(false);
        });

        it('should reject empty token', () => {
            const result = bookingRepository.verifyPaymentToken('', 'SN-123', 'test@test.com');
            expect(result).toBe(false);
        });

        it('should reject token with wrong bookingId', () => {
            const bookingId = 'SN-TEST123';
            const email = 'test@example.com';
            const token = bookingRepository.generatePaymentToken(bookingId, email);
            const result = bookingRepository.verifyPaymentToken(token, 'SN-WRONG', email);
            expect(result).toBe(false);
        });

        it('should reject token with wrong email', () => {
            const bookingId = 'SN-TEST123';
            const email = 'test@example.com';
            const token = bookingRepository.generatePaymentToken(bookingId, email);
            const result = bookingRepository.verifyPaymentToken(token, bookingId, 'wrong@test.com');
            expect(result).toBe(false);
        });
    });

    describe('In-memory storage (fallback)', () => {
        it('should save booking', async () => {
            const booking = {
                id: 'SN-INMEM01',
                name: 'Test User',
                email: 'test@test.com'
            };
            await expect(bookingRepository.saveBooking(booking)).resolves.not.toThrow();
        });

        it('should retrieve saved booking', async () => {
            const booking = {
                id: 'SN-INMEM02',
                name: 'Retrieve Test',
                email: 'retrieve@test.com'
            };
            await bookingRepository.saveBooking(booking);
            const retrieved = await bookingRepository.getBooking('SN-INMEM02');
            expect(retrieved).toBeDefined();
            expect(retrieved.name).toBe('Retrieve Test');
        });

        it('should return null for non-existent booking', async () => {
            const result = await bookingRepository.getBooking('SN-NONEXISTENT');
            expect(result).toBeNull();
        });

        it('should update booking', async () => {
            const booking = {
                id: 'SN-INMEM03',
                date: '2026-01-01',
                name: 'Update Test',
                paymentConfirmed: false
            };
            await bookingRepository.saveBooking(booking);
            // updateBooking takes a full booking object, not (id, updates)
            booking.paymentConfirmed = true;
            await bookingRepository.updateBooking(booking);
            const updated = await bookingRepository.getBooking('SN-INMEM03');
            expect(updated.paymentConfirmed).toBe(true);
        });

        it('should report not using Azure storage when no connection string', () => {
            expect(bookingRepository.isUsingAzureStorage()).toBe(false);
        });
    });
});

describe('Email Service', () => {
    let emailService;
    
    beforeEach(() => {
        jest.resetModules();
        process.env.RESEND_API_KEY = 'test-api-key';
        emailService = require('../src/services/emailService');
    });

    afterEach(() => {
        delete process.env.RESEND_API_KEY;
    });

    describe('isConfigured', () => {
        it('should return true when API key is set', () => {
            expect(emailService.isConfigured()).toBe(true);
        });

        it('should return false when API key is not set', () => {
            delete process.env.RESEND_API_KEY;
            jest.resetModules();
            const freshEmailService = require('../src/services/emailService');
            expect(freshEmailService.isConfigured()).toBe(false);
        });
    });

    describe('sendClientConfirmation', () => {
        it('should accept required parameters', async () => {
            const result = await emailService.sendClientConfirmation(
                'test@test.com',
                'Test Subject',
                '<p>Test HTML</p>',
                []
            );
            expect(result).toBeDefined();
        });

        it('should accept attachments array', async () => {
            const attachments = [{
                filename: 'test.pdf',
                content: 'base64content'
            }];
            const result = await emailService.sendClientConfirmation(
                'test@test.com',
                'Test Subject',
                '<p>Test HTML</p>',
                attachments
            );
            expect(result).toBeDefined();
        });
    });

    describe('sendAdminNotification', () => {
        it('should send to admin email', async () => {
            process.env.ADMIN_EMAIL = 'admin@test.com';
            const result = await emailService.sendAdminNotification(
                'New Booking',
                '<p>Booking details</p>'
            );
            expect(result).toBeDefined();
        });
    });

    describe('sendPaymentConfirmation', () => {
        it('should send payment confirmation', async () => {
            const result = await emailService.sendPaymentConfirmation(
                'client@test.com',
                'Payment Confirmed',
                '<p>Payment received</p>'
            );
            expect(result).toBeDefined();
        });
    });
});

describe('PDF Service', () => {
    let pdfService;
    let translations;

    beforeAll(() => {
        pdfService = require('../src/services/pdfService');
        translations = require('../src/translations');
    });

    describe('Font Loading', () => {
        it('should have Roboto-Regular.ttf font file', () => {
            const fontPath = path.join(__dirname, '..', 'src', 'fonts', 'Roboto-Regular.ttf');
            expect(fs.existsSync(fontPath)).toBe(true);
        });

        it('should have Roboto-Bold.ttf font file', () => {
            const fontPath = path.join(__dirname, '..', 'src', 'fonts', 'Roboto-Bold.ttf');
            expect(fs.existsSync(fontPath)).toBe(true);
        });

        it('font files should not be empty', () => {
            const regularPath = path.join(__dirname, '..', 'src', 'fonts', 'Roboto-Regular.ttf');
            const boldPath = path.join(__dirname, '..', 'src', 'fonts', 'Roboto-Bold.ttf');
            const regularStats = fs.statSync(regularPath);
            const boldStats = fs.statSync(boldPath);
            expect(regularStats.size).toBeGreaterThan(10000); // Font files are typically >100KB
            expect(boldStats.size).toBeGreaterThan(10000);
        });
    });

    describe('generateInvoicePDF', () => {
        let t;
        let baseData;

        beforeAll(() => {
            t = translations.getTranslation('lv');
            baseData = {
                bookingId: 'SN-TEST123',
                name: 'Test User',
                email: 'test@test.com',
                phone: '+37120000000',
                date: '2026-02-01',
                time: '10:00',
                serviceName: 'Sākotnējā konsultācija',
                formatLabel: 'Attālināti (Zoom/Google Meet)',
                price: 65,
                notes: '',
                t
            };
        });

        it('should generate PDF bytes', async () => {
            const pdfBytes = await pdfService.generateInvoicePDF(baseData);
            expect(pdfBytes).toBeInstanceOf(Uint8Array);
            expect(pdfBytes.length).toBeGreaterThan(1000);
        });

        it('should generate valid PDF (starts with %PDF)', async () => {
            const pdfBytes = await pdfService.generateInvoicePDF(baseData);
            const header = String.fromCharCode(...pdfBytes.slice(0, 5));
            expect(header).toBe('%PDF-');
        });

        it('should handle Latvian diacritics in name', async () => {
            const data = { ...baseData, name: 'Jānis Bērziņš' };
            const pdfBytes = await pdfService.generateInvoicePDF(data);
            expect(pdfBytes.length).toBeGreaterThan(1000);
        });

        it('should handle Russian Cyrillic in name', async () => {
            const ruT = translations.getTranslation('ru');
            const data = {
                ...baseData,
                name: 'Иван Петров',
                serviceName: 'Первичная консультация',
                t: ruT
            };
            const pdfBytes = await pdfService.generateInvoicePDF(data);
            expect(pdfBytes.length).toBeGreaterThan(1000);
        });

        it('should handle free consultation (price = 0)', async () => {
            const data = { ...baseData, price: 0 };
            const pdfBytes = await pdfService.generateInvoicePDF(data);
            expect(pdfBytes.length).toBeGreaterThan(1000);
        });

        it('should handle notes field', async () => {
            const data = { ...baseData, notes: 'Special dietary requirements' };
            const pdfBytes = await pdfService.generateInvoicePDF(data);
            expect(pdfBytes.length).toBeGreaterThan(1000);
        });

        it('should handle very long notes (truncation)', async () => {
            const longNotes = 'A'.repeat(200);
            const data = { ...baseData, notes: longNotes };
            const pdfBytes = await pdfService.generateInvoicePDF(data);
            expect(pdfBytes.length).toBeGreaterThan(1000);
        });

        it('should handle missing phone', async () => {
            const data = { ...baseData, phone: '' };
            const pdfBytes = await pdfService.generateInvoicePDF(data);
            expect(pdfBytes.length).toBeGreaterThan(1000);
        });

        it('should generate different PDFs for different bookings', async () => {
            const pdf1 = await pdfService.generateInvoicePDF(baseData);
            const data2 = { ...baseData, bookingId: 'SN-DIFF456', name: 'Different User' };
            const pdf2 = await pdfService.generateInvoicePDF(data2);
            // PDFs should be different (different content)
            expect(pdf1.length).not.toBe(pdf2.length);
        });
    });
});

describe('Config Module', () => {
    const config = require('../src/config');

    describe('Branding', () => {
        it('should have brand name', () => {
            expect(config.branding.name).toBe('Sofija Ivanova');
        });

        it('should have website URL', () => {
            expect(config.branding.websiteUrl).toContain('http');
        });

        it('should have email domain', () => {
            expect(config.branding.email).toContain('@');
        });
    });

    describe('Colors', () => {
        it('should have primary color', () => {
            expect(config.colors.primary).toMatch(/^#[0-9a-f]{6}$/i);
        });

        it('should have accent color', () => {
            expect(config.colors.accent).toMatch(/^#[0-9a-f]{6}$/i);
        });

        it('should have RGB values for PDF', () => {
            expect(config.colors.primaryRgb).toBeDefined();
            expect(config.colors.primaryRgb.r).toBeGreaterThanOrEqual(0);
            expect(config.colors.primaryRgb.r).toBeLessThanOrEqual(1);
        });
    });

    describe('Service Prices', () => {
        it('should have all service prices defined', () => {
            const services = ['initial', 'followup', 'package3', 'package5', 'cgm-diagnostic', 'consultation', 'free-consultation'];
            services.forEach(service => {
                expect(config.servicePrices[service]).toBeDefined();
                expect(typeof config.servicePrices[service]).toBe('number');
            });
        });

        it('free-consultation should be 0', () => {
            expect(config.servicePrices['free-consultation']).toBe(0);
        });
    });

    describe('Payment Info', () => {
        it('should have bank name', () => {
            expect(config.payment.bank).toBeDefined();
            expect(config.payment.bank.length).toBeGreaterThan(0);
        });

        it('should have valid IBAN format', () => {
            expect(config.payment.iban).toMatch(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/);
        });
    });

    describe('API Base URL', () => {
        it('should have API base URL', () => {
            expect(config.API_BASE_URL).toBeDefined();
            expect(config.API_BASE_URL).toContain('http');
        });
    });
});
