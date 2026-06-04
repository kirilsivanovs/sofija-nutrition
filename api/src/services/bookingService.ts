/**
 * BookingService (TypeScript)
 *
 * Business logic for booking operations.
 * Separates business logic from HTTP handlers for better testability and maintainability.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('../config');
const { branding, servicePrices } = config;
const API_BASE_URL = config.API_BASE_URL;

import translations from '../translations';
import {
  saveBooking,
  getBooking,
  updateBooking,
  generateBookingId,
  generatePaymentToken,
  isSlotBooked,
  acquireSlotLock,
  releaseSlotLock,
} from './bookingRepository';
import {
  sendClientConfirmation,
  sendAdminNotification,
  isConfigured,
  type EmailAttachment,
} from './emailService';
import { generateInvoicePDF } from './pdfService';
import {
  generateClientEmailHTML,
  generateAdminEmailHTML,
  generateCancellationEmailHTML,
} from '../templates/emailTemplates';
import { isLatvianHoliday } from './latvianHolidays';
import type { Booking, Language } from '../types';

// ============================================
// Types
// ============================================

export interface BookingInput {
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  serviceId: string;
  consultationFormat: string;
  notes?: string;
  language?: string;
  personalCode?: string;
}

export interface BookingResult {
  success: boolean;
  bookingId: string;
  message: string;
  booking: BookingData;
}

export interface BookingData {
  id: string;
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  serviceName: string;
  formatLabel: string;
  language: string;
  consultationFormat: string;
  price: number;
  paymentToken: string;
  paymentConfirmed: boolean;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface LoggingOptions {
  onLog?: (...args: unknown[]) => void;
  onWarn?: (...args: unknown[]) => void;
  onError?: (...args: unknown[]) => void;
}

export interface CancelOptions extends LoggingOptions {
  reason?: string;
}

export interface BookingErrorDetails {
  holiday?: string;
  errorLv?: string;
  errorRu?: string;
  errorEn?: string;
}

// ============================================
// Error Handling
// ============================================

/**
 * Error codes for booking operations
 */
export const BookingErrorCodes = {
  WEEKEND_NOT_ALLOWED: 'WEEKEND_NOT_ALLOWED',
  HOLIDAY_NOT_ALLOWED: 'HOLIDAY_NOT_ALLOWED',
  SLOT_BEING_BOOKED: 'SLOT_BEING_BOOKED',
  SLOT_ALREADY_BOOKED: 'SLOT_ALREADY_BOOKED',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  ALREADY_CANCELLED: 'ALREADY_CANCELLED',
  ALREADY_CONFIRMED: 'ALREADY_CONFIRMED',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const;

export type BookingErrorCode = (typeof BookingErrorCodes)[keyof typeof BookingErrorCodes];

/**
 * Custom error class for booking-related errors
 */
export class BookingError extends Error {
  public readonly code: BookingErrorCode;
  public readonly statusCode: number;
  public readonly details: BookingErrorDetails;

  constructor(
    message: string,
    code: BookingErrorCode,
    statusCode = 400,
    details: BookingErrorDetails = {}
  ) {
    super(message);
    this.name = 'BookingError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toResponse(): { status: number; jsonBody: Record<string, unknown> } {
    return {
      status: this.statusCode,
      jsonBody: {
        error: this.message,
        code: this.code,
        ...this.details,
      },
    };
  }
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validates that the booking date is not a weekend
 */
function validateNotWeekend(date: string): void {
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
        errorEn: 'Booking on weekends is not available',
      }
    );
  }
}

/**
 * Validates that the booking date is not a holiday
 */
function validateNotHoliday(date: string): void {
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
        errorEn: `Booking on holidays is not available: ${holidayCheck.name}`,
      }
    );
  }
}

// ============================================
// Booking Operations
// ============================================

/**
 * Creates a new booking
 */
export async function createBooking(
  bookingInput: BookingInput,
  options: LoggingOptions = {}
): Promise<BookingResult> {
  const log = options.onLog || console.log;
  const warn = options.onWarn || console.warn;
  const logError = options.onError || console.error;

  const {
    name,
    email,
    phone,
    date,
    time,
    serviceId,
    consultationFormat,
    notes,
    language,
    personalCode,
  } = bookingInput;

  // Validate date constraints
  validateNotWeekend(date);
  validateNotHoliday(date);

  // Acquire slot lock to prevent race conditions
  const lock = await acquireSlotLock(date, time);
  if (!lock.success) {
    throw new BookingError('Time slot is being booked', BookingErrorCodes.SLOT_BEING_BOOKED, 409, {
      errorLv: 'Šis laiks tiek rezervēts. Lūdzu, mēģiniet vēlreiz vai izvēlieties citu laiku.',
      errorRu: 'Это время бронируется. Пожалуйста, попробуйте снова или выберите другое время.',
      errorEn: 'This time slot is being booked. Please try again or choose another time.',
    });
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
          errorEn: 'This time slot is already booked. Please choose another time.',
        }
      );
    }

    // Get translation object
    const t = translations.getTranslation((language as Language) || 'lv');
    const langCode = ['lv', 'en', 'ru'].includes(language || '') ? language : 'lv';

    // Generate booking data
    const bookingId = generateBookingId();
    const paymentToken = generatePaymentToken(bookingId, email);

    const service = serviceId;
    const price = (servicePrices as Record<string, number>)[service] || 65;

    // Get localized service name and format label
    const serviceName = t.services[service as keyof typeof t.services] || service;
    const formatLabel = consultationFormat === 'online' ? t.formatOnline : t.formatInPerson;

    const bookingData: BookingData = {
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
      language: langCode as string,
      consultationFormat,
      price,
      paymentToken,
      paymentConfirmed: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      personalCode: personalCode || '',
      privacyConsentAt: new Date().toISOString(),
    };

    // Save to storage
    await saveBooking(bookingData);
    log(`Booking ${bookingId} saved`);

    // Generate PDF invoice
    let pdfBase64: Uint8Array | null = null;
    try {
      const pdfData = {
        bookingId: bookingData.bookingId,
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        personalCode: bookingData.personalCode as string | undefined,
        date: bookingData.date,
        time: bookingData.time,
        serviceName: bookingData.serviceName,
        formatLabel: bookingData.formatLabel,
        price: bookingData.price,
        t,
      };
      pdfBase64 = await generateInvoicePDF(pdfData);
      log('PDF invoice generated');
    } catch (pdfError: unknown) {
      const err = pdfError as { message?: string };
      warn('PDF generation failed:', err.message);
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
      booking: bookingData,
    };
  } finally {
    // Always release the lock
    if (lock.lockId) {
      await releaseSlotLock(date, time, lock.lockId);
    }
  }
}

