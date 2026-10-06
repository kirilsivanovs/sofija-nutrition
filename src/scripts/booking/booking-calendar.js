/**
 * Booking Calendar Component
 * A calendar widget for scheduling appointments
 *
 * Uses shared translations from shared-translations.js
 */

import {
  reorderWeekdaysMondayFirst,
  getWeekStart,
  getWeekDates,
  getFirstAvailableWeekStart as computeFirstAvailableWeekStart,
  getNextAvailableDateAfter,
  getLastAvailableWeekStart,
  lowercaseFirst,
  formatWeekRange,
} from './calendar-grid';

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
    noSlotsWeek: t.calendar.noSlotsWeek,
    weekdays: t.calendar.weekdays,
    months: t.calendar.months,
    today: t.calendar.today,
    prevWeekLabel: t.calendar.prevWeekLabel,
    nextWeekLabel: t.calendar.nextWeekLabel,
    selectedLabel: t.calendar.selectedLabel,
    serviceLegend: t.form.serviceLegend,
    formatLabel: t.form.formatLabel,
    formatOnline: t.format.online,
    formatInPerson: t.format.inPerson,
    nameLabel: t.form.nameLabel,
    emailLabel: t.form.emailLabel,
    phoneLabel: t.form.phoneLabel,
    personalCodeLabel: t.form.personalCodeLabel,
    personalCodeHint: t.form.personalCodeHint,
    messageLabel: t.form.messageLabel,
    consentText: t.form.consentText,
    submitBtn: t.form.submitBtn,
    continueBtn: t.form.continueBtn,
    summarySelectService: t.messages.summarySelectService,
    summarySelectFormat: t.messages.summarySelectFormat,
    nextAvailableSlot: t.messages.nextAvailableSlot,
    successTitle: t.messages.successTitle,
    successText: t.messages.successText,
    bookingConfirmNote: t.messages.bookingConfirmNote,
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
    noSlotsWeek: 'Šajā nedēļā nav brīvu laiku',
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
    serviceLegend: 'Pakalpojums',
    formatLabel: 'Konsultācijas formāts',
    formatOnline: 'Tiešsaistē',
    formatInPerson: 'Klātienē Rīgā',
    nameLabel: 'Jūsu vārds',
    emailLabel: 'E-\u2060pasts',
    phoneLabel: 'Telefons',
    personalCodeLabel: 'Personas kods (neobligāts)',
    personalCodeHint: 'Norādiet, ja vēlaties iesniegt čeku VID attaisnoto izdevumu atgūšanai.',
    messageLabel: 'Komentārs (neobligāts)',
    consentText:
      'Es piekrītu, ka mani personas dati tiek apstrādāti saskaņā ar <a href="/privacy-policy/" target="_blank" rel="noopener">privātuma politiku</a> un <a href="/terms/" target="_blank" rel="noopener">pakalpojumu noteikumiem</a>.',
    submitBtn: 'Apstiprināt rezervāciju',
    continueBtn: 'Turpināt pieteikšanos',
    summarySelectService: 'Izvēlieties pakalpojumu',
    summarySelectFormat: 'Izvēlieties formātu',
    nextAvailableSlot: (dateLabel) => `Tuvākais brīvais laiks: ${dateLabel}`,
    successTitle: 'Rezervācija veiksmīga!',
    successText: 'Mēs sazināsimies ar Jums 24 stundu laikā, lai apstiprinātu vizīti.',
    bookingConfirmNote: 'Pēc rezervācijas saņemsiet apstiprinājumu e-\u2060pastā.',
    closeBtn: 'Aizvērt',
    selectedLabel: 'Izvēlēts',
    today: 'Šodien',
    prevWeekLabel: 'Iepriekšējā nedēļa',
    nextWeekLabel: 'Nākamā nedēļa',
    // Validation messages
    validation: {
      nameRequired: 'Lūdzu, ievadiet savu vārdu',
      nameMinLength: 'Vārdam jābūt vismaz 2 simboliem',
      emailRequired: 'Lūdzu, ievadiet e-\u2060pasta adresi',
      emailInvalid: 'Lūdzu, ievadiet derīgu e-\u2060pasta adresi',
      phoneInvalid: 'Lūdzu, ievadiet 8 ciparu telefona numuru',
      personalCodeInvalid: 'Lūdzu, ievadiet derīgu personas kodu (11 cipari)',
      consentRequired: 'Lūdzu, apstipriniet piekrišanu datu apstrādei',
      formatRequired: 'Lūdzu, izvēlieties konsultācijas formātu',
    },
  },
  ru: {
    title: 'Выберите дату и время',
    selectDate: 'Выберите дату',
    selectTime: 'Доступное время',
    noSlots: 'В этот день нет свободного времени',
    noSlotsWeek: 'На этой неделе нет свободного времени',
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
    serviceLegend: 'Услуга',
    formatLabel: 'Формат консультации',
    formatOnline: 'Онлайн',
    formatInPerson: 'Очно в Риге',
    nameLabel: 'Ваше имя',
    emailLabel: 'Email',
    phoneLabel: 'Телефон',
    personalCodeLabel: 'Персональный код (необязательно)',
    personalCodeHint: 'Укажите, если хотите подать чек в VID для возврата налога.',
    messageLabel: 'Комментарий (необязательно)',
    consentText:
      'Я соглашаюсь на обработку моих персональных данных в соответствии с <a href="/privacy-policy/" target="_blank" rel="noopener">политикой конфиденциальности</a> и <a href="/terms/" target="_blank" rel="noopener">условиями оказания услуг</a>.',
    submitBtn: 'Подтвердить запись',
    continueBtn: 'Продолжить оформление',
    summarySelectService: 'Выберите услугу',
    summarySelectFormat: 'Выберите формат',
    nextAvailableSlot: (dateLabel) => `Ближайшее свободное время: ${dateLabel}`,
    successTitle: 'Запись успешна!',
    successText: 'Мы свяжемся с Вами в течение 24 часов для подтверждения визита.',
    bookingConfirmNote: 'После записи вы получите подтверждение по email.',
    closeBtn: 'Закрыть',
    selectedLabel: 'Выбрано',
    today: 'Сегодня',
    prevWeekLabel: 'Предыдущая неделя',
    nextWeekLabel: 'Следующая неделя',
    // Validation messages
    validation: {
      nameRequired: 'Пожалуйста, введите ваше имя',
      nameMinLength: 'Имя должно содержать минимум 2 символа',
      emailRequired: 'Пожалуйста, введите email',
      emailInvalid: 'Пожалуйста, введите корректный email',
      phoneInvalid: 'Введите 8 цифр номера телефона',
      personalCodeInvalid: 'Введите корректный персональный код (11 цифр)',
      consentRequired: 'Пожалуйста, подтвердите согласие на обработку данных',
      formatRequired: 'Пожалуйста, выберите формат консультации',
    },
  },
  en: {
    title: 'Select date and time',
    selectDate: 'Select a date',
    selectTime: 'Available times',
    noSlots: 'No available slots on this day',
    noSlotsWeek: 'No available slots this week',
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
    serviceLegend: 'Service',
    formatLabel: 'Consultation format',
    formatOnline: 'Online',
    formatInPerson: 'In person in Riga',
    nameLabel: 'Your name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    personalCodeLabel: 'Personal code (optional)',
    personalCodeHint: 'Provide it if you want to submit the receipt to VID for a tax refund.',
    messageLabel: 'Comment (optional)',
    consentText:
      'I agree that my personal data is processed in accordance with the <a href="/privacy-policy/" target="_blank" rel="noopener">privacy policy</a> and <a href="/terms/" target="_blank" rel="noopener">terms of service</a>.',
    submitBtn: 'Confirm booking',
    continueBtn: 'Continue to booking details',
    summarySelectService: 'Select a service',
    summarySelectFormat: 'Select a format',
    nextAvailableSlot: (dateLabel) => `Next available slot: ${dateLabel}`,
    successTitle: 'Booking successful!',
    successText: 'We will contact you within 24 hours to confirm your appointment.',
    bookingConfirmNote: 'You will receive a confirmation by email after booking.',
    closeBtn: 'Close',
    selectedLabel: 'Selected',
    today: 'Today',
    prevWeekLabel: 'Previous week',
    nextWeekLabel: 'Next week',
    // Validation messages
    validation: {
      nameRequired: 'Please enter your name',
      nameMinLength: 'Name must be at least 2 characters',
      emailRequired: 'Please enter your email',
      emailInvalid: 'Please enter a valid email address',
      phoneInvalid: 'Please enter 8 digit phone number',
      personalCodeInvalid: 'Please enter a valid personal code (11 digits)',
      consentRequired: 'Please confirm your consent to data processing',
      formatRequired: 'Please select a consultation format',
    },
  },
};

