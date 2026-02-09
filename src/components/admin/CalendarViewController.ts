import type { Booking } from '../../../shared/types/booking';
import type { Schedule } from '../../../shared/types/availability';
import type { VacationPeriod } from '../../utils/types';
import {
  renderCalendar,
  showDayDetails,
  setCalendarData,
  getCurrentDate,
  setCurrentDate,
  getSelectedDate,
} from '../../utils/admin/calendar';
import {
  loadCalendarData,
  confirmBooking as confirmBookingApi,
  cancelBooking as cancelBookingApi,
  findFirstUpcomingBooking,
} from '../../utils/adminApiAdapter';
import { MONTH_NAMES } from '../../utils/admin/constants';
import type { ShowToastFn, ShowConfirmFn } from '../../utils/admin/notifications';

export class CalendarViewController {
  private apiBase: string;
  private allBookings: Booking[] = [];
  private holidays: Record<string, string> = {};
  private schedule: Schedule = {};
  private blockedDates = new Set<string>();
  private vacationPeriods: VacationPeriod[] = [];
  private monthNames = MONTH_NAMES;
  private showToast: ShowToastFn;
  private showConfirm: ShowConfirmFn;

  constructor(apiBase: string, showToast: ShowToastFn, showConfirm: ShowConfirmFn) {
    this.apiBase = apiBase;
    this.showToast = showToast;
    this.showConfirm = showConfirm;
  }

  init(): void {
    this.setupEventListeners();
    this.exposeGlobalMethods();
    this.navigateToFirstUpcomingBooking().then(() => this.loadCalendar());
  }

  private setupEventListeners(): void {
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const refreshBookingsBtn = document.getElementById('refresh-bookings');
    const closeDayDetailsBtn = document.getElementById('close-day-details');

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        const currentDate = getCurrentDate();
        currentDate.setDate(1);
        currentDate.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(currentDate);
        this.loadCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        const currentDate = getCurrentDate();
        currentDate.setDate(1);
        currentDate.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(currentDate);
        this.loadCalendar();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        setCurrentDate(new Date());
        this.loadCalendar();
      });
    }

    if (refreshBookingsBtn) {
      refreshBookingsBtn.addEventListener('click', () => this.loadCalendar());
    }

    if (closeDayDetailsBtn) {
      closeDayDetailsBtn.addEventListener('click', () => {
        const dayDetails = document.getElementById('day-details');
        if (dayDetails) dayDetails.classList.add('hidden');
      });
    }
  }

  private exposeGlobalMethods(): void {
    // Expose methods to window for onclick handlers
    (window as any).showDayDetails = showDayDetails;
    (window as any).confirmBooking = this.confirmBooking.bind(this);
    (window as any).cancelBooking = this.cancelBooking.bind(this);
  }

  async loadCalendar(): Promise<void> {
    const loading = document.getElementById('bookings-loading');
    const container = document.getElementById('calendar-container');
    const dayDetails = document.getElementById('day-details');
    const currentMonthEl = document.getElementById('current-month');

    if (loading) loading.classList.remove('hidden');
    if (container) container.classList.add('hidden');
    if (dayDetails) dayDetails.classList.add('hidden');

    const currentDate = getCurrentDate();
    if (currentMonthEl) {
      currentMonthEl.textContent = `${this.monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    try {
      const year = currentDate.getFullYear();
      const data = await loadCalendarData(year);

      this.allBookings = data.bookings;
      this.holidays = data.holidays;
      this.schedule = data.schedule;
      this.blockedDates = data.blockedDates as Set<string>;
      this.vacationPeriods = data.vacations.map((v: { start: string; end: string }) => ({
        startDate: v.start,
        endDate: v.end,
      }));

      setCalendarData({
        bookings: this.allBookings,
        schedule: this.schedule,
        holidays: this.holidays,
        blockedDates: this.blockedDates,
        vacationPeriods: this.vacationPeriods,
      });

      console.log('📅 Loaded vacation periods:', this.vacationPeriods);
      renderCalendar();
      if (loading) loading.classList.add('hidden');
      if (container) container.classList.remove('hidden');
    } catch (error: unknown) {
      if (loading)
        loading.innerHTML =
          '<span style="color:#dc2626;">Kļūda: ' + (error as Error).message + '</span>';
    }
  }

  private async navigateToFirstUpcomingBooking(): Promise<void> {
    try {
      const firstBooking = await findFirstUpcomingBooking();

      if (firstBooking) {
        const today = new Date();
        const bookingDate = new Date(firstBooking.date);

        if (
          bookingDate.getMonth() !== today.getMonth() ||
          bookingDate.getFullYear() !== today.getFullYear()
        ) {
          setCurrentDate(new Date(bookingDate.getFullYear(), bookingDate.getMonth(), 1));
          console.log(`📅 Переключено на месяц с ближайшей записью: ${firstBooking.date}`);
        }
      }
    } catch (error) {
      console.error('Ошибка при поиске ближайших записей:', error);
    }
  }

  private async confirmBooking(id: string): Promise<void> {
    const confirmed = await this.showConfirm(
      'Vai tiešām vēlaties apstiprināt šo ierakstu?',
      'Apstiprināt ierakstu'
    );
    if (!confirmed) return;

    try {
      await confirmBookingApi(id);
      await this.loadCalendar();
      const selectedDate = getSelectedDate();
      if (selectedDate) {
        showDayDetails(selectedDate);
      }
      this.showToast('Ieraksts veiksmīgi apstiprināts', 'success');
    } catch (e: unknown) {
      this.showToast((e as Error).message, 'error');
    }
  }

  private async cancelBooking(id: string): Promise<void> {
    const confirmed = await this.showConfirm(
      'Vai tiešām vēlaties atcelt šo ierakstu?',
      'Atcelt ierakstu'
    );
    if (!confirmed) return;

    try {
      await cancelBookingApi(id);
      await this.loadCalendar();
      const selectedDate = getSelectedDate();
      if (selectedDate) {
        showDayDetails(selectedDate);
      }
      this.showToast('Ieraksts veiksmīgi atcelts', 'success');
    } catch (e: unknown) {
      this.showToast((e as Error).message, 'error');
    }
  }

  isDateInVacation(dateStr: string): boolean {
    return this.vacationPeriods.some((v) => dateStr >= v.startDate && dateStr <= v.endDate);
  }
}
