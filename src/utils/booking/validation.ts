/**
 * Booking Validation Utilities
 * 
 * SOLID: Single Responsibility - only validates booking data
 * DRY: Centralized validation logic
 */

import { VALIDATION, BOOKING_CONFIG } from '../constants';
import type { ValidationError } from '../errors';
import { createValidationError } from '../errors';

// ============================================
// Field Validators
// ============================================

/**
 * Validate name field
 */
export function validateName(name: string): ValidationError | null {
    if (!name || name.trim().length === 0) {
        return createValidationError('name', 'Vārds ir obligāts');
    }

    if (name.length < VALIDATION.NAME.MIN_LENGTH) {
        return createValidationError(
            'name',
            `Vārdam jābūt vismaz ${VALIDATION.NAME.MIN_LENGTH} rakstzīmēm`
        );
    }

    if (name.length > VALIDATION.NAME.MAX_LENGTH) {
        return createValidationError(
            'name',
            `Vārds nedrīkst pārsniegt ${VALIDATION.NAME.MAX_LENGTH} rakstzīmes`
        );
    }

    if (!VALIDATION.NAME.PATTERN.test(name)) {
        return createValidationError(
            'name',
            'Vārdā var izmantot tikai burtus, atstarpes un defises'
        );
    }

    return null;
}

/**
 * Validate email field
 */
export function validateEmail(email: string): ValidationError | null {
    if (!email || email.trim().length === 0) {
        return createValidationError('email', 'E-pasts ir obligāts');
    }

    if (email.length > VALIDATION.EMAIL.MAX_LENGTH) {
        return createValidationError(
            'email',
            `E-pasts nedrīkst pārsniegt ${VALIDATION.EMAIL.MAX_LENGTH} rakstzīmes`
        );
    }

    if (!VALIDATION.EMAIL.PATTERN.test(email)) {
        return createValidationError('email', VALIDATION.EMAIL.ERROR_MESSAGE);
    }

    return null;
}

/**
 * Validate phone field (optional)
 */
export function validatePhone(phone: string | undefined): ValidationError | null {
    if (!phone || phone.trim().length === 0) {
        return null; // Phone is optional
    }

    if (phone.length < VALIDATION.PHONE.MIN_LENGTH) {
        return createValidationError(
            'phone',
            `Tālrunim jābūt vismaz ${VALIDATION.PHONE.MIN_LENGTH} cipariem`
        );
    }

    if (phone.length > VALIDATION.PHONE.MAX_LENGTH) {
        return createValidationError(
            'phone',
            `Tālrunis nedrīkst pārsniegt ${VALIDATION.PHONE.MAX_LENGTH} rakstzīmes`
        );
    }

    if (!VALIDATION.PHONE.PATTERN.test(phone)) {
        return createValidationError('phone', VALIDATION.PHONE.ERROR_MESSAGE);
    }

    return null;
}

/**
 * Validate message field (optional)
 */
export function validateMessage(message: string | undefined): ValidationError | null {
    if (!message || message.trim().length === 0) {
        return null; // Message is optional
    }

    if (message.length > VALIDATION.MESSAGE.MAX_LENGTH) {
        return createValidationError(
            'message',
            `Ziņojums nedrīkst pārsniegt ${VALIDATION.MESSAGE.MAX_LENGTH} rakstzīmes`
        );
    }

    return null;
}

/**
 * Validate service selection
 */
export function validateService(serviceId: string | undefined): ValidationError | null {
    if (!serviceId || serviceId.trim().length === 0) {
        return createValidationError('service', 'Lūdzu, izvēlieties pakalpojumu');
    }

    return null;
}

/**
 * Validate date selection
 */
export function validateDate(date: string | undefined): ValidationError | null {
    if (!date || date.trim().length === 0) {
        return createValidationError('date', 'Lūdzu, izvēlieties datumu');
    }

    // Check if date is valid ISO format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return createValidationError('date', 'Nepareizs datuma formāts');
    }

    // Check if date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return createValidationError('date', 'Nevar izvēlēties pagātnes datumu');
    }

    // Check if date is not too far in the future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + BOOKING_CONFIG.MAX_BOOKING_DAYS_AHEAD);

    if (selectedDate > maxDate) {
        return createValidationError(
            'date',
            `Ierakstu var veikt ne vairāk kā ${BOOKING_CONFIG.MAX_BOOKING_DAYS_AHEAD} dienas uz priekšu`
        );
    }

    return null;
}

/**
 * Validate time selection
 */
export function validateTime(time: string | undefined): ValidationError | null {
    if (!time || time.trim().length === 0) {
        return createValidationError('time', 'Lūdzu, izvēlieties laiku');
    }

    // Check if time is valid HH:MM format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
        return createValidationError('time', 'Nepareizs laika formāts');
    }

    return null;
}

/**
 * Validate consultation format
 */
export function validateFormat(format: string | undefined): ValidationError | null {
    if (!format || format.trim().length === 0) {
        return createValidationError('format', 'Lūdzu, izvēlieties konsultācijas formātu');
    }

    if (format !== 'online' && format !== 'in-person') {
        return createValidationError('format', 'Nepareizs konsultācijas formāts');
    }

    return null;
}

// ============================================
// Combined Validation
// ============================================

export interface BookingFormData {
    service?: string;
    date?: string;
    time?: string;
    consultationFormat?: string;
    name?: string;
    email?: string;
    phone?: string;
    personalCode?: string;
    message?: string;
}

/**
 * Validate all booking form fields
 */
export function validateBookingForm(data: BookingFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    const serviceError = validateService(data.service);
    if (serviceError) errors.push(serviceError);

    const dateError = validateDate(data.date);
    if (dateError) errors.push(dateError);

    const timeError = validateTime(data.time);
    if (timeError) errors.push(timeError);

    const formatError = validateFormat(data.consultationFormat);
    if (formatError) errors.push(formatError);

    const nameError = validateName(data.name || '');
    if (nameError) errors.push(nameError);

    const emailError = validateEmail(data.email || '');
    if (emailError) errors.push(emailError);

    const phoneError = validatePhone(data.phone);
    if (phoneError) errors.push(phoneError);

    const messageError = validateMessage(data.message);
    if (messageError) errors.push(messageError);

    return errors;
}

/**
 * Check if booking form is valid
 */
export function isBookingFormValid(data: BookingFormData): boolean {
    return validateBookingForm(data).length === 0;
}
