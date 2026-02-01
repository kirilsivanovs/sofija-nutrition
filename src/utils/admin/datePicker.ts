/**
 * Date picker utility for date input fields
 */

import { MONTH_NAMES } from './constants';

let pickerCurrentDate = new Date();
let pickerTargetInput: HTMLInputElement | null = null;

/**
 * Initialize date picker
 */
export function initDatePicker(): void {
    const datePicker = document.getElementById('date-picker');
    const pickerMonthYear = document.getElementById('picker-month-year');
    const pickerDates = document.getElementById('picker-dates');
    
    if (!datePicker || !pickerMonthYear || !pickerDates) return;

    // Navigation
    document.getElementById('picker-prev-month')?.addEventListener('click', () => {
        pickerCurrentDate.setMonth(pickerCurrentDate.getMonth() - 1);
        renderDatePicker();
    });

    document.getElementById('picker-next-month')?.addEventListener('click', () => {
        pickerCurrentDate.setMonth(pickerCurrentDate.getMonth() + 1);
        renderDatePicker();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!datePicker.classList.contains('hidden') && 
            !datePicker.contains(target) && 
            !target.classList.contains('date-input') &&
            !target.classList.contains('date-input-icon')) {
            closeDatePicker();
        }
    });

    // Attach to date inputs and icons
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('date-input') || 
            (target.classList.contains('date-input-icon') && target.previousElementSibling)) {
            const input = target.classList.contains('date-input') 
                ? target as HTMLInputElement
                : target.previousElementSibling as HTMLInputElement;
            openDatePicker(input);
        }
    });
}

/**
 * Render date picker calendar
 */
function renderDatePicker(): void {
    const pickerMonthYear = document.getElementById('picker-month-year');
    const pickerDates = document.getElementById('picker-dates');
    
    if (!pickerMonthYear || !pickerDates) return;

    const year = pickerCurrentDate.getFullYear();
    const month = pickerCurrentDate.getMonth();
    
    pickerMonthYear.textContent = `${MONTH_NAMES[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    let html = '';
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const selectedValue = pickerTargetInput ? pickerTargetInput.value : '';
    
    // Previous month days
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        html += `<div class="date-picker-date other-month" data-day="${day}" data-month="${month === 0 ? 11 : month - 1}" data-year="${month === 0 ? year - 1 : year}">${day}</div>`;
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === selectedValue;
        const classes = ['date-picker-date'];
        if (isToday) classes.push('today');
        if (isSelected) classes.push('selected');
        
        html += `<div class="${classes.join(' ')}" data-day="${day}" data-month="${month}" data-year="${year}">${day}</div>`;
    }
    
    // Next month days
    const totalCells = startDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="date-picker-date other-month" data-day="${day}" data-month="${month === 11 ? 0 : month + 1}" data-year="${month === 11 ? year + 1 : year}">${day}</div>`;
    }
    
    pickerDates.innerHTML = html;
    
    // Add click handlers
    pickerDates.querySelectorAll('.date-picker-date').forEach(cell => {
        cell.addEventListener('click', () => {
            const day = (cell as HTMLElement).dataset.day!.padStart(2, '0');
            const month = (parseInt((cell as HTMLElement).dataset.month!) + 1).toString().padStart(2, '0');
            const year = (cell as HTMLElement).dataset.year;
            const dateStr = `${day}/${month}/${year}`;
            
            if (pickerTargetInput) {
                pickerTargetInput.value = dateStr;
                pickerTargetInput.dispatchEvent(new Event('change'));
            }
            
            closeDatePicker();
        });
    });
}

/**
 * Open date picker for input element
 */
function openDatePicker(inputElement: HTMLInputElement): void {
    const datePicker = document.getElementById('date-picker');
    if (!datePicker) return;

    pickerTargetInput = inputElement;
    
    // Parse current value if exists
    if (inputElement.value) {
        const parts = inputElement.value.split('/');
        if (parts.length === 3) {
            pickerCurrentDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
    } else {
        pickerCurrentDate = new Date();
    }
    
    renderDatePicker();
    
    // Position picker below input
    const rect = inputElement.getBoundingClientRect();
    datePicker.style.top = `${rect.bottom + window.scrollY + 5}px`;
    datePicker.style.left = `${rect.left + window.scrollX}px`;
    
    datePicker.classList.remove('hidden');
}

/**
 * Close date picker
 */
function closeDatePicker(): void {
    const datePicker = document.getElementById('date-picker');
    if (!datePicker) return;
    
    datePicker.classList.add('hidden');
    pickerTargetInput = null;
}
