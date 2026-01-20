/**
 * Booking Calendar Component
 * A calendar widget for scheduling appointments
 */

class BookingCalendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTime = null;
        this.availability = null;
        this.currentLang = options.lang || 'lv';
        this.onBookingComplete = options.onBookingComplete || (() => {});
        
        this.translations = {
            lv: {
                title: "Izvēlieties datumu un laiku",
                selectDate: "Izvēlieties datumu",
                selectTime: "Pieejamie laiki",
                noSlots: "Šajā dienā nav pieejamu laiku",
                weekdays: ["Sv", "P", "O", "T", "C", "Pk", "S"],
                months: ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", 
                         "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"],
                serviceLabel: "Pakalpojuma veids",
                nameLabel: "Jūsu vārds",
                emailLabel: "E-pasts vai tālrunis",
                messageLabel: "Komentārs (neobligāts)",
                submitBtn: "Apstiprināt rezervāciju",
                successTitle: "Rezervācija veiksmīga!",
                successText: "Mēs sazināsimies ar Jums 24 stundu laikā, lai apstiprinātu vizīti.",
                closeBtn: "Aizvērt",
                selectedLabel: "Izvēlēts",
                today: "Šodien"
            },
            ru: {
                title: "Выберите дату и время",
                selectDate: "Выберите дату",
                selectTime: "Доступное время",
                noSlots: "В этот день нет свободного времени",
                weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
                months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                         "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
                serviceLabel: "Тип услуги",
                nameLabel: "Ваше имя",
                emailLabel: "Email или телефон",
                messageLabel: "Комментарий (необязательно)",
                submitBtn: "Подтвердить запись",
                successTitle: "Запись успешна!",
                successText: "Мы свяжемся с Вами в течение 24 часов для подтверждения визита.",
                closeBtn: "Закрыть",
                selectedLabel: "Выбрано",
                today: "Сегодня"
            },
            en: {
                title: "Select date and time",
                selectDate: "Select a date",
                selectTime: "Available times",
                noSlots: "No available slots on this day",
                weekdays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
                months: ["January", "February", "March", "April", "May", "June",
                         "July", "August", "September", "October", "November", "December"],
                serviceLabel: "Service type",
                nameLabel: "Your name",
                emailLabel: "Email or phone",
                messageLabel: "Comment (optional)",
                submitBtn: "Confirm booking",
                successTitle: "Booking successful!",
                successText: "We will contact you within 24 hours to confirm your appointment.",
                closeBtn: "Close",
                selectedLabel: "Selected",
                today: "Today"
            }
        };

        this.init();
    }

    async init() {
        await this.loadAvailability();
        this.render();
        this.attachEventListeners();
        console.log('BookingCalendar initialized');
    }

    async loadAvailability() {
        try {
            const response = await fetch('data/availability.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.availability = await response.json();
            console.log('Availability loaded:', this.availability);
        } catch (error) {
            console.error('Failed to load availability:', error);
            this.availability = { slots: {}, booked: [], serviceTypes: [] };
        }
    }

    t(key) {
        return this.translations[this.currentLang][key] || key;
    }

    setLanguage(lang) {
        this.currentLang = lang;
        this.render();
        this.attachEventListeners();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="booking-calendar">
                <div class="booking-header">
                    <h3>${this.t('title')}</h3>
                </div>
                
                <div class="booking-body">
                    <div class="booking-left">
                        <div class="calendar-section">
                            <div class="calendar-nav">
                                <button class="cal-nav-btn prev" aria-label="Previous month">
                                    <i class="ph ph-caret-left"></i>
                                </button>
                                <span class="calendar-month-year"></span>
                                <button class="cal-nav-btn next" aria-label="Next month">
                                    <i class="ph ph-caret-right"></i>
                                </button>
                            </div>
                            <div class="calendar-weekdays"></div>
                            <div class="calendar-days"></div>
                        </div>
                    </div>
                    
                    <div class="booking-right">
                        <div class="time-section">
                            <h4>${this.t('selectTime')}</h4>
                            <div class="time-slots">
                                <p class="no-date-selected">${this.t('selectDate')}</p>
                            </div>
                        </div>
                        
                        <div class="booking-form-section" style="display: none;">
                            <form class="booking-form" id="bookingForm">
                                <div class="selected-datetime"></div>
                                
                                <div class="form-group">
                                    <label>${this.t('serviceLabel')}</label>
                                    <select name="serviceType" required>
                                        ${this.renderServiceOptions()}
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>${this.t('nameLabel')}</label>
                                    <input type="text" name="name" required placeholder="Anna">
                                </div>
                                
                                <div class="form-group">
                                    <label>${this.t('emailLabel')}</label>
                                    <input type="text" name="email" required placeholder="anna@email.com">
                                </div>
                                
                                <div class="form-group">
                                    <label>${this.t('messageLabel')}</label>
                                    <textarea name="message" rows="2" placeholder="..."></textarea>
                                </div>
                                
                                <button type="submit" class="booking-submit-btn">
                                    <i class="ph ph-calendar-check"></i>
                                    ${this.t('submitBtn')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="booking-success-modal" style="display: none;">
                <div class="success-content">
                    <div class="success-icon">
                        <i class="ph ph-check-circle"></i>
                    </div>
                    <h3>${this.t('successTitle')}</h3>
                    <p>${this.t('successText')}</p>
                    <button class="close-success-btn">${this.t('closeBtn')}</button>
                </div>
            </div>
        `;

        this.renderCalendar();
    }

    renderServiceOptions() {
        if (!this.availability?.serviceTypes) return '';
        
        return this.availability.serviceTypes.map(service => 
            `<option value="${service.id}">${service.name[this.currentLang]}</option>`
        ).join('');
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month/year display
        const monthYearEl = this.container.querySelector('.calendar-month-year');
        if (monthYearEl) {
            monthYearEl.textContent = `${this.t('months')[month]} ${year}`;
        }

        // Render weekdays
        const weekdaysEl = this.container.querySelector('.calendar-weekdays');
        if (weekdaysEl) {
            weekdaysEl.innerHTML = this.t('weekdays').map(day => 
                `<span class="weekday">${day}</span>`
            ).join('');
        }

        // Render days
        const daysEl = this.container.querySelector('.calendar-days');
        if (!daysEl) return;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let daysHTML = '';
        
        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            daysHTML += '<span class="day empty"></span>';
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDateISO(date);
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const hasSlots = this.hasAvailableSlots(dateStr);
            const isSelected = this.selectedDate === dateStr;

            let classes = ['day'];
            if (isPast) classes.push('past');
            if (isToday) classes.push('today');
            if (hasSlots && !isPast) classes.push('available');
            if (isSelected) classes.push('selected');
            if (!hasSlots && !isPast) classes.push('unavailable');

            daysHTML += `<span class="${classes.join(' ')}" data-date="${dateStr}">${day}</span>`;
        }

        daysEl.innerHTML = daysHTML;
    }

    hasAvailableSlots(dateStr) {
        if (!this.availability?.slots?.[dateStr]) return false;
        
        const bookedTimes = this.availability.booked
            .filter(b => b.date === dateStr)
            .map(b => b.time);
        
        const availableSlots = this.availability.slots[dateStr]
            .filter(time => !bookedTimes.includes(time));
        
        return availableSlots.length > 0;
    }

    getAvailableSlots(dateStr) {
        if (!this.availability?.slots?.[dateStr]) return [];
        
        const bookedTimes = this.availability.booked
            .filter(b => b.date === dateStr)
            .map(b => b.time);
        
        return this.availability.slots[dateStr]
            .filter(time => !bookedTimes.includes(time))
            .sort();
    }

    formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = this.t('months')[date.getMonth()];
        return `${day} ${month}`;
    }

    renderTimeSlots(dateStr) {
        const timeSlotsEl = this.container.querySelector('.time-slots');
        const formSection = this.container.querySelector('.booking-form-section');
        
        if (!timeSlotsEl) return;

        const slots = this.getAvailableSlots(dateStr);
        
        if (slots.length === 0) {
            timeSlotsEl.innerHTML = `<p class="no-slots">${this.t('noSlots')}</p>`;
            if (formSection) formSection.style.display = 'none';
            return;
        }

        timeSlotsEl.innerHTML = slots.map(time => `
            <button class="time-slot ${this.selectedTime === time ? 'selected' : ''}" data-time="${time}">
                ${time}
            </button>
        `).join('');
    }

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.selectedTime = null;
        
        // Update calendar UI
        this.container.querySelectorAll('.day').forEach(day => {
            day.classList.toggle('selected', day.dataset.date === dateStr);
        });

        // Update time section header
        const timeHeader = this.container.querySelector('.time-section h4');
        if (timeHeader) {
            timeHeader.textContent = `${this.formatDateDisplay(dateStr)}`;
        }

        this.renderTimeSlots(dateStr);
        
        // Hide form if time not selected
        const formSection = this.container.querySelector('.booking-form-section');
        if (formSection) formSection.style.display = 'none';
    }

    selectTime(time) {
        this.selectedTime = time;
        
        // Update time slots UI
        this.container.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.toggle('selected', slot.dataset.time === time);
        });

        // Show booking form
        const formSection = this.container.querySelector('.booking-form-section');
        if (formSection) {
            formSection.style.display = 'block';
            
            // Update selected datetime display
            const datetimeEl = formSection.querySelector('.selected-datetime');
            if (datetimeEl) {
                datetimeEl.innerHTML = `
                    <i class="ph ph-calendar"></i>
                    <strong>${this.t('selectedLabel')}:</strong> 
                    ${this.formatDateDisplay(this.selectedDate)}, ${this.selectedTime}
                `;
            }
        }
    }

    async submitBooking(formData) {
        // In production, this would send to a server
        // For now, we'll simulate success and show confirmation
        
        const booking = {
            date: this.selectedDate,
            time: this.selectedTime,
            name: formData.get('name'),
            email: formData.get('email'),
            type: formData.get('serviceType'),
            message: formData.get('message'),
            createdAt: new Date().toISOString()
        };

        console.log('New booking:', booking);

        // Add to local booked array (simulating database)
        if (this.availability) {
            this.availability.booked.push(booking);
        }

        // Show success modal
        const modal = this.container.querySelector('.booking-success-modal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // Reset form
        this.selectedDate = null;
        this.selectedTime = null;
        
        // Call callback
        this.onBookingComplete(booking);
    }

    attachEventListeners() {
        // Previous month
        this.container.querySelector('.cal-nav-btn.prev')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        // Next month
        this.container.querySelector('.cal-nav-btn.next')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Day selection - using event delegation on container
        const calendarDays = this.container.querySelector('.calendar-days');
        if (calendarDays) {
            calendarDays.addEventListener('click', (e) => {
                console.log('Calendar click event', e.target);
                const dayEl = e.target.closest('.day');
                if (dayEl) {
                    console.log('Day clicked:', dayEl.dataset.date, dayEl.classList.toString());
                    if (!dayEl.classList.contains('past') && !dayEl.classList.contains('empty') && !dayEl.classList.contains('unavailable')) {
                        this.selectDate(dayEl.dataset.date);
                    }
                }
            });
        }

        // Time slot selection
        this.container.querySelector('.time-slots')?.addEventListener('click', (e) => {
            const slotEl = e.target.closest('.time-slot');
            if (slotEl) {
                this.selectTime(slotEl.dataset.time);
            }
        });

        // Form submission
        this.container.querySelector('#bookingForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.submitBooking(formData);
        });

        // Close success modal
        this.container.querySelector('.close-success-btn')?.addEventListener('click', () => {
            const modal = this.container.querySelector('.booking-success-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            this.render(); // Re-render calendar
        });
    }

    // Public method to navigate to month with available slots
    goToNextAvailable() {
        const today = new Date();
        const maxMonths = 3;
        
        for (let i = 0; i < maxMonths; i++) {
            const checkDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const daysInMonth = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = this.formatDateISO(new Date(checkDate.getFullYear(), checkDate.getMonth(), day));
                if (this.hasAvailableSlots(dateStr)) {
                    this.currentDate = checkDate;
                    this.renderCalendar();
                    return;
                }
            }
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingCalendar;
}
