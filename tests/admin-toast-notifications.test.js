/**
 * @jest-environment jsdom
 */

describe('Admin Panel - Toast Notification System', () => {
    let container;

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

    // Toast creation function from admin panel
    function showToast(message, type = 'info', title = null) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'ph-check-circle',
            error: 'ph-warning-circle',
            warning: 'ph-warning',
            info: 'ph-info'
        };
        
        const titles = {
            success: title || 'Veiksmīgi',
            error: title || 'Kļūda',
            warning: title || 'Brīdinājums',
            info: title || 'Informācija'
        };
        
        toast.innerHTML = `
            <i class="ph ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="ph ph-x"></i></button>
        `;
        
        container.appendChild(toast);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            removeToast(toast);
        }, 4000);

        return toast;
    }
    
    function removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    describe('Toast Creation', () => {
        test('should create toast with default info type', () => {
            const toast = showToast('Test message');
            
            expect(toast).toBeTruthy();
            expect(toast.classList.contains('toast')).toBe(true);
            expect(toast.classList.contains('info')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe('Test message');
            expect(toast.querySelector('.toast-title').textContent).toBe('Informācija');
        });

        test('should create success toast', () => {
            const toast = showToast('Operation successful', 'success');
            
            expect(toast.classList.contains('success')).toBe(true);
            expect(toast.querySelector('.toast-title').textContent).toBe('Veiksmīgi');
            expect(toast.querySelector('.toast-icon').classList.contains('ph-check-circle')).toBe(true);
        });

        test('should create error toast', () => {
            const toast = showToast('Something went wrong', 'error');
            
            expect(toast.classList.contains('error')).toBe(true);
            expect(toast.querySelector('.toast-title').textContent).toBe('Kļūda');
            expect(toast.querySelector('.toast-icon').classList.contains('ph-warning-circle')).toBe(true);
        });

        test('should create warning toast', () => {
            const toast = showToast('Please check input', 'warning');
            
            expect(toast.classList.contains('warning')).toBe(true);
            expect(toast.querySelector('.toast-title').textContent).toBe('Brīdinājums');
            expect(toast.querySelector('.toast-icon').classList.contains('ph-warning')).toBe(true);
        });

        test('should create toast with custom title', () => {
            const toast = showToast('Custom message', 'success', 'Custom Title');
            
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
            const toast = showToast('Auto-remove test');
            
            expect(container.children.length).toBe(1);
            
            // Fast-forward time by 4 seconds
            jest.advanceTimersByTime(4000);
            
            expect(toast.classList.contains('removing')).toBe(true);
            
            // Fast-forward animation time (300ms)
            jest.advanceTimersByTime(300);
            
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
        test('should remove toast when close button is clicked', () => {
            const toast = showToast('Manual close test');
            const closeButton = toast.querySelector('.toast-close');
            
            closeButton.click();
            
            expect(toast.classList.contains('removing')).toBe(true);
            
            jest.advanceTimersByTime(300);
            expect(container.children.length).toBe(0);
        });

        test('should have close button in every toast', () => {
            const toast = showToast('Close button test');
            const closeButton = toast.querySelector('.toast-close');
            
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
            const toast1 = showToast('First');
            const toast2 = showToast('Second');
            const toast3 = showToast('Third');
            
            toast2.querySelector('.toast-close').click();
            jest.advanceTimersByTime(300);
            
            expect(container.children.length).toBe(2);
            expect(container.contains(toast1)).toBe(true);
            expect(container.contains(toast2)).toBe(false);
            expect(container.contains(toast3)).toBe(true);
        });

        test('should auto-remove all toasts after their time', () => {
            showToast('First');
            jest.advanceTimersByTime(1000);
            showToast('Second');
            jest.advanceTimersByTime(1000);
            showToast('Third');
            
            // After 2 seconds, should have 3 toasts
            expect(container.children.length).toBe(3);
            
            // After 4 seconds total, first toast should be removing
            jest.advanceTimersByTime(2000);
            expect(container.querySelectorAll('.removing').length).toBeGreaterThan(0);
        });
    });

    describe('Critical Business Scenarios', () => {
        test('should show success toast when saving availability', () => {
            const toast = showToast('Pieejamība saglabāta!', 'success');
            
            expect(toast.classList.contains('success')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe('Pieejamība saglabāta!');
        });

        test('should show success toast when confirming booking', () => {
            const toast = showToast('Ieraksts apstiprināts', 'success');
            
            expect(toast.classList.contains('success')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe('Ieraksts apstiprināts');
        });

        test('should show error toast on API failure', () => {
            const errorMessage = 'Network error occurred';
            const toast = showToast(errorMessage, 'error');
            
            expect(toast.classList.contains('error')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe(errorMessage);
        });

        test('should show warning toast for validation errors', () => {
            const toast = showToast('Izvēlieties sākuma un beigu datumus', 'warning');
            
            expect(toast.classList.contains('warning')).toBe(true);
            expect(toast.querySelector('.toast-message').textContent).toBe('Izvēlieties sākuma un beigu datumus');
        });

        test('should replace alert() calls - saving settings', () => {
            // Old: alert('Iestatījumi saglabāti!')
            // New:
            const toast = showToast('Iestatījumi saglabāti!', 'success');
            
            expect(toast).toBeTruthy();
            expect(container.children.length).toBe(1);
        });

        test('should replace alert() calls - adding vacation', () => {
            // Old: alert('Atvaļinājums pievienots!')
            // New:
            const toast = showToast('Atvaļinājums pievienots!', 'success');
            
            expect(toast).toBeTruthy();
            expect(container.children.length).toBe(1);
        });

        test('should replace alert() calls - error handling', () => {
            // Old: alert('Kļūda: ' + e.message)
            // New:
            const errorMsg = 'Connection timeout';
            const toast = showToast(errorMsg, 'error');
            
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
                const toast = showToast(msg, 'info');
                expect(toast.querySelector('.toast-message').textContent).toBe(msg);
            });
        });

        test('should handle empty messages', () => {
            const toast = showToast('', 'info');
            expect(toast.querySelector('.toast-message').textContent).toBe('');
        });

        test('should include all required elements', () => {
            const toast = showToast('Complete test', 'success');
            
            expect(toast.querySelector('.toast-icon')).toBeTruthy();
            expect(toast.querySelector('.toast-content')).toBeTruthy();
            expect(toast.querySelector('.toast-title')).toBeTruthy();
            expect(toast.querySelector('.toast-message')).toBeTruthy();
            expect(toast.querySelector('.toast-close')).toBeTruthy();
        });
    });

    describe('Toast Accessibility', () => {
        test('should have close button accessible', () => {
            const toast = showToast('Accessibility test', 'info');
            const closeButton = toast.querySelector('.toast-close');
            
            expect(closeButton.tagName).toBe('BUTTON');
            expect(closeButton.querySelector('i')).toBeTruthy();
        });

        test('should support keyboard interaction on close button', () => {
            const toast = showToast('Keyboard test', 'info');
            const closeButton = toast.querySelector('.toast-close');
            
            // Simulate click event (works for both mouse and keyboard)
            closeButton.click();
            
            expect(toast.classList.contains('removing')).toBe(true);
        });
    });

    describe('Toast Styling Classes', () => {
        test('should apply correct type classes', () => {
            const types = ['success', 'error', 'warning', 'info'];
            
            types.forEach(type => {
                container.innerHTML = '';
                const toast = showToast('Test', type);
                expect(toast.classList.contains(type)).toBe(true);
            });
        });

        test('should apply removing class on removal', () => {
            const toast = showToast('Removal test', 'info');
            
            removeToast(toast);
            
            expect(toast.classList.contains('removing')).toBe(true);
        });
    });
});
