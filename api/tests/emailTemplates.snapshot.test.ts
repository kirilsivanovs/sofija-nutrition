/**
 * Email Templates Snapshot Tests
 * 
 * Snapshot tests protect email templates from accidental changes.
 * If you intentionally change the template, run: npm test -- -u
 */

const {
    generateClientEmailHTML,
    generateAdminEmailHTML,
    generatePaymentConfirmedEmailHTML,
    generateCancellationEmailHTML,
    generateConfirmationPageHTML
} = require('../src/templates/emailTemplates');

// Mock translations for consistent snapshots
const mockTranslations = {
    emailSubtitle: 'Veselīga dzīvesveida konsultācijas',
    emailThankYou: 'Paldies par rezervāciju!',
    emailGreeting: (name) => `Labdien, ${name}!`,
    emailConfirmed: 'Jūsu rezervācija ir apstiprināta.',
    emailBookingId: 'Rezervācijas numurs',
    emailService: 'Pakalpojums',
    emailFormat: 'Formāts',
    emailDate: 'Datums',
    emailTime: 'Laiks',
    emailPrice: 'Summa',
    emailInvoiceAttached: 'Rēķins pievienots pielikumā',
    emailQuestions: 'Ja jums ir jautājumi, lūdzu sazinieties ar mums.',
    emailRegards: 'Ar cieņu,',
    emailSubject: (id) => `Rezervācija ${id} - Sofija Nutrition`,
    formatOnline: 'Attālināti',
    formatInPerson: 'Klātienē',
    paymentConfirmedTitle: 'Maksājums apstiprināts!',
    paymentConfirmedText: 'Jūsu maksājums ir saņemts. Gaidīsim jūs konsultācijā!',
    paymentConfirmedSubject: (id) => `Maksājums apstiprināts - ${id}`,
    cancellationTitle: 'Rezervācija atcelta',
    cancellationText: 'Jūsu rezervācija ir atcelta.',
    cancellationDetails: 'Detaļas:',
    cancellationQuestions: 'Ja jums ir jautājumi, lūdzu sazinieties.',
    cancellationSubject: (id) => `Rezervācija atcelta - ${id}`
};

// Mock booking data
const mockBooking = {
    id: 'BK-2026-001',
    name: 'Jānis Bērziņš',
    email: 'janis@example.com',
    phone: '+371 20000000',
    serviceName: 'Uztura konsultācija',
    consultationFormat: 'online',
    date: '2026-02-15',
    time: '10:00',
    price: 45,
    language: 'lv',
    notes: 'Vēlos konsultēties par veselīgu uzturu.'
};

const mockBookingInPerson = {
    ...mockBooking,
    id: 'BK-2026-002',
    consultationFormat: 'in-person',
    price: 55
};

const mockFreeBooking = {
    ...mockBooking,
    id: 'BK-2026-003',
    serviceName: 'Bezmaksas iepazīšanās zvans',
    price: 0
};