class BookingCalendar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.currentWeekStart = getWeekStart(new Date());
    this.selectedDate = null;
    this.selectedTime = null;
    this.selectedFormat = null;
    this.selectedService = null;
    this.selectedStripDate = null;
    this.focusedSlot = null;
    this._calendarHadFocus = false;
    this.availability = null;
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
    // Render the toggle/week grid/summary immediately (with whatever
    // availability we already have, none yet) so the calendar is never
    // blank while the fetch is in flight — only loadAvailability's own
    // failure (below) replaces this with a visible error message.
    this.render();
    this.attachEventListeners();

    await this.loadAvailability();
    if (this.apiAvailable) {
      this.navigateToFirstAvailableWeek();
      this.render();
      this.attachEventListeners();
    }
  }

  async loadAvailability() {
    try {
      let response;

      // Try external Azure Functions API first
      try {
        response = await fetch(`${API_BASE_URL}/api/availability`, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
      } catch {
        // Network error (API not running) — fall through to fallback
        response = null;
      }

      // Fallback to static JSON for local development
      if ((!response || !response.ok) && window.location.hostname === 'localhost') {
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
        message: 'Lūdzu, mēģiniet vēlāk vai sazinieties pa e-\u2060pastu:',
        email: 'info@sofijaivanova.lv',
        retry: 'Mēģināt vēlreiz',
      },
      en: {
        title: 'System temporarily unavailable',
        message: 'Please try again later or contact us via email:',
        email: 'info@sofijaivanova.lv',
        retry: 'Try again',
      },
      ru: {
        title: 'Система временно недоступна',
        message: 'Пожалуйста, попробуйте позже или напишите нам:',
        email: 'info@sofijaivanova.lv',
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
                    <button class="error-retry-btn">
                        <i class="ph ph-arrow-clockwise"></i> ${t.retry}
                    </button>
                </div>
            `;
      this.container
        .querySelector('.error-retry-btn')
        .addEventListener('click', () => location.reload());
    }
  }

  /**
   * Navigate to the first week with an available slot, so the client sees
   * the nearest open days without paging forward manually.
   */
  navigateToFirstAvailableWeek() {
    if (!this.availability || !this.availability.slots) return;

    this.currentWeekStart = computeFirstAvailableWeekStart(
      this.getAvailableDateStrings(),
      new Date()
    );
  }

  /** ISO dates (across the whole fetched horizon) that still have an open slot. */
  getAvailableDateStrings() {
    if (!this.availability || !this.availability.slots) return [];
    return Object.keys(this.availability.slots).filter(
      (dateStr) => this.getAvailableSlots(dateStr).length > 0
    );
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
                <div class="booking-body">
                    ${this.renderServiceControl()}

                    <div class="format-toggle" role="group" aria-label="${this.t('formatLabel')}">
                        <button type="button" class="format-toggle-option" id="formatToggleInPerson" aria-pressed="false">
                            ${this.t('formatInPerson')}
                        </button>
                        <button type="button" class="format-toggle-option" id="formatToggleOnline" aria-pressed="false">
                            ${this.t('formatOnline')}
                        </button>
                    </div>

                    <div class="booking-book">
                        <div class="week-section">
                            <div class="week-nav">
                                <button class="week-nav-btn prev" aria-label="${this.t('prevWeekLabel')}">
                                    <i class="ph ph-caret-left"></i>
                                </button>
                                <span class="week-range" id="weekRangeLabel" aria-live="polite"></span>
                                <button class="week-nav-btn next" aria-label="${this.t('nextWeekLabel')}">
                                    <i class="ph ph-caret-right"></i>
                                </button>
                            </div>
                            <div class="week-grid" role="group" aria-labelledby="weekRangeLabel"></div>
                            <div class="week-day-strip" role="tablist" aria-labelledby="weekRangeLabel"></div>
                            <div class="week-day-detail"></div>
                        </div>

                        <div class="booking-summary" id="bookingSummary"></div>
                    </div>
                </div>

                <div class="booking-form-section" style="display: none;">
                    <form class="booking-form" id="bookingForm" novalidate>
                        <div class="selected-datetime"></div>

                        <input type="hidden" name="serviceType" id="serviceTypeInput" value="${this.selectedService || ''}">
                        <input type="hidden" name="consultationFormat" id="consultationFormatInput" value="${this.selectedFormat || ''}">

                        <div class="booking-form-grid">
                            <div class="form-group">
                                <label for="bookingName">${this.t('nameLabel')}</label>
                                <input type="text" id="bookingName" name="name" placeholder="Anna" autocomplete="name" aria-required="true">
                            </div>

                            <div class="form-group">
                                <label for="bookingEmail">${this.t('emailLabel')}</label>
                                <input type="email" id="bookingEmail" name="email" placeholder="anna@email.com" autocomplete="email" aria-required="true">
                            </div>

                            <div class="form-group">
                                <label for="bookingPhone">${this.t('phoneLabel')}</label>
                                <div class="phone-input-wrapper">
                                    <span class="phone-prefix">+371</span>
                                    <input type="tel" id="bookingPhone" name="phone" placeholder="20000000" maxlength="8" inputmode="numeric" pattern="[0-9]*" autocomplete="tel-national">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="bookingPersonalCode">${this.t('personalCodeLabel')}</label>
                                <input type="text" id="bookingPersonalCode" name="personalCode" placeholder="000000-00000" maxlength="12" inputmode="numeric" autocomplete="off">
                                <small class="form-hint">${this.t('personalCodeHint')}</small>
                            </div>

                            <div class="form-group form-group-full">
                                <label for="bookingMessage">${this.t('messageLabel')}</label>
                                <textarea id="bookingMessage" name="message" rows="2" placeholder="..."></textarea>
                            </div>

                            <div class="form-group form-consent">
                                <label class="consent-checkbox">
                                    <input type="checkbox" name="consent" id="consentCheckbox" aria-required="true">
                                    <span>${this.t('consentText')}</span>
                                </label>
                            </div>
                        </div>

                        <button type="submit" class="booking-submit-btn">
                            <i class="ph ph-calendar-check"></i>
                            ${this.t('submitBtn')}
                        </button>
                    </form>
                </div>
            </div>

            <dialog class="booking-success-modal" aria-labelledby="successTitle" aria-describedby="successBody">
                <div class="success-content">
                    <div class="success-icon">
                        <i class="ph ph-check-circle"></i>
                    </div>
                    <h3 id="successTitle">${this.t('successTitle')}</h3>
                    <div id="successBody">
                        <p>${this.t('successText')}</p>
                    </div>
                    <button class="close-success-btn">${this.t('closeBtn')}</button>
                </div>
            </dialog>
        `;

    this.renderWeek();
    this.updateFormatOptions();
    this.updateSummary();
  }

  /**
   * The service picker: segmented buttons for 2+ services, plain text (no
   * control) for exactly one — auto-selecting it, since there is nothing to
   * choose. Empty until availability has loaded.
   */
  renderServiceControl() {
    const services = this.availability?.serviceTypes || [];
    if (services.length === 0) return '';

    if (services.length === 1) {
      if (!this.selectedService) this.selectedService = services[0].id;
      return `<p class="service-single">${services[0].name[this.currentLang]}</p>`;
    }

    // No preselection: defaulting a returning patient to a first
    // consultation would be wrong.
    const buttons = services
      .map((service) => {
        const isSelected = this.selectedService === service.id;
        return `<button type="button" class="service-option" data-service-id="${service.id}" aria-pressed="${isSelected}">${service.name[this.currentLang]}</button>`;
      })
      .join('');

    return `
      <fieldset class="service-fieldset">
        <legend>${this.t('serviceLegend')}</legend>
        <div class="service-options" role="group">${buttons}</div>
      </fieldset>
    `;
  }

  /** Picks the service, mirroring `selectSlot`'s date+time pairing. */
  selectService(serviceId) {
    this.selectedService = serviceId;

    this.container.querySelectorAll('.service-option').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.serviceId === serviceId));
    });

    const serviceInput = this.container.querySelector('#serviceTypeInput');
    if (serviceInput) serviceInput.value = serviceId;

    this.updateFormatOptions();
    this.updateSummary();
  }

  /** Per-day slot buttons for the week starting at `this.currentWeekStart`. */
  renderWeek() {
    const weekDates = getWeekDates(this.currentWeekStart);

    // Update week range display — 2 nowrap date spans, built as DOM nodes so a
    // line only ever breaks between the two dates (text-wrap: balance in CSS).
    const rangeEl = this.container.querySelector('.week-range');
    if (rangeEl) {
      rangeEl.textContent = '';
      const dateFormat = new Intl.DateTimeFormat(this.currentLang, { day: 'numeric', month: 'long' });

      const startSpan = document.createElement('span');
      startSpan.className = 'week-range-part';
      startSpan.textContent = `${dateFormat.format(weekDates[0])} –`;

      const endSpan = document.createElement('span');
      endSpan.className = 'week-range-part';
      endSpan.textContent = dateFormat.format(weekDates[6]);

      rangeEl.appendChild(startSpan);
      rangeEl.appendChild(document.createTextNode(' '));
      rangeEl.appendChild(endSpan);
    }

    // Disable "previous week" once we're at (or before) the first available week
    const prevBtn = this.container.querySelector('.week-nav-btn.prev');
    if (prevBtn) {
      const firstAvailableWeek = this.getFirstAvailableWeekStart();
      if (firstAvailableWeek) {
        prevBtn.disabled = this.currentWeekStart.getTime() <= firstAvailableWeek.getTime();
      }
    }

    // Disable "next week" once there is no later week with a slot, so there
    // is no blind paging into an ever-empty future.
    const nextBtn = this.container.querySelector('.week-nav-btn.next');
    if (nextBtn) {
      const lastAvailableWeek = getLastAvailableWeekStart(this.getAvailableDateStrings());
      nextBtn.disabled = Boolean(
        lastAvailableWeek && this.currentWeekStart.getTime() >= lastAvailableWeek.getTime()
      );
    }

    const gridEl = this.container.querySelector('.week-grid');
    if (!gridEl) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekdayLabels = reorderWeekdaysMondayFirst(this.t('weekdays'));

    // Snapshot before replacing gridEl.innerHTML below: destroying the currently
    // focused slot fires a native focusout on the container, which would otherwise
    // clear this flag before we get a chance to restore focus on the new cell.
    const hadFocusBeforeRender = this._calendarHadFocus;
    const focusedKey = this.focusedSlot ? `${this.focusedSlot.date}|${this.focusedSlot.time}` : null;

    // A whole empty week gets one concise message instead of a "no slots" line
    // repeated (and wrapping) in all 7 columns; a mixed week just dims the
    // empty days so the available ones stand out.
    const weekSlots = weekDates.map((date) => {
      const dateStr = this.formatDateISO(date);
      return date < today ? [] : this.getAvailableSlots(dateStr);
    });
    const weekIsEmpty = weekSlots.every((slots) => slots.length === 0);

    const dayHTML = (date, index) => {
      const dateStr = this.formatDateISO(date);
      const slots = weekSlots[index];

      const dayNumber = date.getDate();
      const slotsHTML = slots
        .map((time) => {
          const isSelected = this.selectedDate === dateStr && this.selectedTime === time;
          const isFocused = focusedKey === `${dateStr}|${time}`;
          const ariaLabel = `${new Intl.DateTimeFormat(this.currentLang, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(date)}, ${time}`;
          return `<button type="button" class="slot-btn${isSelected ? ' selected' : ''}" data-date="${dateStr}" data-time="${time}" tabindex="${isFocused ? '0' : '-1'}" aria-pressed="${isSelected}" aria-label="${ariaLabel}">${time}</button>`;
        })
        .join('');

      return `
        <div class="week-day${slots.length === 0 ? ' week-day--empty' : ''}">
          <h4><span class="week-day-name">${weekdayLabels[index]}</span><b>${dayNumber}</b></h4>
          <div class="week-day-slots">${slotsHTML}</div>
        </div>
      `;
    };

    gridEl.innerHTML = weekDates.map((date, index) => dayHTML(date, index)).join('');
    if (weekIsEmpty) {
      gridEl.appendChild(this.buildEmptyWeekEl());
    }

    // If nothing was focused (or the previous focus target is gone), default to
    // the first available slot in the newly rendered week.
    if (!gridEl.querySelector('.slot-btn[tabindex="0"]')) {
      const firstSlot = gridEl.querySelector('.slot-btn');
      firstSlot?.setAttribute('tabindex', '0');
      if (firstSlot) {
        this.focusedSlot = { date: firstSlot.dataset.date, time: firstSlot.dataset.time };
      }
    }

    if (hadFocusBeforeRender) {
      const focusedSlotEl = gridEl.querySelector('.slot-btn[tabindex="0"]');
      focusedSlotEl?.focus();
      this._calendarHadFocus = true;
    }

    this.renderDayStrip(weekDates, weekSlots, today, weekIsEmpty);
  }

  /**
   * Narrow-card day strip: 7 chips (weekday over number), a dot marks a day
   * with slots. Selecting a chip only changes which day's slots show below
   * it — it is not a slot pick. Rendered alongside `.week-grid` (step 8's
   * CSS switches which one is visible per card width).
   */
  renderDayStrip(weekDates, weekSlots, today, weekIsEmpty) {
    const stripEl = this.container.querySelector('.week-day-strip');
    const detailEl = this.container.querySelector('.week-day-detail');
    if (!stripEl || !detailEl) return;

    if (weekIsEmpty) {
      stripEl.innerHTML = '';
      detailEl.innerHTML = '';
      detailEl.appendChild(this.buildEmptyWeekEl());
      return;
    }

    const weekdayLabels = reorderWeekdaysMondayFirst(this.t('weekdays'));
    const dateStrs = weekDates.map((date) => this.formatDateISO(date));

    // Keep the previous selection if it still has slots this week, else fall
    // back to the first day that does.
    if (
      !this.selectedStripDate ||
      !dateStrs.includes(this.selectedStripDate) ||
      weekSlots[dateStrs.indexOf(this.selectedStripDate)].length === 0
    ) {
      const firstAvailableIndex = weekSlots.findIndex((slots) => slots.length > 0);
      this.selectedStripDate = firstAvailableIndex >= 0 ? dateStrs[firstAvailableIndex] : dateStrs[0];
    }

    stripEl.innerHTML = weekDates
      .map((date, index) => {
        const dateStr = dateStrs[index];
        const isPast = date < today;
        const isEmpty = weekSlots[index].length === 0;
        const isDisabled = isPast || isEmpty;
        const isSelected = dateStr === this.selectedStripDate;
        return `<button type="button" class="week-day-chip${isSelected ? ' selected' : ''}" role="tab" data-date="${dateStr}" tabindex="${isSelected ? '0' : '-1'}" aria-selected="${isSelected}" aria-disabled="${isDisabled}">
          <span class="week-day-chip-name">${weekdayLabels[index]}</span>
          <span class="week-day-chip-number">${date.getDate()}</span>
          ${!isDisabled ? '<span class="week-day-chip-dot" aria-hidden="true"></span>' : ''}
        </button>`;
      })
      .join('');

    this.renderDayDetail();
  }

  /** Switches which day's slots the strip shows, without re-rendering the whole strip (roving tabindex per the tablist pattern). */
  selectStripDate(dateStr) {
    this.selectedStripDate = dateStr;

    const stripEl = this.container.querySelector('.week-day-strip');
    if (stripEl) {
      stripEl.querySelectorAll('.week-day-chip').forEach((chip) => {
        const isSelected = chip.dataset.date === dateStr;
        chip.classList.toggle('selected', isSelected);
        chip.setAttribute('aria-selected', String(isSelected));
        chip.setAttribute('tabindex', isSelected ? '0' : '-1');
      });
    }

    this.renderDayDetail();
  }

  /** The selected strip day's full date heading and its own slot buttons. */
  renderDayDetail() {
    const detailEl = this.container.querySelector('.week-day-detail');
    if (!detailEl || !this.selectedStripDate) return;

    const date = new Date(this.selectedStripDate);
    const dateLabel = new Intl.DateTimeFormat(this.currentLang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);

    const slots = this.getAvailableSlots(this.selectedStripDate);
    const focusedKey = this.focusedSlot ? `${this.focusedSlot.date}|${this.focusedSlot.time}` : null;

    const slotsHTML = slots
      .map((time) => {
        const isSelected = this.selectedDate === this.selectedStripDate && this.selectedTime === time;
        const isFocused = focusedKey === `${this.selectedStripDate}|${time}`;
        return `<button type="button" class="slot-btn${isSelected ? ' selected' : ''}" data-date="${this.selectedStripDate}" data-time="${time}" tabindex="${isFocused ? '0' : '-1'}" aria-pressed="${isSelected}" aria-label="${dateLabel}, ${time}">${time}</button>`;
      })
      .join('');

    detailEl.innerHTML = `
      <h4 class="week-day-detail-date">${dateLabel}</h4>
      <div class="week-day-detail-slots">${slotsHTML}</div>
    `;

    // If nothing in this day matched the previously focused slot, default to
    // the first slot so a keyboard user always lands on a focusable button.
    if (!detailEl.querySelector('.slot-btn[tabindex="0"]')) {
      const firstSlot = detailEl.querySelector('.slot-btn');
      firstSlot?.setAttribute('tabindex', '0');
    }
  }

  /** The empty-week jump: a Slate line plus a button to the next available date, or the fallback email if none remain in the fetched horizon. */
  buildEmptyWeekEl() {
    const wrapper = document.createElement('div');
    wrapper.className = 'week-empty';

    const line = document.createElement('p');
    line.className = 'week-empty-line';
    line.textContent = this.t('noSlotsWeek');
    wrapper.appendChild(line);

    const nextDate = getNextAvailableDateAfter(
      this.getAvailableDateStrings(),
      this.formatDateISO(getWeekDates(this.currentWeekStart)[6])
    );

    if (nextDate) {
      const dateLabel = new Intl.DateTimeFormat(this.currentLang, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(nextDate));

      const jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.className = 'week-empty-jump-btn';
      jumpBtn.textContent = this.t('nextAvailableSlot')(dateLabel);
      jumpBtn.addEventListener('click', () => this.jumpToDate(nextDate));
      wrapper.appendChild(jumpBtn);
    } else {
      const emailLine = document.createElement('a');
      emailLine.className = 'week-empty-email-link';
      emailLine.href = 'mailto:info@sofijaivanova.lv';
      emailLine.textContent = 'info@sofijaivanova.lv';
      wrapper.appendChild(emailLine);
    }

    return wrapper;
  }

  /** Jumps to the week of `dateStr`, selects that day and focuses its first slot. */
  jumpToDate(dateStr) {
    this.currentWeekStart = getWeekStart(new Date(dateStr));
    this.selectedStripDate = dateStr;
    this._calendarHadFocus = true;
    this.renderWeek();

    const firstSlot = this.container.querySelector(
      `.week-day-detail .slot-btn, .week-grid .slot-btn[data-date="${dateStr}"]`
    );
    firstSlot?.focus();
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
    return new Intl.DateTimeFormat(this.currentLang, { day: 'numeric', month: 'long' }).format(
      date
    );
  }

  /** Selects a date+time pair together — a week grid picks both in one click. */
  selectSlot(dateStr, time) {
    this.selectedDate = dateStr;
    this.selectedTime = time;
    this.focusedSlot = { date: dateStr, time };
    this._calendarHadFocus = true;

    this.container.querySelectorAll('.slot-btn').forEach((btn) => {
      const isSelected = btn.dataset.date === dateStr && btn.dataset.time === time;
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });

    this.updateSummary();
  }

  /**
   * Line 1 (Graphite) names the chosen service + format once both are
   * known. Line 2 is the date/time pick, or — while any of the three
   * (service, format, slot) is still missing — a Slate prompt naming the
   * first one. Continue needs all three.
   */
  updateSummary() {
    const summaryEl = this.container.querySelector('.booking-summary');
    if (!summaryEl) return;

    const formSection = this.container.querySelector('.booking-form-section');
    const service = this.availability?.serviceTypes?.find((s) => s.id === this.selectedService);
    const hasSlot = Boolean(this.selectedDate && this.selectedTime);
    const canContinue = Boolean(service && this.selectedFormat && hasSlot);

    const contextLine = service && this.selectedFormat
      ? `<p class="booking-summary-context">${service.name[this.currentLang]}, ${lowercaseFirst(
          this.selectedFormat === 'online' ? this.t('formatOnline') : this.t('formatInPerson')
        )}</p>`
      : '';

    let pickHTML;
    if (hasSlot) {
      pickHTML = `<p class="booking-summary-pick"><strong>${this.t('selectedLabel')}:</strong> ${this.formatDateDisplay(this.selectedDate)}, ${this.selectedTime}</p>`;
    } else {
      const prompt = !service
        ? this.t('summarySelectService')
        : !this.selectedFormat
          ? this.t('summarySelectFormat')
          : this.t('selectDate');
      pickHTML = `<p class="booking-summary-prompt">${prompt}</p>`;
    }

    summaryEl.innerHTML = `
      ${contextLine}
      ${pickHTML}
      <button type="button" class="booking-continue-btn"${canContinue ? '' : ' disabled'}>${this.t('continueBtn')}</button>
      <p class="booking-summary-note">${this.t('bookingConfirmNote')}</p>
    `;

    if (!canContinue) {
      if (formSection) formSection.style.display = 'none';
      return;
    }

    summaryEl.querySelector('.booking-continue-btn')?.addEventListener('click', () => {
      if (formSection) {
        formSection.style.display = 'block';

        const datetimeEl = formSection.querySelector('.selected-datetime');
        if (datetimeEl) {
          datetimeEl.innerHTML = `
                    <i class="ph ph-calendar"></i>
                    <strong>${this.t('selectedLabel')}:</strong>
                    ${this.formatDateDisplay(this.selectedDate)}, ${this.selectedTime}
                `;
        }

        this.updateFormatOptions();
        formSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
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
      personalCode: formData.get('personalCode'),
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
        this.showBookingError('serverError');
      }
    } catch (error) {
      console.error('Booking error:', error);

      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        this.showBookingError('timeout');
      } else if (!navigator.onLine) {
        this.showBookingError('offline');
      } else {
        this.showBookingError('serverError');
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
          message: 'Notikusi kļūda. Lūdzu, mēģiniet vēlāk vai rakstiet uz info@sofijaivanova.lv',
        },
        en: {
          title: 'Server error',
          message: 'An error occurred. Please try later or email info@sofijaivanova.lv',
        },
        ru: {
          title: 'Ошибка сервера',
          message: 'Произошла ошибка. Попробуйте позже или напишите info@sofijaivanova.lv',
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
        this.renderWeek();
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

      case 'personalCode': {
        // Optional, but if provided must be a valid Latvian personas kods (11 digits)
        if (!value || value.trim() === '') {
          return { valid: true, message: '' };
        }
        const codeDigits = value.replace(/\D/g, '');
        if (codeDigits.length !== 11) {
          return { valid: false, message: v.personalCodeInvalid };
        }
        return { valid: true, message: '' };
      }

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
    errorEl.id = `${inputElement.id || inputElement.name}-error`;
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');
    errorEl.innerHTML = `<i class="ph ph-warning-circle"></i> ${message}`;

    // Insert after input or its parent (for select wrappers)
    const parent = inputElement.closest('.form-group') || inputElement.parentElement;
    parent.appendChild(errorEl);

    inputElement.setAttribute('aria-describedby', errorEl.id);
    inputElement.setAttribute('aria-invalid', 'true');
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

    inputElement.removeAttribute('aria-describedby');
    inputElement.setAttribute('aria-invalid', 'false');
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
    const personalCodeInput = form.querySelector('input[name="personalCode"]');
    const consentInput = form.querySelector('input[name="consent"]');

    if (!this.validateAndShowError(nameInput)) isValid = false;
    if (!this.validateAndShowError(emailInput)) isValid = false;
    if (phoneInput) this.validateAndShowError(phoneInput); // Phone is optional
    if (personalCodeInput && !this.validateAndShowError(personalCodeInput)) isValid = false; // Optional, but validate format if filled

    // Service and format are chosen before the form is reachable (the continue
    // button stays disabled until both are picked), so there is nothing left
    // to validate here beyond the hidden inputs already carrying the values.

    // Validate consent checkbox (mandatory under GDPR)
    if (consentInput) {
      const consentGroup = consentInput.closest('.form-consent');
      const existingConsentError = consentGroup?.querySelector('.field-error-message');
      if (existingConsentError) existingConsentError.remove();
      consentGroup?.classList.remove('consent-error');
      consentGroup?.removeAttribute('aria-describedby');
      consentGroup?.setAttribute('aria-invalid', 'false');

      if (!consentInput.checked) {
        const v = this.getValidationTranslations();
        if (consentGroup) {
          consentGroup.classList.add('consent-error');
          const errorEl = document.createElement('div');
          errorEl.className = 'field-error-message';
          errorEl.id = 'consentGroup-error';
          errorEl.setAttribute('role', 'alert');
          errorEl.setAttribute('aria-live', 'polite');
          errorEl.innerHTML = `<i class="ph ph-warning-circle"></i> ${v.consentRequired}`;
          consentGroup.appendChild(errorEl);
          consentGroup.setAttribute('aria-describedby', errorEl.id);
          consentGroup.setAttribute('aria-invalid', 'true');
        }
        isValid = false;
      }
    }

    return isValid;
  }
  // ========== End Validation Methods ==========

  /** Build booking details summary HTML for the success modal */
  buildBookingDetailsHtml(booking) {
    const date = booking.date ? this.formatDateDisplay(booking.date) : '';
    const time = booking.time || '';
    const format =
      booking.consultationFormat === 'in-person'
        ? this.t('formatInPerson')
        : this.t('formatOnline');

    const dateLabel =
      this.currentLang === 'ru'
        ? 'Дата и время'
        : this.currentLang === 'en'
          ? 'Date & time'
          : 'Datums un laiks';
    const formatLbl =
      this.currentLang === 'ru' ? 'Формат' : this.currentLang === 'en' ? 'Format' : 'Formāts';

    return `
      <div class="booking-details-summary">
        <div class="detail-row">
          <i class="ph ph-calendar"></i>
          <span><strong>${dateLabel}:</strong> ${date}, ${time}</span>
        </div>
        <div class="detail-row">
          <i class="ph ph-monitor"></i>
          <span><strong>${formatLbl}:</strong> ${format}</span>
        </div>
      </div>
    `;
  }

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
            : `<p class="invoice-info">Rēķins <strong>${booking.id}</strong> ir nosūtīts uz Jūsu e-\u2060pastu.<br>Summa: <strong>€${booking.price?.toFixed(2) || '—'}</strong></p>`;

      const detailsHtml = this.buildBookingDetailsHtml(booking);

      successContent.innerHTML = `
                <div class="success-icon">
                    <i class="ph ph-check-circle"></i>
                </div>
                <h3 id="successTitle">${this.t('successTitle')}</h3>
                <div id="successBody">
                    ${detailsHtml}
                    ${invoiceInfo}
                    <p>${this.t('successText')}</p>
                </div>
                <button class="close-success-btn">${this.t('closeBtn')}</button>
            `;

      // Re-attach close button event
      successContent.querySelector('.close-success-btn')?.addEventListener('click', () => {
        modal.close();
      });
    }

    if (modal) {
      modal.showModal();
    }

    // Call callback
    this.onBookingComplete(booking);
  }

  /** Reset the form state and restore focus to the calendar after the success dialog closes */
  closeSuccessModal() {
    this.selectedDate = null;
    this.selectedTime = null;
    this.render();
    this.attachEventListeners();
    const slot = this.container.querySelector('.slot-btn[tabindex="0"]');
    slot?.focus();
  }


  /**
   * Disables the format the selected service's `allowOnline`/`allowInPerson`
   * rules out (from the payload's `serviceTypes`), and drops a format the
   * current selection no longer permits.
   */
  updateFormatOptions() {
    const service = this.availability?.serviceTypes?.find((s) => s.id === this.selectedService);
    const allowOnline = service ? service.allowOnline : true;
    const allowInPerson = service ? service.allowInPerson : true;

    if (this.selectedFormat === 'online' && !allowOnline) this.selectedFormat = null;
    if (this.selectedFormat === 'in-person' && !allowInPerson) this.selectedFormat = null;

    const formatInput = this.container.querySelector('#consultationFormatInput');
    if (formatInput) formatInput.value = this.selectedFormat || '';

    const toggleInPerson = this.container.querySelector('#formatToggleInPerson');
    const toggleOnline = this.container.querySelector('#formatToggleOnline');
    if (toggleInPerson) {
      toggleInPerson.disabled = !allowInPerson;
      toggleInPerson.setAttribute('aria-pressed', String(this.selectedFormat === 'in-person'));
    }
    if (toggleOnline) {
      toggleOnline.disabled = !allowOnline;
      toggleOnline.setAttribute('aria-pressed', String(this.selectedFormat === 'online'));
    }
  }

  /**
   * The Monday of the earliest week (today or later) with an available slot;
   * falls back to the current week if none. `null` only when availability
   * hasn't loaded yet.
   */
  getFirstAvailableWeekStart() {
    if (!this.availability || !this.availability.slots) return null;

    return computeFirstAvailableWeekStart(this.getAvailableDateStrings(), new Date());
  }

  attachEventListeners() {
    // Previous week - only if there's an earlier week with availability
    this.container.querySelector('.week-nav-btn.prev')?.addEventListener('click', () => {
      const firstAvailableWeek = this.getFirstAvailableWeekStart();
      const targetWeekStart = new Date(this.currentWeekStart);
      targetWeekStart.setDate(targetWeekStart.getDate() - 7);

      if (firstAvailableWeek && targetWeekStart.getTime() < firstAvailableWeek.getTime()) {
        return;
      }

      this.currentWeekStart = targetWeekStart;
      this.renderWeek();
    });

    // Next week
    this.container.querySelector('.week-nav-btn.next')?.addEventListener('click', () => {
      this.currentWeekStart = new Date(this.currentWeekStart);
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
      this.renderWeek();
    });

    // Slot selection - event delegation on a slot container (a slot pick is
    // date+time together). Wired identically on `.week-grid` (wide card) and
    // `.week-day-detail` (narrow card's day strip) since both can be the
    // visible slot list depending on card width.
    const attachSlotInteractions = (root) => {
      if (!root) return;

      const handleSlotSelect = (e) => {
        const slotEl = e.target.closest('.slot-btn');
        if (slotEl) {
          this.selectSlot(slotEl.dataset.date, slotEl.dataset.time);
        }
      };
      root.addEventListener('click', handleSlotSelect);
      // iOS Safari fix: touchend ensures tap registers reliably
      root.addEventListener(
        'touchend',
        (e) => {
          e.preventDefault();
          handleSlotSelect(e);
        },
        { passive: false }
      );

      root.addEventListener('focusin', () => {
        this._calendarHadFocus = true;
      });
      root.addEventListener('focusout', () => {
        this._calendarHadFocus = false;
      });

      // Flat roving tabindex: left/right move in DOM order (slot counts differ
      // per day, so this isn't a strict 2D grid); up/down target the same
      // slot-index in the adjacent day column (only present in `.week-grid`),
      // falling back to its nearest slot.
      root.addEventListener('keydown', (e) => {
        const slots = Array.from(root.querySelectorAll('.slot-btn'));
        const current = e.target.closest('.slot-btn');
        if (!current || slots.length === 0) return;

        const currentIndex = slots.indexOf(current);
        let target = null;

        if (e.key === 'ArrowLeft') {
          target = slots[currentIndex - 1] || null;
        } else if (e.key === 'ArrowRight') {
          target = slots[currentIndex + 1] || null;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const currentDay = current.closest('.week-day');
          const days = Array.from(root.querySelectorAll('.week-day'));
          if (currentDay && days.length > 0) {
            const currentDayIndex = days.indexOf(currentDay);
            const slotIndexInDay = Array.from(currentDay.querySelectorAll('.slot-btn')).indexOf(
              current
            );
            const step = e.key === 'ArrowUp' ? -1 : 1;

            for (
              let dayIndex = currentDayIndex + step;
              dayIndex >= 0 && dayIndex < days.length;
              dayIndex += step
            ) {
              const daySlots = Array.from(days[dayIndex].querySelectorAll('.slot-btn'));
              if (daySlots.length === 0) continue;
              target = daySlots[Math.min(slotIndexInDay, daySlots.length - 1)];
              break;
            }
          }
        }

        if (!target) return;
        e.preventDefault();
        slots.forEach((s) => s.setAttribute('tabindex', '-1'));
        target.setAttribute('tabindex', '0');
        this.focusedSlot = { date: target.dataset.date, time: target.dataset.time };
        target.focus();
      });
    };

    attachSlotInteractions(this.container.querySelector('.week-grid'));
    attachSlotInteractions(this.container.querySelector('.week-day-detail'));

    // Day-strip chips - a `role="tablist"` (WAI-ARIA tabs pattern): click or
    // arrow/Home/End picks which day's slots `.week-day-detail` shows, with
    // roving tabindex. Disabled (empty/past) chips are skipped by the arrows.
    const stripEl = this.container.querySelector('.week-day-strip');
    if (stripEl) {
      const isChipDisabled = (chip) => chip.getAttribute('aria-disabled') === 'true';

      stripEl.addEventListener('click', (e) => {
        const chip = e.target.closest('.week-day-chip');
        if (chip && !isChipDisabled(chip)) {
          this.selectStripDate(chip.dataset.date);
        }
      });

      stripEl.addEventListener('keydown', (e) => {
        const chips = Array.from(stripEl.querySelectorAll('.week-day-chip'));
        const current = e.target.closest('.week-day-chip');
        if (!current || chips.length === 0) return;

        const enabledChips = chips.filter((chip) => !isChipDisabled(chip));
        if (enabledChips.length === 0) return;

        const currentIndex = chips.indexOf(current);
        let target = null;

        if (e.key === 'ArrowLeft') {
          for (let i = currentIndex - 1; i >= 0; i--) {
            if (!isChipDisabled(chips[i])) {
              target = chips[i];
              break;
            }
          }
        } else if (e.key === 'ArrowRight') {
          for (let i = currentIndex + 1; i < chips.length; i++) {
            if (!isChipDisabled(chips[i])) {
              target = chips[i];
              break;
            }
          }
        } else if (e.key === 'Home') {
          target = enabledChips[0];
        } else if (e.key === 'End') {
          target = enabledChips[enabledChips.length - 1];
        }

        if (!target) return;
        e.preventDefault();
        this.selectStripDate(target.dataset.date);
        target.focus();
      });
    }

    // Format toggle - a format the selected service excludes stays disabled
    // (updateFormatOptions), so a click here only ever picks a permitted one.
    const wireFormatToggle = (toggleId, formatValue) => {
      this.container.querySelector(`#${toggleId}`)?.addEventListener('click', () => {
        this.selectedFormat = formatValue;
        this.updateFormatOptions();
        this.updateSummary();
      });
    };
    wireFormatToggle('formatToggleInPerson', 'in-person');
    wireFormatToggle('formatToggleOnline', 'online');

    // Service picker - picking a service refreshes the format restriction
    // and, once all three (service, format, slot) are known, the summary.
    this.container.querySelector('.service-options')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.service-option');
      if (btn) this.selectService(btn.dataset.serviceId);
    });

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
      const personalCodeInput = form.querySelector('input[name="personalCode"]');

      // Validate on blur
      nameInput?.addEventListener('blur', () => this.validateAndShowError(nameInput));
      emailInput?.addEventListener('blur', () => this.validateAndShowError(emailInput));
      phoneInput?.addEventListener('blur', () => this.validateAndShowError(phoneInput));
      personalCodeInput?.addEventListener('blur', () =>
        this.validateAndShowError(personalCodeInput)
      );

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

      // Personal code - allow digits, auto-insert hyphen after 6 digits (DDMMYY-XXXXX)
      personalCodeInput?.addEventListener('input', (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
        e.target.value = digits.length > 6 ? `${digits.slice(0, 6)}-${digits.slice(6)}` : digits;

        if (personalCodeInput.classList.contains('input-error')) {
          this.validateAndShowError(personalCodeInput);
        }
      });

      // Validate format selection on change
      const formatInputs = form.querySelectorAll('input[name="consultationFormat"]');
      formatInputs.forEach((input) => {
        input.addEventListener('change', () => {
          // Clear format error when selected
          const formatGroup = form.querySelector('#formatGroup');
          if (formatGroup) {
            const errorEl = formatGroup.querySelector('.field-error-message');
            if (errorEl) errorEl.remove();
            formatGroup.removeAttribute('aria-describedby');
            formatGroup.setAttribute('aria-invalid', 'false');
          }
        });
      });

      // Clear consent error when checked
      const consentInput = form.querySelector('input[name="consent"]');
      consentInput?.addEventListener('change', () => {
        if (consentInput.checked) {
          const consentGroup = consentInput.closest('.form-consent');
          consentGroup?.classList.remove('consent-error');
          const errorEl = consentGroup?.querySelector('.field-error-message');
          if (errorEl) errorEl.remove();
        }
      });
    }

    // Close success modal
    const successModal = this.container.querySelector('.booking-success-modal');
    successModal?.addEventListener('close', () => this.closeSuccessModal());
    this.container.querySelector('.close-success-btn')?.addEventListener('click', () => {
      successModal?.close();
    });
  }

  // Public method to navigate to the next week with an available slot
  goToNextAvailable() {
    const firstAvailableWeek = this.getFirstAvailableWeekStart();
    if (!firstAvailableWeek) return;
    this.currentWeekStart = firstAvailableWeek;
    this.renderWeek();
  }
}

window.BookingCalendar = BookingCalendar;
