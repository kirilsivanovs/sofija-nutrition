/**
 * Availability management utilities
 */

import { formatDate, formatTime, formatDateReverse, initializeDateInputs } from './formatters';
import { showToast, showConfirm } from './notifications';
import { escapeHtml } from '../escapeHtml';

// Day configuration
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayNames = {
    monday: 'Pirmdiena',
    tuesday: 'Otrdiena',
    wednesday: 'Trešdiena',
    thursday: 'Ceturtdiena',
    friday: 'Piektdiena',
    saturday: 'Sestdiena',
    sunday: 'Svētdiena'
};

/**
 * Load and render availability form
 */
export function loadAvailabilityForm(apiBase: string, onLoadCallback?: () => void): void {
    const form = document.getElementById('availability-form');
    if (!form) return;

    form.innerHTML = days.map(day => `
        <div class="availability-day">
            <div class="availability-day-header">
                <span class="availability-day-name">${dayNames[day]}</span>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="day-${day}-enabled" checked style="width:20px;height:20px;accent-color:var(--color-navy);">
                    <span style="font-size:14px;color:var(--color-slate);">Aktīva</span>
                </label>
            </div>
            <div class="availability-day-times">
                <input type="text" id="day-${day}-start" value="09:00" placeholder="HH:MM" pattern="[0-2][0-9]:[0-5][0-9]" maxlength="5" class="input-field time-input">
                <span style="color:var(--color-slate);">—</span>
                <input type="text" id="day-${day}-end" value="17:00" placeholder="HH:MM" pattern="[0-2][0-9]:[0-5][0-9]" maxlength="5" class="input-field time-input">
            </div>
        </div>
    `).join('');
    
    document.getElementById('day-saturday-enabled')?.setAttribute('checked', 'false');
    document.getElementById('day-sunday-enabled')?.setAttribute('checked', 'false');
    
    const satCheckbox = document.getElementById('day-saturday-enabled') as HTMLInputElement;
    const sunCheckbox = document.getElementById('day-sunday-enabled') as HTMLInputElement;
    if (satCheckbox) satCheckbox.checked = false;
    if (sunCheckbox) sunCheckbox.checked = false;
    
    // Add time input formatters
    document.querySelectorAll('.time-input').forEach(input => {
        input.addEventListener('blur', function(this: HTMLInputElement) {
            this.value = formatTime(this.value);
        });
        input.addEventListener('keypress', function(e: KeyboardEvent) {
            if (!/[0-9:]/.test(e.key)) e.preventDefault();
        });
    });

    // Reinitialize date input formatters after DOM update
    initializeDateInputs();

    // Load data from API
    fetch(apiBase + '/dashboard/availability')
        .then(r => r.json())
        .then(data => {
            if (data.schedule) {
                Object.entries(data.schedule).forEach(([day, config]: [string, any]) => {
                    const checkbox = document.getElementById(`day-${day}-enabled`) as HTMLInputElement;
                    const startInput = document.getElementById(`day-${day}-start`) as HTMLInputElement;
                    const endInput = document.getElementById(`day-${day}-end`) as HTMLInputElement;
                    if (checkbox) checkbox.checked = config.enabled;
                    if (startInput) startInput.value = config.start || '09:00';
                    if (endInput) endInput.value = config.end || '17:00';
                });
            }
            if (data.blockedDates) renderBlockedDates(apiBase, data.blockedDates);
            if (data.vacationPeriods) renderVacationPeriods(apiBase, data.vacationPeriods);
            
            if (onLoadCallback) onLoadCallback();
        })
        .catch(() => {});
}

/**
 * Render vacation periods list
 */
export function renderVacationPeriods(apiBase: string, periods: any[]): void {
    const list = document.getElementById('vacation-list');
    if (!list) return;
    
    if (!periods || periods.length === 0) {
        list.innerHTML = '<p style="color:var(--color-slate);font-size:14px;">Nav atvaļinājuma periodu</p>';
        return;
    }
    
    list.innerHTML = periods.map(v => `
        <div class="blocked-item" style="background:var(--color-white);border-left:3px solid var(--color-slate);">
            <span>
                <strong>${escapeHtml(formatDate(v.startDate))}</strong> — <strong>${escapeHtml(formatDate(v.endDate))}</strong>
                ${v.reason ? '<span style="color:var(--color-slate);margin-left:12px;">' + escapeHtml(v.reason) + '</span>' : ''}
            </span>
            <button type="button" data-vacation-id="${escapeHtml(v.id)}" aria-label="${escapeHtml('Dzēst atvaļinājumu ' + formatDate(v.startDate) + ' — ' + formatDate(v.endDate))}" class="btn-close" style="width:28px;height:28px;">
                <i class="ph ph-x" aria-hidden="true"></i>
            </button>
        </div>
    `).join('');

    list.onclick = (event) => {
        const button = (event.target as Element).closest('[data-vacation-id]') as HTMLElement | null;
        if (button) removeVacation(apiBase, button.dataset.vacationId!, () => loadAvailabilityForm(apiBase));
    };
}

/**
 * Render blocked dates list
 */
