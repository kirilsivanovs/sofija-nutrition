/**
 * Translations module - exported for testing and reuse
 * Contains all text translations with proper Latvian diacritics (ā, ē, ī, ū, ļ, ņ, ķ, ģ, č, š, ž)
 */

const translations = {
    lv: {
        emailSubject: (id) => `Rezervācijas apstiprinājums - ${id}`,
        emailGreeting: (name) => `Labdien, ${name}!`,
        emailThankYou: 'Paldies par rezervāciju!',
        emailConfirmed: 'Jūsu rezervācija ir apstiprināta:',
        emailBookingId: 'Rezervācijas numurs',
        emailService: 'Pakalpojums',
        emailFormat: 'Formāts',
        emailDate: 'Datums',
        emailTime: 'Laiks',
        emailPrice: 'Cena',
        emailInvoiceAttached: 'Rēķins ir pievienots šim e-pastam.',
        emailQuestions: 'Ja jums ir jautājumi, lūdzu, sazinieties ar mums.',
        emailRegards: 'Ar cieņu,',
        emailSubtitle: 'Uztura speciāliste · PhD',
        formatOnline: 'Attālināti (Zoom/Google Meet)',
        formatInPerson: 'Klātienē',
        paymentConfirmedSubject: (id) => `Maksājums apstiprināts - ${id}`,
        paymentConfirmedTitle: 'Maksājums saņemts!',
        paymentConfirmedText: 'Paldies! Jūsu maksājums ir saņemts. Gaidām Jūs konsultācijā:',
        paymentWaitingText: 'Gaidām Jūs:',
        cancellationSubject: (id) => `Rezervācija atcelta - ${id}`,
        cancellationTitle: 'Rezervācija atcelta',
        cancellationText: 'Jūsu rezervācija ir atcelta.',
        cancellationDetails: 'Atceltās rezervācijas informācija:',
        cancellationQuestions: 'Ja vēlaties veikt jaunu rezervāciju vai jums ir jautājumi, lūdzu, sazinieties ar mums.',
        pdfSubtitle: 'Uztura speciāliste · PhD',
        pdfInvoice: 'RĒĶINS',
        pdfNumber: 'Numurs',
        pdfDate: 'Datums',
        pdfClient: 'Klients',
        pdfName: 'Vārds',
        pdfEmail: 'E-pasts',
        pdfPhone: 'Telefons',
        pdfFormat: 'Formāts',
        pdfService: 'Pakalpojums',
        pdfTime: 'Laiks',
        pdfPrice: 'Cena',
        pdfTotal: 'KOPĀ',
        pdfPaymentInfo: 'Maksājuma informācija',
        pdfBank: 'Banka',
        pdfReference: 'Maksājuma mērķis',
        pdfNotes: 'Piezīmes',
        pdfThankYou: 'Paldies, ka izvēlējāties mūs!',
        pdfNotProvided: 'Nav norādīts',
        services: {
            'initial': 'Sākotnējā konsultācija',
            'followup': 'Atkārtota konsultācija',
            'package3': '3 konsultāciju pakete',
            'package5': '5 konsultāciju pakete',
            'cgm-diagnostic': 'CGM diagnostikas programma',
            'consultation': 'Uztura konsultācija',
            'free-consultation': 'Bezmaksas 15 min konsultācija'
        }
    },
    en: {
        emailSubject: (id) => `Booking Confirmation - ${id}`,
        emailGreeting: (name) => `Hello, ${name}!`,
        emailThankYou: 'Thank you for your booking!',
        emailConfirmed: 'Your booking has been confirmed:',
        emailBookingId: 'Booking ID',
        emailService: 'Service',
        emailFormat: 'Format',
        emailDate: 'Date',
        emailTime: 'Time',
        emailPrice: 'Price',
        emailInvoiceAttached: 'The invoice is attached to this email.',
        emailQuestions: 'If you have any questions, please contact us.',
        emailRegards: 'Best regards,',
        emailSubtitle: 'Nutrition Specialist · PhD',
        formatOnline: 'Online (Zoom/Google Meet)',
        formatInPerson: 'In-person',
        paymentConfirmedSubject: (id) => `Payment Confirmed - ${id}`,
        paymentConfirmedTitle: 'Payment Received!',
        paymentConfirmedText: 'Thank you! Your payment has been received. We look forward to seeing you:',
        paymentWaitingText: 'We look forward to seeing you:',
        cancellationSubject: (id) => `Booking Cancelled - ${id}`,
        cancellationTitle: 'Booking Cancelled',
        cancellationText: 'Your booking has been cancelled.',
        cancellationDetails: 'Cancelled booking details:',
        cancellationQuestions: 'If you would like to make a new booking or have any questions, please contact us.',
        pdfSubtitle: 'Nutrition Specialist · PhD',
        pdfInvoice: 'INVOICE',
        pdfNumber: 'Number',
        pdfDate: 'Date',
        pdfClient: 'Client',
        pdfName: 'Name',
        pdfEmail: 'Email',
        pdfPhone: 'Phone',
        pdfFormat: 'Format',
        pdfService: 'Service',
        pdfTime: 'Time',
        pdfPrice: 'Price',
        pdfTotal: 'TOTAL',
        pdfPaymentInfo: 'Payment Information',
        pdfBank: 'Bank',
        pdfReference: 'Reference',
        pdfNotes: 'Notes',
        pdfThankYou: 'Thank you for choosing us!',
        pdfNotProvided: 'Not provided',
        services: {
            'initial': 'Initial Consultation',
            'followup': 'Follow-up Consultation',
            'package3': '3 Consultation Package',
            'package5': '5 Consultation Package',
            'cgm-diagnostic': 'CGM Diagnostic Program',
            'consultation': 'Nutrition Consultation',
            'free-consultation': 'Free 15-min Consultation'
        }
    },
    ru: {
        emailSubject: (id) => `Подтверждение бронирования - ${id}`,
        emailGreeting: (name) => `Здравствуйте, ${name}!`,
        emailThankYou: 'Спасибо за бронирование!',
        emailConfirmed: 'Ваше бронирование подтверждено:',
        emailBookingId: 'Номер бронирования',
        emailService: 'Услуга',
        emailFormat: 'Формат',
        emailDate: 'Дата',
        emailTime: 'Время',
        emailPrice: 'Цена',
        emailInvoiceAttached: 'Счёт прикреплён к этому письму.',
        emailQuestions: 'Если у вас есть вопросы, пожалуйста, свяжитесь с нами.',
        emailRegards: 'С уважением,',
        emailSubtitle: 'Специалист по питанию · PhD',
        formatOnline: 'Онлайн (Zoom/Google Meet)',
        formatInPerson: 'Очно',
        paymentConfirmedSubject: (id) => `Оплата подтверждена - ${id}`,
        paymentConfirmedTitle: 'Оплата получена!',
        paymentConfirmedText: 'Спасибо! Ваша оплата получена. Ждём вас на консультации:',
        paymentWaitingText: 'Ждём вас:',
        cancellationSubject: (id) => `Бронирование отменено - ${id}`,
        cancellationTitle: 'Бронирование отменено',
        cancellationText: 'Ваше бронирование было отменено.',
        cancellationDetails: 'Информация об отменённом бронировании:',
        cancellationQuestions: 'Если вы хотите сделать новое бронирование или у вас есть вопросы, пожалуйста, свяжитесь с нами.',
        pdfSubtitle: 'Специалист по питанию · PhD',
        pdfInvoice: 'СЧЁТ',
        pdfNumber: 'Номер',
        pdfDate: 'Дата',
        pdfClient: 'Клиент',
        pdfName: 'Имя',
        pdfEmail: 'Email',
        pdfPhone: 'Телефон',
        pdfFormat: 'Формат',
        pdfService: 'Услуга',
        pdfTime: 'Время',
        pdfPrice: 'Цена',
        pdfTotal: 'ИТОГО',
        pdfPaymentInfo: 'Платёжная информация',
        pdfBank: 'Банк',
        pdfReference: 'Назначение платежа',
        pdfNotes: 'Примечания',
        pdfThankYou: 'Спасибо, что выбрали нас!',
        pdfNotProvided: 'Не указано',
        services: {
            'initial': 'Первичная консультация',
            'followup': 'Повторная консультация',
            'package3': 'Пакет из 3 консультаций',
            'package5': 'Пакет из 5 консультаций',
            'cgm-diagnostic': 'Программа CGM диагностики',
            'consultation': 'Консультация по питанию',
            'free-consultation': 'Бесплатная 15-мин консультация'
        }
    }
};

const servicePrices = {
    'initial': 65,
    'followup': 45,
    'package3': 150,
    'package5': 220,
    'cgm-diagnostic': 150,
    'consultation': 80,
    'free-consultation': 0
};

// Latvian diacritical characters for validation
const latvianDiacritics = ['ā', 'ē', 'ī', 'ū', 'ļ', 'ņ', 'ķ', 'ģ', 'č', 'š', 'ž', 'Ā', 'Ē', 'Ī', 'Ū', 'Ļ', 'Ņ', 'Ķ', 'Ģ', 'Č', 'Š', 'Ž'];

// Russian Cyrillic characters for validation
const russianCyrillic = ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я'];

/**
 * Get translation object for a language
 * @param {string} lang - Language code (lv, en, ru)
 * @returns {Object} - Translation object with all strings and functions
 */
function getTranslation(lang) {
    const langCode = ['lv', 'en', 'ru'].includes(lang) ? lang : 'lv';
    return translations[langCode];
}

module.exports = {
    translations,
    servicePrices,
    latvianDiacritics,
    russianCyrillic,
    getTranslation
};
