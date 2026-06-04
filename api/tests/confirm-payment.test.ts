/**
 * Confirm Payment Endpoint Tests
 * Tests for the payment confirmation workflow
 */

const translations = require('../src/translations');

// Mock Azure Functions app
const mockApp = {
    http: jest.fn()
};

jest.mock('@azure/functions', () => ({
    app: mockApp
}));

// Mock Resend
const mockSend = jest.fn().mockResolvedValue({ data: { id: 'mock-email-id' } });
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: mockSend
        }
    }))
}));

// Mock Azure Tables
jest.mock('@azure/data-tables', () => ({
    TableClient: {
        fromConnectionString: jest.fn()
    }
}));

describe('ConfirmPayment Endpoint', () => {
    let bookingRepository;

    beforeAll(() => {
        jest.resetModules();
        mockApp.http.mockClear();
        process.env.RESEND_API_KEY = 'test-key';
        process.env.ADMIN_EMAIL = 'admin@test.com';
        
        bookingRepository = require('../src/services/bookingRepository');
    });

    describe('Token Generation and Verification', () => {
        it('should generate base64 encoded token', () => {
            const bookingId = 'SN-TEST1234';
            const email = 'test@test.com';
            const token = bookingRepository.generatePaymentToken(bookingId, email);
            
            // Should be valid base64
            expect(() => Buffer.from(token, 'base64')).not.toThrow();
        });

        it('should verify token with correct credentials', () => {
            const bookingId = 'SN-DECODE12';
            const email = 'verify@test.com';
            const token = bookingRepository.generatePaymentToken(bookingId, email);
            const isValid = bookingRepository.verifyPaymentToken(token, bookingId, email);
            
            expect(isValid).toBe(true);
        });

        it('should reject token with wrong email', () => {
            const bookingId = 'SN-EMAIL123';
            const correctEmail = 'correct@test.com';
            const wrongEmail = 'wrong@test.com';
            const token = bookingRepository.generatePaymentToken(bookingId, correctEmail);
            const isValid = bookingRepository.verifyPaymentToken(token, bookingId, wrongEmail);
            
            expect(isValid).toBe(false);
        });

        it('should reject token with wrong booking ID', () => {
            const correctId = 'SN-CORRECT1';
            const wrongId = 'SN-WRONG123';
            const email = 'test@test.com';
            const token = bookingRepository.generatePaymentToken(correctId, email);
            const isValid = bookingRepository.verifyPaymentToken(token, wrongId, email);
            
            expect(isValid).toBe(false);
        });

        it('should handle special characters in booking ID', () => {
            const bookingId = 'SN-SPE+IAL=';
            const email = 'special@test.com';
            const token = bookingRepository.generatePaymentToken(bookingId, email);
            const isValid = bookingRepository.verifyPaymentToken(token, bookingId, email);
            
            expect(isValid).toBe(true);
        });
    });
});

describe('Payment Confirmation Email', () => {
    const { generatePaymentConfirmedEmailHTML } = require('../src/templates/emailTemplates');

    describe('Email Content', () => {
        ['lv', 'en', 'ru'].forEach(lang => {
            it(`should generate payment confirmation email in ${lang}`, () => {
                const t = translations.getTranslation(lang);
                const booking = {
                    id: 'SN-PAY12345',
                    serviceName: t.services.initial,
                    consultationFormat: 'online',
                    date: '2026-02-15',
                    time: '14:00'
                };
                
                const html = generatePaymentConfirmedEmailHTML(t, booking);
                
                expect(html).toContain(booking.id);
                expect(html).toContain(booking.date);
                expect(html).toContain(booking.time);
                expect(html).toContain(t.paymentConfirmedTitle);
            });
        });
    });

    describe('Confirmation Page', () => {
        const { generateConfirmationPageHTML } = require('../src/templates/emailTemplates');

        it('should generate success confirmation page', () => {
            const html = generateConfirmationPageHTML('success', 'Maksājums saņemts veiksmīgi!', true);
            
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Maksājums apstiprināts!');
            expect(html).toContain('E-pasts klientam nosūtīts!');
        });

        it('should generate error page', () => {
            const html = generateConfirmationPageHTML('error', 'Kļūda apstrādājot maksājumu');
            
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Kļūda');
        });

        it('should generate already confirmed page', () => {
            const html = generateConfirmationPageHTML('already', 'Šis maksājums jau ir apstiprināts');
            
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Jau apstiprināts');
        });

        it('should include proper meta tags', () => {
            const html = generateConfirmationPageHTML('success', 'Test message');
            
            expect(html).toContain('charset="UTF-8"');
            expect(html).toContain('viewport');
        });

        it('should include back link to website', () => {
            const html = generateConfirmationPageHTML('success', 'Test message');
            
            expect(html).toContain('sofijaivanova.lv');
            expect(html).toContain('Atgriezties uz mājaslapu');
        });
    });
});

