/**
 * Patient management service
 * Following Single Responsibility and SOLID principles
 */

export interface Patient {
  userId: string;
  displayName?: string;
  email?: string;
  mealsCount: number;
  lastMealAt?: string;
  accessEnabled?: boolean;
}

export class PatientService {
  private apiBase: string;

  constructor(apiBase: string) {
    this.apiBase = apiBase;
  }

  /**
   * Fetch list of patients from API
   */
  async fetchPatients(limit = 200): Promise<Patient[]> {
    const response = await fetch(`${this.apiBase}/dashboard/patients?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }

    return await response.json();
  }

  /**
   * Delete patient and all their meal records
   */
  async deletePatient(userId: string): Promise<{ deletedMeals: number }> {
    const response = await fetch(
      `${this.apiBase}/dashboard/patients/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete patient');
    }

    return await response.json();
  }

  /**
   * Update patient access status
   */
  async updateAccess(userId: string, enabled: boolean): Promise<void> {
    const response = await fetch(`${this.apiBase}/dashboard/food-access`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userId, accessEnabled: enabled }),
    });

    if (!response.ok) {
      throw new Error('Failed to update access');
    }
  }

  /**
   * Filter patients by search query
   * Searches in: userId, displayName, email
   */
  filterPatients(patients: Patient[], query: string): Patient[] {
    if (!query.trim()) {
      return patients;
    }

    const lowerQuery = query.toLowerCase().trim();
    return patients.filter((p) => {
      const userId = p.userId?.toLowerCase() || '';
      const displayName = p.displayName?.toLowerCase() || '';
      const email = p.email?.toLowerCase() || '';

      return (
        userId.includes(lowerQuery) ||
        displayName.includes(lowerQuery) ||
        email.includes(lowerQuery)
      );
    });
  }

  /**
   * Get display name for patient (email first, then displayName, fallback to userId)
   */
  getDisplayName(patient: Patient): string {
    return patient.email || patient.displayName || patient.userId;
  }

  /**
   * Get secondary info (displayName if email shown, or last meal date)
   */
  getSecondaryInfo(patient: Patient): string {
    // If showing email, show displayName as secondary
    if (patient.email && patient.displayName) {
      return patient.displayName;
    }

    // If showing email/displayName, show ID
    if (patient.email || patient.displayName) {
      return `ID: ${patient.userId}`;
    }

    // Otherwise show last meal date
    return patient.lastMealAt ? `Pēdējais ieraksts: ${this.formatDate(patient.lastMealAt)}` : '';
  }

  /**
   * Format date in Latvian locale
   */
  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('lv-LV');
  }

  /**
   * Get auth headers from window context
   */
  private getAuthHeaders(): Record<string, string> {
    if (typeof window !== 'undefined' && (window as any).getAuthHeaders) {
      return (window as any).getAuthHeaders();
    }
    return { 'Content-Type': 'application/json' };
  }
}
