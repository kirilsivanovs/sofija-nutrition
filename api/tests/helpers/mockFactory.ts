/**
 * Test Helpers - Mock Factories
 * 
 * DRY principle: Centralized mock creation for consistent testing
 */

import { HttpRequest, InvocationContext } from '@azure/functions';
import type { Booking, Language } from '../../src/types';

// ============================================
// HTTP Request Mocks
// ============================================

export interface MockRequestOptions {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    query?: Record<string, string>;
    params?: Record<string, string>;
}

export function createMockHttpRequest(options: MockRequestOptions = {}): HttpRequest {
    const {
        url = 'http://localhost:7071/api/test',
        method = 'GET',
        headers = {},
        body = null,
        query = {},
        params = {}
    } = options;

    return {
        url,
        method,
        headers: new Map(Object.entries(headers)),
        query: new Map(Object.entries(query)),
        params,
        user: null,
        body: body ? { string: JSON.stringify(body) } : { string: null },
        bodyUsed: false,
        text: async () => body ? JSON.stringify(body) : '',
        json: async () => body,
        formData: async () => new FormData(),
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob()
    } as unknown as HttpRequest;
}

// ============================================
// Azure Function Context Mocks
// ============================================

export function createMockContext(): InvocationContext {
    return {
        invocationId: `test-${Date.now()}`,
        functionName: 'test-function',
        extraInputs: {
            get: () => undefined,
            set: () => {}
        },
        extraOutputs: {
            get: () => undefined,
            set: () => {}
        },
        retryContext: undefined,
        traceContext: {
            traceparent: 'test-trace-parent',
            tracestate: '',
            attributes: {}
        },
        triggerMetadata: {},
        options: {
            trigger: { type: 'httpTrigger', name: 'req' },
            return: { type: 'http', name: '$return' },
            extraInputs: [],
            extraOutputs: [],
            handler: async () => {}
        },
        log: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        trace: jest.fn(),
        warn: jest.fn()
    } as unknown as InvocationContext;
}

// ============================================
// Booking Data Factories
// ============================================

export interface BookingOverrides {
    name?: string;
    email?: string;
    phone?: string;
    date?: string;
    time?: string;
    serviceId?: string;
    consultationFormat?: 'online' | 'in-person';
    notes?: string;
    language?: Language;
}

export function createMockBookingInput(overrides: BookingOverrides = {}) {
    return {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+37120000000',
        date: '2026-03-15',
        time: '10:00',
        serviceId: 'initial',
        consultationFormat: 'online' as const,
        notes: 'Test booking',
        language: 'lv' as Language,
        ...overrides
    };
}

export function createMockBooking(overrides: Partial<Booking> = {}): Booking {
    const defaultBooking: Booking = {
        partitionKey: '2026-03-15',
        rowKey: '10:00',
        id: 'SN-TEST-12345',
        bookingId: 'SN-TEST-12345',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+37120000000',
        date: '2026-03-15',
        time: '10:00',
        service: 'initial',
        serviceName: 'Initial Consultation',
        formatLabel: 'Online',
        language: 'lv',
        consultationFormat: 'online',
        price: 65,
        status: 'pending',
        paymentConfirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timestamp: new Date()
    };

    return { ...defaultBooking, ...overrides };
}

// ============================================
// Admin Request Helpers
// ============================================

const DEFAULT_ADMIN_KEY = process.env.ADMIN_API_KEY || 'test-admin-key-12345';

export function createMockAdminRequest(options: MockRequestOptions = {}): HttpRequest {
    return createMockHttpRequest({
        ...options,
        headers: {
            'x-admin-key': DEFAULT_ADMIN_KEY,
            ...options.headers
        }
    });
}

export function createUnauthorizedRequest(options: MockRequestOptions = {}): HttpRequest {
    return createMockHttpRequest({
        ...options,
        headers: {
            // No admin key
            ...options.headers
        }
    });
}

export function createInvalidAuthRequest(options: MockRequestOptions = {}): HttpRequest {
    return createMockHttpRequest({
        ...options,
        headers: {
            'x-admin-key': 'invalid-key',
            ...options.headers
        }
    });
}

// ============================================
// Test Data Generators
// ============================================

export function generateTestEmail(prefix = 'test'): string {
    return `${prefix}-${Date.now()}@example.com`;
}

export function generateTestPhone(): string {
    const random = Math.floor(Math.random() * 100000000);
    return `+371${String(random).padStart(8, '0')}`;
}

export function generateFutureDate(daysAhead = 30): string {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    
    // Ensure it's a weekday
    while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
    }
    
    return date.toISOString().split('T')[0];
}

