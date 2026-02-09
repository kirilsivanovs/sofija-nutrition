/**
 * PatientList controller - manages patient list UI logic
 * Following Single Responsibility and SOLID principles
 */
import { PatientService, type Patient } from '../../../services/admin/PatientService';

export class PatientListController {
  private service: PatientService;
  private patients: Patient[] = [];
  private filteredPatients: Patient[] = [];
  private selectedPatientId: string = '';

  // DOM elements
  private searchInput: HTMLInputElement | null = null;
  private addInput: HTMLInputElement | null = null;
  private addButton: HTMLButtonElement | null = null;
  private listContainer: HTMLElement | null = null;
  private emptyContainer: HTMLElement | null = null;

  // Callbacks
  private onPatientSelect?: (patient: Patient) => void;
  private onAccessUpdate?: (userId: string, enabled: boolean) => void;
  private onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  private onShowConfirm?: (message: string, title: string) => Promise<boolean>;

  constructor(service: PatientService) {
    this.service = service;
  }

  /**
   * Initialize controller with DOM elements and callbacks
   */
  init(config: {
    searchInput: HTMLInputElement | null;
    addInput: HTMLInputElement | null;
    addButton: HTMLButtonElement | null;
    listContainer: HTMLElement | null;
    emptyContainer: HTMLElement | null;
    onPatientSelect?: (patient: Patient) => void;
    onAccessUpdate?: (userId: string, enabled: boolean) => void;
    onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    onShowConfirm?: (message: string, title: string) => Promise<boolean>;
  }): void {
    this.searchInput = config.searchInput;
    this.addInput = config.addInput;
    this.addButton = config.addButton;
    this.listContainer = config.listContainer;
    this.emptyContainer = config.emptyContainer;
    this.onPatientSelect = config.onPatientSelect;
    this.onAccessUpdate = config.onAccessUpdate;
    this.onShowToast = config.onShowToast;
    this.onShowConfirm = config.onShowConfirm;

    this.attachEventListeners();
  }

  /**
   * Load patients from API
   */
  async loadPatients(): Promise<void> {
    try {
      this.patients = await this.service.fetchPatients();
      this.applyFilter();
    } catch (error) {
      console.error('Error loading patients:', error);
      this.onShowToast?.('Kļūda ielādējot pacientus', 'error');
    }
  }

  /**
   * Apply search filter and render
   */
  private applyFilter(): void {
    const query = this.searchInput?.value || '';
    this.filteredPatients = this.service.filterPatients(this.patients, query);
    this.render();
  }

  /**
   * Render patient list
   */
  private render(): void {
    if (!this.listContainer || !this.emptyContainer) return;

    if (this.filteredPatients.length === 0) {
      this.listContainer.innerHTML = '';
      this.emptyContainer.classList.remove('hidden');
      return;
    }

    this.emptyContainer.classList.add('hidden');
    this.listContainer.innerHTML = this.filteredPatients
      .map((patient) => this.renderPatientItem(patient))
      .join('');

    this.attachItemListeners();
  }

