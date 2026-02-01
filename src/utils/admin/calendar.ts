/**
 * Calendar rendering and navigation utilities
 */

import { formatDate, formatTime } from './formatters';
import { SERVICE_NAMES } from './constants';

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
        
        html += `<div class="${cellClass}" onclick="showDayDetails('${dateStr}')" title="${formatDate(dateStr)}">
            <div class="day-number ${isToday ? 'today' : ''}">${day}</div>
            ${isHoliday ? `<div class="holiday-name">${isHoliday}</div>` : ''}
            ${isVacation && !isHoliday ? '<div class="holiday-name">Atvaļinājums</div>' : ''}
            ${isBlocked && !isHoliday && !isVacation ? '<div class="holiday-name">Bloķēts</div>' : ''}
            ${!isHoliday && !isBlocked && !isVacation && isWorkingDay && !isWeekend && daySchedule ? `<div class="day-time"><i class="ph ph-clock"></i>${formatTime(daySchedule.start)}–${formatTime(daySchedule.end)}</div>` : ''}
            ${totalCount > 0 ? `<div class="booking-count">${totalCount}</div>` : ''}
            ${(pending > 0 || confirmed > 0 || cancelled > 0) ? `<div class="booking-dots">
                ${confirmed > 0 ? `<div class="booking-dot confirmed"><span></span>${confirmed}</div>` : ''}
                ${pending > 0 ? `<div class="booking-dot pending"><span></span>${pending}</div>` : ''}
                ${cancelled > 0 ? `<div class="booking-dot cancelled"><span></span>${cancelled}</div>` : ''}
            </div>` : ''}
        </div>`;
    }
    
    // Empty cells after month end
    const totalCells = startDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remainingCells; i++) {
        html += '<div class="calendar-cell empty"></div>';
    }
    
    grid.innerHTML = html;
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
    
    // Add selected class to clicked day
    const allCells = document.querySelectorAll('.calendar-cell');
    allCells.forEach(cell => {
        const cellDateMatch = cell.getAttribute('onclick')?.match(/showDayDetails\('([^']+)'\)/);
        if (cellDateMatch && cellDateMatch[1] === dateStr) {
            cell.classList.add('selected');
        }
    });
    
    const details = document.getElementById('day-details');
    const title = document.getElementById('day-details-title');
    const list = document.getElementById('day-bookings-list');
    
    if (!details || !title || !list) return;
    
    const date = new Date(dateStr);
    const dayNames = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'];
    title.textContent = `${dayNames[date.getDay()]}, ${formatDate(dateStr)}`;
    
    const holidayName = holidays[dateStr];
    const dayBookings = allBookings.filter(b => b.date === dateStr);
    
    let html = '';
    
    if (holidayName) {
        html += `<div class="booking-card" style="border-left-color:#3b82f6;background:#eff6ff;">
            <div class="booking-details">
                <div><i class="ph ph-flag"></i><strong>Valsts svētki:</strong> ${holidayName}</div>
            </div>
        </div>`;
    }
    
    if (dayBookings.length === 0 && !holidayName) {
        html += '<div class="loading-state" style="padding:40px;"><i class="ph ph-calendar-x" style="font-size:32px;color:var(--color-muted);"></i><span>Nav ierakstu šajā dienā</span></div>';
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
                    <h4 class="group-title" style="color:${color};">
                        <i class="ph ${icon}"></i>
                        ${title} (${bookings.length})
                    </h4>
                    ${bookings.map(b => `
                        <div class="booking-card ${b.status}">
                            <div class="booking-header">
                                <div class="booking-info">
                                    <div class="booking-name">${b.name}</div>
                                    <span class="booking-status ${b.status}">
                                        ${getStatusText(b.status)}
                                    </span>
                                </div>
                                <span class="booking-time">${formatTime(b.time)}</span>
                            </div>
                            <div class="booking-details">
                                <div><i class="ph ph-clipboard-text"></i>${getServiceName(b.service)}</div>
                                <div><i class="ph ${b.consultationFormat === 'online' ? 'ph-video-camera' : 'ph-map-pin'}"></i>${b.consultationFormat === 'online' ? 'Online' : 'Klātienē'}</div>
                                <div><i class="ph ph-envelope"></i>${b.email}</div>
                                ${b.phone ? `<div><i class="ph ph-phone"></i>${b.phone}</div>` : ''}
                                ${b.message ? `<div><i class="ph ph-note"></i>${b.message}</div>` : ''}
                                <div><i class="ph ph-currency-eur"></i>€${b.price || 0}</div>
                            </div>
                            <div class="booking-actions">
                                ${b.status === 'pending' ? `<button onclick="confirmBooking('${b.id}')" class="btn-primary btn-sm"><i class="ph ph-check"></i> Apstiprināt</button>` : ''}
                                ${b.status !== 'cancelled' ? `<button onclick="cancelBooking('${b.id}')" class="btn-danger btn-sm"><i class="ph ph-x"></i> Atcelt</button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        };
        
        html += renderGroup(confirmedBookings, 'Apstiprinātie', 'ph-check-circle', '#22c55e');
        html += renderGroup(pendingBookings, 'Gaida apstiprinājumu', 'ph-clock', '#facc15');
        html += renderGroup(cancelledBookings, 'Atcelti', 'ph-x-circle', '#ef4444');
    }
    
    list.innerHTML = html;
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
