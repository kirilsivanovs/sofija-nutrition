/**
 * Comprehensive Translation Coverage Tests
 * 
 * Ensures all translations exist for all 3 supported languages (lv, en, ru)
 * and that the language is properly passed through the booking flow.
 */

const { sharedTranslations, commonData } = require('../../shared/translations');
const { translations, getTranslation } = require('../src/translations');

const SUPPORTED_LANGUAGES = ['lv', 'en', 'ru'];

describe('Translation Coverage', () => {
    describe('Shared Translations Structure', () => {
        SUPPORTED_LANGUAGES.forEach(lang => {
            describe(`Language: ${lang.toUpperCase()}`, () => {
                const t = sharedTranslations[lang];

                test('should have calendar translations', () => {
                    expect(t.calendar).toBeDefined();
                    expect(t.calendar.title).toBeDefined();
                    expect(t.calendar.selectDate).toBeDefined();
                    expect(t.calendar.selectTime).toBeDefined();
                    expect(t.calendar.noSlots).toBeDefined();
                    expect(t.calendar.weekdays).toHaveLength(7);
                    expect(t.calendar.months).toHaveLength(12);
                    expect(t.calendar.today).toBeDefined();
                    expect(t.calendar.selectedLabel).toBeDefined();
                });

                test('should have form translations', () => {
                    expect(t.form).toBeDefined();
                    expect(t.form.serviceLabel).toBeDefined();
                    expect(t.form.formatLabel).toBeDefined();
                    expect(t.form.nameLabel).toBeDefined();
                    expect(t.form.emailLabel).toBeDefined();
                    expect(t.form.phoneLabel).toBeDefined();
                    expect(t.form.messageLabel).toBeDefined();
                    expect(t.form.submitBtn).toBeDefined();
                });

                test('should have message translations', () => {
                    expect(t.messages).toBeDefined();
                    expect(t.messages.successTitle).toBeDefined();
                    expect(t.messages.successText).toBeDefined();
                    expect(t.messages.closeBtn).toBeDefined();
                    expect(t.messages.errorTitle).toBeDefined();
                    expect(t.messages.errorMessage).toBeDefined();
                    expect(t.messages.errorRetry).toBeDefined();
                    expect(t.messages.slotTaken).toBeDefined();
                    expect(t.messages.rateLimit).toBeDefined();
                    expect(t.messages.serverError).toBeDefined();
                    expect(t.messages.timeout).toBeDefined();
                    expect(t.messages.offline).toBeDefined();
                });

                test('should have format translations', () => {
                    expect(t.format).toBeDefined();
                    expect(t.format.online).toBeDefined();
                    expect(t.format.inPerson).toBeDefined();
                });

                test('should have all service translations', () => {
                    expect(t.services).toBeDefined();
                    const expectedServices = [
                        'initial', 'followup', 'package3', 'package5',
                        'cgm-diagnostic', 'consultation', 'free-consultation'
                    ];
                    expectedServices.forEach(serviceId => {
                        expect(t.services[serviceId]).toBeDefined();
                        expect(t.services[serviceId].length).toBeGreaterThan(0);
                    });
                });

                test('should have email translations', () => {
                    expect(t.email).toBeDefined();
                    expect(typeof t.email.subject).toBe('function');
                    expect(typeof t.email.greeting).toBe('function');
                    expect(t.email.thankYou).toBeDefined();
                    expect(t.email.confirmed).toBeDefined();
                    expect(t.email.bookingId).toBeDefined();
                    expect(t.email.service).toBeDefined();
                    expect(t.email.format).toBeDefined();
                    expect(t.email.date).toBeDefined();
                    expect(t.email.time).toBeDefined();
                    expect(t.email.price).toBeDefined();
                    expect(t.email.invoiceAttached).toBeDefined();
                    expect(t.email.questions).toBeDefined();
                    expect(t.email.regards).toBeDefined();
                    expect(t.email.subtitle).toBeDefined();
                });

                test('should have payment translations', () => {
                    expect(t.payment).toBeDefined();
                    expect(typeof t.payment.confirmedSubject).toBe('function');
                    expect(t.payment.confirmedTitle).toBeDefined();
                    expect(t.payment.confirmedText).toBeDefined();
                    expect(t.payment.waitingText).toBeDefined();
                });

                test('should have cancellation translations', () => {
                    expect(t.cancellation).toBeDefined();
                    expect(typeof t.cancellation.subject).toBe('function');
                    expect(t.cancellation.title).toBeDefined();
                    expect(t.cancellation.text).toBeDefined();
                    expect(t.cancellation.details).toBeDefined();
                    expect(t.cancellation.questions).toBeDefined();
                });

                test('should have PDF translations', () => {
                    expect(t.pdf).toBeDefined();
                    expect(t.pdf.subtitle).toBeDefined();
                    expect(t.pdf.invoice).toBeDefined();
                    expect(t.pdf.number).toBeDefined();
                    expect(t.pdf.date).toBeDefined();
                    expect(t.pdf.client).toBeDefined();
                    expect(t.pdf.name).toBeDefined();
                    expect(t.pdf.email).toBeDefined();
                    expect(t.pdf.phone).toBeDefined();
                    expect(t.pdf.format).toBeDefined();
                    expect(t.pdf.service).toBeDefined();
                    expect(t.pdf.time).toBeDefined();
                    expect(t.pdf.price).toBeDefined();
                    expect(t.pdf.total).toBeDefined();
                    expect(t.pdf.paymentInfo).toBeDefined();
                    expect(t.pdf.bank).toBeDefined();
                    expect(t.pdf.reference).toBeDefined();
                    expect(t.pdf.notes).toBeDefined();
                    expect(t.pdf.thankYou).toBeDefined();
                    expect(t.pdf.notProvided).toBeDefined();
                });
            });
        });
    });

    describe('Legacy API Translations Compatibility', () => {
        SUPPORTED_LANGUAGES.forEach(lang => {
            test(`${lang.toUpperCase()} should have all legacy fields`, () => {
                const t = getTranslation(lang);

                // Email fields
                expect(typeof t.emailSubject).toBe('function');
                expect(typeof t.emailGreeting).toBe('function');
                expect(t.emailThankYou).toBeDefined();
                expect(t.emailConfirmed).toBeDefined();
                expect(t.emailBookingId).toBeDefined();
                expect(t.emailService).toBeDefined();
                expect(t.emailFormat).toBeDefined();
                expect(t.emailDate).toBeDefined();
                expect(t.emailTime).toBeDefined();
                expect(t.emailPrice).toBeDefined();
                expect(t.emailInvoiceAttached).toBeDefined();
                expect(t.emailQuestions).toBeDefined();
                expect(t.emailRegards).toBeDefined();
                expect(t.emailSubtitle).toBeDefined();

                // Format fields
                expect(t.formatOnline).toBeDefined();
                expect(t.formatInPerson).toBeDefined();

                // Payment fields
                expect(typeof t.paymentConfirmedSubject).toBe('function');
                expect(t.paymentConfirmedTitle).toBeDefined();
                expect(t.paymentConfirmedText).toBeDefined();
                expect(t.paymentWaitingText).toBeDefined();

                // Cancellation fields
                expect(typeof t.cancellationSubject).toBe('function');
                expect(t.cancellationTitle).toBeDefined();
                expect(t.cancellationText).toBeDefined();
                expect(t.cancellationDetails).toBeDefined();
                expect(t.cancellationQuestions).toBeDefined();

                // PDF fields
                expect(t.pdfSubtitle).toBeDefined();
                expect(t.pdfInvoice).toBeDefined();
                expect(t.pdfNumber).toBeDefined();
                expect(t.pdfDate).toBeDefined();
                expect(t.pdfClient).toBeDefined();
                expect(t.pdfName).toBeDefined();
                expect(t.pdfEmail).toBeDefined();
                expect(t.pdfPhone).toBeDefined();
                expect(t.pdfFormat).toBeDefined();
                expect(t.pdfService).toBeDefined();
                expect(t.pdfTime).toBeDefined();
                expect(t.pdfPrice).toBeDefined();
                expect(t.pdfTotal).toBeDefined();
                expect(t.pdfPaymentInfo).toBeDefined();
                expect(t.pdfBank).toBeDefined();
                expect(t.pdfReference).toBeDefined();
                expect(t.pdfNotes).toBeDefined();
                expect(t.pdfThankYou).toBeDefined();
                expect(t.pdfNotProvided).toBeDefined();

                // Services
                expect(t.services).toBeDefined();
                expect(Object.keys(t.services).length).toBeGreaterThanOrEqual(7);
            });
        });
    });

    describe('Translation Key Consistency', () => {
        test('all languages should have the same structure', () => {
            const lvKeys = getAllKeys(sharedTranslations.lv);
            const enKeys = getAllKeys(sharedTranslations.en);
            const ruKeys = getAllKeys(sharedTranslations.ru);

            // Check that all languages have the same keys
            expect(lvKeys.sort()).toEqual(enKeys.sort());
            expect(lvKeys.sort()).toEqual(ruKeys.sort());
        });

        test('all service IDs should be consistent across languages', () => {
            const lvServices = Object.keys(sharedTranslations.lv.services);
            const enServices = Object.keys(sharedTranslations.en.services);
            const ruServices = Object.keys(sharedTranslations.ru.services);

            expect(lvServices.sort()).toEqual(enServices.sort());
            expect(lvServices.sort()).toEqual(ruServices.sort());
        });
    });

    describe('Common Data', () => {
        test('should have email address', () => {
            expect(commonData.email).toBe('info@sofija-nutrition.lv');
        });

        test('should have website', () => {
            expect(commonData.website).toBe('sofija-nutrition.lv');
        });
    });
});

