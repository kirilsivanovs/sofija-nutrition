/**
 * Meals Tab Controller - manages patient meal diary calendar
 * Following Single Responsibility and SOLID principles
 */

import { PatientListController } from '../PatientList/PatientListController';
import { PatientService } from '../../../services/admin/PatientService';
import type { Patient } from '../../../services/admin/PatientService';

interface MealItem {
  name: string;
  weight: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

interface Meal {
  id?: string;
  userId?: string;
  createdAt: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  items?: MealItem[];
}

interface DayData {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  meals: Meal[];
  mealsByType: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snack: Meal[];
  };
}

interface MealsTabConfig {
  patientController: PatientListController;
  onShowToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export class MealsTabController {
  private patientController: PatientListController;
  private onShowToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  private apiBase: string;
  private currentDate: Date;
  private mealsDataByDay: Map<string, DayData>;
  private selectedPatientName: string;

  // DOM elements - initialized in init()
  private elements!: {
    patientName: HTMLElement | null;
    patientId: HTMLElement | null;
    currentMonth: HTMLElement | null;
    prevMonthBtn: HTMLButtonElement | null;
    nextMonthBtn: HTMLButtonElement | null;
    refreshBtn: HTMLButtonElement | null;
    loading: HTMLElement | null;
    calendarContainer: HTMLElement | null;
    calendarGrid: HTMLElement | null;
    empty: HTMLElement | null;
    patientsRefreshBtn: HTMLButtonElement | null;
    modal: HTMLElement | null;
    modalTitle: HTMLElement | null;
    modalSummary: HTMLElement | null;
    modalContent: HTMLElement | null;
  };

  constructor(config: MealsTabConfig, apiBase: string) {
    this.patientController = config.patientController;
    this.onShowToast = config.onShowToast;
    this.apiBase = apiBase;
    this.currentDate = new Date();
    this.mealsDataByDay = new Map();
    this.selectedPatientName = '';
  }

  /**
   * Initialize the MealsTab controller
   */
  init(): void {
    this.initDOMElements();
    this.setupEventListeners();
    this.exposeGlobalFunctions();
    this.renderCalendar();
  }

  /**
   * Initialize DOM element references
   */
  private initDOMElements(): void {
    this.elements = {
      patientName: document.getElementById('meals-patient-name'),
      patientId: document.getElementById('meals-patient-id'),
      currentMonth: document.getElementById('meals-current-month'),
      prevMonthBtn: document.getElementById('meals-prev-month') as HTMLButtonElement | null,
      nextMonthBtn: document.getElementById('meals-next-month') as HTMLButtonElement | null,
      refreshBtn: document.getElementById('meals-refresh') as HTMLButtonElement | null,
      loading: document.getElementById('meals-loading'),
      calendarContainer: document.getElementById('meals-calendar-container'),
      calendarGrid: document.getElementById('meals-calendar-grid'),
      empty: document.getElementById('meals-empty'),
      patientsRefreshBtn: document.getElementById('patients-refresh') as HTMLButtonElement | null,
      modal: document.getElementById('meals-day-modal'),
      modalTitle: document.getElementById('meals-modal-title'),
      modalSummary: document.getElementById('meals-modal-summary'),
      modalContent: document.getElementById('meals-modal-content'),
    };
  }

  /**
   * Setup event listeners for calendar navigation
   */
  private setupEventListeners(): void {
    this.elements.prevMonthBtn?.addEventListener('click', () => this.navigatePrevMonth());
    this.elements.nextMonthBtn?.addEventListener('click', () => this.navigateNextMonth());
    this.elements.refreshBtn?.addEventListener('click', () => this.loadMealsForMonth());
    this.elements.patientsRefreshBtn?.addEventListener('click', () =>
      this.patientController.loadPatients()
    );
  }

  /**
   * Expose functions to window for onclick handlers
   */
  private exposeGlobalFunctions(): void {
    (window as any).showDayMealsModal = (dateKey: string) => this.showDayModal(dateKey);
    (window as any).closeMealsModal = () => this.closeModal();
  }

  /**
   * Navigate to previous month
   */
  private navigatePrevMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.loadMealsForMonth();
  }

