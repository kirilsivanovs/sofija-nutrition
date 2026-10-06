/**
 * Calendar rendering and navigation utilities
 */

import { formatDate, formatTime } from './formatters';
import { SERVICE_NAMES } from './constants';
import { escapeHtml } from '../escapeHtml';

// Calendar state
let currentDate = new Date();
let selectedDate: string | null = null;

// Data state
let allBookings: any[] = [];
let schedule: Record<string, any> = {};
let holidays: Record<string, string> = {};
let blockedDates: Set<string> = new Set();
let vacationPeriods: any[] = [];

// Day names for schedule lookup
const dayNamesForSchedule = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Update calendar data
 */
export function setCalendarData(data: {
    bookings?: any[];
    schedule?: Record<string, any>;
    holidays?: Record<string, string>;
    blockedDates?: Set<string>;
    vacationPeriods?: any[];
}) {
    if (data.bookings !== undefined) allBookings = data.bookings;
    if (data.schedule !== undefined) schedule = data.schedule;
    if (data.holidays !== undefined) holidays = data.holidays;
    if (data.blockedDates !== undefined) blockedDates = data.blockedDates;
    if (data.vacationPeriods !== undefined) vacationPeriods = data.vacationPeriods;
}

/**
 * Get current calendar date
 */
export function getCurrentDate(): Date {
    return currentDate;
}

/**
 * Set current calendar date
 */
export function setCurrentDate(date: Date) {
    currentDate = date;
}

/**
 * Get selected date
 */
export function getSelectedDate(): string | null {
    return selectedDate;
}

/**
 * Set selected date
 */
export function setSelectedDate(date: string | null) {
    selectedDate = date;
}

/**
 * Check if date is in vacation period
 */
function isDateInVacation(dateStr: string): boolean {
    return vacationPeriods.some(v => dateStr >= v.start && dateStr <= v.end);
}

/**
 * Get service name by key
 */
export function getServiceName(service: string): string {
    return SERVICE_NAMES[service] || service;
}

/**
 * Get status text in Latvian
 */
export function getStatusText(status: string): string {
    switch (status) {
        case 'confirmed': return 'Apstiprināts';
        case 'pending': return 'Gaida';
        case 'cancelled': return 'Atcelts';
        default: return status;
    }
}

/** Screen-reader label: date, non-zero counts and the cell's reason text. Never names. */
function buildDayLabel(
    dateStr: string,
    counts: { confirmed: number; pending: number; cancelled: number },
    reasonText: string
): string {
    const parts = [formatDate(dateStr)];
    if (counts.confirmed > 0) parts.push(`apstiprināti: ${counts.confirmed}`);
    if (counts.pending > 0) parts.push(`gaida: ${counts.pending}`);
    if (counts.cancelled > 0) parts.push(`atcelti: ${counts.cancelled}`);
    if (reasonText) parts.push(reasonText);
    return parts.join(', ');
}

const ARROW_KEY_STEPS: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
};

const DAY_BUTTON_SELECTOR = 'button.calendar-cell[data-date]';

/** Delegated click and arrow-key handling; call once, the grid element outlives re-renders. */
export function attachCalendarGridHandlers(grid: HTMLElement | null): void {
    if (!grid) return;

    grid.addEventListener('click', (event) => {
        const cell = (event.target as Element).closest(DAY_BUTTON_SELECTOR);
        const dateStr = cell?.getAttribute('data-date');
        if (dateStr) showDayDetails(dateStr);
    });

    grid.addEventListener('keydown', (event) => {
        const step = ARROW_KEY_STEPS[event.key];
        if (step === undefined || event.ctrlKey || event.altKey || event.metaKey) return;

        const cell = (event.target as Element).closest(DAY_BUTTON_SELECTOR);
        if (!cell) return;

        const cells = Array.from(grid.querySelectorAll<HTMLElement>(DAY_BUTTON_SELECTOR));
        const target = cells[cells.indexOf(cell as HTMLElement) + step];
        event.preventDefault();
        if (!target) return;

        cells.forEach(c => c.setAttribute('tabindex', '-1'));
        target.setAttribute('tabindex', '0');
        target.focus();
    });
}

/**
 * Render calendar grid
 */