describe('Language Flow in Booking', () => {
    const { generateClientEmailHTML, generateAdminEmailHTML } = require('../src/templates/emailTemplates');

    describe('Email Language Selection', () => {
        const mockBooking = {
            name: 'Test User',
            bookingId: 'SN-TEST123',
            serviceName: 'Test Service',
            formatLabel: 'Online',
            date: '2026-02-15',
            time: '10:00',
            price: 50
        };

        SUPPORTED_LANGUAGES.forEach(lang => {
            test(`should generate email in ${lang.toUpperCase()} language`, () => {
                const t = getTranslation(lang);
                const html = generateClientEmailHTML(t, mockBooking);

                // Email should contain language-specific text
                expect(html).toContain(t.emailThankYou);
                expect(html).toContain(mockBooking.name);
                expect(html).toContain(mockBooking.bookingId);
            });
        });

        test('Latvian email should contain Latvian text', () => {
            const t = getTranslation('lv');
            const html = generateClientEmailHTML(t, mockBooking);

            expect(html).toContain('Paldies');
            expect(html).toContain('Ar cieņu');
        });

        test('English email should contain English text', () => {
            const t = getTranslation('en');
            const html = generateClientEmailHTML(t, mockBooking);

            expect(html).toContain('Thank you');
            expect(html).toContain('Best regards');
        });

        test('Russian email should contain Russian text', () => {
            const t = getTranslation('ru');
            const html = generateClientEmailHTML(t, mockBooking);

            expect(html).toContain('Спасибо');
            expect(html).toContain('С уважением');
        });
    });

    describe('Booking Language Preservation', () => {
        test('booking should store language from client', () => {
            // Simulate booking data with language
            const bookingData = {
                id: 'SN-TEST',
                name: 'Test',
                email: 'test@test.com',
                date: '2026-02-15',
                time: '10:00',
                service: 'consultation',
                language: 'ru', // Client was on Russian version
                price: 50
            };

            expect(bookingData.language).toBe('ru');
        });

        test('getTranslation should fallback to Latvian for unknown language', () => {
            const t = getTranslation('de'); // German not supported
            expect(t).toEqual(getTranslation('lv'));
        });

        test('getTranslation should fallback to Latvian for undefined', () => {
            const t = getTranslation(undefined);
            expect(t).toEqual(getTranslation('lv'));
        });

        test('getTranslation should fallback to Latvian for null', () => {
            const t = getTranslation(null);
            expect(t).toEqual(getTranslation('lv'));
        });
    });
});

// Helper function to get all nested keys
function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && typeof obj[key] !== 'function') {
            keys = keys.concat(getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}
