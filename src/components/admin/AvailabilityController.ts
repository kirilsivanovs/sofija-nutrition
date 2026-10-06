import {
  addBlockedDate,
  addVacation,
  loadAvailabilityForm,
  saveAvailability,
  setupVacationDateValidation,
} from '../../utils/admin/availability';
import { loadHolidays, setupHolidaysListeners } from '../../utils/admin/holidays';

export class AvailabilityController {
  private apiBase: string;

  constructor(apiBase: string) {
    this.apiBase = apiBase;
  }

  init(): void {
    this.setupButtonListeners();
    this.setupHolidaysListeners();
  }

  loadAvailability(): void {
    loadAvailabilityForm(this.apiBase, () => loadHolidays(this.apiBase));
    setupVacationDateValidation();
  }

  private setupButtonListeners(): void {
    const reload = () => loadAvailabilityForm(this.apiBase);
    document.getElementById('save-availability')?.addEventListener('click', () => saveAvailability(this.apiBase));
    document.getElementById('add-vacation')?.addEventListener('click', () => addVacation(this.apiBase, reload));
    document.getElementById('add-blocked-date')?.addEventListener('click', () => addBlockedDate(this.apiBase, reload));
  }

  private setupHolidaysListeners(): void {
    setupHolidaysListeners(this.apiBase);
  }
}
