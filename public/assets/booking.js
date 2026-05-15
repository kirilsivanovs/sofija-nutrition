/**
 * Booking Calendar Component
 * A calendar widget for scheduling appointments
 *
 * Uses shared translations from shared-translations.js
 */

// API is served from the same domain (SWA managed API)
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:7071' : '';

/**
 * Build UI translations from shared translations
 * Maps shared translation structure to flat UI format
 */
function buildUITranslations(lang) {
  // Check if shared translations are loaded
  if (typeof window.sharedTranslations === 'undefined') {
    console.warn('Shared translations not loaded, using fallback');
    return null;
  }

  const t = window.sharedTranslations[lang];
  if (!t) return null;

  return {
    title: t.calendar.title,
    selectDate: t.calendar.selectDate,
    selectTime: t.calendar.selectTime,
    noSlots: t.calendar.noSlots,
    weekdays: t.calendar.weekdays,
    months: t.calendar.months,
    today: t.calendar.today,
    selectedLabel: t.calendar.selectedLabel,
    serviceLabel: t.form.serviceLabel,
    formatLabel: t.form.formatLabel,
    formatOnline: t.format.online,
    formatInPerson: t.format.inPerson,
    nameLabel: t.form.nameLabel,
    emailLabel: t.form.emailLabel,
    phoneLabel: t.form.phoneLabel,
    messageLabel: t.form.messageLabel,
    submitBtn: t.form.submitBtn,
    successTitle: t.messages.successTitle,
    successText: t.messages.successText,
    closeBtn: t.messages.closeBtn,
    errorTitle: t.messages.errorTitle,
    errorMessage: t.messages.errorMessage,
    errorRetry: t.messages.errorRetry,
    slotTaken: t.messages.slotTaken,
    rateLimit: t.messages.rateLimit,
    serverError: t.messages.serverError,
    timeout: t.messages.timeout,
    offline: t.messages.offline,
  };
}

/**
 * Fallback translations (used if shared translations not available)
 */
