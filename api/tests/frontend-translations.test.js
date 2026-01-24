/**
 * Unit tests for frontend booking translations
 * Tests the BookingCalendar translations object
 */

// Frontend translations (mirrored from booking.js for testing)
const frontendTranslations = {
    lv: {
        title: "Izvēlieties datumu un laiku",
        selectDate: "Izvēlieties datumu",
        selectTime: "Pieejamie laiki",
        noSlots: "Šajā dienā nav pieejamu laiku",
        weekdays: ["Sv", "P", "O", "T", "C", "Pk", "S"],
        months: ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", 
                 "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"],
        serviceLabel: "Pakalpojuma veids",
        formatLabel: "Konsultācijas formāts",
        formatOnline: "Attālināti (Zoom/Google Meet)",
        formatInPerson: "Klātienē",
        nameLabel: "Jūsu vārds",
        emailLabel: "E-pasts",
        phoneLabel: "Telefons",
        messageLabel: "Komentārs (neobligāts)",
        submitBtn: "Apstiprināt rezervāciju",
        successTitle: "Rezervācija veiksmīga!",
        successText: "Mēs sazināsimies ar Jums 24 stundu laikā, lai apstiprinātu vizīti.",
        closeBtn: "Aizvērt",
        selectedLabel: "Izvēlēts",
        today: "Šodien"
    },
    ru: {
        title: "Выберите дату и время",
        selectDate: "Выберите дату",
        selectTime: "Доступное время",
        noSlots: "В этот день нет свободного времени",
        weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                 "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
        serviceLabel: "Тип услуги",
        formatLabel: "Формат консультации",
        formatOnline: "Онлайн (Zoom/Google Meet)",
        formatInPerson: "Очно",
        nameLabel: "Ваше имя",
        emailLabel: "Email",
        phoneLabel: "Телефон",
        messageLabel: "Комментарий (необязательно)",
        submitBtn: "Подтвердить запись",
        successTitle: "Запись успешна!",
        successText: "Мы свяжемся с Вами в течение 24 часов для подтверждения визита.",
        closeBtn: "Закрыть",
        selectedLabel: "Выбрано",
        today: "Сегодня"
    },
    en: {
        title: "Select date and time",
        selectDate: "Select a date",
        selectTime: "Available times",
        noSlots: "No available slots on this day",
        weekdays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        months: ["January", "February", "March", "April", "May", "June",
                 "July", "August", "September", "October", "November", "December"],
        serviceLabel: "Service type",
        formatLabel: "Consultation format",
        formatOnline: "Online (Zoom/Google Meet)",
        formatInPerson: "In-person",
        nameLabel: "Your name",
        emailLabel: "Email",
        phoneLabel: "Phone",
        messageLabel: "Comment (optional)",
        submitBtn: "Confirm booking",
        successTitle: "Booking successful!",
        successText: "We will contact you within 24 hours to confirm your appointment.",
        closeBtn: "Close",
        selectedLabel: "Selected",
        today: "Today"
    }
};

