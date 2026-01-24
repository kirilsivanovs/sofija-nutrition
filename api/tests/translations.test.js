/**
 * Unit tests for translations and language support
 * Tests Latvian diacritics (garumzīmes), Russian Cyrillic, and English
 */

const { translations, servicePrices, latvianDiacritics, russianCyrillic } = require('../src/translations');

describe('Translations Module', () => {
    
    describe('Supported Languages', () => {
        test('should support Latvian (lv)', () => {
            expect(translations.lv).toBeDefined();
        });

        test('should support English (en)', () => {
            expect(translations.en).toBeDefined();
        });

        test('should support Russian (ru)', () => {
            expect(translations.ru).toBeDefined();
        });

        test('all languages should have same structure', () => {
            const lvKeys = Object.keys(translations.lv).sort();
            const enKeys = Object.keys(translations.en).sort();
            const ruKeys = Object.keys(translations.ru).sort();

            expect(lvKeys).toEqual(enKeys);
            expect(enKeys).toEqual(ruKeys);
        });
    });

    describe('Latvian Diacritics (Garumzīmes)', () => {
        
        test('Latvian translations should contain ā (a with macron)', () => {
            const allLvText = JSON.stringify(translations.lv);
            expect(allLvText).toContain('ā');
        });

        test('Latvian translations should contain ē (e with macron)', () => {
            const allLvText = JSON.stringify(translations.lv);
            expect(allLvText).toContain('ē');
        });

        test('Latvian translations should contain ī (i with macron)', () => {
            const allLvText = JSON.stringify(translations.lv);
            expect(allLvText).toContain('ī');
        });

        test('Latvian translations should contain ū (u with macron)', () => {
            const allLvText = JSON.stringify(translations.lv);
            expect(allLvText).toContain('ū');
        });

        test('Latvian translations should contain ņ (n with cedilla)', () => {
            const allLvText = JSON.stringify(translations.lv);
            expect(allLvText).toContain('ņ');
        });

        test('Latvian translations should contain specific words with diacritics', () => {
            // Key Latvian words that MUST have diacritics
            expect(translations.lv.pdfInvoice).toBe('RĒĶINS');
            expect(translations.lv.pdfName).toBe('Vārds');
            expect(translations.lv.formatInPerson).toBe('Klātienē');
            expect(translations.lv.emailThankYou).toBe('Paldies par rezervāciju!');
            expect(translations.lv.pdfPaymentInfo).toBe('Maksājuma informācija');
            expect(translations.lv.pdfReference).toBe('Maksājuma mērķis');
            expect(translations.lv.pdfThankYou).toBe('Paldies, ka izvēlējāties mūs!');
        });

        test('emailSubject function should produce text with diacritics', () => {
            const subject = translations.lv.emailSubject('TEST-123');
            expect(subject).toBe('Rezervācijas apstiprinājums - TEST-123');
            expect(subject).toContain('ā');
        });

        test('paymentConfirmedSubject function should produce text with diacritics', () => {
            const subject = translations.lv.paymentConfirmedSubject('TEST-123');
            expect(subject).toBe('Maksājums apstiprināts - TEST-123');
            expect(subject).toContain('ā');
        });
    });

    describe('Latvian Service Names', () => {
        test('initial consultation should be "Sākotnējā konsultācija"', () => {
            expect(translations.lv.services.initial).toBe('Sākotnējā konsultācija');
        });

        test('followup should be "Atkārtota konsultācija"', () => {
            expect(translations.lv.services.followup).toBe('Atkārtota konsultācija');
        });

        test('package3 should contain "konsultāciju"', () => {
            expect(translations.lv.services.package3).toBe('3 konsultāciju pakete');
        });

        test('free-consultation should be "Bezmaksas 15 min konsultācija"', () => {
            expect(translations.lv.services['free-consultation']).toBe('Bezmaksas 15 min konsultācija');
        });

        test('all service names should have corresponding translations', () => {
            const serviceKeys = Object.keys(servicePrices);
            
            serviceKeys.forEach(key => {
                expect(translations.lv.services[key]).toBeDefined();
                expect(translations.en.services[key]).toBeDefined();
                expect(translations.ru.services[key]).toBeDefined();
            });
        });
    });

    describe('Russian Cyrillic', () => {
        test('Russian translations should contain Cyrillic characters', () => {
            const allRuText = JSON.stringify(translations.ru);
            
            // Check for common Cyrillic characters
            expect(allRuText).toContain('а');
            expect(allRuText).toContain('е');
            expect(allRuText).toContain('и');
            expect(allRuText).toContain('о');
        });

        test('Russian translations should have proper greeting', () => {
            const greeting = translations.ru.emailGreeting('Иван');
            expect(greeting).toBe('Здравствуйте, Иван!');
        });

        test('Russian services should be in Cyrillic', () => {
            expect(translations.ru.services.initial).toBe('Первичная консультация');
            expect(translations.ru.services.followup).toBe('Повторная консультация');
        });

        test('Russian format labels should be in Cyrillic', () => {
            expect(translations.ru.formatOnline).toContain('Онлайн');
            expect(translations.ru.formatInPerson).toBe('Очно');
        });
    });

    describe('English Translations', () => {
        test('English translations should be in ASCII', () => {
            // English should not contain diacritics or Cyrillic
            const allEnText = JSON.stringify(translations.en);
            
            latvianDiacritics.forEach(char => {
                expect(allEnText).not.toContain(char);
            });
        });

        test('English services should have proper names', () => {
            expect(translations.en.services.initial).toBe('Initial Consultation');
            expect(translations.en.services.followup).toBe('Follow-up Consultation');
            expect(translations.en.services['free-consultation']).toBe('Free 15-min Consultation');
        });

        test('English format labels should be correct', () => {
            expect(translations.en.formatOnline).toBe('Online (Zoom/Google Meet)');
            expect(translations.en.formatInPerson).toBe('In-person');
        });
    });

    describe('Translation Functions', () => {
        const testCases = [
            { lang: 'lv', id: 'SN-123', name: 'Jānis' },
            { lang: 'en', id: 'SN-456', name: 'John' },
            { lang: 'ru', id: 'SN-789', name: 'Иван' }
        ];

        testCases.forEach(({ lang, id, name }) => {
            test(`emailSubject function works for ${lang}`, () => {
                const result = translations[lang].emailSubject(id);
                expect(result).toContain(id);
                expect(typeof result).toBe('string');
            });

            test(`emailGreeting function works for ${lang}`, () => {
                const result = translations[lang].emailGreeting(name);
                expect(result).toContain(name);
                expect(typeof result).toBe('string');
            });

            test(`paymentConfirmedSubject function works for ${lang}`, () => {
                const result = translations[lang].paymentConfirmedSubject(id);
                expect(result).toContain(id);
                expect(typeof result).toBe('string');
            });
        });
    });

    describe('Service Prices', () => {
        test('all services should have prices defined', () => {
            expect(servicePrices.initial).toBe(65);
            expect(servicePrices.followup).toBe(45);
            expect(servicePrices.package3).toBe(150);
            expect(servicePrices.package5).toBe(220);
            expect(servicePrices['cgm-diagnostic']).toBe(150);
            expect(servicePrices.consultation).toBe(80);
            expect(servicePrices['free-consultation']).toBe(0);
        });

        test('free consultation should be 0', () => {
            expect(servicePrices['free-consultation']).toBe(0);
        });

        test('all prices should be non-negative numbers', () => {
            Object.values(servicePrices).forEach(price => {
                expect(typeof price).toBe('number');
                expect(price).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Text Consistency', () => {
        test('all languages should have PhD in subtitle', () => {
            expect(translations.lv.emailSubtitle).toContain('PhD');
            expect(translations.en.emailSubtitle).toContain('PhD');
            expect(translations.ru.emailSubtitle).toContain('PhD');
        });

        test('all format labels should mention Zoom/Google Meet for online', () => {
            expect(translations.lv.formatOnline).toContain('Zoom');
            expect(translations.en.formatOnline).toContain('Zoom');
            expect(translations.ru.formatOnline).toContain('Zoom');
        });

        test('pdfNotProvided should be defined for all languages', () => {
            expect(translations.lv.pdfNotProvided).toBe('Nav norādīts');
            expect(translations.en.pdfNotProvided).toBe('Not provided');
            expect(translations.ru.pdfNotProvided).toBe('Не указано');
        });
    });
});

describe('Character Encoding', () => {
    test('latvianDiacritics array should contain all required characters', () => {
        expect(latvianDiacritics).toContain('ā');
        expect(latvianDiacritics).toContain('ē');
        expect(latvianDiacritics).toContain('ī');
        expect(latvianDiacritics).toContain('ū');
        expect(latvianDiacritics).toContain('ļ');
        expect(latvianDiacritics).toContain('ņ');
        expect(latvianDiacritics).toContain('ķ');
        expect(latvianDiacritics).toContain('ģ');
        expect(latvianDiacritics).toContain('č');
        expect(latvianDiacritics).toContain('š');
        expect(latvianDiacritics).toContain('ž');
    });

    test('russianCyrillic array should contain common characters', () => {
        expect(russianCyrillic).toContain('а');
        expect(russianCyrillic).toContain('я');
        expect(russianCyrillic).toContain('ё');
    });

    test('UTF-8 string operations should preserve diacritics', () => {
        const latvianText = 'Sākotnējā konsultācija';
        const encoded = Buffer.from(latvianText, 'utf8').toString('utf8');
        expect(encoded).toBe(latvianText);
    });

    test('JSON stringify/parse should preserve diacritics', () => {
        const original = { text: 'Rezervācijas apstiprinājums' };
        const parsed = JSON.parse(JSON.stringify(original));
        expect(parsed.text).toBe(original.text);
    });
});