const fallbackTranslations = {
  lv: {
    title: 'Izvēlieties datumu un laiku',
    selectDate: 'Izvēlieties datumu',
    selectTime: 'Pieejamie laiki',
    noSlots: 'Šajā dienā nav pieejamu laiku',
    weekdays: ['Sv', 'P', 'O', 'T', 'C', 'Pk', 'S'],
    months: [
      'Janvāris',
      'Februāris',
      'Marts',
      'Aprīlis',
      'Maijs',
      'Jūnijs',
      'Jūlijs',
      'Augusts',
      'Septembris',
      'Oktobris',
      'Novembris',
      'Decembris',
    ],
    serviceLabel: 'Pakalpojuma veids',
    formatLabel: 'Konsultācijas formāts',
    formatOnline: 'Attālināti (Zoom/Google Meet)',
    formatInPerson: 'Klātienē',
    nameLabel: 'Jūsu vārds',
    emailLabel: 'E-pasts',
    phoneLabel: 'Telefons',
    messageLabel: 'Komentārs (neobligāts)',
    submitBtn: 'Apstiprināt rezervāciju',
    successTitle: 'Rezervācija veiksmīga!',
    successText: 'Mēs sazināsimies ar Jums 24 stundu laikā, lai apstiprinātu vizīti.',
    closeBtn: 'Aizvērt',
    selectedLabel: 'Izvēlēts',
    today: 'Šodien',
    // Validation messages
    validation: {
      nameRequired: 'Lūdzu, ievadiet savu vārdu',
      nameMinLength: 'Vārdam jābūt vismaz 2 simboliem',
      emailRequired: 'Lūdzu, ievadiet e-pasta adresi',
      emailInvalid: 'Lūdzu, ievadiet derīgu e-pasta adresi',
      phoneInvalid: 'Lūdzu, ievadiet 8 ciparu telefona numuru',
      formatRequired: 'Lūdzu, izvēlieties konsultācijas formātu',
    },
  },
  ru: {
    title: 'Выберите дату и время',
    selectDate: 'Выберите дату',
    selectTime: 'Доступное время',
    noSlots: 'В этот день нет свободного времени',
    weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    months: [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ],
    serviceLabel: 'Тип услуги',
    formatLabel: 'Формат консультации',
    formatOnline: 'Онлайн (Zoom/Google Meet)',
    formatInPerson: 'Очно',
    nameLabel: 'Ваше имя',
    emailLabel: 'Email',
    phoneLabel: 'Телефон',
    messageLabel: 'Комментарий (необязательно)',
    submitBtn: 'Подтвердить запись',
    successTitle: 'Запись успешна!',
    successText: 'Мы свяжемся с Вами в течение 24 часов для подтверждения визита.',
    closeBtn: 'Закрыть',
    selectedLabel: 'Выбрано',
    today: 'Сегодня',
    // Validation messages
    validation: {
      nameRequired: 'Пожалуйста, введите ваше имя',
      nameMinLength: 'Имя должно содержать минимум 2 символа',
      emailRequired: 'Пожалуйста, введите email',
      emailInvalid: 'Пожалуйста, введите корректный email',
      phoneInvalid: 'Введите 8 цифр номера телефона',
      formatRequired: 'Пожалуйста, выберите формат консультации',
    },
  },
  en: {
    title: 'Select date and time',
    selectDate: 'Select a date',
    selectTime: 'Available times',
    noSlots: 'No available slots on this day',
    weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    serviceLabel: 'Service type',
    formatLabel: 'Consultation format',
    formatOnline: 'Online (Zoom/Google Meet)',
    formatInPerson: 'In-person',
    nameLabel: 'Your name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    messageLabel: 'Comment (optional)',
    submitBtn: 'Confirm booking',
    successTitle: 'Booking successful!',
    successText: 'We will contact you within 24 hours to confirm your appointment.',
    closeBtn: 'Close',
    selectedLabel: 'Selected',
    today: 'Today',
    // Validation messages
    validation: {
      nameRequired: 'Please enter your name',
      nameMinLength: 'Name must be at least 2 characters',
      emailRequired: 'Please enter your email',
      emailInvalid: 'Please enter a valid email address',
      phoneInvalid: 'Please enter 8 digit phone number',
      formatRequired: 'Please select a consultation format',
    },
  },
};

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

    // Try to use shared translations, fallback to embedded
    this.translations = {
      lv: buildUITranslations('lv') || fallbackTranslations.lv,
      ru: buildUITranslations('ru') || fallbackTranslations.ru,
      en: buildUITranslations('en') || fallbackTranslations.en,
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
      let response = await fetch(`${API_BASE_URL}/api/availability`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      // Fallback to static JSON for local development
      if (!response.ok) {
        console.log('API not available, falling back to static JSON');
        response = await fetch('/data/availability.json');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.availability = await response.json();
      this.apiAvailable = true;
    } catch (error) {
      console.error('Failed to load availability:', error);
      this.availability = { slots: {}, booked: [], serviceTypes: [] };
      this.apiAvailable = false;

      // Show inline error message instead of redirecting
      this.showApiError();
    }
  }

  showApiError() {
    const errorMessages = {
      lv: {
        title: 'Sistēma īslaicīgi nepieejama',
        message: 'Lūdzu, mēģiniet vēlāk vai sazinieties pa e-pastu:',
        email: 'info@sofija-nutrition.lv',
        retry: 'Mēģināt vēlreiz',
      },
      en: {
        title: 'System temporarily unavailable',
        message: 'Please try again later or contact us via email:',
        email: 'info@sofija-nutrition.lv',
        retry: 'Try again',
      },
      ru: {
        title: 'Система временно недоступна',
        message: 'Пожалуйста, попробуйте позже или напишите нам:',
        email: 'info@sofija-nutrition.lv',
        retry: 'Попробовать снова',
      },
    };

    const t = errorMessages[this.currentLang] || errorMessages.lv;

    if (this.container) {
      this.container.innerHTML = `
                <div class="booking-error">
                    <div class="error-icon">
                        <i class="ph ph-warning-circle"></i>
                    </div>
                    <h3>${t.title}</h3>
                    <p>${t.message}</p>
                    <a href="mailto:${t.email}" class="error-email-link">
                        <i class="ph ph-envelope"></i> ${t.email}
                    </a>
                    <button class="error-retry-btn" onclick="location.reload()">
                        <i class="ph ph-arrow-clockwise"></i> ${t.retry}
                    </button>
                </div>
            `;
    }
  }

  /**
   * Навигация к первому месяцу с доступными датами
   * Чтобы клиент сразу видел ближайшие свободные дни
   */
  navigateToFirstAvailableMonth() {
    if (!this.availability || !this.availability.slots) return;

    const availableDates = Object.keys(this.availability.slots)
      .filter((dateStr) => {
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
                    </div>
                </div>

                <div class="booking-form-section" style="display: none;">
                    <form class="booking-form" id="bookingForm" novalidate>
                        <div class="selected-datetime"></div>

                        <div class="booking-form-grid">
                            <div class="form-group">
                                <label>${this.t('serviceLabel')}</label>
                                <select name="serviceType" id="serviceTypeSelect">
                                    ${this.renderServiceOptions()}
                                </select>
                            </div>

                            <div class="form-group" id="formatGroup">
                                <label>${this.t('formatLabel')}</label>
                                <div class="format-options">
                                    <label class="format-option">
                                        <input type="radio" name="consultationFormat" value="online" id="formatOnline">
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
                                <input type="text" name="name" placeholder="Anna">
                            </div>

                            <div class="form-group">
                                <label>${this.t('emailLabel')}</label>
                                <input type="email" name="email" placeholder="anna@email.com">
                            </div>

                            <div class="form-group">
                                <label>${this.t('phoneLabel')}</label>
                                <div class="phone-input-wrapper">
                                    <span class="phone-prefix">+371</span>
                                    <input type="tel" name="phone" placeholder="20000000" maxlength="8" inputmode="numeric" pattern="[0-9]*">
                                </div>
                            </div>

                            <div class="form-group">
                                <label>${this.t('messageLabel')}</label>
                                <textarea name="message" rows="2" placeholder="..."></textarea>
                            </div>
                        </div>

                        <button type="submit" class="booking-submit-btn">
                            <i class="ph ph-calendar-check"></i>
                            ${this.t('submitBtn')}
                        </button>
                    </form>
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

    return this.availability.serviceTypes
      .map((service) => `<option value="${service.id}">${service.name[this.currentLang]}</option>`)
      .join('');
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
      weekdaysEl.innerHTML = this.t('weekdays')
        .map((day) => `<span class="weekday">${day}</span>`)
        .join('');
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
      .filter((b) => b.date === dateStr)
      .map((b) => b.time);

    const availableSlots = this.availability.slots[dateStr].filter(
      (time) => !bookedTimes.includes(time)
    );

    return availableSlots.length > 0;
  }

  getAvailableSlots(dateStr) {
    if (!this.availability?.slots?.[dateStr]) return [];

    const bookedTimes = this.availability.booked
      .filter((b) => b.date === dateStr)
      .map((b) => b.time);

    // Get current time for filtering past slots on today
    const now = new Date();
    const today = this.formatDateISO(now);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return this.availability.slots[dateStr]
      .filter((time) => !bookedTimes.includes(time))
      .filter((time) => {
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

    timeSlotsEl.innerHTML = slots
      .map(
        (time) => `
            <button class="time-slot ${this.selectedTime === time ? 'selected' : ''}" data-time="${time}">
                ${time}
            </button>
        `
      )
      .join('');
  }

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.selectedTime = null;

    // Update calendar UI
    this.container.querySelectorAll('.day').forEach((day) => {
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
    this.container.querySelectorAll('.time-slot').forEach((slot) => {
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
      submitBtn.innerHTML =
        '<i class="ph ph-spinner ph-spin"></i> ' +
        (this.currentLang === 'ru'
          ? 'Отправка...'
          : this.currentLang === 'en'
            ? 'Sending...'
            : 'Sūta...');
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
      language: this.currentLang,
    };

    try {
      // Call external Azure Functions API
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
        signal: AbortSignal.timeout(15000), // 15 second timeout for booking
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          // Update success modal with invoice info
          this.showSuccessWithInvoice(result.booking);
        } else {
          throw new Error(result.error || 'Booking failed');
        }
      } else if (response.status === 409) {
        // Slot already taken - show specific error
        this.showBookingError('slotTaken');
      } else if (response.status === 429) {
        // Rate limited
        this.showBookingError('rateLimit');
      } else if (response.status >= 500) {
        // Server error - show friendly message
        this.showBookingError('serverError');
      } else {
        // Fallback for local development without API
        this.simulateLocalBooking(bookingData);
      }
    } catch (error) {
      console.error('Booking error:', error);

      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        this.showBookingError('timeout');
      } else if (!navigator.onLine) {
        this.showBookingError('offline');
      } else {
        // Fallback for local development
        this.simulateLocalBooking(bookingData);
      }
    } finally {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  }

  showBookingError(errorType) {
    const errorMessages = {
      slotTaken: {
        lv: {
          title: 'Laiks jau aizņemts',
          message: 'Šis laiks tikko tika rezervēts. Lūdzu, izvēlieties citu laiku.',
        },
        en: {
          title: 'Time slot taken',
          message: 'This slot was just booked. Please select another time.',
        },
        ru: {
          title: 'Время уже занято',
          message: 'Это время только что забронировали. Пожалуйста, выберите другое.',
        },
      },
      rateLimit: {
        lv: {
          title: 'Pārāk daudz pieprasījumu',
          message: 'Lūdzu, uzgaidiet minūti un mēģiniet vēlreiz.',
        },
        en: { title: 'Too many requests', message: 'Please wait a minute and try again.' },
        ru: {
          title: 'Слишком много запросов',
          message: 'Пожалуйста, подождите минуту и попробуйте снова.',
        },
      },
      serverError: {
        lv: {
          title: 'Servera kļūda',
          message: 'Notikusi kļūda. Lūdzu, mēģiniet vēlāk vai rakstiet uz info@sofija-nutrition.lv',
        },
        en: {
          title: 'Server error',
          message: 'An error occurred. Please try later or email info@sofija-nutrition.lv',
        },
        ru: {
          title: 'Ошибка сервера',
          message: 'Произошла ошибка. Попробуйте позже или напишите info@sofija-nutrition.lv',
        },
      },
      timeout: {
        lv: {
          title: 'Savienojums pārtrūka',
          message: 'Pieprasījums ilga pārāk ilgi. Lūdzu, mēģiniet vēlreiz.',
        },
        en: {
          title: 'Connection timeout',
          message: 'The request took too long. Please try again.',
        },
        ru: {
          title: 'Время ожидания истекло',
          message: 'Запрос занял слишком много времени. Попробуйте ещё раз.',
        },
      },
      offline: {
        lv: {
          title: 'Nav interneta savienojuma',
          message: 'Lūdzu, pārbaudiet interneta savienojumu un mēģiniet vēlreiz.',
        },
        en: {
          title: 'No internet connection',
          message: 'Please check your connection and try again.',
        },
        ru: {
          title: 'Нет подключения к интернету',
          message: 'Проверьте подключение и попробуйте снова.',
        },
      },
    };

    const error = errorMessages[errorType] || errorMessages.serverError;
    const t = error[this.currentLang] || error.lv;

    // Show error toast/notification
    this.showErrorToast(t.title, t.message);

    // If slot taken, refresh availability
    if (errorType === 'slotTaken') {
      this.loadAvailability().then(() => {
        this.renderCalendar();
      });
    }
  }

  showErrorToast(title, message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.booking-error-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'booking-error-toast';
    toast.innerHTML = `
            <div class="toast-content">
                <i class="ph ph-warning-circle"></i>
                <div>
                    <strong>${title}</strong>
                    <p>${message}</p>
                </div>
                <button class="toast-close" aria-label="Close">
                    <i class="ph ph-x"></i>
                </button>
            </div>
        `;

    document.body.appendChild(toast);

    // Auto-close after 5 seconds
    setTimeout(() => toast.remove(), 5000);

    // Close on click
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  }

  // ========== Form Validation Methods ==========

  getValidationTranslations() {
    const t = this.translations;
    return (
      t.validation ||
      fallbackTranslations[this.currentLang]?.validation ||
      fallbackTranslations.lv.validation
    );
  }

  validateField(fieldName, value) {
    const v = this.getValidationTranslations();

    switch (fieldName) {
      case 'name':
        if (!value || value.trim() === '') {
          return { valid: false, message: v.nameRequired };
        }
        if (value.trim().length < 2) {
          return { valid: false, message: v.nameMinLength };
        }
        return { valid: true, message: '' };

      case 'email':
        if (!value || value.trim() === '') {
          return { valid: false, message: v.emailRequired };
        }
        // Email regex pattern
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value.trim())) {
          return { valid: false, message: v.emailInvalid };
        }
        return { valid: true, message: '' };

      case 'phone':
        // Phone is optional, but if provided must be exactly 8 digits (Latvian format)
        if (!value || value.trim() === '') {
          return { valid: true, message: '' }; // Phone is optional
        }
        // Only allow 8 digits (Latvian phone number without country code)
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length !== 8 || !/^[0-9]{8}$/.test(digitsOnly)) {
          return { valid: false, message: v.phoneInvalid };
        }
        return { valid: true, message: '' };

      case 'consultationFormat':
        if (!value) {
          return { valid: false, message: v.formatRequired };
        }
        return { valid: true, message: '' };

      default:
        return { valid: true, message: '' };
    }
  }

  showFieldError(inputElement, message) {
    // Remove any existing error
    this.clearFieldError(inputElement);

    // For phone input, add error class to wrapper instead
    const phoneWrapper = inputElement.closest('.phone-input-wrapper');
    if (phoneWrapper) {
      phoneWrapper.classList.add('input-error');
      phoneWrapper.classList.remove('input-valid');
    } else {
      // Add error class to input
      inputElement.classList.add('input-error');
      inputElement.classList.remove('input-valid');
    }

    // Create error message element
    const errorEl = document.createElement('div');
    errorEl.className = 'field-error-message';
    errorEl.innerHTML = `<i class="ph ph-warning-circle"></i> ${message}`;

    // Insert after input or its parent (for select wrappers)
    const parent = inputElement.closest('.form-group') || inputElement.parentElement;
    parent.appendChild(errorEl);
  }

  clearFieldError(inputElement) {
    inputElement.classList.remove('input-error');

    // Also clear from phone wrapper if exists
    const phoneWrapper = inputElement.closest('.phone-input-wrapper');
    if (phoneWrapper) {
      phoneWrapper.classList.remove('input-error');
    }

    const parent = inputElement.closest('.form-group') || inputElement.parentElement;
    const existingError = parent.querySelector('.field-error-message');
    if (existingError) {
      existingError.remove();
    }
  }

  showFieldValid(inputElement) {
    this.clearFieldError(inputElement);

    // For phone input, add valid class to wrapper
    const phoneWrapper = inputElement.closest('.phone-input-wrapper');
    if (phoneWrapper) {
      phoneWrapper.classList.add('input-valid');
    } else {
      inputElement.classList.add('input-valid');
    }
  }

  validateAndShowError(inputElement) {
    const fieldName = inputElement.name;
    const value = inputElement.value;

    const result = this.validateField(fieldName, value);

    if (!result.valid) {
      this.showFieldError(inputElement, result.message);
    } else if (value && value.trim() !== '') {
      this.showFieldValid(inputElement);
    } else {
      this.clearFieldError(inputElement);
    }

    return result.valid;
  }

  validateAllFields() {
    const form = this.container.querySelector('#bookingForm');
    if (!form) return false;

    let isValid = true;

    // Validate each required field
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const phoneInput = form.querySelector('input[name="phone"]');
    const formatInput = form.querySelector('input[name="consultationFormat"]:checked');

    if (!this.validateAndShowError(nameInput)) isValid = false;
    if (!this.validateAndShowError(emailInput)) isValid = false;
    if (phoneInput) this.validateAndShowError(phoneInput); // Phone is optional

    // Validate radio buttons separately
    if (!formatInput) {
      const v = this.getValidationTranslations();
      const formatGroup = form.querySelector('.format-options');
      if (formatGroup) {
        // Remove existing error
        const existingError = formatGroup.querySelector('.field-error-message');
        if (existingError) existingError.remove();

        // Add error
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error-message';
        errorEl.innerHTML = `<i class="ph ph-warning-circle"></i> ${v.formatRequired}`;
        formatGroup.appendChild(errorEl);
      }
      isValid = false;
    }

    return isValid;
  }
  // ========== End Validation Methods ==========

  showSuccessWithInvoice(booking) {
    // Add to local booked array
    if (this.availability) {
      this.availability.booked.push({
        date: booking.date,
        time: booking.time,
        type: booking.serviceType,
      });
    }

    // Update success modal content
    const modal = this.container.querySelector('.booking-success-modal');
    const successContent = modal?.querySelector('.success-content');

    if (successContent && booking) {
      const invoiceInfo =
        this.currentLang === 'ru'
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
      price:
        bookingData.serviceType === 'cgm-diagnostic'
          ? 150
          : bookingData.serviceType === 'consultation'
            ? 80
            : 50,
    };

    // Add to local booked array
    if (this.availability) {
      this.availability.booked.push({
        date: bookingData.date,
        time: bookingData.time,
        name: bookingData.name,
        email: bookingData.email,
        type: bookingData.serviceType,
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
    const serviceSetting = this.serviceSettings?.find((s) => s.id === serviceId);

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

    return Object.keys(this.availability.slots).some((dateStr) => {
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
      .filter((dateStr) => {
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
      const prevYear =
        prevMonth < 0 ? this.currentDate.getFullYear() - 1 : this.currentDate.getFullYear();
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
      const handleDaySelect = (e) => {
        const dayEl = e.target.closest('.day');
        if (dayEl) {
          if (
            !dayEl.classList.contains('past') &&
            !dayEl.classList.contains('empty') &&
            !dayEl.classList.contains('unavailable')
          ) {
            this.selectDate(dayEl.dataset.date);
          }
        }
      };
      calendarDays.addEventListener('click', handleDaySelect);
      // iOS Safari fix: touchend ensures tap registers on non-interactive elements
      calendarDays.addEventListener(
        'touchend',
        (e) => {
          e.preventDefault();
          handleDaySelect(e);
        },
        { passive: false }
      );
    }

    // Time slot selection
    const timeSlots = this.container.querySelector('.time-slots');
    if (timeSlots) {
      const handleTimeSelect = (e) => {
        const slotEl = e.target.closest('.time-slot');
        if (slotEl) {
          this.selectTime(slotEl.dataset.time);
        }
      };
      timeSlots.addEventListener('click', handleTimeSelect);
      // iOS Safari fix
      timeSlots.addEventListener(
        'touchend',
        (e) => {
          e.preventDefault();
          handleTimeSelect(e);
        },
        { passive: false }
      );
    }

    // Form submission
    this.container.querySelector('#bookingForm')?.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate all fields before submission
      if (!this.validateAllFields()) {
        // Add shake animation to invalid fields
        const invalidInputs = this.container.querySelectorAll('.input-error');
        invalidInputs.forEach((input) => {
          input.classList.add('shake');
          setTimeout(() => input.classList.remove('shake'), 500);
        });

        // Scroll to first error
        const firstError = this.container.querySelector('.input-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
        return;
      }

      const formData = new FormData(e.target);
      this.submitBooking(formData);
    });

    // Real-time validation on blur (when user leaves field)
    const form = this.container.querySelector('#bookingForm');
    if (form) {
      const nameInput = form.querySelector('input[name="name"]');
      const emailInput = form.querySelector('input[name="email"]');
      const phoneInput = form.querySelector('input[name="phone"]');

      // Validate on blur
      nameInput?.addEventListener('blur', () => this.validateAndShowError(nameInput));
      emailInput?.addEventListener('blur', () => this.validateAndShowError(emailInput));
      phoneInput?.addEventListener('blur', () => this.validateAndShowError(phoneInput));

      // Clear error on input (but don't validate until blur)
      nameInput?.addEventListener('input', () => {
        if (nameInput.classList.contains('input-error')) {
          this.validateAndShowError(nameInput);
        }
      });
      emailInput?.addEventListener('input', () => {
        if (emailInput.classList.contains('input-error')) {
          this.validateAndShowError(emailInput);
        }
      });
      // Phone input - only allow digits and limit to 8
      phoneInput?.addEventListener('input', (e) => {
        // Remove non-digits and limit to 8 characters
        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
        e.target.value = digitsOnly;

        if (phoneInput.classList.contains('input-error')) {
          this.validateAndShowError(phoneInput);
        }
      });

      // Validate format selection on change
      const formatInputs = form.querySelectorAll('input[name="consultationFormat"]');
      formatInputs.forEach((input) => {
        input.addEventListener('change', () => {
          // Clear format error when selected
          const formatGroup = form.querySelector('.format-options');
          if (formatGroup) {
            const errorEl = formatGroup.querySelector('.field-error-message');
            if (errorEl) errorEl.remove();
          }
        });
      });
    }

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
      // Reset selected date and time to allow new booking
      this.selectedDate = null;
      this.selectedTime = null;
      this.render(); // Re-render calendar
      this.attachEventListeners(); // Re-attach event listeners
      this.renderCalendar(); // Re-render calendar days to make them clickable again
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
        const dateStr = this.formatDateISO(
          new Date(checkDate.getFullYear(), checkDate.getMonth(), day)
        );
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
