/**
 * Holidays management utilities
 */

import { formatDate } from './formatters';

/**
 * Load and render holidays for selected year
 */
export async function loadHolidays(apiBase: string): Promise<void> {
    const yearSelect = document.getElementById('holiday-year') as HTMLSelectElement;
    const list = document.getElementById('holidays-list');
    
    if (!yearSelect || !list) return;
    
    const year = yearSelect.value;
    
    try {
        const response = await fetch(`${apiBase}/holidays?year=${year}`);
        const data = await response.json();
        
        if (data.holidays && data.holidays.length > 0) {
            list.innerHTML = data.holidays.map((h: any) => `
                <div class="holiday-item">
                    <span class="holiday-date">${formatDate(h.date)}</span>
                    <span>${h.name}</span>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p style="color:var(--color-text-light);">Nav svētku šajā gadā</p>';
        }
    } catch (e) {
        list.innerHTML = '<p style="color:#dc2626;">Kļūda ielādējot svētkus</p>';
    }
}

/**
 * Setup holidays event listeners
 */
export function setupHolidaysListeners(apiBase: string): void {
    const yearSelect = document.getElementById('holiday-year');
    const refreshBtn = document.getElementById('refresh-holidays');
    
    yearSelect?.addEventListener('change', () => loadHolidays(apiBase));
    refreshBtn?.addEventListener('click', () => loadHolidays(apiBase));
}