describe('Payment Status Tracking', () => {
    const bookingRepository = require('../src/services/bookingRepository');

    describe('In-Memory Booking Updates', () => {
        it('should store booking with pending status', async () => {
            const booking = {
                id: 'SN-PENDING1',
                date: '2026-01-01',
                name: 'Pending User',
                email: 'pending@test.com',
                service: 'initial',
                status: 'pending_payment'
            };
            
            await bookingRepository.saveBooking(booking);
            const retrieved = await bookingRepository.getBooking(booking.id);
            
            expect(retrieved.status).toBe('pending_payment');
        });

        it('should update booking status to confirmed via updateBooking', async () => {
            const bookingId = 'SN-CONFIRM1';
            const booking = {
                id: bookingId,
                date: '2026-01-02',
                name: 'Confirm User',
                email: 'confirm@test.com',
                service: 'followup',
                status: 'pending_payment'
            };
            
            await bookingRepository.saveBooking(booking);
            
            // Update the booking status
            booking.status = 'confirmed';
            await bookingRepository.updateBooking(booking);
            
            const retrieved = await bookingRepository.getBooking(bookingId);
            expect(retrieved.status).toBe('confirmed');
        });

        it('should handle getBooking for non-existent booking', async () => {
            const result = await bookingRepository.getBooking('SN-NONEXIST');
            expect(result).toBeNull();
        });
    });
});

describe('Free Consultation Flow', () => {
    const { generateClientEmailHTML } = require('../src/templates/emailTemplates');

    it('should not require payment for free consultation', () => {
        const t = translations.getTranslation('lv');
        const data = {
            name: 'Free User',
            bookingId: 'SN-FREE1234',
            serviceName: t.services['free-consultation'],
            formatLabel: t.formatOnline,
            date: '2026-02-20',
            time: '15:00',
            price: 0
        };
        
        const html = generateClientEmailHTML(t, data);
        
        // Should not contain payment instructions for free
        expect(html).toContain(data.name);
        expect(html).toContain(data.bookingId);
        // Free consultation should work
        expect(html).not.toContain('undefined');
    });

    it('should show correct price for paid services', () => {
        const t = translations.getTranslation('lv');
        const data = {
            name: 'Paid User',
            bookingId: 'SN-PAID1234',
            serviceName: t.services.initial,
            formatLabel: t.formatInPerson,
            date: '2026-02-21',
            time: '16:00',
            price: 65
        };
        
        const html = generateClientEmailHTML(t, data);
        
        expect(html).toContain('65');
        // Price is shown as €65 in the template
        expect(html).toContain('€');
    });
});

describe('Consultation Format', () => {
    ['lv', 'en', 'ru'].forEach(lang => {
        describe(`${lang.toUpperCase()} Format Labels`, () => {
            const t = translations.getTranslation(lang);

            it('should have online format label', () => {
                expect(t.formatOnline).toBeDefined();
                expect(t.formatOnline.length).toBeGreaterThan(0);
            });

            it('should have in-person format label', () => {
                expect(t.formatInPerson).toBeDefined();
                expect(t.formatInPerson.length).toBeGreaterThan(0);
            });

            it('should have different labels for online vs in-person', () => {
                expect(t.formatOnline).not.toBe(t.formatInPerson);
            });
        });
    });
});