export function renderCalendar(): void {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const bookingsByDate: Record<string, any[]> = {};
    allBookings.forEach(b => {
        if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
        bookingsByDate[b.date].push(b);
    });
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('📅 Rendering calendar:', { year, month: month + 1, totalBookings: allBookings.length, scheduleLoaded: !!schedule });
    
    // Roving tabindex: one Tab stop, today if visible, else day 1
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const tabStopDate = todayStr.startsWith(monthPrefix) ? todayStr : `${monthPrefix}01`;

    let html = '';

    // Empty cells before month start
    for (let i = 0; i < startDay; i++) {
        html += '<div class="calendar-cell empty"></div>';
    }
    
    // Days in month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const isHoliday = holidays[dateStr];
        const dayBookings = bookingsByDate[dateStr] || [];
        const dayOfWeek = (startDay + day - 1) % 7;
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
        const isBlocked = blockedDates.has(dateStr);
        const isVacation = isDateInVacation(dateStr);
        
        const checkDate = new Date(year, month, day);
        const scheduleDayName = dayNamesForSchedule[checkDate.getDay()];
        const daySchedule = schedule[scheduleDayName];
        const isWorkingDay = daySchedule && daySchedule.enabled;
        
        const pending = dayBookings.filter(b => b.status === 'pending').length;
        const confirmed = dayBookings.filter(b => b.status === 'confirmed').length;
        const cancelled = dayBookings.filter(b => b.status === 'cancelled').length;
        const totalCount = dayBookings.length;
        
        let cellClass = 'calendar-cell';
        if (isHoliday || isBlocked || isVacation) {
            cellClass += ' holiday';
        } else if (isWeekend || !isWorkingDay) {
            cellClass += ' weekend';
        } else if (confirmed > 0 || pending > 0) {
            cellClass += ' booked';
        } else {
            cellClass += ' available';
        }
        
        const reasonText = isHoliday
            ? String(isHoliday)
            : isVacation ? 'Atvaļinājums' : isBlocked ? 'Bloķēts' : '';
        const label = buildDayLabel(dateStr, { confirmed, pending, cancelled }, reasonText);
        const tabStop = dateStr === tabStopDate ? '0' : '-1';

        html += `<button type="button" class="${cellClass}" data-date="${dateStr}" aria-pressed="false" aria-label="${escapeHtml(label)}" tabindex="${tabStop}"${isToday ? ' aria-current="date"' : ''}>
            <span class="day-number ${isToday ? 'today' : ''}">${day}</span>
            ${isHoliday ? `<span class="holiday-name">${escapeHtml(String(isHoliday))}</span>` : ''}
            ${isVacation && !isHoliday ? '<span class="holiday-name">Atvaļinājums</span>' : ''}
            ${isBlocked && !isHoliday && !isVacation ? '<span class="holiday-name">Bloķēts</span>' : ''}
            ${!isHoliday && !isBlocked && !isVacation && isWorkingDay && !isWeekend && daySchedule ? `<span class="day-time"><i class="ph ph-clock"></i>${formatTime(daySchedule.start)}–${formatTime(daySchedule.end)}</span>` : ''}
            ${totalCount > 0 ? `<span class="booking-count">${totalCount}</span>` : ''}
            ${(pending > 0 || confirmed > 0 || cancelled > 0) ? `<span class="booking-dots">
                ${confirmed > 0 ? `<span class="booking-dot confirmed"><span></span>${confirmed}</span>` : ''}
                ${pending > 0 ? `<span class="booking-dot pending"><span></span>${pending}</span>` : ''}
                ${cancelled > 0 ? `<span class="booking-dot cancelled"><span></span>${cancelled}</span>` : ''}
            </span>` : ''}
        </button>`;
    }
    
    // Empty cells after month end
    const totalCells = startDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remainingCells; i++) {
        html += '<div class="calendar-cell empty"></div>';
    }
    
    grid.innerHTML = html;
}

type BookingActionWindow = Window & {
    confirmBooking?: (id: string) => void;
    cancelBooking?: (id: string) => void;
};

function handleBookingAction(event: MouseEvent): void {
    const button = (event.target as Element).closest<HTMLElement>('[data-booking-action]');
    const id = button?.dataset.bookingId;
    if (!button || !id) return;
    const actions = window as BookingActionWindow;
    if (button.dataset.bookingAction === 'confirm') actions.confirmBooking?.(id);
    else if (button.dataset.bookingAction === 'cancel') actions.cancelBooking?.(id);
}

/**
 * Show details for a specific day
 */
