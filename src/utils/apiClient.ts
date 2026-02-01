/**
 * Centralized API Client
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Handles only HTTP communication
 * - Open/Closed: Extensible for new endpoints without modification
 * - Dependency Inversion: Depends on abstractions (types) not concrete implementations
 * 
 * DRY Principles:
 * - Eliminates duplicate fetch calls across codebase
 * - Centralized error handling and retry logic
 * - Unified response formatting
 */

import type { APIResponse, BookingData, AvailabilityData, AdminBooking } from './types';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL || '';

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
} as const;

const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // ms
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
} as const;

// ============================================
// Types
// ============================================

interface RequestConfig extends RequestInit {
    retry?: boolean;
    maxRetries?: number;
    timeout?: number;
}

interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    retryableStatusCodes: number[];
}

export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// ============================================
// Core HTTP Methods
// ============================================

/**
 * Core fetch wrapper with retry logic
 */
async function fetchWithRetry(
    url: string,
    config: RequestConfig = {},
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
    const { maxRetries, retryDelay, retryableStatusCodes } = retryConfig;
    const { retry = true, timeout = 30000, ...fetchConfig } = config;

    let lastError: Error | null = null;
    const attempts = retry ? maxRetries : 1;

    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...fetchConfig,
                signal: controller.signal,
                headers: {
                    ...DEFAULT_HEADERS,
                    ...fetchConfig.headers,
                },
            });

            clearTimeout(timeoutId);

            // Success or non-retryable error
            if (response.ok || !retryableStatusCodes.includes(response.status)) {
                return response;
            }

            // Retryable error - save it and continue
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

            // Wait before retry (with exponential backoff)
            if (attempt < attempts - 1) {
                await sleep(retryDelay * Math.pow(2, attempt));
            }
        } catch (error) {
            lastError = error as Error;

            // Don't retry on AbortError (timeout)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new APIError('Request timeout', 408, 'TIMEOUT');
            }

            // Retry on network errors
            if (attempt < attempts - 1) {
                await sleep(retryDelay * Math.pow(2, attempt));
            }
        }
    }

    // All retries failed
    throw new APIError(
        lastError?.message || 'Request failed after retries',
        0,
        'NETWORK_ERROR'
    );
}

/**
 * Parse JSON response with error handling
 */
async function parseResponse<T>(response: Response): Promise<APIResponse<T>> {
    try {
        const data = await response.json();

        if (!response.ok) {
            throw new APIError(
                data.error?.message || 'API request failed',
                response.status,
                data.error?.code,
                data.error?.details
            );
        }

        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }

        throw new APIError(
            'Failed to parse response',
            response.status,
            'PARSE_ERROR'
        );
    }
}

/**
 * Generic GET request
 */
async function get<T>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        ...config,
    });

    return parseResponse<T>(response);
}

/**
 * Generic POST request
 */
async function post<T>(
    endpoint: string,
    data: unknown,
    config?: RequestConfig
): Promise<APIResponse<T>> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
        ...config,
    });

    return parseResponse<T>(response);
}

/**
 * Generic PATCH request
 */
async function patch<T>(
    endpoint: string,
    data: unknown,
    config?: RequestConfig
): Promise<APIResponse<T>> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...config,
    });

    return parseResponse<T>(response);
}

/**
 * Generic DELETE request
 */
async function del<T>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        ...config,
    });

    return parseResponse<T>(response);
}

// ============================================
// API Methods - Public Endpoints
// ============================================

export const api = {
    /**
     * Get available time slots for a specific date
     */
    getAvailability: async (date: string, serviceId?: string) => {
        const params = new URLSearchParams({ date });
        if (serviceId) params.append('serviceId', serviceId);
        
        return get<AvailabilityData>(`/api/availability?${params.toString()}`);
    },

    /**
     * Create a new booking
     */
    createBooking: async (bookingData: BookingData) => {
        return post<{ bookingId: string; paymentUrl?: string }>('/api/bookings', bookingData);
    },

    /**
     * Confirm payment for a booking
     */
    confirmPayment: async (token: string) => {
        return post<{ success: boolean }>('/api/confirm-payment', { token });
    },
} as const;

// ============================================
// API Methods - Admin Endpoints
// ============================================

export const adminApi = {
    /**
     * Get all bookings
     */
    getBookings: async () => {
        return get<{ bookings: AdminBooking[] }>('/api/dashboard/bookings');
    },

    /**
     * Update booking status
     */
    updateBookingStatus: async (id: string, status: 'confirmed' | 'cancelled') => {
        return patch<AdminBooking>(`/api/dashboard/bookings/${id}`, { status });
    },

    /**
     * Get schedule settings
     */
    getSchedule: async () => {
        return get<Record<string, any>>('/api/dashboard/schedule');
    },

    /**
     * Update schedule settings
     */
    updateSchedule: async (schedule: Record<string, any>) => {
        return post<Record<string, any>>('/api/dashboard/schedule', schedule);
    },

    /**
     * Get service settings
     */
    getServices: async () => {
        return get<Record<string, any>>('/api/dashboard/services');
    },

    /**
     * Update service settings
     */
    updateServices: async (services: Record<string, any>) => {
        return post<Record<string, any>>('/api/dashboard/services', services);
    },

    /**
     * Get blocked dates
     */
    getBlockedDates: async () => {
        return get<string[]>('/api/dashboard/blocked-dates');
    },

    /**
     * Update blocked dates
     */
    updateBlockedDates: async (dates: string[]) => {
        return post<string[]>('/api/dashboard/blocked-dates', { dates });
    },

    /**
     * Get vacation periods
     */
    getVacations: async () => {
        return get<Array<{ start: string; end: string }>>('/api/dashboard/vacations');
    },

    /**
     * Update vacation periods
     */
    updateVacations: async (periods: Array<{ start: string; end: string }>) => {
        return post<Array<{ start: string; end: string }>>('/api/dashboard/vacations', { periods });
    },

    /**
     * Get Latvian holidays
     */
    getHolidays: async (year: number) => {
        return get<Record<string, string>>(`/api/dashboard/holidays/${year}`);
    },
} as const;

// ============================================
// Utility Functions
// ============================================

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is an API error
 */
export function isAPIError(error: unknown): error is APIError {
    return error instanceof APIError;
}

/**
 * Format API error for display
 */
export function formatAPIError(error: unknown): string {
    if (isAPIError(error)) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred';
}

// ============================================
// Exports
// ============================================

export { APIError, get, post, patch, del };
export type { RequestConfig, APIResponse };
