import {
  loadAvailabilityForm,
  setupVacationDateValidation,
} from '../../utils/admin/availability';
import { loadHolidays, setupHolidaysListeners } from '../../utils/admin/holidays';

export class AvailabilityController {
  private apiBase: string;

  constructor(apiBase: string) {
    this.apiBase = apiBase;
  }

  init(): void {
    this.setupHolidaysListeners();
  }

  loadAvailability(): void {
    loadAvailabilityForm(this.apiBase, () => loadHolidays(this.apiBase));
    setupVacationDateValidation();
  }

  private setupHolidaysListeners(): void {
    setupHolidaysListeners(this.apiBase);
  }
}
