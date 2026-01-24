/**
 * Unit tests for email HTML generation
 * Tests proper encoding and rendering of multilingual content
 */

const { translations, latvianDiacritics } = require('../src/translations');

// Helper to simulate email HTML generation (simplified version)
function generateEmailSubject(lang, bookingId) {
    const t = translations[lang] || translations.lv;
    return t.emailSubject(bookingId);
}

function generateEmailGreeting(lang, name) {
    const t = translations[lang] || translations.lv;
    return t.emailGreeting(name);
}

function getServiceName(lang, serviceKey) {
    const t = translations[lang] || translations.lv;
    return t.services[serviceKey] || serviceKey;
}

function getFormatLabel(lang, format) {
    const t = translations[lang] || translations.lv;
    return format === 'online' ? t.formatOnline : t.formatInPerson;
}

describe('Email Content Generation', () => {

    describe('Email Subject', () => {
        test('Latvian subject should contain "Rezervācijas"', () => {
            const subject = generateEmailSubject('lv', 'SN-TEST123');
            expect(subject).toBe('Rezervācijas apstiprinājums - SN-TEST123');
            expect(subject).toContain('ā');
        });

        test('English subject should be in English', () => {
            const subject = generateEmailSubject('en', 'SN-TEST123');
            expect(subject).toBe('Booking Confirmation - SN-TEST123');
        });

        test('Russian subject should be in Cyrillic', () => {
            const subject = generateEmailSubject('ru', 'SN-TEST123');
            expect(subject).toBe('Подтверждение бронирования - SN-TEST123');
        });

        test('Unknown language should fallback to Latvian', () => {
            const subject = generateEmailSubject('de', 'SN-TEST123');
            expect(subject).toBe('Rezervācijas apstiprinājums - SN-TEST123');
        });
    });

    describe('Email Greeting', () => {
        test('Latvian greeting with Latvian name', () => {
            const greeting = generateEmailGreeting('lv', 'Jānis Bērziņš');
            expect(greeting).toBe('Labdien, Jānis Bērziņš!');
        });

        test('English greeting', () => {
            const greeting = generateEmailGreeting('en', 'John Smith');
            expect(greeting).toBe('Hello, John Smith!');
        });

        test('Russian greeting with Cyrillic name', () => {
            const greeting = generateEmailGreeting('ru', 'Иван Петров');
            expect(greeting).toBe('Здравствуйте, Иван Петров!');
        });
    });

    describe('Service Names in Email', () => {
        const services = ['initial', 'followup', 'package3', 'package5', 'cgm-diagnostic', 'consultation', 'free-consultation'];

        services.forEach(service => {
            test(`Latvian service "${service}" should be defined`, () => {
                const name = getServiceName('lv', service);
                expect(name).toBeDefined();
                expect(name.length).toBeGreaterThan(0);
            });

            test(`English service "${service}" should be defined`, () => {
                const name = getServiceName('en', service);
                expect(name).toBeDefined();
                expect(name.length).toBeGreaterThan(0);
            });

            test(`Russian service "${service}" should be defined`, () => {
                const name = getServiceName('ru', service);
                expect(name).toBeDefined();
                expect(name.length).toBeGreaterThan(0);
            });
        });

        test('Latvian service names should have diacritics where needed', () => {
            expect(getServiceName('lv', 'initial')).toContain('ā');
            expect(getServiceName('lv', 'followup')).toContain('ā');
            expect(getServiceName('lv', 'package3')).toContain('ā');
        });
    });

    describe('Format Labels', () => {
        test('Latvian online format', () => {
            const label = getFormatLabel('lv', 'online');
            expect(label).toBe('Attālināti (Zoom/Google Meet)');
            expect(label).toContain('ā');
        });

        test('Latvian in-person format', () => {
            const label = getFormatLabel('lv', 'in-person');
            expect(label).toBe('Klātienē');
            expect(label).toContain('ā');
            expect(label).toContain('ē');
        });

        test('English online format', () => {
            const label = getFormatLabel('en', 'online');
            expect(label).toBe('Online (Zoom/Google Meet)');
        });

        test('English in-person format', () => {
            const label = getFormatLabel('en', 'in-person');
            expect(label).toBe('In-person');
        });

        test('Russian online format', () => {
            const label = getFormatLabel('ru', 'online');
            expect(label).toContain('Онлайн');
        });

        test('Russian in-person format', () => {
            const label = getFormatLabel('ru', 'in-person');
            expect(label).toBe('Очно');
        });
    });
});