export function showDayDetails(dateStr: string): void {
    selectedDate = dateStr;
    
    // Remove previous selection
    document.querySelectorAll('.calendar-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    document.querySelectorAll('.calendar-cell[aria-pressed="true"]').forEach(cell => {
        cell.setAttribute('aria-pressed', 'false');
    });

    const selectedCell = document.querySelector(`.calendar-cell[data-date="${dateStr}"]`);
    if (selectedCell) {
        selectedCell.classList.add('selected');
        selectedCell.setAttribute('aria-pressed', 'true');
    }
    
    const details = document.getElementById('day-details');
    const title = document.getElementById('day-details-title');
    const list = document.getElementById('day-bookings-list');
    
    if (!details || !title || !list) return;
    
    const date = new Date(dateStr);
    const dayNames = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'];
    title.textContent = `${dayNames[date.getDay()]}, ${formatDate(dateStr)}`;
    
    const holidayName = holidays[dateStr];
    const dayBookings = allBookings.filter(b => b.date === dateStr);
    
    const reason = !holidayName && isDateInVacation(dateStr)
        ? 'Atvaļinājums'
        : !holidayName && blockedDates.has(dateStr) ? 'Bloķēts' : '';

    let html = '';

    if (holidayName) {
        html += `<div class="booking-card" style="border-left:3px solid var(--color-slate);background:var(--color-white);">
            <div class="booking-details">
                <div><i class="ph ph-flag"></i><strong>Valsts svētki:</strong> ${escapeHtml(String(holidayName))}</div>
            </div>
        </div>`;
    }

    if (reason) {
        html += `<div class="booking-card" style="border-left:3px solid var(--color-slate);background:var(--color-white);">
            <div class="booking-details">
                <div><i class="ph ph-calendar-x"></i><strong>${reason}</strong></div>
            </div>
        </div>`;
    }

    if (dayBookings.length === 0 && !holidayName && !reason) {
        html += '<div class="loading-state" style="padding:40px;"><i class="ph ph-calendar-x" style="font-size:32px;color:var(--color-slate);"></i><span>Nav ierakstu šajā dienā</span></div>';
    } else {
        // Group bookings by status
        const confirmedBookings = dayBookings.filter(b => b.status === 'confirmed');
        const pendingBookings = dayBookings.filter(b => b.status === 'pending');
        const cancelledBookings = dayBookings.filter(b => b.status === 'cancelled');
        
        const renderGroup = (bookings: any[], title: string, icon: string, color: string) => {
            if (bookings.length === 0) return '';
            bookings.sort((a, b) => a.time.localeCompare(b.time));
            return `
                <div class="bookings-group">
                    <h4 class="group-title">
                        <i class="ph ${icon}" style="color:${color};"></i>
                        ${title} (${bookings.length})
                    </h4>
                    ${bookings.map(b => `
                        <div class="booking-card ${escapeHtml(b.status)}">
                            <div class="booking-header">
                                <div class="booking-info">
                                    <div class="booking-name">${escapeHtml(b.name)}</div>
                                    <span class="booking-status ${escapeHtml(b.status)}">
                                        ${escapeHtml(getStatusText(b.status))}
                                    </span>
                                </div>
                                <span class="booking-time">${escapeHtml(formatTime(b.time))}</span>
                            </div>
                            <div class="booking-details">
                                <div><i class="ph ph-clipboard-text"></i>${escapeHtml(getServiceName(b.service))}</div>
                                <div><i class="ph ${b.consultationFormat === 'online' ? 'ph-video-camera' : 'ph-map-pin'}"></i>${b.consultationFormat === 'online' ? 'Online' : 'Klātienē'}</div>
                                <div><i class="ph ph-envelope"></i>${escapeHtml(b.email)}</div>
                                ${b.phone ? `<div><i class="ph ph-phone"></i>${escapeHtml(b.phone)}</div>` : ''}
                                ${b.notes ? `<div><i class="ph ph-note"></i>${escapeHtml(b.notes)}</div>` : ''}
                                <div><i class="ph ph-currency-eur"></i>€${escapeHtml(b.price || 0)}</div>
                            </div>
                            <div class="booking-actions">
                                ${b.status === 'pending' ? `<button data-booking-action="confirm" data-booking-id="${escapeHtml(b.id)}" class="btn-primary btn-sm"><i class="ph ph-check"></i> Apstiprināt</button>` : ''}
                                ${b.status !== 'cancelled' ? `<button data-booking-action="cancel" data-booking-id="${escapeHtml(b.id)}" class="btn-danger btn-sm"><i class="ph ph-x"></i> Atcelt</button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        };
        
        html += renderGroup(confirmedBookings, 'Apstiprinātie', 'ph-check-circle', 'var(--color-range)');
        html += renderGroup(pendingBookings, 'Gaida apstiprinājumu', 'ph-clock', 'var(--color-high)');
        html += renderGroup(cancelledBookings, 'Atcelti', 'ph-x-circle', 'var(--color-error)');
    }
    
    list.innerHTML = html;
    list.onclick = handleBookingAction;
    details.classList.remove('hidden');
    details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Navigate to previous/next month
 */
export function navigateMonth(direction: number): void {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

/**
 * Go to today
 */
export function goToToday(): void {
    currentDate = new Date();
    renderCalendar();
}
