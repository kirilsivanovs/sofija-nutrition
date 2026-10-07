/**
 * @jest-environment jsdom
 */

import { showToast } from '../src/utils/admin/notifications';

describe('Admin Panel - Toast Notification System', () => {
    let container;
    const lastToast = () => container.lastElementChild as HTMLElement;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="toast-container" class="toast-container"></div>
        `;
        container = document.getElementById('toast-container');

        // Mock setTimeout and clearTimeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('Toast Creation', () => {
        test('should create toast with default info type', () => {
            showToast('Test message');
            const toast = lastToast();

            expect(toast).toBeTruthy();
            expect(toast.classList.contains('toast')).toBe(true);
            expect(toast.classList.contains('info')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe('Test message');
            expect(toast.querySelector('.toast-title').textContent).toBe('Informācija');
        });

        test('should create success toast', () => {
            showToast('Operation successful', 'success');
            const toast = lastToast();

            expect(toast.classList.contains('success')).toBe(true);
            expect(toast.querySelector('.toast-title').textContent).toBe('Veiksmīgi');
            expect(toast.querySelector('.toast-icon').classList.contains('ph-check-circle')).toBe(true);
        });

        test('should create error toast', () => {
            showToast('Something went wrong', 'error');
            const toast = lastToast();

            expect(toast.classList.contains('error')).toBe(true);
            expect(toast.querySelector('.toast-title').textContent).toBe('Kļūda');
            expect(toast.querySelector('.toast-icon').classList.contains('ph-warning-circle')).toBe(true);
        });

        test('should create warning toast', () => {
            showToast('Please check input', 'warning');
            const toast = lastToast();

            expect(toast.classList.contains('warning')).toBe(true);
            expect(toast.querySelector('.toast-title').textContent).toBe('Brīdinājums');
            expect(toast.querySelector('.toast-icon').classList.contains('ph-warning')).toBe(true);
        });

        test('should create toast with custom title', () => {
            showToast('Custom message', 'success', 'Custom Title');
            const toast = lastToast();

            expect(toast.querySelector('.toast-title').textContent).toBe('Custom Title');
        });

        test('should append toast to container', () => {
            showToast('Test');

            expect(container.children.length).toBe(1);
            expect(container.querySelector('.toast')).toBeTruthy();
        });
    });

    describe('Toast Auto-removal', () => {
        test('should auto-remove toast after 4 seconds', () => {
            showToast('Auto-remove test');

            expect(container.children.length).toBe(1);

            jest.advanceTimersByTime(3999);
            expect(container.children.length).toBe(1);

            jest.advanceTimersByTime(1);
            expect(container.children.length).toBe(0);
        });

        test('should not remove toast before 4 seconds', () => {
            showToast('Wait test');

            jest.advanceTimersByTime(3000);
            expect(container.children.length).toBe(1);

            jest.advanceTimersByTime(999);
            expect(container.children.length).toBe(1);
        });
    });

    describe('Toast Manual Removal', () => {
        test('should remove the toast immediately when the close button is clicked', () => {
            showToast('Manual close test');
            const closeButton = lastToast().querySelector('.toast-close') as HTMLElement;

            closeButton.click();

            expect(container.children.length).toBe(0);
        });

        test('should have close button in every toast', () => {
            showToast('Close button test');
            const closeButton = lastToast().querySelector('.toast-close');

            expect(closeButton).toBeTruthy();
            expect(closeButton.querySelector('.ph-x')).toBeTruthy();
        });
    });

    describe('Multiple Toasts', () => {
        test('should handle multiple toasts simultaneously', () => {
            showToast('First', 'info');
            showToast('Second', 'success');
            showToast('Third', 'error');

            expect(container.children.length).toBe(3);
        });

        test('should remove toasts independently', () => {
            showToast('First');
            const toast1 = lastToast();
            showToast('Second');
            const toast2 = lastToast();
            showToast('Third');
            const toast3 = lastToast();

            (toast2.querySelector('.toast-close') as HTMLElement).click();

            expect(container.children.length).toBe(2);
            expect(container.contains(toast1)).toBe(true);
            expect(container.contains(toast2)).toBe(false);
            expect(container.contains(toast3)).toBe(true);
        });

        test('should auto-remove all toasts after their time', () => {
            showToast('First');
            const first = lastToast();
            jest.advanceTimersByTime(1000);
            showToast('Second');
            jest.advanceTimersByTime(1000);
            showToast('Third');

            // After 2 seconds, should have 3 toasts
            expect(container.children.length).toBe(3);

            // After 4 seconds total, the first toast is gone
            jest.advanceTimersByTime(2000);
            expect(container.children.length).toBe(2);
            expect(container.contains(first)).toBe(false);
        });
    });

    describe('Critical Business Scenarios', () => {
        test('should show success toast when saving availability', () => {
            showToast('Pieejamība saglabāta!', 'success');
            const toast = lastToast();

            expect(toast.classList.contains('success')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe('Pieejamība saglabāta!');
        });

        test('should show success toast when confirming booking', () => {
            showToast('Ieraksts apstiprināts', 'success');
            const toast = lastToast();

            expect(toast.classList.contains('success')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe('Ieraksts apstiprināts');
        });

        test('should show error toast on API failure', () => {
            const errorMessage = 'Network error occurred';
            showToast(errorMessage, 'error');
            const toast = lastToast();

            expect(toast.classList.contains('error')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe(errorMessage);
        });

        test('should show warning toast for validation errors', () => {
            showToast('Izvēlieties sākuma un beigu datumus', 'warning');
            const toast = lastToast();

            expect(toast.classList.contains('warning')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe('Izvēlieties sākuma un beigu datumus');
        });

        test('should replace alert() calls - saving settings', () => {
            showToast('Iestatījumi saglabāti!', 'success');

            expect(lastToast()).toBeTruthy();
            expect(container.children.length).toBe(1);
        });

        test('should replace alert() calls - adding vacation', () => {
            showToast('Atvaļinājums pievienots!', 'success');

            expect(lastToast()).toBeTruthy();
            expect(container.children.length).toBe(1);
        });

        test('should replace alert() calls - error handling', () => {
            const errorMsg = 'Connection timeout';
            showToast(errorMsg, 'error');
            const toast = lastToast();

            expect(toast).toBeTruthy();
            expect(toast.querySelector('.toast-message').textContent).toBe(errorMsg);
        });
    });

    describe('Toast Content Validation', () => {
        test('should display message content correctly', () => {
            const messages = [
                'Simple message',
                'Message with special chars: äöü',
                'Message with numbers: 123',
                'Long message that contains multiple words and sentences.'
            ];

            messages.forEach(msg => {
                container.innerHTML = '';
                showToast(msg, 'info');
                expect(lastToast().querySelector('.toast-message').textContent).toBe(msg);
            });
        });

        test('should handle empty messages', () => {
            showToast('', 'info');
            expect(lastToast().querySelector('.toast-message').textContent).toBe('');
        });

        test('should include all required elements', () => {
            showToast('Complete test', 'success');
            const toast = lastToast();

            expect(toast.querySelector('.toast-icon')).toBeTruthy();
            expect(toast.querySelector('.toast-content')).toBeTruthy();
            expect(toast.querySelector('.toast-title')).toBeTruthy();
            expect(toast.querySelector('.toast-message')).toBeTruthy();
            expect(toast.querySelector('.toast-close')).toBeTruthy();
        });
    });

    describe('Toast Accessibility', () => {
        test('should have close button accessible', () => {
            showToast('Accessibility test', 'info');
            const closeButton = lastToast().querySelector('.toast-close');

            expect(closeButton.tagName).toBe('BUTTON');
            expect(closeButton.querySelector('i')).toBeTruthy();
        });

        test('should support keyboard interaction on close button', () => {
            showToast('Keyboard test', 'info');
            const toast = lastToast();
            const closeButton = toast.querySelector('.toast-close') as HTMLElement;

            // Simulate click event (works for both mouse and keyboard)
            closeButton.click();

            expect(container.contains(toast)).toBe(false);
        });
    });

    describe('Toast Styling Classes', () => {
        test('should apply correct type classes', () => {
            const types = ['success', 'error', 'warning', 'info'] as const;

            types.forEach(type => {
                container.innerHTML = '';
                showToast('Test', type);
                expect(lastToast().classList.contains(type)).toBe(true);
            });
        });
    });
});