  /**
   * Navigate to next month
   */
  private navigateNextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.loadMealsForMonth();
  }

  /**
   * Load meals data for current month
   */
  async loadMealsForMonth(): Promise<void> {
    const selectedPatientId = this.patientController.getSelectedPatientId();

    if (!selectedPatientId) {
      this.onShowToast('Izvēlies pacientu', 'warning');
      return;
    }

    this.showLoading();
    this.disableControls();

    try {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();

      // Calculate date range for API call
      const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const response = await fetch(
        `${this.apiBase}/dashboard/meals/range?userId=${encodeURIComponent(selectedPatientId)}&startDate=${firstDay}&endDate=${lastDayStr}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        this.onShowToast(error?.error || 'Neizdevās ielādēt datus', 'error');
        this.mealsDataByDay = new Map();
        this.renderCalendar();
        return;
      }

      const data = await response.json();
      const meals = Array.isArray(data) ? data : [];
      this.mealsDataByDay = this.aggregateDataByDay(meals);

      this.updateHeader(selectedPatientId);
      this.renderCalendar();
    } catch (error: unknown) {
      this.onShowToast((error as Error).message, 'error');
      this.mealsDataByDay = new Map();
      this.renderCalendar();
    } finally {
      this.hideLoading();
      this.enableControls();
    }
  }

  /**
   * Aggregate meals by day
   */
  private aggregateDataByDay(meals: Meal[]): Map<string, DayData> {
    const dayMap = new Map<string, DayData>();

    meals.forEach((meal) => {
      if (!meal.createdAt) return;
      const date = new Date(meal.createdAt);
      const dateKey = date.toISOString().split('T')[0];

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          totalCalories: 0,
          totalProtein: 0,
          totalFat: 0,
          totalCarbs: 0,
          meals: [],
          mealsByType: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: [],
          },
        });
      }

      const dayData = dayMap.get(dateKey)!;
      dayData.totalCalories += meal.totalCalories || 0;
      dayData.totalProtein += meal.totalProtein || 0;
      dayData.totalFat += meal.totalFat || 0;
      dayData.totalCarbs += meal.totalCarbs || 0;
      dayData.meals.push(meal);

      const mealType = meal.mealType || 'snack';
      if (dayData.mealsByType[mealType]) {
        dayData.mealsByType[mealType].push(meal);
      }
    });

    return dayMap;
  }

  /**
   * Render calendar grid
   */
  private renderCalendar(): void {
    if (!this.elements.calendarGrid) return;

    const selectedPatientId = this.patientController.getSelectedPatientId();

    if (!selectedPatientId) {
      this.elements.calendarContainer?.classList.add('hidden');
      this.elements.empty?.classList.remove('hidden');
      return;
    }

    this.elements.empty?.classList.add('hidden');
    this.elements.calendarContainer?.classList.remove('hidden');

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const daysInMonth = lastDay.getDate();
    const cells: string[] = [];

    // Empty cells before month starts
    for (let i = 0; i < startDay; i++) {
      cells.push('<div class="meals-calendar-day empty"></div>');
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = this.mealsDataByDay.get(dateKey);

      if (dayData && dayData.meals.length > 0) {
        const kcal = Math.round(dayData.totalCalories);
        const protein = Math.round(dayData.totalProtein);
        const fat = Math.round(dayData.totalFat);
        const carbs = Math.round(dayData.totalCarbs);

        cells.push(`
          <div class="meals-calendar-day has-data" onclick="showDayMealsModal('${dateKey}')">
            <div class="meals-day-number">${day}</div>
            <div class="meals-day-kcal">${kcal} kcal</div>
            <div class="meals-day-macros">
              <span>O:${protein}</span>
              <span>T:${fat}</span>
              <span>Og:${carbs}</span>
            </div>
          </div>
        `);
      } else {
        cells.push(`
          <div class="meals-calendar-day">
            <div class="meals-day-number">${day}</div>
          </div>
        `);
      }
    }

    this.elements.calendarGrid.innerHTML = cells.join('');
  }

  /**
   * Show day details modal
   */
  private showDayModal(dateKey: string): void {
    const dayData = this.mealsDataByDay.get(dateKey);
    if (!dayData || !this.elements.modal) return;

    const date = new Date(dateKey);
    const formattedDate = date.toLocaleDateString('lv-LV', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (this.elements.modalTitle) {
      this.elements.modalTitle.textContent = formattedDate;
    }

    this.renderModalSummary(dayData);
    this.renderModalContent(dayData);

    this.elements.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Render modal summary section
   */
  private renderModalSummary(dayData: DayData): void {
    if (!this.elements.modalSummary) return;

    const kcal = Math.round(dayData.totalCalories);
    const protein = Math.round(dayData.totalProtein);
    const fat = Math.round(dayData.totalFat);
    const carbs = Math.round(dayData.totalCarbs);

    this.elements.modalSummary.innerHTML = `
      <div class="meals-summary-row">
        <span class="meals-summary-label">Kopā kalorijas:</span>
        <span class="meals-summary-value">${kcal} kcal</span>
      </div>
      <div class="meals-summary-row">
        <span class="meals-summary-label">Olbaltumvielas:</span>
        <span class="meals-summary-value">${protein}g</span>
      </div>
      <div class="meals-summary-row">
        <span class="meals-summary-label">Tauki:</span>
        <span class="meals-summary-value">${fat}g</span>
      </div>
      <div class="meals-summary-row">
        <span class="meals-summary-label">Ogļhidrāti:</span>
        <span class="meals-summary-value">${carbs}g</span>
      </div>
    `;
  }

  /**
   * Render modal meal content
   */
  private renderModalContent(dayData: DayData): void {
    if (!this.elements.modalContent) return;

    const typeLabels: Record<string, string> = {
      breakfast: 'Brokastis',
      lunch: 'Pusdienas',
      dinner: 'Vakariņas',
      snack: 'Uzkodas',
    };

    const typeIcons: Record<string, string> = {
      breakfast: 'ph-coffee',
      lunch: 'ph-bowl-food',
      dinner: 'ph-fork-knife',
      snack: 'ph-apple',
    };

    const sections: string[] = [];

    Object.entries(dayData.mealsByType).forEach(([type, meals]) => {
      if (meals.length === 0) return;

      const typeKcal = meals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
      const typeProtein = meals.reduce((sum, m) => sum + (m.totalProtein || 0), 0);
      const typeFat = meals.reduce((sum, m) => sum + (m.totalFat || 0), 0);
      const typeCarbs = meals.reduce((sum, m) => sum + (m.totalCarbs || 0), 0);

      const entries = meals
        .map((meal) => {
          const time = this.formatMealTime(meal.createdAt);
          const items =
            (meal.items || [])
              .map((item: MealItem) => `${item.name} (${item.weight}g)`)
              .join(', ') || '—';
          const calories = Math.round(meal.totalCalories || 0);
          const protein = Math.round(meal.totalProtein || 0);
          const fat = Math.round(meal.totalFat || 0);
          const carbs = Math.round(meal.totalCarbs || 0);

          return `
            <div class="meal-entry">
              <div class="meal-entry-time">${time}</div>
              <div class="meal-entry-items">${items}</div>
              <div class="meal-entry-macros">
                <span>${calories} kcal</span>
                <span>O: ${protein}g</span>
                <span>T: ${fat}g</span>
                <span>Og: ${carbs}g</span>
              </div>
            </div>
          `;
        })
        .join('');

      sections.push(`
        <div class="meal-type-section">
          <div class="meal-type-header">
            <div class="meal-type-title">
              <i class="ph ${typeIcons[type]}"></i>
              <span>${typeLabels[type]}</span>
            </div>
            <div class="meal-type-summary">
              ${Math.round(typeKcal)} kcal |
              O:${Math.round(typeProtein)}g |
              T:${Math.round(typeFat)}g |
              Og:${Math.round(typeCarbs)}g
            </div>
          </div>
          ${entries}
        </div>
      `);
    });

    this.elements.modalContent.innerHTML = sections.join('');
  }

  /**
   * Close modal
   */
  private closeModal(): void {
    if (this.elements.modal) {
      this.elements.modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  /**
   * Update header with patient info
   */
  private updateHeader(selectedPatientId: string): void {
    if (this.elements.currentMonth) {
      this.elements.currentMonth.textContent = this.formatMonthYear(this.currentDate);
    }
    if (this.elements.patientName) {
      this.elements.patientName.textContent = this.selectedPatientName || selectedPatientId;
    }
    if (this.elements.patientId) {
      this.elements.patientId.textContent = `ID: ${selectedPatientId}`;
    }
  }

  /**
   * Set selected patient name (called from patient controller)
   */
  setSelectedPatientName(name: string): void {
    this.selectedPatientName = name;
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    this.elements.loading?.classList.remove('hidden');
    this.elements.calendarContainer?.classList.add('hidden');
    this.elements.empty?.classList.add('hidden');
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    this.elements.loading?.classList.add('hidden');
    // Show calendar if a patient is selected, otherwise show empty state
    const hasPatient = !!this.patientController.getSelectedPatientId();
    this.elements.calendarContainer?.classList.toggle('hidden', !hasPatient);
    this.elements.empty?.classList.toggle('hidden', hasPatient);
  }

  /**
   * Disable navigation controls
   */
  private disableControls(): void {
    [this.elements.prevMonthBtn, this.elements.nextMonthBtn, this.elements.refreshBtn].forEach(
      (btn) => {
        if (btn) btn.setAttribute('disabled', 'true');
      }
    );
  }

  /**
   * Enable navigation controls
   */
  private enableControls(): void {
    [this.elements.prevMonthBtn, this.elements.nextMonthBtn, this.elements.refreshBtn].forEach(
      (btn) => {
        if (btn) btn.removeAttribute('disabled');
      }
    );
  }

  /**
   * Format month and year in Latvian
   */
  private formatMonthYear(date: Date): string {
    const months = [
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
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  /**
   * Format meal time
   */
  private formatMealTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Get auth headers
   */
  private getAuthHeaders(): Record<string, string> {
    if (typeof window !== 'undefined' && (window as any).getAuthHeaders) {
      return (window as any).getAuthHeaders();
    }
    return { 'Content-Type': 'application/json' };
  }
}
