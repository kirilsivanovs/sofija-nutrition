/**
 * Translations module - exported for testing and reuse
 * Uses shared translations as single source of truth
 * Provides backward-compatible API for existing code
 */

// Use require for shared module to avoid TypeScript compilation issues
// The shared translations file is copied into dist/ during build
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sharedTranslations } = require('./shared-translations');

export interface TranslationStrings {
    // Email translations
    emailSubject: (id: string) => string;
    emailGreeting: (name: string) => string;
    emailThankYou: string;
    emailConfirmed: string;
    emailBookingId: string;
    emailService: string;
    emailFormat: string;
    emailDate: string;
    emailTime: string;
    emailPrice: string;
    emailInvoiceAttached: string;
    emailQuestions: string;
    emailRegards: string;
    emailSubtitle: string;
    
    // Formats
    formatOnline: string;
    formatInPerson: string;
    
    // Payment
    paymentConfirmedSubject: (id: string) => string;
    paymentConfirmedTitle: string;
    paymentConfirmedText: string;
    paymentWaitingText: string;
    
    // Cancellation
    cancellationSubject: (id: string) => string;
    cancellationTitle: string;
    cancellationText: string;
    cancellationDetails: string;
    cancellationQuestions: string;
    
    // PDF
    pdfSubtitle: string;
    pdfInvoice: string;
    pdfNumber: string;
    pdfDate: string;
    pdfClient: string;
    pdfName: string;
    pdfEmail: string;
    pdfPhone: string;
    pdfFormat: string;
    pdfService: string;
    pdfTime: string;
    pdfPrice: string;
    pdfTotal: string;
    pdfPaymentInfo: string;
    pdfBank: string;
    pdfReference: string;
    pdfNotes: string;
    pdfThankYou: string;
    pdfNotProvided: string;
    
    // Services
    services: Record<string, string>;
}

export interface TranslationsMap {
    lv: TranslationStrings;
    en: TranslationStrings;
    ru: TranslationStrings;
}

interface SharedTranslationLang {
    email: {
        subject: (id: string) => string;
        greeting: (name: string) => string;
        thankYou: string;
        confirmed: string;
        bookingId: string;
        service: string;
        format: string;
        date: string;
        time: string;
        price: string;
        invoiceAttached: string;
        questions: string;
        regards: string;
        subtitle: string;
    };
    format: {
        online: string;
        inPerson: string;
    };
    payment: {
        confirmedSubject: (id: string) => string;
        confirmedTitle: string;
        confirmedText: string;
        waitingText: string;
    };
    cancellation: {
        subject: (id: string) => string;
        title: string;
        text: string;
        details: string;
        questions: string;
    };
    pdf: {
        subtitle: string;
        invoice: string;
        number: string;
        date: string;
        client: string;
        name: string;
        email: string;
        phone: string;
        format: string;
        service: string;
        time: string;
        price: string;
        total: string;
        paymentInfo: string;
        bank: string;
        reference: string;
        notes: string;
        thankYou: string;
        notProvided: string;
    };
    services: Record<string, string>;
}

/**
 * Convert shared translations to legacy flat format for backward compatibility
 */
function toLegacyFormat(lang: 'lv' | 'en' | 'ru'): TranslationStrings {
    const t: SharedTranslationLang = sharedTranslations[lang];
    
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
export const translations: TranslationsMap = {
    lv: toLegacyFormat('lv'),
    en: toLegacyFormat('en'),
    ru: toLegacyFormat('ru')
};

export const servicePrices: Record<string, number> = {
    'initial': 65,
    'followup': 45,
    'package3': 150,
    'package5': 220,
    'cgm-diagnostic': 150,
    'consultation': 80,
    'free-consultation': 0
};

// Latvian diacritical characters for validation
export const latvianDiacritics: string[] = [
    'ā', 'ē', 'ī', 'ū', 'ļ', 'ņ', 'ķ', 'ģ', 'č', 'š', 'ž', 
    'Ā', 'Ē', 'Ī', 'Ū', 'Ļ', 'Ņ', 'Ķ', 'Ģ', 'Č', 'Š', 'Ž'
];

// Russian Cyrillic characters for validation
export const russianCyrillic: string[] = [
    'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 
    'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 
    'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я'
];

/**
 * Get translation object for a language
 * @param lang - Language code (lv, en, ru)
 * @returns Translation object with all strings and functions
 */
export function getTranslation(lang: string): TranslationStrings {
    const langCode = (['lv', 'en', 'ru'].includes(lang) ? lang : 'lv') as keyof TranslationsMap;
    return translations[langCode];
}

export default {
    translations,
    servicePrices,
    latvianDiacritics,
    russianCyrillic,
    getTranslation
};
