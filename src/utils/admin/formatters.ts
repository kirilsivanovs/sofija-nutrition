/**
 * Date and time formatting utilities for admin panel
 */

/**
 * Convert yyyy-mm-dd to dd/mm/yyyy
 * @param dateStr - Date string in yyyy-mm-dd format
 * @returns Date string in dd/mm/yyyy format
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Convert dd/mm/yyyy to yyyy-mm-dd
 * @param dateStr - Date string in dd/mm/yyyy format
 * @returns Date string in yyyy-mm-dd format
 */
export function formatDateReverse(dateStr: string): string {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

/**
 * Ensure time is in 24-hour format HH:MM
 * @param timeStr - Time string
 * @returns Time string in HH:MM format
 */
export function formatTime(timeStr: string): string {
    if (!timeStr) return '';
    // If already in correct format, return as is
    if (timeStr.match(/^\d{2}:\d{2}$/)) return timeStr;
    // Otherwise parse and format
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

/**
 * Convert Date object to yyyy-mm-dd format
 * @param date - Date object
 * @returns Date string in yyyy-mm-dd format
 */
export function formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Initialize date input formatters
 * Automatically formats user input to dd/mm/yyyy
 */
export function initializeDateInputs(): void {
    document.querySelectorAll('.date-input').forEach(input => {
        input.addEventListener('input', function(this: HTMLInputElement, e: Event) {
            let value = this.value.replace(/[^\d]/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2);
            }
            if (value.length >= 5) {
                value = value.slice(0, 5) + '/' + value.slice(5, 9);
            }
            this.value = value.slice(0, 10);
        });

        input.addEventListener('blur', function(this: HTMLInputElement) {
            const value = this.value;
            if (value && value.length === 10) {
                const [day, month, year] = value.split('/');
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                if (date.getDate() != parseInt(day) || 
                    date.getMonth() != parseInt(month) - 1 || 
                    date.getFullYear() != parseInt(year)) {
                    this.value = '';
                    alert('Nederīgs datums. Lūdzu ievadiet dd/mm/gggg formātā.');
                }
            }
        });
    });
}