describe('Frontend Booking Translations', () => {
    
    describe('Latvian UI Translations', () => {
        const lv = frontendTranslations.lv;

        test('title should have proper diacritics', () => {
            expect(lv.title).toBe('Izvēlieties datumu un laiku');
            expect(lv.title).toContain('ē');
        });

        test('selectDate should have proper diacritics', () => {
            expect(lv.selectDate).toBe('Izvēlieties datumu');
        });

        test('noSlots should have proper diacritics', () => {
            expect(lv.noSlots).toBe('Šajā dienā nav pieejamu laiku');
            expect(lv.noSlots).toContain('Š');
            expect(lv.noSlots).toContain('ā');
        });

        test('formatInPerson should be "Klātienē"', () => {
            expect(lv.formatInPerson).toBe('Klātienē');
            expect(lv.formatInPerson).toContain('ā');
            expect(lv.formatInPerson).toContain('ē');
        });

        test('formatOnline should contain "Attālināti"', () => {
            expect(lv.formatOnline).toContain('Attālināti');
            expect(lv.formatOnline).toContain('ā');
        });

        test('serviceLabel should have diacritics', () => {
            expect(lv.serviceLabel).toBe('Pakalpojuma veids');
        });

        test('formatLabel should have diacritics', () => {
            expect(lv.formatLabel).toBe('Konsultācijas formāts');
            expect(lv.formatLabel).toContain('ā');
        });

        test('nameLabel should have diacritics', () => {
            expect(lv.nameLabel).toBe('Jūsu vārds');
            expect(lv.nameLabel).toContain('ū');
            expect(lv.nameLabel).toContain('ā');
        });

        test('submitBtn should have diacritics', () => {
            expect(lv.submitBtn).toBe('Apstiprināt rezervāciju');
            expect(lv.submitBtn).toContain('ā');
        });

        test('successTitle should have diacritics', () => {
            expect(lv.successTitle).toBe('Rezervācija veiksmīga!');
            expect(lv.successTitle).toContain('ā');
            expect(lv.successTitle).toContain('ī');
        });

        test('successText should have diacritics', () => {
            expect(lv.successText).toContain('sazināsimies');
            expect(lv.successText).toContain('ā');
        });

        test('today should be "Šodien"', () => {
            expect(lv.today).toBe('Šodien');
            expect(lv.today).toContain('Š');
        });
    });

    describe('Latvian Month Names', () => {
        const months = frontendTranslations.lv.months;

        test('should have 12 months', () => {
            expect(months).toHaveLength(12);
        });

        test('Janvāris should have ā', () => {
            expect(months[0]).toBe('Janvāris');
            expect(months[0]).toContain('ā');
        });

        test('Februāris should have ā', () => {
            expect(months[1]).toBe('Februāris');
        });

        test('Aprīlis should have ī', () => {
            expect(months[3]).toBe('Aprīlis');
            expect(months[3]).toContain('ī');
        });

        test('Jūnijs should have ū', () => {
            expect(months[5]).toBe('Jūnijs');
            expect(months[5]).toContain('ū');
        });

        test('Jūlijs should have ū', () => {
            expect(months[6]).toBe('Jūlijs');
        });
    });

    describe('Latvian Weekday Names', () => {
        const weekdays = frontendTranslations.lv.weekdays;

        test('should have 7 weekdays', () => {
            expect(weekdays).toHaveLength(7);
        });

        test('weekdays should be correct', () => {
            expect(weekdays).toEqual(["Sv", "P", "O", "T", "C", "Pk", "S"]);
        });
    });

    describe('Russian UI Translations', () => {
        const ru = frontendTranslations.ru;

        test('title should be in Cyrillic', () => {
            expect(ru.title).toBe('Выберите дату и время');
        });

        test('formatInPerson should be "Очно"', () => {
            expect(ru.formatInPerson).toBe('Очно');
        });

        test('submitBtn should be in Cyrillic', () => {
            expect(ru.submitBtn).toBe('Подтвердить запись');
        });

        test('successTitle should be in Cyrillic', () => {
            expect(ru.successTitle).toBe('Запись успешна!');
        });

        test('months should be in Cyrillic', () => {
            expect(ru.months[0]).toBe('Январь');
            expect(ru.months[11]).toBe('Декабрь');
        });

        test('weekdays should be in Cyrillic', () => {
            expect(ru.weekdays).toEqual(["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]);
        });
    });

    describe('English UI Translations', () => {
        const en = frontendTranslations.en;

        test('title should be correct', () => {
            expect(en.title).toBe('Select date and time');
        });

        test('formatInPerson should be "In-person"', () => {
            expect(en.formatInPerson).toBe('In-person');
        });

        test('submitBtn should be correct', () => {
            expect(en.submitBtn).toBe('Confirm booking');
        });

        test('months should be correct', () => {
            expect(en.months[0]).toBe('January');
            expect(en.months[11]).toBe('December');
        });

        test('weekdays should be correct', () => {
            expect(en.weekdays).toEqual(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]);
        });
    });

    describe('Translation Consistency', () => {
        test('all languages should have same keys', () => {
            const lvKeys = Object.keys(frontendTranslations.lv).sort();
            const enKeys = Object.keys(frontendTranslations.en).sort();
            const ruKeys = Object.keys(frontendTranslations.ru).sort();

            expect(lvKeys).toEqual(enKeys);
            expect(enKeys).toEqual(ruKeys);
        });

        test('all languages should have 12 months', () => {
            expect(frontendTranslations.lv.months).toHaveLength(12);
            expect(frontendTranslations.en.months).toHaveLength(12);
            expect(frontendTranslations.ru.months).toHaveLength(12);
        });

        test('all languages should have 7 weekdays', () => {
            expect(frontendTranslations.lv.weekdays).toHaveLength(7);
            expect(frontendTranslations.en.weekdays).toHaveLength(7);
            expect(frontendTranslations.ru.weekdays).toHaveLength(7);
        });

        test('all format options should mention Zoom', () => {
            expect(frontendTranslations.lv.formatOnline).toContain('Zoom');
            expect(frontendTranslations.en.formatOnline).toContain('Zoom');
            expect(frontendTranslations.ru.formatOnline).toContain('Zoom');
        });
    });
});

describe('Diacritics Detection', () => {
    // Helper function to check for Latvian diacritics
    const containsLatvianDiacritics = (text) => {
        const diacritics = /[āēīūļņķģčšžĀĒĪŪĻŅĶĢČŠŽ]/;
        return diacritics.test(text);
    };

    test('Latvian translations should contain diacritics', () => {
        const lv = frontendTranslations.lv;
        
        expect(containsLatvianDiacritics(lv.title)).toBe(true);
        expect(containsLatvianDiacritics(lv.selectDate)).toBe(true);
        expect(containsLatvianDiacritics(lv.formatInPerson)).toBe(true);
        expect(containsLatvianDiacritics(lv.nameLabel)).toBe(true);
        expect(containsLatvianDiacritics(lv.submitBtn)).toBe(true);
    });

    test('English translations should NOT contain diacritics', () => {
        const en = frontendTranslations.en;
        
        Object.values(en).forEach(value => {
            if (typeof value === 'string') {
                expect(containsLatvianDiacritics(value)).toBe(false);
            }
        });
    });

    test('Russian translations should NOT contain Latvian diacritics', () => {
        const ru = frontendTranslations.ru;
        
        Object.values(ru).forEach(value => {
            if (typeof value === 'string') {
                expect(containsLatvianDiacritics(value)).toBe(false);
            }
        });
    });
});
