/**
 * Translations module - exported for testing and reuse
 * Uses shared translations as single source of truth
 * Provides backward-compatible API for existing code
 */

const { sharedTranslations, commonData } = require('../../shared/translations');

/**
 * Convert shared translations to legacy flat format for backward compatibility
 */
function toLegacyFormat(lang) {
    const t = sharedTranslations[lang];
    
    return {
        // Email translations
        emailSubject: t.email.subject,
        emailGreeting: t.email.greeting,
        emailThankYou: t.email.thankYou,
        emailConfirmed: t.email.confirmed,
        emailBookingId: t.email.bookingId,
        emailService: t.email.service,
        emailFormat: t.email.format,
        emailDate: t.email.date,
        emailTime: t.email.time,
        emailPrice: t.email.price,
        emailInvoiceAttached: t.email.invoiceAttached,
        emailQuestions: t.email.questions,
        emailRegards: t.email.regards,
        emailSubtitle: t.email.subtitle,
        
        // Formats
        formatOnline: t.format.online,
        formatInPerson: t.format.inPerson,
        
        // Payment
        paymentConfirmedSubject: t.payment.confirmedSubject,
        paymentConfirmedTitle: t.payment.confirmedTitle,
        paymentConfirmedText: t.payment.confirmedText,
        paymentWaitingText: t.payment.waitingText,
        
        // Cancellation
        cancellationSubject: t.cancellation.subject,
        cancellationTitle: t.cancellation.title,
        cancellationText: t.cancellation.text,
        cancellationDetails: t.cancellation.details,
        cancellationQuestions: t.cancellation.questions,
        
        // PDF
        pdfSubtitle: t.pdf.subtitle,
        pdfInvoice: t.pdf.invoice,
        pdfNumber: t.pdf.number,
        pdfDate: t.pdf.date,
        pdfClient: t.pdf.client,
        pdfName: t.pdf.name,
        pdfEmail: t.pdf.email,
        pdfPhone: t.pdf.phone,
        pdfFormat: t.pdf.format,
        pdfService: t.pdf.service,
        pdfTime: t.pdf.time,
        pdfPrice: t.pdf.price,
        pdfTotal: t.pdf.total,
        pdfPaymentInfo: t.pdf.paymentInfo,
        pdfBank: t.pdf.bank,
        pdfReference: t.pdf.reference,
        pdfNotes: t.pdf.notes,
        pdfThankYou: t.pdf.thankYou,
        pdfNotProvided: t.pdf.notProvided,
        
        // Services
        services: t.services
    };
}

// Build legacy translations object
const translations = {
    lv: toLegacyFormat('lv'),
    en: toLegacyFormat('en'),
    ru: toLegacyFormat('ru')
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