  /**
   * Render single patient item HTML
   */
  private renderPatientItem(patient: Patient): string {
    const isActive = this.selectedPatientId === patient.userId;
    const accessEnabled = Boolean(patient.accessEnabled);
    const displayName = this.service.getDisplayName(patient);
    const secondary = this.service.getSecondaryInfo(patient);

    return `
      <div class="patient-item ${isActive ? 'active' : ''}" data-user-id="${patient.userId}" role="button" tabindex="0">
        <div>
          <div class="patient-id">${displayName}</div>
          <div class="patient-meta">${secondary}</div>
        </div>
        <div class="patient-actions">
          <div class="patient-meta">${patient.mealsCount || 0} ier.</div>
          <div style="display: flex; gap: 4px; align-items: center;">
            <button class="access-toggle ${accessEnabled ? 'on' : 'off'}" data-user-id="${patient.userId}" data-enabled="${accessEnabled}">
              ${accessEnabled ? 'Atļauts' : 'Slēgts'}
            </button>
            <button class="btn-remove-patient" data-user-id="${patient.userId}" title="Dzēst pacientu">
              <i class="ph ph-x"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to DOM elements
   */
  private attachEventListeners(): void {
    this.searchInput?.addEventListener('input', () => this.applyFilter());
    this.addButton?.addEventListener('click', () => this.handleAddPatient());
  }

  /**
   * Attach listeners to patient item elements
   */
  private attachItemListeners(): void {
    this.listContainer?.querySelectorAll('.patient-item').forEach((item) => {
      item.addEventListener('click', () => {
        const userId = (item as HTMLElement).dataset.userId || '';
        if (userId) this.handleSelectPatient(userId);
      });
    });

    this.listContainer?.querySelectorAll('.access-toggle').forEach((toggle) => {
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const button = event.currentTarget as HTMLButtonElement;
        const userId = button.dataset.userId || '';
        const enabled = button.dataset.enabled === 'true';
        if (userId) this.handleToggleAccess(userId, !enabled);
      });
    });

    this.listContainer?.querySelectorAll('.btn-remove-patient').forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        const button = event.currentTarget as HTMLButtonElement;
        const userId = button.dataset.userId || '';
        if (userId) await this.handleRemovePatient(userId);
      });
    });
  }

  /**
   * Handle patient selection
   */
  private handleSelectPatient(userId: string): void {
    const patient = this.patients.find((p) => p.userId === userId);
    if (!patient) return;

    this.selectedPatientId = userId;
    this.onPatientSelect?.(patient);
    this.applyFilter();
  }

  /**
   * Handle access toggle
   */
  private async handleToggleAccess(userId: string, enabled: boolean): Promise<void> {
    try {
      await this.service.updateAccess(userId, enabled);

      const patient = this.patients.find((p) => p.userId === userId);
      if (patient) {
        patient.accessEnabled = enabled;
      }

      this.onAccessUpdate?.(userId, enabled);
      this.applyFilter();
      this.onShowToast?.(enabled ? 'Piekļuve atļauta' : 'Piekļuve liegta', 'success');
    } catch (error) {
      console.error('Error updating access:', error);
      this.onShowToast?.('Kļūda mainot piekļuvi', 'error');
    }
  }

  /**
   * Handle patient removal
   */
  private async handleRemovePatient(userId: string): Promise<void> {
    const patient = this.patients.find((p) => p.userId === userId);
    if (!patient) return;

    const displayName = this.service.getDisplayName(patient);
    const mealsCount = patient.mealsCount || 0;

    const confirmed = await this.onShowConfirm?.(
      `Vai tiešām dzēst pacientu "${displayName}" un visus viņa ${mealsCount} ierakstus? Šī darbība ir neatgriezeniska!`,
      'Dzēst pacientu un datus'
    );

    if (!confirmed) return;

    try {
      const result = await this.service.deletePatient(userId);

      this.patients = this.patients.filter((p) => p.userId !== userId);

      if (this.selectedPatientId === userId) {
        this.selectedPatientId = '';
      }

      this.applyFilter();
      this.onShowToast?.(`Pacients un ${result.deletedMeals || 0} ieraksti dzēsti`, 'success');
    } catch (error) {
      console.error('Error deleting patient:', error);
      this.onShowToast?.('Kļūda dzēšot pacientu', 'error');
    }
  }

  /**
   * Handle adding new patient
   */
  private handleAddPatient(): void {
    const userId = this.addInput?.value?.trim() || '';
    if (!userId) return;

    // Check if patient already exists
    if (this.patients.some((p) => p.userId === userId)) {
      this.onShowToast?.('Šis pacients jau ir sarakstā', 'info');
      return;
    }

    // Add new patient
    const newPatient: Patient = {
      userId,
      mealsCount: 0,
      accessEnabled: false,
    };

    this.patients.unshift(newPatient);
    this.applyFilter();

    if (this.addInput) {
      this.addInput.value = '';
    }

    this.onShowToast?.('Pacients pievienots', 'success');
  }

  /**
   * Get currently selected patient ID
   */
  getSelectedPatientId(): string {
    return this.selectedPatientId;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedPatientId = '';
    this.applyFilter();
  }
}
