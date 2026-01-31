/**
 * BookingService - Business logic for booking operations
 * 
 * Separates business logic from HTTP handlers for better testability and maintainability.
 */

const config = require('../config');
const translations = require('../translations');
const { 
    saveBooking, 
    getBooking,
    updateBooking,
    generateBookingId, 
    generatePaymentToken, 
    isSlotBooked, 
    acquireSlotLock, 
    releaseSlotLock 
} = require('./bookingRepository');
const { sendClientConfirmation, sendAdminNotification, isConfigured } = require('./emailService');
const { generateInvoicePDF } = require('./pdfService');
const { generateClientEmailHTML, generateAdminEmailHTML, generateCancellationEmailHTML } = require('../templates/emailTemplates');
const { isLatvianHoliday } = require('./latvianHolidays');

/**
 * Custom error class for booking-related errors
 */
class BookingError extends Error {
    constructor(message, code, statusCode = 400, details = {}) {
        super(message);
        this.name = 'BookingError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }

    toResponse() {
        return {
            status: this.statusCode,
            jsonBody: {
                error: this.message,
                code: this.code,
                ...this.details
            }
        };
    }
}

/**
 * Error codes for booking operations
 */
const BookingErrorCodes = {
    WEEKEND_NOT_ALLOWED: 'WEEKEND_NOT_ALLOWED',
    HOLIDAY_NOT_ALLOWED: 'HOLIDAY_NOT_ALLOWED',
    SLOT_BEING_BOOKED: 'SLOT_BEING_BOOKED',
    SLOT_ALREADY_BOOKED: 'SLOT_ALREADY_BOOKED',
    BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
    ALREADY_CANCELLED: 'ALREADY_CANCELLED',
    ALREADY_CONFIRMED: 'ALREADY_CONFIRMED',
    INVALID_TOKEN: 'INVALID_TOKEN'
};

/**
 * Validates that the booking date is not a weekend
 */
function validateNotWeekend(date) {
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new BookingError(
            'Weekend booking not allowed',
            BookingErrorCodes.WEEKEND_NOT_ALLOWED,
            400,
            {
                errorLv: 'Brīvdienās pieraksts nav iespējams',
                errorRu: 'Запись в выходные дни недоступна',
                errorEn: 'Booking on weekends is not available'
            }
        );
    }
}

/**
 * Validates that the booking date is not a holiday
 */
function validateNotHoliday(date) {
    const holidayCheck = isLatvianHoliday(date);
    
    if (holidayCheck.isHoliday) {
        throw new BookingError(
            'Holiday booking not allowed',
            BookingErrorCodes.HOLIDAY_NOT_ALLOWED,
            400,
            {
                holiday: holidayCheck.name,
                errorLv: `Svētku dienā pieraksts nav iespējams: ${holidayCheck.name}`,
                errorRu: `Запись в праздничный день недоступна: ${holidayCheck.name}`,
                errorEn: `Booking on holidays is not available: ${holidayCheck.name}`
            }
        );
    }
}

/**
 * Creates a new booking
 * 
 * @param {Object} bookingInput - Validated and sanitized booking input
 * @param {Object} options - Optional configuration
 * @param {Function} options.onLog - Logging callback
 * @param {Function} options.onWarn - Warning callback
 * @param {Function} options.onError - Error callback
 * @returns {Promise<Object>} Created booking result
 */
