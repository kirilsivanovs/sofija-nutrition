import type { ShowToastFn } from '../../utils/admin/notifications';

interface SettingsData {
  prices?: {
    initial: number;
    followup: number;
  };
  contact?: {
    email: string;
    phone: string;
    address: string;
  };
  duration?: {
    initial: number;
    followup: number;
  };
  bank?: {
    name: string;
    iban: string;
  };
}

export class SettingsController {
  private apiBase: string;
  private showToast: ShowToastFn;

  constructor(apiBase: string, showToast: ShowToastFn) {
    this.apiBase = apiBase;
    this.showToast = showToast;
  }

  init(): void {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }
  }

  loadSettings(): void {
    fetch(this.apiBase + '/dashboard/settings')
      .then((r) => r.json())
      .then((data: SettingsData) => {
        const priceInitial = document.getElementById('price-initial') as HTMLInputElement | null;
        const priceFollowup = document.getElementById('price-followup') as HTMLInputElement | null;
        const contactEmail = document.getElementById('contact-email') as HTMLInputElement | null;
        const contactPhone = document.getElementById('contact-phone') as HTMLInputElement | null;
        const contactAddress = document.getElementById(
          'contact-address'
        ) as HTMLInputElement | null;
        const durationInitial = document.getElementById(
          'duration-initial'
        ) as HTMLInputElement | null;
        const durationFollowup = document.getElementById(
          'duration-followup'
        ) as HTMLInputElement | null;
        const bankName = document.getElementById('bank-name') as HTMLInputElement | null;
        const bankIban = document.getElementById('bank-iban') as HTMLInputElement | null;

        if (data.prices) {
          if (priceInitial) priceInitial.value = String(data.prices.initial || 65);
          if (priceFollowup) priceFollowup.value = String(data.prices.followup || 45);
        }
        if (data.contact) {
          if (contactEmail) contactEmail.value = data.contact.email || '';
          if (contactPhone) contactPhone.value = data.contact.phone || '';
          if (contactAddress) contactAddress.value = data.contact.address || '';
        }
        if (data.duration) {
          if (durationInitial) durationInitial.value = String(data.duration.initial || 60);
          if (durationFollowup) durationFollowup.value = String(data.duration.followup || 30);
        }
        if (data.bank) {
          if (bankName) bankName.value = data.bank.name || '';
          if (bankIban) bankIban.value = data.bank.iban || '';
        }
      })
      .catch(() => {});
  }

  private async saveSettings(): Promise<void> {
    const priceInitial = (document.getElementById('price-initial') as HTMLInputElement)?.value;
    const priceFollowup = (document.getElementById('price-followup') as HTMLInputElement)?.value;
    const contactEmail = (document.getElementById('contact-email') as HTMLInputElement)?.value;
    const contactPhone = (document.getElementById('contact-phone') as HTMLInputElement)?.value;
    const contactAddress = (document.getElementById('contact-address') as HTMLInputElement)?.value;
    const durationInitial = (document.getElementById('duration-initial') as HTMLInputElement)
      ?.value;
    const durationFollowup = (document.getElementById('duration-followup') as HTMLInputElement)
      ?.value;
    const bankName = (document.getElementById('bank-name') as HTMLInputElement)?.value;
    const bankIban = (document.getElementById('bank-iban') as HTMLInputElement)?.value;

    const settings: SettingsData = {
      prices: {
        initial: parseInt(priceInitial || '65'),
        followup: parseInt(priceFollowup || '45'),
      },
      contact: {
        email: contactEmail || '',
        phone: contactPhone || '',
        address: contactAddress || '',
      },
      duration: {
        initial: parseInt(durationInitial || '60'),
        followup: parseInt(durationFollowup || '30'),
      },
      bank: { name: bankName || '', iban: bankIban || '' },
    };

    try {
      await fetch(this.apiBase + '/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      this.showToast('Iestatījumi saglabāti!', 'success');
    } catch (e: unknown) {
      this.showToast((e as Error).message, 'error');
    }
  }
}
