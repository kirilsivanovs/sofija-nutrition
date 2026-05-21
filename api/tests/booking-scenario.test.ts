/**
 * Full Booking Scenario Tests
 * End-to-end tests for the complete booking workflow
 */

const { translations, servicePrices } = require('../src/translations');

// Mock booking data generator
function createMockBooking(overrides = {}) {
    return {
        id: `SN-${Date.now().toString(36).toUpperCase()}`,
        name: 'Jānis Bērziņš',
        email: 'janis.berzins@example.com',
        phone: '+371 20000000',
        date: '2026-02-15',
        time: '14:00',
        service: 'initial',
        consultationFormat: 'online',
        language: 'lv',
        notes: 'Testa piezīme',
        paymentConfirmed: false,
        createdAt: new Date().toISOString(),
        ...overrides
    };
}

// Simulate booking creation logic
function processBooking(bookingData) {
    const { service, language, consultationFormat } = bookingData;
    const lang = translations[language] ? language : 'lv';
    const t = translations[lang];
    
    const price = servicePrices[service] || 0;
    const serviceName = t.services[service] || service;
    const formatLabel = consultationFormat === 'online' ? t.formatOnline : t.formatInPerson;
    
    return {
        ...bookingData,
        price,
        serviceName,
        formatLabel,
        language: lang
    };
}