describe('Email Templates Snapshots', () => {
    describe('generateClientEmailHTML', () => {
        it('should match snapshot for online consultation', () => {
            const html = generateClientEmailHTML(mockTranslations, {
                name: mockBooking.name,
                bookingId: mockBooking.id,
                serviceName: mockBooking.serviceName,
                formatLabel: 'Attālināti',
                date: mockBooking.date,
                time: mockBooking.time,
                price: mockBooking.price
            });
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for in-person consultation', () => {
            const html = generateClientEmailHTML(mockTranslations, {
                name: mockBookingInPerson.name,
                bookingId: mockBookingInPerson.id,
                serviceName: mockBookingInPerson.serviceName,
                formatLabel: 'Klātienē',
                date: mockBookingInPerson.date,
                time: mockBookingInPerson.time,
                price: mockBookingInPerson.price
            });
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for free consultation', () => {
            const html = generateClientEmailHTML(mockTranslations, {
                name: mockFreeBooking.name,
                bookingId: mockFreeBooking.id,
                serviceName: mockFreeBooking.serviceName,
                formatLabel: 'Attālināti',
                date: mockFreeBooking.date,
                time: mockFreeBooking.time,
                price: 0
            });
            
            expect(html).toMatchSnapshot();
        });
        
        it('should escape HTML in user input', () => {
            const html = generateClientEmailHTML(mockTranslations, {
                name: '<script>alert("xss")</script>',
                bookingId: 'BK-XSS-001',
                serviceName: 'Test<img src=x onerror=alert(1)>',
                formatLabel: 'Online',
                date: '2026-01-01',
                time: '10:00',
                price: 50
            });
            
            // Check that actual HTML tags are escaped (not executed)
            expect(html).not.toContain('<script>');
            expect(html).not.toContain('<img src=');
            // Verify escaped versions are present
            expect(html).toContain('&lt;script&gt;');
            expect(html).toContain('&lt;img src=x');
            expect(html).toMatchSnapshot();
        });
    });
    
    describe('generateAdminEmailHTML', () => {
        it('should match snapshot for paid booking', () => {
            const confirmUrl = 'https://example.com/api/confirm?id=BK-2026-001&token=abc123';
            const html = generateAdminEmailHTML(mockBooking, confirmUrl);
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for free booking', () => {
            const confirmUrl = 'https://example.com/api/confirm?id=BK-2026-003&token=abc123';
            const html = generateAdminEmailHTML(mockFreeBooking, confirmUrl);
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for in-person booking', () => {
            const confirmUrl = 'https://example.com/api/confirm?id=BK-2026-002&token=abc123';
            const html = generateAdminEmailHTML(mockBookingInPerson, confirmUrl);
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for booking without notes', () => {
            const bookingNoNotes = { ...mockBooking, notes: '' };
            const confirmUrl = 'https://example.com/api/confirm?id=BK-2026-001&token=abc123';
            const html = generateAdminEmailHTML(bookingNoNotes, confirmUrl);
            
            expect(html).toMatchSnapshot();
        });
    });
    
    describe('generatePaymentConfirmedEmailHTML', () => {
        it('should match snapshot for online consultation', () => {
            const html = generatePaymentConfirmedEmailHTML(mockTranslations, mockBooking);
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for in-person consultation', () => {
            const html = generatePaymentConfirmedEmailHTML(mockTranslations, mockBookingInPerson);
            
            expect(html).toMatchSnapshot();
        });
    });
    
    describe('generateCancellationEmailHTML', () => {
        it('should match snapshot for cancelled booking', () => {
            const html = generateCancellationEmailHTML(mockTranslations, mockBooking);
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for in-person cancelled booking', () => {
            const html = generateCancellationEmailHTML(mockTranslations, mockBookingInPerson);
            
            expect(html).toMatchSnapshot();
        });
    });
    
    describe('generateConfirmationPageHTML', () => {
        it('should match snapshot for success status', () => {
            const html = generateConfirmationPageHTML(
                'success',
                'Rezervācija BK-2026-001 ir apstiprināta!',
                true
            );
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for error status', () => {
            const html = generateConfirmationPageHTML(
                'error',
                'Kļūda: rezervācija nav atrasta.',
                false
            );
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot for already confirmed status', () => {
            const html = generateConfirmationPageHTML(
                'already',
                'Šī rezervācija jau ir apstiprināta iepriekš.',
                false
            );
            
            expect(html).toMatchSnapshot();
        });
        
        it('should match snapshot without email sent', () => {
            const html = generateConfirmationPageHTML(
                'success',
                'Maksājums apstiprināts!',
                false
            );
            
            expect(html).toMatchSnapshot();
        });
    });
    
    describe('Email structure validation', () => {
        it('should contain DOCTYPE declaration', () => {
            const html = generateClientEmailHTML(mockTranslations, {
                name: 'Test',
                bookingId: 'BK-001',
                serviceName: 'Test Service',
                formatLabel: 'Online',
                date: '2026-01-01',
                time: '10:00',
                price: 50
            });
            
            expect(html).toContain('<!DOCTYPE html>');
        });
        
        it('should contain meta charset', () => {
            const html = generateClientEmailHTML(mockTranslations, {
                name: 'Test',
                bookingId: 'BK-001',
                serviceName: 'Test Service',
                formatLabel: 'Online',
                date: '2026-01-01',
                time: '10:00',
                price: 50
            });
            
            expect(html).toContain('charset="UTF-8"');
        });
        
        it('should contain viewport meta tag', () => {
            const html = generateClientEmailHTML(mockTranslations, {
                name: 'Test',
                bookingId: 'BK-001',
                serviceName: 'Test Service',
                formatLabel: 'Online',
                date: '2026-01-01',
                time: '10:00',
                price: 50
            });
            
            expect(html).toContain('viewport');
        });
        
        it('should contain branding name', () => {
            const html = generateClientEmailHTML(mockTranslations, {
                name: 'Test',
                bookingId: 'BK-001',
                serviceName: 'Test Service',
                formatLabel: 'Online',
                date: '2026-01-01',
                time: '10:00',
                price: 50
            });
            
            expect(html).toContain('Sofija Nutrition');
        });
    });
});
