/**
 * Booking State Management
 * 
 * SOLID: Single Responsibility - manages booking form state
 * DRY: Centralized state management logic
 */

import type { BookingFormData } from './validation';
import type { Language } from '../types';

// ============================================
// State Interface
// ============================================

export interface BookingState {
    // Step tracking
    currentStep: number;
    totalSteps: number;

    // Form data
    service?: string;
    date?: string;
    time?: string;
    consultationFormat?: 'online' | 'in-person';
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    language?: Language;

    // UI state
    isLoading: boolean;
    isSubmitting: boolean;
    errors: Record<string, string>;

    // Available data
    availableSlots: string[];
    selectedDateSlots: string[];
}

// ============================================
// State Store
// ============================================

let bookingState: BookingState = {
    currentStep: 1,
    totalSteps: 3,
    isLoading: false,
    isSubmitting: false,
    errors: {},
    availableSlots: [],
    selectedDateSlots: [],
};

// State change listeners
type StateChangeListener = (state: BookingState) => void;
const listeners: StateChangeListener[] = [];

// ============================================
// State Getters
// ============================================

/**
 * Get current booking state
 */
export function getBookingState(): Readonly<BookingState> {
    return { ...bookingState };
}

/**
 * Get current step number
 */
export function getCurrentStep(): number {
    return bookingState.currentStep;
}

/**
 * Check if on specific step
 */
export function isOnStep(step: number): boolean {
    return bookingState.currentStep === step;
}

/**
 * Check if loading
 */
export function isLoading(): boolean {
    return bookingState.isLoading;
}

/**
 * Check if submitting
 */
export function isSubmitting(): boolean {
    return bookingState.isSubmitting;
}

/**
 * Get form data
 */
export function getFormData(): BookingFormData {
    return {
        service: bookingState.service,
        date: bookingState.date,
        time: bookingState.time,
        consultationFormat: bookingState.consultationFormat,
        name: bookingState.name,
        email: bookingState.email,
        phone: bookingState.phone,
        message: bookingState.message,
    };
}

/**
 * Get errors
 */
export function getErrors(): Record<string, string> {
    return { ...bookingState.errors };
}

/**
 * Check if field has error
 */
export function hasError(field: string): boolean {
    return !!bookingState.errors[field];
}

/**
 * Get error for field
 */
export function getError(field: string): string | undefined {
    return bookingState.errors[field];
}

// ============================================
// State Setters
// ============================================

/**
 * Update booking state
 */
function updateState(updates: Partial<BookingState>): void {
    bookingState = { ...bookingState, ...updates };
    notifyListeners();
}

/**
 * Set form field value
 */
export function setField(field: keyof BookingFormData, value: any): void {
    updateState({ [field]: value });
}

/**
 * Set multiple fields
 */
export function setFields(fields: Partial<BookingFormData>): void {
    updateState(fields);
}

/**
 * Set loading state
 */
export function setLoading(loading: boolean): void {
    updateState({ isLoading: loading });
}

/**
 * Set submitting state
 */
export function setSubmitting(submitting: boolean): void {
    updateState({ isSubmitting: submitting });
}

/**
 * Set errors
 */
export function setErrors(errors: Record<string, string>): void {
    updateState({ errors });
}

/**
 * Set single error
 */
export function setError(field: string, message: string): void {
    updateState({ errors: { ...bookingState.errors, [field]: message } });
}

/**
 * Clear error for field
 */
export function clearError(field: string): void {
    const errors = { ...bookingState.errors };
    delete errors[field];
    updateState({ errors });
}

/**
 * Clear all errors
 */
export function clearErrors(): void {
    updateState({ errors: {} });
}

/**
 * Set available slots
 */
export function setAvailableSlots(slots: string[]): void {
    updateState({ availableSlots: slots });
}

/**
 * Set selected date slots
 */
export function setSelectedDateSlots(slots: string[]): void {
    updateState({ selectedDateSlots: slots });
}

// ============================================
// Step Navigation
// ============================================

/**
 * Go to next step
 */
export function nextStep(): void {
    if (bookingState.currentStep < bookingState.totalSteps) {
        updateState({ currentStep: bookingState.currentStep + 1 });
    }
}

/**
 * Go to previous step
 */
export function previousStep(): void {
    if (bookingState.currentStep > 1) {
        updateState({ currentStep: bookingState.currentStep - 1 });
    }
}

/**
 * Go to specific step
 */
export function goToStep(step: number): void {
    if (step >= 1 && step <= bookingState.totalSteps) {
        updateState({ currentStep: step });
    }
}

/**
 * Check if can go to next step
 */
export function canGoNext(): boolean {
    return bookingState.currentStep < bookingState.totalSteps;
}

/**
 * Check if can go to previous step
 */
export function canGoPrevious(): boolean {
    return bookingState.currentStep > 1;
}

// ============================================
// State Reset
// ============================================

/**
 * Reset booking state to initial
 */
export function resetBookingState(): void {
    bookingState = {
        currentStep: 1,
        totalSteps: 3,
        isLoading: false,
        isSubmitting: false,
        errors: {},
        availableSlots: [],
        selectedDateSlots: [],
    };
    notifyListeners();
}

/**
 * Reset form data only (keep UI state)
 */
export function resetFormData(): void {
    updateState({
        service: undefined,
        date: undefined,
        time: undefined,
        consultationFormat: undefined,
        name: undefined,
        email: undefined,
        phone: undefined,
        message: undefined,
    });
}

// ============================================
// Event Listeners
// ============================================

/**
 * Subscribe to state changes
 */
export function subscribe(listener: StateChangeListener): () => void {
    listeners.push(listener);

    // Return unsubscribe function
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

/**
 * Notify all listeners of state change
 */
function notifyListeners(): void {
    const state = getBookingState();
    listeners.forEach(listener => listener(state));
}

// ============================================
// Persistence (Optional)
// ============================================

const STORAGE_KEY = 'booking_form_data';

/**
 * Save form data to localStorage
 */
export function saveToStorage(): void {
    try {
        const formData = getFormData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
        console.warn('Failed to save booking data to storage:', error);
    }
}

/**
 * Load form data from localStorage
 */
export function loadFromStorage(): boolean {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const formData = JSON.parse(stored);
            setFields(formData);
            return true;
        }
    } catch (error) {
        console.warn('Failed to load booking data from storage:', error);
    }
    return false;
}

/**
 * Clear stored form data
 */
export function clearStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('Failed to clear booking data from storage:', error);
    }
}

// ============================================
// Exports
// ============================================

export type { BookingState, StateChangeListener };