export function renderBlockedDates(apiBase: string, dates: any[]): void {
    const list = document.getElementById('blocked-dates-list');
    if (!list) return;
    
    if (!dates || dates.length === 0) {
        list.innerHTML = '<p style="color:var(--color-slate);font-size:14px;">Nav bloķētu datumu</p>';
        return;
    }
    
    list.innerHTML = dates.map(d => `
        <div class="blocked-item">
            <span>${escapeHtml(formatDate(d.date))} ${d.reason ? '— ' + escapeHtml(d.reason) : ''}</span>
            <button type="button" data-blocked-date="${escapeHtml(d.date)}" aria-label="${escapeHtml('Noņemt bloķēšanu ' + formatDate(d.date))}" class="btn-close" style="width:28px;height:28px;">
                <i class="ph ph-x" aria-hidden="true"></i>
            </button>
        </div>
    `).join('');

    list.onclick = (event) => {
        const button = (event.target as Element).closest('[data-blocked-date]') as HTMLElement | null;
        if (button) removeBlockedDate(apiBase, button.dataset.blockedDate!, () => loadAvailabilityForm(apiBase));
    };
}

async function requireOk(response: Response): Promise<void> {
    if (response.ok) return;
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${response.status}`);
}

/**
 * Save availability schedule
 */
export async function saveAvailability(apiBase: string): Promise<void> {
    const scheduleData: Record<string, any> = {};
    
    days.forEach(day => {
        const enabledInput = document.getElementById(`day-${day}-enabled`) as HTMLInputElement;
        const startInput = document.getElementById(`day-${day}-start`) as HTMLInputElement;
        const endInput = document.getElementById(`day-${day}-end`) as HTMLInputElement;
        
        scheduleData[day] = {
            enabled: enabledInput?.checked || false,
            start: startInput?.value || '09:00',
            end: endInput?.value || '17:00'
        };
    });
    
    try {
        const response = await fetch(apiBase + '/dashboard/availability', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule: scheduleData })
        });
        await requireOk(response);
        showToast('Pieejamība saglabāta!', 'success');
    } catch (e: any) {
        showToast(e.message, 'error');
    }
}

/**
 * Add vacation period
 */
export async function addVacation(apiBase: string, onSuccess?: () => void): Promise<void> {
    const startDateInput = document.getElementById('vacation-start') as HTMLInputElement;
    const endDateInput = document.getElementById('vacation-end') as HTMLInputElement;
    const reasonInput = document.getElementById('vacation-reason') as HTMLInputElement;
    
    const startDateDisplay = startDateInput?.value;
    const endDateDisplay = endDateInput?.value;
    const reason = reasonInput?.value;
    
    if (!startDateDisplay || !endDateDisplay) {
        return showToast('Izvēlieties sākuma un beigu datumus', 'warning');
    }
    
    // Convert dd/mm/yyyy to yyyy-mm-dd for API
    const startDate = formatDateReverse(startDateDisplay);
    const endDate = formatDateReverse(endDateDisplay);
    
    if (new Date(startDate) > new Date(endDate)) {
        return showToast('Sākuma datums nevar būt vēlāks par beigu datumu', 'warning');
    }
    
    try {
        const response = await fetch(apiBase + '/dashboard/availability/vacation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate, reason })
        });
        await requireOk(response);

        startDateInput.value = '';
        endDateInput.value = '';
        reasonInput.value = '';
        
        showToast('Atvaļinājums pievienots!', 'success');
        
        if (onSuccess) onSuccess();
    } catch (e: any) {
        showToast(e.message, 'error');
    }
}

/**
 * Remove vacation period
 */
export async function removeVacation(apiBase: string, id: string, onSuccess?: () => void): Promise<void> {
    const confirmed = await showConfirm('Dzēst šo atvaļinājuma periodu?', 'Dzēst atvaļinājumu');
    if (!confirmed) return;
    
    try {
        await fetch(apiBase + '/dashboard/availability/vacation', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        showToast('Atvaļinājums dzēsts', 'success');
        
        if (onSuccess) onSuccess();
    } catch (e: any) {
        showToast(e.message, 'error');
    }
}

/**
 * Add blocked date
 */
export async function addBlockedDate(apiBase: string, onSuccess?: () => void): Promise<void> {
    const dateInput = document.getElementById('block-date') as HTMLInputElement;
    const reasonInput = document.getElementById('block-reason') as HTMLInputElement;
    
    const dateDisplay = dateInput?.value;
    const reason = reasonInput?.value;
    
    if (!dateDisplay) {
        return showToast('Izvēlieties datumu', 'warning');
    }
    
    // Convert dd/mm/yyyy to yyyy-mm-dd for API
    const date = formatDateReverse(dateDisplay);
    
    try {
        const response = await fetch(apiBase + '/dashboard/availability/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, reason })
        });
        await requireOk(response);

        dateInput.value = '';
        reasonInput.value = '';
        
        showToast('Datums bloķēts', 'success');
        
        if (onSuccess) onSuccess();
    } catch (e: any) {
        showToast(e.message, 'error');
    }
}

/**
 * Remove blocked date
 */
export async function removeBlockedDate(apiBase: string, date: string, onSuccess?: () => void): Promise<void> {
    try {
        await fetch(apiBase + '/dashboard/availability/block', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date })
        });
        
        showToast('Bloķēšana noņemta', 'success');
        
        if (onSuccess) onSuccess();
    } catch (e: any) {
        showToast(e.message, 'error');
    }
}

/**
 * Setup vacation date validation
 */
export function setupVacationDateValidation(): void {
    const startDateInput = document.getElementById('vacation-start') as HTMLInputElement;
    const endDateInput = document.getElementById('vacation-end') as HTMLInputElement;
    
    if (!startDateInput || !endDateInput) return;
    
    startDateInput.addEventListener('change', function() {
        const startDate = this.value;
        if (startDate) {
            // Set minimum date for end date to be same as start date
            endDateInput.min = startDate;
            // If end date is not set or is before start date, set it to start date
            if (!endDateInput.value || endDateInput.value < startDate) {
                endDateInput.value = startDate;
            }
        }
    });
}