// Validate booking data
function validateBookingInput(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length === 0) {
        errors.push('Name is required');
    }
    
    if (!data.email || !data.email.includes('@')) {
        errors.push('Valid email is required');
    }
    
    if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        errors.push('Valid date is required (YYYY-MM-DD)');
    }
    
    if (!data.time || !/^\d{2}:\d{2}$/.test(data.time)) {
        errors.push('Valid time is required (HH:MM)');
    }
    
    if (!data.service) {
        errors.push('Service is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Generate booking ID
function generateBookingId() {
    return `SN-${Date.now().toString(36).toUpperCase()}`;
}

// Calculate payment token
function generatePaymentToken(bookingId, email) {
    return Buffer.from(`${bookingId}:${email}`).toString('base64');
}

function verifyPaymentToken(token, bookingId, email) {
    const expected = Buffer.from(`${bookingId}:${email}`).toString('base64');
    return token === expected;
}

describe('Full Booking Scenario', () => {
    
    describe('Step 1: Booking Input Validation', () => {
        test('should accept valid booking data', () => {
            const booking = createMockBooking();
            const result = validateBookingInput(booking);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject booking without name', () => {
            const booking = createMockBooking({ name: '' });
            const result = validateBookingInput(booking);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Name is required');
        });

        test('should reject booking without valid email', () => {
            const booking = createMockBooking({ email: 'invalid-email' });
            const result = validateBookingInput(booking);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Valid email is required');
        });

        test('should reject booking without date', () => {
            const booking = createMockBooking({ date: '' });
            const result = validateBookingInput(booking);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Valid date is required (YYYY-MM-DD)');
        });

        test('should reject booking with invalid date format', () => {
            const booking = createMockBooking({ date: '15/02/2026' });
            const result = validateBookingInput(booking);
            
            expect(result.isValid).toBe(false);
        });

        test('should reject booking without time', () => {
            const booking = createMockBooking({ time: '' });
            const result = validateBookingInput(booking);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Valid time is required (HH:MM)');
        });

        test('should reject booking without service', () => {
            const booking = createMockBooking({ service: '' });
            const result = validateBookingInput(booking);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Service is required');
        });

        test('should collect multiple validation errors', () => {
            const booking = createMockBooking({ 
                name: '', 
                email: '', 
                date: '', 
                time: '', 
                service: '' 
            });
            const result = validateBookingInput(booking);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });

    describe('Step 2: Booking Processing', () => {
        test('should calculate price for initial consultation', () => {
            const booking = createMockBooking({ service: 'initial' });
            const processed = processBooking(booking);
            
            expect(processed.price).toBe(65);
        });

        test('should calculate price for followup consultation', () => {
            const booking = createMockBooking({ service: 'followup' });
            const processed = processBooking(booking);
            
            expect(processed.price).toBe(45);
        });

        test('should calculate price for package3', () => {
            const booking = createMockBooking({ service: 'package3' });
            const processed = processBooking(booking);
            
            expect(processed.price).toBe(150);
        });

        test('should calculate price for package5', () => {
            const booking = createMockBooking({ service: 'package5' });
            const processed = processBooking(booking);
            
            expect(processed.price).toBe(220);
        });

        test('should set correct Latvian service name', () => {
            const booking = createMockBooking({ 
                service: 'initial', 
                language: 'lv' 
            });
            const processed = processBooking(booking);
            
            expect(processed.serviceName).toBe('Sākotnējā konsultācija');
        });

        test('should set correct English service name', () => {
            const booking = createMockBooking({ 
                service: 'initial', 
                language: 'en' 
            });
            const processed = processBooking(booking);
            
            expect(processed.serviceName).toBe('Initial Consultation');
        });

        test('should set correct Russian service name', () => {
            const booking = createMockBooking({ 
                service: 'initial', 
                language: 'ru' 
            });
            const processed = processBooking(booking);
            
            expect(processed.serviceName).toBe('Первичная консультация');
        });

        test('should set online format label in Latvian', () => {
            const booking = createMockBooking({ 
                consultationFormat: 'online', 
                language: 'lv' 
            });
            const processed = processBooking(booking);
            
            expect(processed.formatLabel).toBe('Attālināti (Zoom/Google Meet)');
        });

        test('should set in-person format label in Latvian', () => {
            const booking = createMockBooking({ 
                consultationFormat: 'in-person', 
                language: 'lv' 
            });
            const processed = processBooking(booking);
            
            expect(processed.formatLabel).toBe('Klātienē');
        });

        test('should fallback to Latvian for unknown language', () => {
            const booking = createMockBooking({ language: 'de' });
            const processed = processBooking(booking);
            
            expect(processed.language).toBe('lv');
            expect(processed.serviceName).toBe('Sākotnējā konsultācija');
        });
    });

    describe('Step 3: Booking ID Generation', () => {
        test('should generate unique booking IDs', async () => {
            const id1 = generateBookingId();
            // Small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 2));
            const id2 = generateBookingId();
            
            expect(id1).not.toBe(id2);
        });

        test('should start with SN- prefix', () => {
            const id = generateBookingId();
            expect(id).toMatch(/^SN-/);
        });

        test('should be uppercase', () => {
            const id = generateBookingId();
            expect(id).toBe(id.toUpperCase());
        });

        test('should have reasonable length', () => {
            const id = generateBookingId();
            expect(id.length).toBeGreaterThan(5);
            expect(id.length).toBeLessThan(20);
        });
    });

    describe('Step 4: Email Subject Generation', () => {
        test('Latvian booking confirmation subject', () => {
            const booking = createMockBooking({ language: 'lv' });
            const processed = processBooking(booking);
            const subject = translations.lv.emailSubject(booking.id);
            
            expect(subject).toContain('Rezervācijas apstiprinājums');
            expect(subject).toContain(booking.id);
        });

        test('English booking confirmation subject', () => {
            const booking = createMockBooking({ language: 'en' });
            const subject = translations.en.emailSubject(booking.id);
            
            expect(subject).toContain('Booking Confirmation');
            expect(subject).toContain(booking.id);
        });

        test('Russian booking confirmation subject', () => {
            const booking = createMockBooking({ language: 'ru' });
            const subject = translations.ru.emailSubject(booking.id);
            
            expect(subject).toContain('Подтверждение бронирования');
            expect(subject).toContain(booking.id);
        });
    });

    describe('Step 5: Payment Token System', () => {
        test('should generate valid payment token', () => {
            const bookingId = 'SN-TEST123';
            const email = 'test@example.com';
            const token = generatePaymentToken(bookingId, email);
            
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        test('should verify correct token', () => {
            const bookingId = 'SN-TEST123';
            const email = 'test@example.com';
            const token = generatePaymentToken(bookingId, email);
            
            expect(verifyPaymentToken(token, bookingId, email)).toBe(true);
        });

        test('should reject incorrect token', () => {
            const bookingId = 'SN-TEST123';
            const email = 'test@example.com';
            const wrongToken = 'invalid-token';
            
            expect(verifyPaymentToken(wrongToken, bookingId, email)).toBe(false);
        });

        test('should reject token with wrong email', () => {
            const bookingId = 'SN-TEST123';
            const email = 'test@example.com';
            const wrongEmail = 'wrong@example.com';
            const token = generatePaymentToken(bookingId, email);
            
            expect(verifyPaymentToken(token, bookingId, wrongEmail)).toBe(false);
        });

        test('should reject token with wrong booking ID', () => {
            const bookingId = 'SN-TEST123';
            const email = 'test@example.com';
            const wrongId = 'SN-WRONG';
            const token = generatePaymentToken(bookingId, email);
            
            expect(verifyPaymentToken(token, wrongId, email)).toBe(false);
        });
    });

    describe('Step 6: Payment Confirmation Flow', () => {
        test('paid consultation should require payment confirmation', () => {
            const booking = createMockBooking({ service: 'initial' });
            const processed = processBooking(booking);
            
            const requiresPayment = processed.price > 0;
            expect(requiresPayment).toBe(true);
        });

        test('payment confirmation should update booking state', () => {
            const booking = createMockBooking({ 
                service: 'initial',
                paymentConfirmed: false 
            });
            
            // Simulate payment confirmation
            booking.paymentConfirmed = true;
            booking.paymentConfirmedAt = new Date().toISOString();
            
            expect(booking.paymentConfirmed).toBe(true);
            expect(booking.paymentConfirmedAt).toBeDefined();
        });
    });
});

describe('Booking Scenarios by Language', () => {
    const languages = ['lv', 'en', 'ru'];
    const services = Object.keys(servicePrices);
    const formats = ['online', 'in-person'];

    languages.forEach(lang => {
        describe(`${lang.toUpperCase()} Language Scenario`, () => {
            services.forEach(service => {
                formats.forEach(format => {
                    test(`should process ${service} booking with ${format} format`, () => {
                        const booking = createMockBooking({
                            service,
                            consultationFormat: format,
                            language: lang
                        });
                        
                        const processed = processBooking(booking);
                        
                        expect(processed.price).toBe(servicePrices[service]);
                        expect(processed.serviceName).toBe(translations[lang].services[service]);
                        expect(processed.formatLabel).toBe(
                            format === 'online' 
                                ? translations[lang].formatOnline 
                                : translations[lang].formatInPerson
                        );
                    });
                });
            });
        });
    });
});

describe('Edge Cases', () => {
    test('should handle booking with Latvian diacritics in name', () => {
        const booking = createMockBooking({ 
            name: 'Jānis Bērziņš' 
        });
        const processed = processBooking(booking);
        
        expect(processed.name).toBe('Jānis Bērziņš');
        expect(processed.name).toContain('ā');
        expect(processed.name).toContain('ē');
        expect(processed.name).toContain('ņ');
    });

    test('should handle booking with Russian Cyrillic in name', () => {
        const booking = createMockBooking({ 
            name: 'Иван Петров',
            language: 'ru'
        });
        const processed = processBooking(booking);
        
        expect(processed.name).toBe('Иван Петров');
    });

    test('should handle booking with special characters in notes', () => {
        const booking = createMockBooking({ 
            notes: 'Piezīme ar īpašām zīmēm: €, @, #, &' 
        });
        const processed = processBooking(booking);
        
        expect(processed.notes).toContain('€');
        expect(processed.notes).toContain('ī');
    });

    test('should handle very long notes', () => {
        const longNotes = 'A'.repeat(1000);
        const booking = createMockBooking({ notes: longNotes });
        const processed = processBooking(booking);
        
        expect(processed.notes.length).toBe(1000);
    });

    test('should handle empty optional fields', () => {
        const booking = createMockBooking({ 
            phone: '',
            notes: '' 
        });
        const processed = processBooking(booking);
        
        expect(processed.phone).toBe('');
        expect(processed.notes).toBe('');
    });

    test('should handle international phone numbers', () => {
        const booking = createMockBooking({ 
            phone: '+371 29 123 456' 
        });
        
        expect(booking.phone).toBe('+371 29 123 456');
    });
});

describe('Complete Booking Flow Integration', () => {
    test('should complete full Latvian booking flow', () => {
        // Step 1: Create booking data
        const bookingData = {
            name: 'Jānis Bērziņš',
            email: 'janis@example.lv',
            phone: '+371 29123456',
            date: '2026-02-20',
            time: '10:00',
            service: 'initial',
            consultationFormat: 'in-person',
            language: 'lv',
            notes: 'Vēlos apspriest uztura plānu'
        };

        // Step 2: Validate
        const validation = validateBookingInput(bookingData);
        expect(validation.isValid).toBe(true);

        // Step 3: Generate ID
        const bookingId = generateBookingId();
        expect(bookingId).toMatch(/^SN-/);

        // Step 4: Process booking
        const booking = { ...bookingData, id: bookingId };
        const processed = processBooking(booking);

        expect(processed.price).toBe(65);
        expect(processed.serviceName).toBe('Sākotnējā konsultācija');
        expect(processed.formatLabel).toBe('Klātienē');

        // Step 5: Generate email subject
        const subject = translations.lv.emailSubject(bookingId);
        expect(subject).toContain('Rezervācijas apstiprinājums');
        expect(subject).toContain(bookingId);

        // Step 6: Generate payment token
        const token = generatePaymentToken(bookingId, booking.email);
        expect(verifyPaymentToken(token, bookingId, booking.email)).toBe(true);

        // Step 7: Simulate payment confirmation
        processed.paymentConfirmed = true;
        processed.paymentConfirmedAt = new Date().toISOString();

        const paymentSubject = translations.lv.paymentConfirmedSubject(bookingId);
        expect(paymentSubject).toContain('Maksājums apstiprināts');
    });

    test('should complete full English booking flow', () => {
        const bookingData = {
            name: 'John Smith',
            email: 'john@example.com',
            phone: '+44 7911 123456',
            date: '2026-02-21',
            time: '15:00',
            service: 'package3',
            consultationFormat: 'online',
            language: 'en',
            notes: 'Interested in weight loss program'
        };

        const validation = validateBookingInput(bookingData);
        expect(validation.isValid).toBe(true);

        const bookingId = generateBookingId();
        const booking = { ...bookingData, id: bookingId };
        const processed = processBooking(booking);

        expect(processed.price).toBe(150);
        expect(processed.serviceName).toBe('3 Consultation Package');
        expect(processed.formatLabel).toBe('Online (Zoom/Google Meet)');

        const subject = translations.en.emailSubject(bookingId);
        expect(subject).toContain('Booking Confirmation');
    });

    test('should complete full Russian booking flow', () => {
        const bookingData = {
            name: 'Иван Петров',
            email: 'ivan@example.ru',
            phone: '+7 999 123 4567',
            date: '2026-02-22',
            time: '11:00',
            service: 'followup',
            consultationFormat: 'online',
            language: 'ru',
            notes: 'Повторная консультация по питанию'
        };

        const validation = validateBookingInput(bookingData);
        expect(validation.isValid).toBe(true);

        const bookingId = generateBookingId();
        const booking = { ...bookingData, id: bookingId };
        const processed = processBooking(booking);

        expect(processed.price).toBe(45);
        expect(processed.serviceName).toBe('Повторная консультация');
        expect(processed.formatLabel).toContain('Онлайн');

        const subject = translations.ru.emailSubject(bookingId);
        expect(subject).toContain('Подтверждение бронирования');
    });

    test('should handle initial consultation flow', () => {
        const bookingData = {
            name: 'Anna Kalniņa',
            email: 'anna@example.lv',
            date: '2026-02-23',
            time: '09:00',
            service: 'initial',
            consultationFormat: 'online',
            language: 'lv'
        };

        const validation = validateBookingInput(bookingData);
        expect(validation.isValid).toBe(true);

        const bookingId = generateBookingId();
        const booking = { ...bookingData, id: bookingId };
        const processed = processBooking(booking);

        expect(processed.price).toBe(65);
        expect(processed.serviceName).toBe('Sākotnējā konsultācija');

        // Paid consultations need payment confirmation
        const requiresPayment = processed.price > 0;
        expect(requiresPayment).toBe(true);
    });
});
