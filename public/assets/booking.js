/**
 * Booking Calendar Component
 * A calendar widget for scheduling appointments
 */

// Auto-detect API URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:7071'
    : 'https://sofija-nutrition-api.azurewebsites.net';

class BookingCalendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTime = null;
        this.availability = null;
        this.serviceSettings = [];
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
                formatLabel: "Konsultācijas formāts",
                formatOnline: "Attālināti (Zoom/Google Meet)",
                formatInPerson: "Klātienē",
                nameLabel: "Jūsu vārds",
                emailLabel: "E-pasts",
                phoneLabel: "Telefons",
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
                formatLabel: "Формат консультации",
                formatOnline: "Онлайн (Zoom/Google Meet)",
                formatInPerson: "Очно",
                nameLabel: "Ваше имя",
                emailLabel: "Email",
                phoneLabel: "Телефон",
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
                formatLabel: "Consultation format",
                formatOnline: "Online (Zoom/Google Meet)",
                formatInPerson: "In-person",
                nameLabel: "Your name",
                emailLabel: "Email",
                phoneLabel: "Phone",
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
        this.navigateToFirstAvailableMonth();
        this.render();
        this.attachEventListeners();
    }

    async loadAvailability() {
        try {
            // Try external Azure Functions API first
            let response = await fetch(`${API_BASE_URL}/api/availability`);
            
            // Fallback to static JSON for local development
            if (!response.ok) {
                console.log('API not available, falling back to static JSON');
                response = await fetch('/data/availability.json');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.availability = await response.json();
        } catch (error) {
            console.error('Failed to load availability:', error);
            this.availability = { slots: {}, booked: [], serviceTypes: [] };
        }
    }

    /**
     * Навигация к первому месяцу с доступными датами
     * Чтобы клиент сразу видел ближайшие свободные дни
     */
    navigateToFirstAvailableMonth() {
        if (!this.availability || !this.availability.slots) return;
        
        const availableDates = Object.keys(this.availability.slots)
            .filter(dateStr => {
                const slots = this.availability.slots[dateStr];
                return slots && slots.length > 0;
            })
            .sort();
        
        if (availableDates.length === 0) return;
        
        // Берём первую доступную дату
        const firstAvailableDate = new Date(availableDates[0]);
        
        // Устанавливаем currentDate на этот месяц
        this.currentDate = new Date(firstAvailableDate.getFullYear(), firstAvailableDate.getMonth(), 1);
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
                                    <select name="serviceType" id="serviceTypeSelect" required>
                                        ${this.renderServiceOptions()}
                                    </select>
                                </div>
                                
                                <div class="form-group" id="formatGroup">
                                    <label>${this.t('formatLabel')}</label>
                                    <div class="format-options">
                                        <label class="format-option">
                                            <input type="radio" name="consultationFormat" value="online" id="formatOnline" required>
                                            <span class="format-label">
                                                <i class="ph ph-video-camera"></i>
                                                ${this.t('formatOnline')}
                                            </span>
                                        </label>
                                        <label class="format-option">
                                            <input type="radio" name="consultationFormat" value="in-person" id="formatInPerson">
                                            <span class="format-label">
                                                <i class="ph ph-map-pin"></i>
                                                ${this.t('formatInPerson')}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>${this.t('nameLabel')}</label>
                                    <input type="text" name="name" required placeholder="Anna">
                                </div>
                                
                                <div class="form-group">
                                    <label>${this.t('emailLabel')}</label>
                                    <input type="email" name="email" required placeholder="anna@email.com">
                                </div>
                                
                                <div class="form-group">
                                    <label>${this.t('phoneLabel')}</label>
                                    <input type="tel" name="phone" placeholder="+371 20000000">
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

        // Обновляем состояние кнопки "назад"
        const prevBtn = this.container.querySelector('.cal-nav-btn.prev');
        if (prevBtn) {
            const firstAvailable = this.getFirstAvailableMonth();
            if (firstAvailable) {
                const currentTime = new Date(year, month, 1).getTime();
                const firstAvailableTime = new Date(firstAvailable.year, firstAvailable.month, 1).getTime();
                
                if (currentTime <= firstAvailableTime) {
                    prevBtn.disabled = true;
                    prevBtn.style.opacity = '0.3';
                    prevBtn.style.cursor = 'not-allowed';
                } else {
                    prevBtn.disabled = false;
                    prevBtn.style.opacity = '1';
                    prevBtn.style.cursor = 'pointer';
                }
            }
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
        
        // Get current time for filtering past slots on today
        const now = new Date();
        const today = this.formatDateISO(now);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        return this.availability.slots[dateStr]
            .filter(time => !bookedTimes.includes(time))
            .filter(time => {
                // If not today, show all available slots
                if (dateStr !== today) return true;
                
                // For today, filter out past times
                const [slotHour, slotMinute] = time.split(':').map(Number);
                
                // Add 30 min buffer - don't allow booking less than 30 min from now
                const slotTotalMinutes = slotHour * 60 + slotMinute;
                const currentTotalMinutes = currentHour * 60 + currentMinute + 30;
                
                return slotTotalMinutes > currentTotalMinutes;
            })
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
            
            // Apply service format restrictions to initial state
            this.updateFormatOptions();
        }
    }

    async submitBooking(formData) {
        const submitBtn = this.container.querySelector('.booking-submit-btn');
        const originalBtnText = submitBtn?.innerHTML;
        
        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> ' + 
                (this.currentLang === 'ru' ? 'Отправка...' : 
                 this.currentLang === 'en' ? 'Sending...' : 'Sūta...');
        }

        const bookingData = {
            date: this.selectedDate,
            time: this.selectedTime,
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            service: formData.get('serviceType'),
            consultationFormat: formData.get('consultationFormat'),
            message: formData.get('message'),
            language: this.currentLang
        };

        try {
            // Call external Azure Functions API
            const response = await fetch(`${API_BASE_URL}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    // Update success modal with invoice info
                    this.showSuccessWithInvoice(result.booking);
                } else {
                    throw new Error(result.error || 'Booking failed');
                }
            } else {
                // Fallback for local development without API
                this.simulateLocalBooking(bookingData);
            }
        } catch (error) {
            console.error('Booking error:', error);
            // Fallback for local development
            this.simulateLocalBooking(bookingData);
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    }

    showSuccessWithInvoice(booking) {
        // Add to local booked array
        if (this.availability) {
            this.availability.booked.push({
                date: booking.date,
                time: booking.time,
                type: booking.serviceType
            });
        }

        // Update success modal content
        const modal = this.container.querySelector('.booking-success-modal');
        const successContent = modal?.querySelector('.success-content');
        
        if (successContent && booking) {
            const invoiceInfo = this.currentLang === 'ru' 
                ? `<p class="invoice-info">Счёт <strong>${booking.id}</strong> отправлен на вашу почту.<br>Сумма: <strong>€${booking.price?.toFixed(2) || '—'}</strong></p>`
                : this.currentLang === 'en'
                ? `<p class="invoice-info">Invoice <strong>${booking.id}</strong> has been sent to your email.<br>Amount: <strong>€${booking.price?.toFixed(2) || '—'}</strong></p>`
                : `<p class="invoice-info">Rēķins <strong>${booking.id}</strong> ir nosūtīts uz Jūsu e-pastu.<br>Summa: <strong>€${booking.price?.toFixed(2) || '—'}</strong></p>`;
            
            successContent.innerHTML = `
                <div class="success-icon">
                    <i class="ph ph-check-circle"></i>
                </div>
                <h3>${this.t('successTitle')}</h3>
                ${invoiceInfo}
                <p>${this.t('successText')}</p>
                <button class="close-success-btn">${this.t('closeBtn')}</button>
            `;
            
            // Re-attach close button event
            successContent.querySelector('.close-success-btn')?.addEventListener('click', () => {
                modal.style.display = 'none';
                this.render();
                this.attachEventListeners();
                this.renderCalendar();
            });
        }

        if (modal) {
            modal.style.display = 'flex';
        }

        // Reset form
        this.selectedDate = null;
        this.selectedTime = null;
        
        // Call callback
        this.onBookingComplete(booking);
    }

    simulateLocalBooking(bookingData) {
        // For local development without API
        const simulatedBooking = {
            id: `INV-${Date.now().toString(36).toUpperCase()}`,
            date: bookingData.date,
            time: bookingData.time,
            serviceType: bookingData.serviceType,
            price: bookingData.serviceType === 'cgm-diagnostic' ? 150 : 
                   bookingData.serviceType === 'consultation' ? 80 : 50
        };
        
        // Add to local booked array
        if (this.availability) {
            this.availability.booked.push({
                date: bookingData.date,
                time: bookingData.time,
                name: bookingData.name,
                email: bookingData.email,
                type: bookingData.serviceType
            });
        }

        // Show success modal with proper close handler
        const modal = this.container.querySelector('.booking-success-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Re-attach close button event
            const closeBtn = modal.querySelector('.close-success-btn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                    this.render();
                    this.attachEventListeners();
                };
            }
        }

        // Reset form
        this.selectedDate = null;
        this.selectedTime = null;
        
        // Call callback
        this.onBookingComplete(simulatedBooking);
    }

    updateFormatOptions() {
        const serviceSelect = this.container.querySelector('#serviceTypeSelect');
        if (!serviceSelect) return;
        
        const serviceId = serviceSelect.value;
        const formatOnline = this.container.querySelector('#formatOnline');
        const formatInPerson = this.container.querySelector('#formatInPerson');
        
        // Найти настройки услуги из загруженных данных
        const serviceSetting = this.serviceSettings?.find(s => s.id === serviceId);
        
        if (serviceSetting) {
            // Использовать настройки из базы данных
            if (!serviceSetting.allowOnline && serviceSetting.allowInPerson) {
                // In-person only
                if (formatOnline && formatInPerson) {
                    formatOnline.parentElement.style.display = 'none';
                    formatInPerson.checked = true;
                    this.selectedFormat = 'in-person';
                }
            } else if (serviceSetting.allowOnline && !serviceSetting.allowInPerson) {
                // Только онлайн
                if (formatOnline && formatInPerson) {
                    formatInPerson.parentElement.style.display = 'none';
                    formatOnline.checked = true;
                    this.selectedFormat = 'online';
                }
            } else {
                // Оба формата доступны
                if (formatOnline && formatInPerson) {
                    formatOnline.parentElement.style.display = 'flex';
                    formatInPerson.parentElement.style.display = 'flex';
                    if (!formatOnline.checked && !formatInPerson.checked) {
                        formatOnline.checked = true;
                        this.selectedFormat = 'online';
                    }
                }
            }
        } else {
            // Fallback to hardcoded list if settings not loaded
            const inPersonOnly = ['cgm-diagnostic'];
            
            if (inPersonOnly.includes(serviceId)) {
                if (formatOnline && formatInPerson) {
                    formatOnline.parentElement.style.display = 'none';
                    formatInPerson.checked = true;
                    this.selectedFormat = 'in-person';
                }
            } else {
                if (formatOnline && formatInPerson) {
                    formatOnline.parentElement.style.display = 'flex';
                    formatInPerson.parentElement.style.display = 'flex';
                    if (!formatOnline.checked && !formatInPerson.checked) {
                        formatOnline.checked = true;
                        this.selectedFormat = 'online';
                    }
                }
            }
        }
    }

    /**
     * Проверяет, есть ли доступные даты в указанном месяце
     */
    hasAvailableDatesInMonth(year, month) {
        if (!this.availability || !this.availability.slots) return false;
        
        return Object.keys(this.availability.slots).some(dateStr => {
            const slots = this.availability.slots[dateStr];
            if (!slots || slots.length === 0) return false;
            
            const date = new Date(dateStr);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    }

    /**
     * Получает первый месяц с доступными датами
     */
    getFirstAvailableMonth() {
        if (!this.availability || !this.availability.slots) return null;
        
        const availableDates = Object.keys(this.availability.slots)
            .filter(dateStr => {
                const slots = this.availability.slots[dateStr];
                return slots && slots.length > 0;
            })
            .sort();
        
        if (availableDates.length === 0) return null;
        
        const firstDate = new Date(availableDates[0]);
        return { year: firstDate.getFullYear(), month: firstDate.getMonth() };
    }

    attachEventListeners() {
        // Previous month - only if there are available dates
        this.container.querySelector('.cal-nav-btn.prev')?.addEventListener('click', () => {
            const prevMonth = this.currentDate.getMonth() - 1;
            const prevYear = prevMonth < 0 ? this.currentDate.getFullYear() - 1 : this.currentDate.getFullYear();
            const normalizedMonth = prevMonth < 0 ? 11 : prevMonth;
            
            // Проверяем, есть ли доступные даты в предыдущем месяце
            // или это первый месяц с доступными датами
            const firstAvailable = this.getFirstAvailableMonth();
            if (firstAvailable) {
                const firstAvailableTime = new Date(firstAvailable.year, firstAvailable.month, 1).getTime();
                const targetTime = new Date(prevYear, normalizedMonth, 1).getTime();
                
                // Не позволяем уйти раньше первого доступного месяца
                if (targetTime < firstAvailableTime) {
                    return;
                }
            }
            
            this.currentDate.setDate(1);
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        // Next month
        this.container.querySelector('.cal-nav-btn.next')?.addEventListener('click', () => {
            // Set to 1st day to avoid month overflow (e.g., Jan 30 -> Feb 30 = Mar 2)
            this.currentDate.setDate(1);
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Day selection - using event delegation on container
        const calendarDays = this.container.querySelector('.calendar-days');
        if (calendarDays) {
            calendarDays.addEventListener('click', (e) => {
                const dayEl = e.target.closest('.day');
                if (dayEl) {
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

        // Service type change - handle format restrictions
        this.container.querySelector('#serviceTypeSelect')?.addEventListener('change', (e) => {
            this.updateFormatOptions();
        });

        // Close success modal
        this.container.querySelector('.close-success-btn')?.addEventListener('click', () => {
            const modal = this.container.querySelector('.booking-success-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            this.render(); // Re-render calendar
            this.attachEventListeners(); // Re-attach event listeners
            this.renderCalendar(); // Re-render calendar days
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
