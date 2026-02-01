/**
 * Error Handling Utilities
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles error formatting and display
 * - Dependency Inversion: Works with abstract Error interface
 * 
 * DRY Principle: Centralized error handling logic
 */

import { ERROR_CODES } from './constants';
import type { ErrorCode } from './constants';

// ============================================
// Error Types
// ============================================

export interface AppError {
    message: string;
    code?: ErrorCode;
    status?: number;
    details?: unknown;
}

export interface ValidationError {
    field: string;
    message: string;
}

// ============================================
// Error Formatting
// ============================================

/**
 * Format error for user display
 */
export function formatError(error: unknown): string {
    if (isAppError(error)) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'Notikusi neparedzēta kļūda. Lūdzu, mēģiniet vēlreiz.';
}

/**
 * Get error code from error
 */
export function getErrorCode(error: unknown): ErrorCode | undefined {
    if (isAppError(error)) {
        return error.code;
    }

    return undefined;
}

/**
 * Check if error has specific code
 */
export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
    return getErrorCode(error) === code;
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as AppError).message === 'string'
    );
}

// ============================================
// User-Friendly Error Messages
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
    [ERROR_CODES.VALIDATION_ERROR]: 'Lūdzu, pārbaudiet ievadītos datus',
    [ERROR_CODES.SLOT_TAKEN]: 'Šis laiks jau ir aizņemts. Lūdzu, izvēlieties citu.',
    [ERROR_CODES.SLOT_LOCKED]: 'Šo laiku šobrīd rezervē cits lietotājs. Lūdzu, uzgaidiet vai izvēlieties citu laiku.',
    [ERROR_CODES.NETWORK_ERROR]: 'Savienojuma kļūda. Lūdzu, pārbaudiet interneta savienojumu.',
    [ERROR_CODES.TIMEOUT]: 'Pieprasījums pārsniedza laika limitu. Lūdzu, mēģiniet vēlreiz.',
    [ERROR_CODES.UNAUTHORIZED]: 'Nepieciešama autorizācija',
    [ERROR_CODES.FORBIDDEN]: 'Jums nav piekļuves tiesību',
    [ERROR_CODES.NOT_FOUND]: 'Pieprasītais resurss nav atrasts',
    [ERROR_CODES.INTERNAL_ERROR]: 'Servera kļūda. Lūdzu, mēģiniet vēlāk.',
    [ERROR_CODES.RATE_LIMIT]: 'Pārāk daudz pieprasījumu. Lūdzu, uzgaidiet.',
};

/**
 * Get user-friendly error message by code
 */
export function getErrorMessage(code: ErrorCode): string {
    return ERROR_MESSAGES[code] || 'Notikusi kļūda';
}

/**
 * Format error with user-friendly message
 */
export function formatErrorWithCode(error: unknown): string {
    const code = getErrorCode(error);
    
    if (code && ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code];
    }

    return formatError(error);
}

// ============================================
// Validation Error Handling
// ============================================

/**
 * Create validation error
 */
export function createValidationError(field: string, message: string): ValidationError {
    return { field, message };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
        return errors[0].message;
    }

    return errors.map(e => `• ${e.message}`).join('\n');
}

/**
 * Check if errors contain specific field
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
    return errors.some(e => e.field === field);
}

/**
 * Get error message for specific field
 */
export function getFieldError(errors: ValidationError[], field: string): string | undefined {
    return errors.find(e => e.field === field)?.message;
}

// ============================================
// Error Logging
// ============================================

/**
 * Log error to console (can be extended to send to logging service)
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
        console.error('Error occurred:', error);
        if (context) {
            console.error('Context:', context);
        }
    }

    // In production, you could send to error tracking service
    // e.g., Sentry, LogRocket, etc.
}

/**
 * Log validation errors
 */
export function logValidationErrors(errors: ValidationError[], context?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
        console.warn('Validation errors:', errors);
        if (context) {
            console.warn('Context:', context);
        }
    }
}

// ============================================
// Error Recovery
// ============================================

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
    const code = getErrorCode(error);
    
    if (!code) return true; // Unknown errors are considered recoverable
    
    const recoverableCodes: ErrorCode[] = [
        ERROR_CODES.NETWORK_ERROR,
        ERROR_CODES.TIMEOUT,
        ERROR_CODES.SLOT_LOCKED,
        ERROR_CODES.RATE_LIMIT,
    ];
    
    return recoverableCodes.includes(code);
}

/**
 * Get retry delay for recoverable errors (in ms)
 */
export function getRetryDelay(error: unknown): number {
    const code = getErrorCode(error);
    
    switch (code) {
        case ERROR_CODES.RATE_LIMIT:
            return 60000; // 1 minute
        case ERROR_CODES.SLOT_LOCKED:
            return 3000; // 3 seconds
        case ERROR_CODES.NETWORK_ERROR:
        case ERROR_CODES.TIMEOUT:
            return 1000; // 1 second
        default:
            return 0;
    }
}

// ============================================
// Exports
// ============================================

export {
    formatError,
    formatErrorWithCode,
    getErrorCode,
    hasErrorCode,
    isAppError,
    getErrorMessage,
    createValidationError,
    formatValidationErrors,
    hasFieldError,
    getFieldError,
    logError,
    logValidationErrors,
    isRecoverableError,
    getRetryDelay,
};

export type { AppError, ValidationError };
