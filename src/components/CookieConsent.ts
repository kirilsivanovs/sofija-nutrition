/**
 * GDPR Cookie Consent Dialog
 * Native <dialog>, static markup in index.astro, no third-party dependencies.
 */

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface ConsentData {
  version: string;
  timestamp: string;
  preferences: CookiePreferences;
}

const CONSENT_KEY = 'sofija_cookie_consent';
const CONSENT_VERSION = '1.0';

class CookieConsent {
  private consent: ConsentData | null = null;
  private dialog: HTMLDialogElement | null = null;

  constructor() {
    this.init();
  }

  private getConsent(): ConsentData | null {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (consent) {
        const parsed: ConsentData = JSON.parse(consent);
        if (parsed.version === CONSENT_VERSION) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading consent:', e);
    }
    return null;
  }

  private saveConsent(preferences: CookiePreferences): ConsentData {
    const consent: ConsentData = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      preferences: preferences
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    return consent;
  }

  private deleteNonNecessaryCookies(): void {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const [name] = cookie.split('=');
      const cookieName = name.trim();

      // Keep only necessary cookies
      if (!cookieName.startsWith('__') &&
          cookieName !== 'sofija_cookie_consent' &&
          cookieName !== 'session' &&
          cookieName !== 'auth') {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    }
  }

  private openDialog(): void {
    if (!this.dialog || this.dialog.open) return;
    this.dialog.showModal();
    // showModal()'s native dialog-focusing algorithm falls through to the
    // first focusable descendant (the privacy link) even with tabindex="-1"
    // on the dialog, so focus it explicitly to keep Enter from following
    // that link before the visitor has made a choice.
    this.dialog.focus();
  }

  private closeDialog(): void {
    this.dialog?.close();
  }

  private acceptAll(): void {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    this.saveConsent(preferences);
    this.closeDialog();
    this.loadScripts(preferences);
  }

  private acceptSelected(): void {
    const analyticsCheckbox = document.getElementById('consent-analytics') as HTMLInputElement;
    const marketingCheckbox = document.getElementById('consent-marketing') as HTMLInputElement;

    const preferences: CookiePreferences = {
      necessary: true,
      analytics: analyticsCheckbox?.checked || false,
      marketing: marketingCheckbox?.checked || false
    };
    this.saveConsent(preferences);
    this.closeDialog();
    this.loadScripts(preferences);
  }

  private rejectAll(): void {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    this.saveConsent(preferences);
    this.deleteNonNecessaryCookies();
    this.closeDialog();
  }

  private loadScripts(preferences: CookiePreferences): void {
    // Google Analytics (if enabled)
    if (preferences.analytics && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }

    // Marketing scripts (if enabled)
    if (preferences.marketing) {
      // Load marketing scripts here
    }
  }

  private init(): void {
    this.dialog = document.getElementById('cookie-consent-dialog') as HTMLDialogElement | null;
    this.consent = this.getConsent();

    document.getElementById('consent-accept-all')?.addEventListener('click', () => this.acceptAll());
    document.getElementById('consent-accept-selected')?.addEventListener('click', () => this.acceptSelected());
    document.getElementById('consent-reject-all')?.addEventListener('click', () => this.rejectAll());

    if (!this.consent) {
      setTimeout(() => this.openDialog(), 500);
    } else {
      this.loadScripts(this.consent.preferences);

      if (!this.consent.preferences.analytics || !this.consent.preferences.marketing) {
        this.deleteNonNecessaryCookies();
      }
    }

    // Expose function to reopen settings
    (window as any).showCookieSettings = () => this.openDialog();

    // Footer trigger (no floating button — site-design's Never list bars
    // floating elements that can cover page content).
    document
      .getElementById('footer-cookie-settings')
      ?.addEventListener('click', () => this.openDialog());
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CookieConsent());
} else {
  new CookieConsent();
}