/**
 * Sends booking confirmation emails to client and admin
 */
async function sendBookingEmails(
  bookingData: BookingData,
  t: ReturnType<typeof translations.getTranslation>,
  pdfBase64: Uint8Array | null,
  { log, logError }: { log: (...args: unknown[]) => void; logError: (...args: unknown[]) => void }
): Promise<void> {
  const { name, email, bookingId, serviceName, formatLabel, date, time, price, paymentToken } =
    bookingData;

  const confirmPaymentUrl = `${API_BASE_URL}/api/confirm-payment?token=${paymentToken}`;

  const displayData = {
    name,
    bookingId,
    serviceName,
    formatLabel,
    date,
    time,
    price,
  };

  // Send client confirmation email
  const clientEmailHtml = generateClientEmailHTML(t, displayData);
  const attachments: EmailAttachment[] = pdfBase64
    ? [
        {
          filename: `invoice-${bookingId}.pdf`,
          content: pdfBase64,
        },
      ]
    : [];

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
  } catch (err: unknown) {
    const error = err as { message?: string };
    logError('Client email error:', error.message);
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
  } catch (err: unknown) {
    const error = err as { message?: string };
    logError('Admin email error:', error.message);
  }
}

/**
 * Confirms payment for a booking
 */
export async function confirmPayment(
  token: string,
  options: LoggingOptions = {}
): Promise<{ success: boolean; bookingId: string }> {
  const log = options.onLog || console.log;

  if (!token) {
    throw new BookingError('Token is required', BookingErrorCodes.INVALID_TOKEN, 400);
  }

  // Find booking by token
  const booking = await getBooking(token);

  if (!booking) {
    throw new BookingError('Booking not found', BookingErrorCodes.BOOKING_NOT_FOUND, 404);
  }

  if (booking.paymentConfirmed) {
    throw new BookingError('Payment already confirmed', BookingErrorCodes.ALREADY_CONFIRMED, 400);
  }

  if (booking.status === 'cancelled') {
    throw new BookingError('Booking is cancelled', BookingErrorCodes.ALREADY_CANCELLED, 400);
  }

  // Update booking
  await updateBooking({
    ...booking,
    id: booking.rowKey || booking.id || '',
    date: booking.date,
    paymentConfirmed: true,
    status: 'confirmed' as const,
    confirmedAt: new Date().toISOString(),
  });

  log(`Payment confirmed for booking ${booking.rowKey || booking.id}`);

  return {
    success: true,
    bookingId: booking.rowKey || booking.id || '',
  };
}

/**
 * Cancels a booking
 */
export async function cancelBooking(
  bookingId: string,
  options: CancelOptions = {}
): Promise<{ success: boolean; bookingId: string }> {
  const log = options.onLog || console.log;
  const logError = options.onError || console.error;
  const reason = options.reason || 'Cancelled by admin';

  const booking = await getBooking(bookingId);

  if (!booking) {
    throw new BookingError('Booking not found', BookingErrorCodes.BOOKING_NOT_FOUND, 404);
  }

  if (booking.status === 'cancelled') {
    throw new BookingError('Booking already cancelled', BookingErrorCodes.ALREADY_CANCELLED, 400);
  }

  // Update booking status
  await updateBooking({
    ...booking,
    id: booking.rowKey || booking.id || '',
    date: booking.date,
    status: 'cancelled' as const,
    cancelledAt: new Date().toISOString(),
    cancelReason: reason,
  });

  log(`Booking ${bookingId} cancelled: ${reason}`);

  // Send cancellation email if configured
  if (isConfigured() && booking.email) {
    try {
      const t = translations.getTranslation((booking.language as Language) || 'lv');
      const emailHtml = generateCancellationEmailHTML(t, {
        id: booking.rowKey || booking.id || '',
        name: booking.name,
        email: booking.email,
        serviceName: booking.serviceName || booking.service,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        consultationFormat: booking.consultationFormat || 'online',
      });

      await sendClientConfirmation(
        booking.email,
        t.cancellationSubject
          ? t.cancellationSubject(bookingId)
          : `Rezervācija atcelta - ${bookingId}`,
        emailHtml
      );
      log(`Cancellation email sent to ${booking.email}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      logError(`Cancellation email failed for booking ${bookingId}:`, error.message);
    }
  }

  return {
    success: true,
    bookingId,
  };
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  createBooking,
  confirmPayment,
  cancelBooking,
  sendBookingEmails,
  BookingError,
  BookingErrorCodes,
};
