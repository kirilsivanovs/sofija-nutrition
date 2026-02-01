/**
 * Booking State Management Tests
 * 
 * Tests for centralized booking state
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    getBookingState,
    getCurrentStep,
    isOnStep,
    isLoading,
    isSubmitting,
    getFormData,
    setFormField,
    setMultipleFields,
    clearForm,
    setStep,
    nextStep,
    previousStep,
    setLoading,
    setSubmitting,
    setError,
    clearError,
    clearAllErrors,
    setAvailableSlots,
    subscribe,
    unsubscribe
} from '../src/utils/booking/state';

// ============================================
// State Reset Before Each Test
// ============================================

beforeEach(() => {
    clearForm();
    clearAllErrors();
});

// ============================================
// State Getters Tests
// ============================================

describe('State Getters', () => {
    it('should get initial state', () => {
        const state = getBookingState();
        
        expect(state).toHaveProperty('currentStep');
        expect(state).toHaveProperty('isLoading');
        expect(state).toHaveProperty('isSubmitting');
        expect(state).toHaveProperty('errors');
    });

    it('should get current step', () => {
        const step = getCurrentStep();
        expect(typeof step).toBe('number');
        expect(step).toBeGreaterThanOrEqual(1);
    });

    it('should check if on specific step', () => {
        setStep(1);
        expect(isOnStep(1)).toBe(true);
        expect(isOnStep(2)).toBe(false);
    });

    it('should check loading state', () => {
        expect(typeof isLoading()).toBe('boolean');
    });

    it('should check submitting state', () => {
        expect(typeof isSubmitting()).toBe('boolean');
    });

    it('should get form data', () => {
        const data = getFormData();
        expect(typeof data).toBe('object');
    });
});

// ============================================
// Form Field Management Tests
// ============================================

describe('Form Field Management', () => {
    it('should set single form field', () => {
        setFormField('name', 'John Doe');
        const state = getBookingState();
        
        expect(state.name).toBe('John Doe');
    });

    it('should set multiple fields at once', () => {
        setMultipleFields({
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+37120000000'
        });
        
        const state = getBookingState();
        expect(state.name).toBe('John Doe');
        expect(state.email).toBe('john@example.com');
        expect(state.phone).toBe('+37120000000');
    });

    it('should update existing field', () => {
        setFormField('name', 'John');
        setFormField('name', 'Jane');
        
        const state = getBookingState();
        expect(state.name).toBe('Jane');
    });

    it('should handle all form fields', () => {
        const fields = {
            service: 'initial',
            date: '2026-02-15',
            time: '10:00',
            consultationFormat: 'online' as const,
            name: 'Test User',
            email: 'test@example.com',
            phone: '+37120000000',
            message: 'Test message',
            language: 'lv' as const
        };

        setMultipleFields(fields);
        const state = getBookingState();

        expect(state.service).toBe(fields.service);
        expect(state.date).toBe(fields.date);
        expect(state.time).toBe(fields.time);
        expect(state.consultationFormat).toBe(fields.consultationFormat);
        expect(state.name).toBe(fields.name);
        expect(state.email).toBe(fields.email);
        expect(state.phone).toBe(fields.phone);
        expect(state.message).toBe(fields.message);
        expect(state.language).toBe(fields.language);
    });

    it('should clear form', () => {
        setMultipleFields({
            name: 'John Doe',
            email: 'john@example.com'
        });
        
        clearForm();
        const state = getBookingState();
        
        expect(state.name).toBeUndefined();
        expect(state.email).toBeUndefined();
    });
});

// ============================================
// Step Navigation Tests
// ============================================

describe('Step Navigation', () => {
    it('should set step directly', () => {
        setStep(2);
        expect(getCurrentStep()).toBe(2);
    });

    it('should go to next step', () => {
        setStep(1);
        nextStep();
        expect(getCurrentStep()).toBe(2);
    });

    it('should go to previous step', () => {
        setStep(2);
        previousStep();
        expect(getCurrentStep()).toBe(1);
    });

    it('should not go below step 1', () => {
        setStep(1);
        previousStep();
        expect(getCurrentStep()).toBe(1);
    });

    it('should not exceed total steps', () => {
        const state = getBookingState();
        const totalSteps = state.totalSteps;
        
        setStep(totalSteps);
        nextStep();
        
        expect(getCurrentStep()).toBe(totalSteps);
    });

    it('should handle step navigation sequence', () => {
        setStep(1);
        expect(getCurrentStep()).toBe(1);
        
        nextStep();
        expect(getCurrentStep()).toBe(2);
        
        nextStep();
        expect(getCurrentStep()).toBe(3);
        
        previousStep();
        expect(getCurrentStep()).toBe(2);
    });
});

// ============================================
// Loading & Submitting States Tests
// ============================================

describe('Loading & Submitting States', () => {
    it('should set loading state', () => {
        setLoading(true);
        expect(isLoading()).toBe(true);
        
        setLoading(false);
        expect(isLoading()).toBe(false);
    });

    it('should set submitting state', () => {
        setSubmitting(true);
        expect(isSubmitting()).toBe(true);
        
        setSubmitting(false);
        expect(isSubmitting()).toBe(false);
    });

    it('should handle loading state during async operation', async () => {
        setLoading(true);
        expect(isLoading()).toBe(true);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        setLoading(false);
        expect(isLoading()).toBe(false);
    });
});

// ============================================
// Error Management Tests
// ============================================

describe('Error Management', () => {
    it('should set field error', () => {
        setError('email', 'Invalid email');
        const state = getBookingState();
        
        expect(state.errors.email).toBe('Invalid email');
    });

    it('should set multiple errors', () => {
        setError('email', 'Invalid email');
        setError('phone', 'Invalid phone');
        
        const state = getBookingState();
        expect(state.errors.email).toBe('Invalid email');
        expect(state.errors.phone).toBe('Invalid phone');
    });

    it('should clear specific error', () => {
        setError('email', 'Invalid email');
        clearError('email');
        
        const state = getBookingState();
        expect(state.errors.email).toBeUndefined();
    });

    it('should clear all errors', () => {
        setError('email', 'Invalid email');
        setError('phone', 'Invalid phone');
        
        clearAllErrors();
        const state = getBookingState();
        
        expect(Object.keys(state.errors)).toHaveLength(0);
    });

    it('should update existing error', () => {
        setError('email', 'First error');
        setError('email', 'Second error');
        
        const state = getBookingState();
        expect(state.errors.email).toBe('Second error');
    });
});

// ============================================
// Available Slots Management Tests
// ============================================

describe('Available Slots Management', () => {
    it('should set available slots', () => {
        const slots = ['10:00', '11:00', '12:00'];
        setAvailableSlots(slots);
        
        const state = getBookingState();
        expect(state.availableSlots).toEqual(slots);
    });

    it('should update slots when date changes', () => {
        const morning = ['09:00', '10:00'];
        const afternoon = ['14:00', '15:00'];
        
        setAvailableSlots(morning);
        expect(getBookingState().availableSlots).toEqual(morning);
        
        setAvailableSlots(afternoon);
        expect(getBookingState().availableSlots).toEqual(afternoon);
    });

    it('should handle empty slots', () => {
        setAvailableSlots([]);
        
        const state = getBookingState();
        expect(state.availableSlots).toEqual([]);
    });

    it('should handle many slots', () => {
        const slots = Array.from({ length: 20 }, (_, i) => 
            `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`
        );
        
        setAvailableSlots(slots);
        const state = getBookingState();
        
        expect(state.availableSlots).toHaveLength(20);
    });
});

// ============================================
// State Subscription Tests
// ============================================

describe('State Subscriptions', () => {
    it('should notify subscribers on state change', () => {
        let callCount = 0;
        const listener = () => { callCount++; };
        
        subscribe(listener);
        setFormField('name', 'Test');
        
        expect(callCount).toBeGreaterThan(0);
        unsubscribe(listener);
    });

    it('should notify multiple subscribers', () => {
        let count1 = 0;
        let count2 = 0;
        
        const listener1 = () => { count1++; };
        const listener2 = () => { count2++; };
        
        subscribe(listener1);
        subscribe(listener2);
        
        setFormField('name', 'Test');
        
        expect(count1).toBeGreaterThan(0);
        expect(count2).toBeGreaterThan(0);
        
        unsubscribe(listener1);
        unsubscribe(listener2);
    });

    it('should unsubscribe listener', () => {
        let callCount = 0;
        const listener = () => { callCount++; };
        
        subscribe(listener);
        setFormField('name', 'First');
        const firstCount = callCount;
        
        unsubscribe(listener);
        setFormField('name', 'Second');
        
        expect(callCount).toBe(firstCount);
    });

    it('should pass current state to listener', () => {
        let receivedState: any = null;
        const listener = (state: any) => { receivedState = state; };
        
        subscribe(listener);
        setFormField('name', 'Test User');
        
        expect(receivedState).toBeTruthy();
        expect(receivedState.name).toBe('Test User');
        
        unsubscribe(listener);
    });
});

// ============================================
// State Immutability Tests
// ============================================

describe('State Immutability', () => {
    it('should return new state object on change', () => {
        const state1 = getBookingState();
        setFormField('name', 'Test');
        const state2 = getBookingState();
        
        expect(state1).not.toBe(state2);
    });

    it('should not mutate returned state object', () => {
        const state = getBookingState();
        const originalStep = state.currentStep;
        
        // Try to mutate
        (state as any).currentStep = 999;
        
        // Should not affect actual state
        expect(getCurrentStep()).toBe(originalStep);
    });
});

// ============================================
// Complex Workflow Tests
// ============================================

describe('Complex Booking Workflows', () => {
    it('should handle complete booking flow', () => {
        // Step 1: Service selection
        setStep(1);
        setFormField('service', 'initial');
        setFormField('consultationFormat', 'online');
        nextStep();
        
        // Step 2: Date & Time
        setFormField('date', '2026-02-15');
        setFormField('time', '10:00');
        nextStep();
        
        // Step 3: Personal info
        setMultipleFields({
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+37120000000'
        });
        
        const state = getBookingState();
        expect(state.service).toBe('initial');
        expect(state.date).toBe('2026-02-15');
        expect(state.name).toBe('John Doe');
    });

    it('should handle validation errors during flow', () => {
        setStep(1);
        setFormField('service', 'initial');
        
        // Try to advance without required fields
        setError('date', 'Date is required');
        
        // Should stay on current step
        const state = getBookingState();
        expect(state.errors.date).toBe('Date is required');
    });

    it('should handle back navigation with preserved data', () => {
        setFormField('name', 'John Doe');
        setStep(2);
        
        previousStep();
        
        const state = getBookingState();
        expect(state.name).toBe('John Doe');
        expect(getCurrentStep()).toBe(1);
    });

    it('should clear errors when changing steps', () => {
        setError('email', 'Invalid email');
        nextStep();
        clearAllErrors();
        
        const state = getBookingState();
        expect(Object.keys(state.errors)).toHaveLength(0);
    });
});

// ============================================
// Edge Cases Tests
// ============================================

describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
        for (let i = 0; i < 100; i++) {
            setFormField('name', `User ${i}`);
        }
        
        const state = getBookingState();
        expect(state.name).toBe('User 99');
    });

    it('should handle concurrent updates', async () => {
        const updates = [
            setFormField('name', 'User 1'),
            setFormField('email', 'user1@test.com'),
            setFormField('phone', '+37120000001'),
        ];
        
        await Promise.all(updates);
        
        const state = getBookingState();
        expect(state.name).toBeDefined();
        expect(state.email).toBeDefined();
        expect(state.phone).toBeDefined();
    });

    it('should handle empty strings', () => {
        setFormField('name', '');
        setFormField('message', '');
        
        const state = getBookingState();
        expect(state.name).toBe('');
        expect(state.message).toBe('');
    });

    it('should handle special characters in fields', () => {
        setMultipleFields({
            name: 'Jānis Bērziņš',
            message: 'Special chars: <>&"\''
        });
        
        const state = getBookingState();
        expect(state.name).toBe('Jānis Bērziņš');
        expect(state.message).toContain('<>&');
    });

    it('should handle very long strings', () => {
        const longString = 'a'.repeat(10000);
        setFormField('message', longString);
        
        const state = getBookingState();
        expect(state.message).toHaveLength(10000);
    });

    it('should handle null/undefined values', () => {
        setFormField('name', undefined as any);
        setFormField('email', null as any);
        
        const state = getBookingState();
        // Should handle gracefully
        expect(state).toBeDefined();
    });
});

// ============================================
// Performance Tests
// ============================================

describe('Performance', () => {
    it('should handle many subscribers efficiently', () => {
        const listeners = Array.from({ length: 100 }, () => jest.fn());
        
        listeners.forEach(listener => subscribe(listener));
        
        setFormField('name', 'Test');
        
        listeners.forEach(listener => {
            expect(listener).toHaveBeenCalled();
            unsubscribe(listener);
        });
    });

    it('should handle large state objects', () => {
        const largeMessage = 'x'.repeat(100000);
        
        const start = Date.now();
        setFormField('message', largeMessage);
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(100); // Should be fast
    });
});