async function createBooking(bookingInput, options = {}) {
    const log = options.onLog || console.log;
    const warn = options.onWarn || console.warn;
    const logError = options.onError || console.error;

    const { name, email, phone, date, time, serviceId, consultationFormat, notes, language } = bookingInput;

    // Validate date constraints
    validateNotWeekend(date);
    validateNotHoliday(date);

    // Acquire slot lock to prevent race conditions
    const lock = await acquireSlotLock(date, time);
    if (!lock.success) {
        throw new BookingError(
            'Time slot is being booked',
            BookingErrorCodes.SLOT_BEING_BOOKED,
            409,
            {
                errorLv: 'Šis laiks tiek rezervēts. Lūdzu, mēģiniet vēlreiz vai izvēlieties citu laiku.',
                errorRu: 'Это время бронируется. Пожалуйста, попробуйте снова или выберите другое время.',
                errorEn: 'This time slot is being booked. Please try again or choose another time.'
            }
        );
    }

    try {
        // Check if slot is already booked (inside lock)
        const slotTaken = await isSlotBooked(date, time);
        if (slotTaken) {
            throw new BookingError(
                'Time slot already booked',
                BookingErrorCodes.SLOT_ALREADY_BOOKED,
                409,
                {
                    errorLv: 'Šis laiks jau ir aizņemts. Lūdzu, izvēlieties citu laiku.',
                    errorRu: 'Это время уже занято. Пожалуйста, выберите другое время.',
                    errorEn: 'This time slot is already booked. Please choose another time.'
                }
            );
        }

        // Get translation object
        const t = translations.getTranslation(language);
        const langCode = ['lv', 'en', 'ru'].includes(language) ? language : 'lv';

        // Generate booking data
        const bookingId = generateBookingId();
        const paymentToken = generatePaymentToken(bookingId);
        
        const service = serviceId;
        const price = config.servicePrices[service] || 65;
        
        // Get localized service name and format label
        const serviceName = t.services[service] || service;
        const formatLabel = consultationFormat === 'online' ? t.formatOnline : t.formatInPerson;
        
        const bookingData = {
            id: bookingId,
            bookingId,
            name,
            email,
            phone: phone || '',
            date,
            time,
            service,
            serviceName,
            formatLabel,
            language: langCode,
            consultationFormat,
            price,
            paymentToken,
            paymentConfirmed: false,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Save to storage
        const storageData = { ...bookingData };
        await saveBooking(storageData);
        log(`Booking ${bookingId} saved`);

        // Generate PDF invoice
        let pdfBase64 = null;
        try {
            const pdfData = { ...bookingData, t };
            pdfBase64 = await generateInvoicePDF(pdfData);
            log('PDF invoice generated');
        } catch (pdfError) {
            warn('PDF generation failed:', pdfError.message);
        }

        // Send emails if configured
        if (isConfigured()) {
            await sendBookingEmails(bookingData, t, pdfBase64, { log, logError });
        } else {
            warn('Email service not configured - skipping emails');
        }

        return {
            success: true,
            bookingId,
            message: t.emailThankYou,
            booking: bookingData
        };

    } finally {
        // Always release the lock
        await releaseSlotLock(date, time, lock.lockId);
    }
}

/**
 * Sends booking confirmation emails to client and admin
 */
async function sendBookingEmails(bookingData, t, pdfBase64, { log, logError }) {
    const { name, email, bookingId, serviceName, formatLabel, date, time, price, paymentToken } = bookingData;
    
    const confirmPaymentUrl = `${config.API_BASE_URL}/api/confirm-payment?token=${paymentToken}`;
    
    const displayData = {
        name,
        bookingId,
        serviceName,
        formatLabel,
        date,
        time,
        price
    };
    
    // Send client confirmation email
    const clientEmailHtml = generateClientEmailHTML(t, displayData);
    const attachments = pdfBase64 ? [{
        filename: `invoice-${bookingId}.pdf`,
        content: pdfBase64
    }] : [];

    try {
        const clientResult = await sendClientConfirmation(
            email,
            t.emailSubject(bookingId),
            clientEmailHtml,
            attachments
        );
        if (clientResult.success) {
            log('Client email sent successfully, id:', clientResult.id);
        } else {
            logError('Client email failed:', clientResult.error);
        }
    } catch (err) {
        logError('Client email error:', err.message);
    }

    // Send admin notification
    try {
        const adminEmailHtml = generateAdminEmailHTML(bookingData, confirmPaymentUrl);
        const adminResult = await sendAdminNotification(
            `Jauna rezervācija - ${bookingId}`,
            adminEmailHtml
        );
        if (adminResult.success) {
            log('Admin email sent successfully, id:', adminResult.id);
        } else {
            logError('Admin email failed:', adminResult.error);
        }
    } catch (err) {
        logError('Admin email error:', err.message);
    }
}

/**
 * Confirms payment for a booking
 * 
 * @param {string} token - Payment token
 * @param {Object} options - Logging options
 * @returns {Promise<Object>} Confirmation result
 */
async function confirmPayment(token, options = {}) {
    const log = options.onLog || console.log;

    if (!token) {
        throw new BookingError(
            'Token is required',
            BookingErrorCodes.INVALID_TOKEN,
            400
        );
    }

    // Find booking by token
    const booking = await getBooking(token);
    
    if (!booking) {
        throw new BookingError(
            'Booking not found',
            BookingErrorCodes.BOOKING_NOT_FOUND,
            404
        );
    }

    if (booking.paymentConfirmed) {
        throw new BookingError(
            'Payment already confirmed',
            BookingErrorCodes.ALREADY_CONFIRMED,
            400
        );
    }

    if (booking.status === 'cancelled') {
        throw new BookingError(
            'Booking is cancelled',
            BookingErrorCodes.ALREADY_CANCELLED,
            400
        );
    }

    // Update booking
    await updateBooking(booking.id, {
        paymentConfirmed: true,
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
    });

    log(`Payment confirmed for booking ${booking.id}`);

    return {
        success: true,
        bookingId: booking.id
    };
}

/**
 * Cancels a booking
 * 
 * @param {string} bookingId - Booking ID
 * @param {Object} options - Options including reason
 * @returns {Promise<Object>} Cancellation result
 */
async function cancelBooking(bookingId, options = {}) {
    const log = options.onLog || console.log;
    const reason = options.reason || 'Cancelled by admin';

    const booking = await getBooking(bookingId);
    
    if (!booking) {
        throw new BookingError(
            'Booking not found',
            BookingErrorCodes.BOOKING_NOT_FOUND,
            404
        );
    }

    if (booking.status === 'cancelled') {
        throw new BookingError(
            'Booking already cancelled',
            BookingErrorCodes.ALREADY_CANCELLED,
            400
        );
    }

    // Update booking status
    await updateBooking(bookingId, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason
    });

    log(`Booking ${bookingId} cancelled: ${reason}`);

    // Send cancellation email if configured
    if (isConfigured() && booking.email) {
        try {
            const t = translations.getTranslation(booking.language || 'lv');
            const emailHtml = generateCancellationEmailHTML(t, {
                name: booking.name,
                bookingId: booking.id,
                serviceName: booking.serviceName,
                date: booking.date,
                time: booking.time,
                reason
            });
            
            await sendClientConfirmation(
                booking.email,
                t.cancellationSubject ? t.cancellationSubject(bookingId) : `Rezervācija atcelta - ${bookingId}`,
                emailHtml
            );
            log(`Cancellation email sent to ${booking.email}`);
        } catch (err) {
            console.error('Cancellation email error:', err.message);
        }
    }

    return {
        success: true,
        bookingId
    };
}

module.exports = {
    createBooking,
    confirmPayment,
    cancelBooking,
    sendBookingEmails,
    BookingError,
    BookingErrorCodes
};