describe('HTML Encoding', () => {
    // Simulate HTML content generation
    function generateHTMLSnippet(text) {
        return `<p>${text}</p>`;
    }

    test('Latvian diacritics should be preserved in HTML', () => {
        const latvianText = 'Sākotnējā konsultācija';
        const html = generateHTMLSnippet(latvianText);
        
        expect(html).toBe('<p>Sākotnējā konsultācija</p>');
        expect(html).toContain('ā');
        expect(html).toContain('ē');
    });

    test('Russian Cyrillic should be preserved in HTML', () => {
        const russianText = 'Первичная консультация';
        const html = generateHTMLSnippet(russianText);
        
        expect(html).toBe('<p>Первичная консультация</p>');
        expect(html).toContain('П');
        expect(html).toContain('я');
    });

    test('HTML special characters should not corrupt diacritics', () => {
        const text = 'Cena: €65 - Sākotnējā konsultācija';
        const html = generateHTMLSnippet(text);
        
        expect(html).toContain('€65');
        expect(html).toContain('ā');
    });
});

describe('PDF Content Translations', () => {
    describe('PDF Labels', () => {
        test('Latvian PDF labels should have proper diacritics', () => {
            const t = translations.lv;
            
            expect(t.pdfInvoice).toBe('RĒĶINS');
            expect(t.pdfName).toBe('Vārds');
            expect(t.pdfTotal).toBe('KOPĀ');
            expect(t.pdfPaymentInfo).toBe('Maksājuma informācija');
            expect(t.pdfReference).toBe('Maksājuma mērķis');
            expect(t.pdfNotes).toBe('Piezīmes');
            expect(t.pdfThankYou).toBe('Paldies, ka izvēlējāties mūs!');
        });

        test('Russian PDF labels should be in Cyrillic', () => {
            const t = translations.ru;
            
            expect(t.pdfInvoice).toBe('СЧЁТ');
            expect(t.pdfName).toBe('Имя');
            expect(t.pdfTotal).toBe('ИТОГО');
            expect(t.pdfPaymentInfo).toBe('Платёжная информация');
        });

        test('English PDF labels should be in ASCII', () => {
            const t = translations.en;
            
            expect(t.pdfInvoice).toBe('INVOICE');
            expect(t.pdfName).toBe('Name');
            expect(t.pdfTotal).toBe('TOTAL');
        });
    });
});

describe('Payment Confirmation Translations', () => {
    test('Latvian payment confirmed title', () => {
        expect(translations.lv.paymentConfirmedTitle).toBe('Maksājums saņemts!');
        expect(translations.lv.paymentConfirmedTitle).toContain('ņ');
    });

    test('Latvian payment confirmed text', () => {
        expect(translations.lv.paymentConfirmedText).toContain('Paldies');
        expect(translations.lv.paymentConfirmedText).toContain('ā');
    });

    test('English payment confirmed title', () => {
        expect(translations.en.paymentConfirmedTitle).toBe('Payment Received!');
    });

    test('Russian payment confirmed title', () => {
        expect(translations.ru.paymentConfirmedTitle).toBe('Оплата получена!');
    });
});

describe('Edge Cases', () => {
    test('Empty booking ID should still work', () => {
        const subject = generateEmailSubject('lv', '');
        expect(subject).toBe('Rezervācijas apstiprinājums - ');
    });

    test('Special characters in name should be preserved', () => {
        const greeting = generateEmailGreeting('lv', 'Jānis "Džonijs" O\'Brien');
        expect(greeting).toContain('Jānis');
        expect(greeting).toContain('"Džonijs"');
    });

    test('Unicode emoji should not affect translations', () => {
        const text = translations.lv.emailThankYou;
        const withEmoji = `✅ ${text}`;
        expect(withEmoji).toContain('Paldies');
        expect(withEmoji).toContain('✅');
    });

    test('Very long booking ID should work', () => {
        const longId = 'SN-' + 'A'.repeat(50);
        const subject = generateEmailSubject('lv', longId);
        expect(subject).toContain(longId);
    });
});