export function generateTimeSlot(hour = 10, minute = 0): string {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ============================================
// Service Types
// ============================================

export const TEST_SERVICES = {
    initial: { id: 'initial', price: 65, duration: 60 },
    followup: { id: 'followup', price: 50, duration: 45 },
    package3: { id: 'package3', price: 180, duration: 60 },
    package5: { id: 'package5', price: 280, duration: 60 },
    cgmDiagnostic: { id: 'cgm-diagnostic', price: 140, duration: 90 },
    consultation: { id: 'consultation', price: 50, duration: 60 },
    freeConsultation: { id: 'free-consultation', price: 0, duration: 30 }
} as const;

export function createBookingForService(serviceId: keyof typeof TEST_SERVICES, overrides: BookingOverrides = {}) {
    return createMockBookingInput({
        serviceId,
        ...overrides
    });
}

// ============================================
// Edge Case Generators
// ============================================

export function createXSSAttempt(field: 'name' | 'email' | 'notes' = 'name'): BookingOverrides {
    const xssPayloads: Record<string, string> = {
        name: '<script>alert("XSS")</script>',
        email: 'test+<script>@example.com',
        notes: '<img src=x onerror=alert(1)>'
    };

    return {
        [field]: xssPayloads[field]
    };
}

export function createSQLInjectionAttempt(field: 'name' | 'email' = 'name'): BookingOverrides {
    const sqlPayloads: Record<string, string> = {
        name: "' OR '1'='1",
        email: "admin'--@example.com"
    };

    return {
        [field]: sqlPayloads[field]
    };
}

export function createLongInput(field: 'name' | 'notes' = 'notes', length = 10000): BookingOverrides {
    return {
        [field]: 'x'.repeat(length)
    };
}

export function createSpecialCharacters(): BookingOverrides {
    return {
        name: 'Jānis Bērziņš-O\'Brien',
        notes: 'Special: <>&"\' üöä'
    };
}

// ============================================
// Date/Time Helpers
// ============================================

export function createWeekendDate(type: 'saturday' | 'sunday' = 'saturday'): string {
    const date = new Date();
    const targetDay = type === 'saturday' ? 6 : 0;
    
    while (date.getDay() !== targetDay) {
        date.setDate(date.getDate() + 1);
    }
    
    return date.toISOString().split('T')[0];
}

export function createWeekdayDate(): string {
    const date = new Date();
    
    // Find next weekday
    while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
    }
    
    return date.toISOString().split('T')[0];
}

export function createHolidayDate(holiday: 'newYear' | 'christmas' | 'independenceDay' = 'christmas'): string {
    const year = new Date().getFullYear() + 1;
    
    const holidays: Record<string, string> = {
        newYear: `${year}-01-01`,
        christmas: `${year}-12-25`,
        independenceDay: `${year}-11-18`
    };
    
    return holidays[holiday];
}

// ============================================
// Multi-Language Helpers
// ============================================

export function createBookingInLanguage(language: Language, overrides: BookingOverrides = {}) {
    const names: Record<Language, string> = {
        lv: 'Jānis Bērziņš',
        en: 'John Smith',
        ru: 'Иван Иванов'
    };

    return createMockBookingInput({
        name: names[language],
        language,
        ...overrides
    });
}

// ============================================
// Concurrent Request Helpers
// ============================================

export function createConcurrentBookings(count: number, baseDate: string, baseTime: string): BookingOverrides[] {
    return Array.from({ length: count }, (_, i) => ({
        name: `User ${i + 1}`,
        email: generateTestEmail(`user${i + 1}`),
        date: baseDate,
        time: baseTime
    }));
}

// ============================================
// Assertion Helpers
// ============================================

export function assertValidBookingResponse(response: any) {
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('bookingId');
    expect(response).toHaveProperty('booking');
    expect(response.booking).toHaveProperty('id');
    expect(response.booking).toHaveProperty('email');
    expect(response.booking).toHaveProperty('date');
    expect(response.booking).toHaveProperty('time');
}

export function assertBookingErrorResponse(response: any, expectedCode?: string) {
    expect(response).toHaveProperty('status');
    expect(response).toHaveProperty('jsonBody');
    expect(response.jsonBody).toHaveProperty('error');
    
    if (expectedCode) {
        expect(response.jsonBody).toHaveProperty('code', expectedCode);
    }
}

export function assertCORSHeaders(response: any) {
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Headers');
}

// ============================================
// Cleanup Helpers
// ============================================

export async function cleanupTestBookings(bookingIds: string[]) {
    // Implementation depends on your repository
    // This is a placeholder
    console.log('Cleaning up test bookings:', bookingIds);
}

export function resetMocks() {
    jest.clearAllMocks();
    jest.resetModules();
}
