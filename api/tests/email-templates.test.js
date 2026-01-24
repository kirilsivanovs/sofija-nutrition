/**
 * Email Templates Unit Tests
 * Tests for all email template generation
 */

const {
    generateClientEmailHTML,
    generateAdminEmailHTML,
    generatePaymentConfirmedEmailHTML,
    generateConfirmationPageHTML
} = require('../src/templates/emailTemplates');

const translations = require('../src/translations');
const config = require('../src/config');

describe('Email Templates', () => {
    describe('generateClientEmailHTML', () => {
        const t = translations.getTranslation('lv');
        const displayData = {
            name: 'Jānis',
            bookingId: 'SN-TEST123',
            serviceName: 'Sākotnējā konsultācija',
            formatLabel: 'Attālināti (Zoom/Google Meet)',
            date: '2026-02-01',
            time: '10:00',
            price: 65
        };

        it('should generate complete HTML', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('</html>');
        });

        it('should include UTF-8 charset for diacritics', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('charset="UTF-8"');
        });

        it('should include viewport meta for mobile', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('viewport');
        });

        it('should use max-width 600px for mobile', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('max-width: 600px');
        });

        it('should show brand name in header', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain(config.branding.name);
        });

        it('should have gradient background in header', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('linear-gradient');
        });

        it('should include gold accent line', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain(config.colors.accent);
        });

        it('should include website link in footer', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain(config.branding.website);
        });

        it('should include copyright in footer', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('©');
        });

        it('should include booking details', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('SN-TEST123');
            expect(html).toContain('Sākotnējā konsultācija');
            expect(html).toContain('2026-02-01');
            expect(html).toContain('10:00');
        });

        it('should include greeting with name', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('Jānis');
        });

        it('should show price', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('€65');
        });

        it('should show FREE for zero price', () => {
            const freeData = { ...displayData, price: 0 };
            const html = generateClientEmailHTML(t, freeData);
            expect(html).toContain('FREE');
        });

        it('should include invoice attachment note', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain(t.emailInvoiceAttached);
        });

        it('should use table role=presentation for accessibility', () => {
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('role="presentation"');
        });

        it('should use inline styles for email compatibility', () => {
            const html = generateClientEmailHTML(t, displayData);
            // Should use inline styles, minimal class usage
            expect((html.match(/class="/g) || []).length).toBeLessThan(5);
        });
    });

    describe('generateAdminEmailHTML', () => {
        const booking = {
            id: 'SN-ADMIN123',
            name: 'Client Name',
            email: 'client@test.com',
            phone: '+37120000000',
            serviceName: 'Sākotnējā konsultācija',
            consultationFormat: 'online',
            date: '2026-02-01',
            time: '10:00',
            price: 65,
            language: 'lv'
        };
        const confirmUrl = 'https://example.com/confirm?token=abc123';

        it('should generate admin notification', () => {
            const html = generateAdminEmailHTML(booking, confirmUrl);
            expect(html).toContain('<!DOCTYPE html>');
        });

        it('should show client details', () => {
            const html = generateAdminEmailHTML(booking, confirmUrl);
            expect(html).toContain('Client Name');
            expect(html).toContain('client@test.com');
            expect(html).toContain('+37120000000');
        });

        it('should show booking ID', () => {
            const html = generateAdminEmailHTML(booking, confirmUrl);
            expect(html).toContain('SN-ADMIN123');
        });

        it('should include confirm payment button', () => {
            const html = generateAdminEmailHTML(booking, confirmUrl);
            expect(html).toContain(confirmUrl);
            expect(html).toContain('Apstiprināt');
        });

        it('should show format icon for online', () => {
            const html = generateAdminEmailHTML(booking, confirmUrl);
            expect(html).toContain('💻');
        });

        it('should show format icon for in-person', () => {
            const inPersonBooking = { ...booking, consultationFormat: 'in-person' };
            const html = generateAdminEmailHTML(inPersonBooking, confirmUrl);
            expect(html).toContain('📍');
        });

        it('should not show confirm button for free consultation', () => {
            const freeBooking = { ...booking, price: 0 };
            const html = generateAdminEmailHTML(freeBooking, confirmUrl);
            expect(html).not.toContain('Apstiprināt maksājumu');
        });
    });

    describe('generatePaymentConfirmedEmailHTML', () => {
        const t = translations.getTranslation('lv');
        const booking = {
            id: 'SN-PAID123',
            serviceName: 'Sākotnējā konsultācija',
            consultationFormat: 'online',
            date: '2026-02-01',
            time: '10:00'
        };

        it('should generate confirmation email', () => {
            const html = generatePaymentConfirmedEmailHTML(t, booking);
            expect(html).toContain('<!DOCTYPE html>');
        });

        it('should show success message', () => {
            const html = generatePaymentConfirmedEmailHTML(t, booking);
            expect(html).toContain(t.paymentConfirmedTitle);
        });

        it('should include booking details', () => {
            const html = generatePaymentConfirmedEmailHTML(t, booking);
            expect(html).toContain('2026-02-01');
            expect(html).toContain('10:00');
        });

        it('should have green success styling', () => {
            const html = generatePaymentConfirmedEmailHTML(t, booking);
            expect(html).toContain('#4CAF50'); // success green
        });

        it('should show checkmark icon', () => {
            const html = generatePaymentConfirmedEmailHTML(t, booking);
            expect(html).toContain('✓');
        });
    });

    describe('generateConfirmationPageHTML', () => {
        it('should generate success page', () => {
            const html = generateConfirmationPageHTML('success', 'Maksājums apstiprināts!', false);
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Maksājums apstiprināts!');
            expect(html).toContain('✓');
        });

        it('should generate error page', () => {
            const html = generateConfirmationPageHTML('error', 'Kļūda apstrādājot');
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Kļūda');
            expect(html).toContain('✕');
        });

        it('should generate already confirmed page', () => {
            const html = generateConfirmationPageHTML('already', 'Maksājums jau apstiprināts');
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Jau apstiprināts');
        });

        it('should show email sent indicator when true', () => {
            const html = generateConfirmationPageHTML('success', 'Test', true);
            expect(html).toContain('E-pasts klientam nosūtīts!');
        });

        it('should not show email indicator when false', () => {
            const html = generateConfirmationPageHTML('success', 'Test', false);
            expect(html).not.toContain('E-pasts klientam nosūtīts!');
        });

        it('should include back to website link', () => {
            const html = generateConfirmationPageHTML('success', 'Test');
            expect(html).toContain(config.branding.websiteUrl);
            expect(html).toContain('Atgriezties uz mājaslapu');
        });
    });

    describe('Multilingual Email Templates', () => {
        const displayData = {
            name: 'Test User',
            bookingId: 'SN-LANG123',
            serviceName: 'Test Service',
            formatLabel: 'Online',
            date: '2026-02-01',
            time: '10:00',
            price: 65
        };

        it('should generate Latvian email with diacritics', () => {
            const t = translations.getTranslation('lv');
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('Paldies');
            expect(html).toContain('Rezervācijas');
        });

        it('should generate English email', () => {
            const t = translations.getTranslation('en');
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('Thank you');
        });

        it('should generate Russian email with Cyrillic', () => {
            const t = translations.getTranslation('ru');
            const html = generateClientEmailHTML(t, displayData);
            expect(html).toContain('Спасибо');
        });

        it('should generate Latvian payment confirmation', () => {
            const t = translations.getTranslation('lv');
            const booking = { id: 'SN-LV123', serviceName: 'Test', consultationFormat: 'online', date: '2026-01-01', time: '10:00' };
            const html = generatePaymentConfirmedEmailHTML(t, booking);
            expect(html).toContain(t.paymentConfirmedTitle);
        });

        it('should generate English payment confirmation', () => {
            const t = translations.getTranslation('en');
            const booking = { id: 'SN-EN123', serviceName: 'Test', consultationFormat: 'online', date: '2026-01-01', time: '10:00' };
            const html = generatePaymentConfirmedEmailHTML(t, booking);
            expect(html).toContain(t.paymentConfirmedTitle);
        });

        it('should generate Russian payment confirmation', () => {
            const t = translations.getTranslation('ru');
            const booking = { id: 'SN-RU123', serviceName: 'Test', consultationFormat: 'online', date: '2026-01-01', time: '10:00' };
            const html = generatePaymentConfirmedEmailHTML(t, booking);
            expect(html).toContain(t.paymentConfirmedTitle);
        });
    });

    describe('Edge Cases', () => {
        const t = translations.getTranslation('lv');

        it('should handle special characters in name', () => {
            const data = {
                name: 'Jānis Āboltiņš <test>',
                bookingId: 'SN-SPECIAL',
                serviceName: 'Test',
                formatLabel: 'Online',
                date: '2026-01-01',
                time: '10:00',
                price: 0
            };
            expect(() => generateClientEmailHTML(t, data)).not.toThrow();
        });

        it('should handle very long service name', () => {
            const data = {
                name: 'Test',
                bookingId: 'SN-LONG123',
                serviceName: 'This is a very long service name that might overflow the container',
                formatLabel: 'Online',
                date: '2026-01-01',
                time: '10:00',
                price: 100
            };
            expect(() => generateClientEmailHTML(t, data)).not.toThrow();
        });

        it('should handle missing optional fields gracefully', () => {
            const booking = {
                id: 'SN-MINIMAL',
                name: 'Test',
                email: 'test@test.com',
                serviceName: 'Test',
                consultationFormat: 'online',
                date: '2026-01-01',
                time: '10:00',
                price: 0,
                language: 'lv'  // language is required for admin email
            };
            expect(() => generateAdminEmailHTML(booking, 'https://test.com')).not.toThrow();
        });
    });
});
