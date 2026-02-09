/**
 * GDPR Cookie Consent Banner
 * TypeScript implementation - fully GDPR compliant, no third-party dependencies
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

  private createBanner(): HTMLElement {
    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.innerHTML = `
      <div class="cookie-consent-overlay"></div>
      <div class="cookie-consent-modal">
        <div class="cookie-consent-header">
          <h3>🍪 Sīkdatņu izmantošana</h3>
        </div>
        
        <div class="cookie-consent-body">
          <p>
            Mēs izmantojam sīkdatnes, lai uzlabotu jūsu pieredzi mūsu vietnē. 
            Jūs varat izvēlēties, kuras sīkdatnes pieņemt.
          </p>
          
          <div class="cookie-categories">
            <div class="cookie-category">
              <div class="cookie-category-header">
                <label>
                  <input type="checkbox" id="consent-necessary" checked disabled>
                  <strong>Nepieciešamās sīkdatnes</strong>
                </label>
              </div>
              <p class="cookie-category-description">
                Šīs sīkdatnes ir nepieciešamas vietnes darbībai un nevar tikt atspējotas.
              </p>
            </div>
            
            <div class="cookie-category">
              <div class="cookie-category-header">
                <label>
                  <input type="checkbox" id="consent-analytics">
                  <strong>Analītikas sīkdatnes</strong>
                </label>
              </div>
              <p class="cookie-category-description">
                Palīdz mums saprast, kā apmeklētāji izmanto vietni, lai to uzlabotu.
              </p>
            </div>
            
            <div class="cookie-category">
              <div class="cookie-category-header">
                <label>
                  <input type="checkbox" id="consent-marketing">
                  <strong>Mārketinga sīkdatnes</strong>
                </label>
              </div>
              <p class="cookie-category-description">
                Izmanto, lai rādītu personalizētus piedāvājumus un reklāmas.
              </p>
            </div>
          </div>
        </div>
        
        <div class="cookie-consent-footer">
          <button id="consent-accept-all" class="btn-primary">
            Pieņemt visu
          </button>
          <button id="consent-accept-selected" class="btn-secondary">
            Saglabāt izvēli
          </button>
          <button id="consent-reject-all" class="btn-text">
            Noraidīt visu
          </button>
        </div>
        
        <div class="cookie-consent-privacy">
          <a href="/privacy-policy" target="_blank">Privātuma politika</a>
        </div>
      </div>
    `;
    
    return banner;
  }

  public showBanner(): void {
    const existingBanner = document.getElementById('cookie-consent-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
    
    const banner = this.createBanner();
    document.body.appendChild(banner);
    
    // Add event listeners
    document.getElementById('consent-accept-all')?.addEventListener('click', () => this.acceptAll());
    document.getElementById('consent-accept-selected')?.addEventListener('click', () => this.acceptSelected());
    document.getElementById('consent-reject-all')?.addEventListener('click', () => this.rejectAll());
    
    document.body.style.overflow = 'hidden';
  }

  private hideBanner(): void {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.remove();
    }
    document.body.style.overflow = '';
  }

  private acceptAll(): void {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    this.saveConsent(preferences);
    this.hideBanner();
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
    this.hideBanner();
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
    this.hideBanner();
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

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #cookie-consent-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .cookie-consent-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
      }
      
      .cookie-consent-modal {
        position: relative;
        background: white;
        border-radius: 16px;
        max-width: 600px;
        width: 90%;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
        margin: 0 auto;
      }
      
      /* Mobile optimization */
      @media (max-width: 640px) {
        .cookie-consent-modal {
          width: calc(100% - 32px);
          max-width: 400px;
          max-height: 90vh;
          border-radius: 12px;
          margin: 0 16px;
        }
        
        .cookie-consent-header {
          padding: 20px 16px 12px;
        }
        
        .cookie-consent-header h3 {
          font-size: 20px;
        }
        
        .cookie-consent-body {
          padding: 16px;
        }
        
        .cookie-consent-body > p {
          font-size: 14px;
          margin-bottom: 16px;
        }
        
        .cookie-category {
          padding: 12px;
        }
        
        .cookie-category-description {
          font-size: 13px;
        }
        
        .cookie-consent-footer {
          padding: 16px;
          flex-direction: column;
        }
        
        .cookie-consent-footer button {
          padding: 14px 20px;
          font-size: 15px;
          width: 100%;
        }
        
        .btn-text {
          padding: 12px;
        }
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .cookie-consent-header {
        padding: 24px 24px 16px;
        border-bottom: 2px solid #f3f4f6;
      }
      
      .cookie-consent-header h3 {
        margin: 0;
        font-size: 24px;
        color: #1f2937;
        font-weight: 700;
      }
      
      .cookie-consent-body {
        padding: 24px;
      }
      
      .cookie-consent-body > p {
        margin: 0 0 20px;
        color: #6b7280;
        line-height: 1.6;
      }
      
      .cookie-categories {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .cookie-category {
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        transition: all 0.2s;
      }
      
      .cookie-category:hover {
        border-color: #a78f72;
        background: #fefdfb;
      }
      
      .cookie-category-header {
        margin-bottom: 8px;
      }
      
      .cookie-category-header label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
      }
      
      .cookie-category-header input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
      
      .cookie-category-header input[type="checkbox"]:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      .cookie-category-description {
        margin: 0;
        padding-left: 26px;
        font-size: 14px;
        color: #9ca3af;
        line-height: 1.5;
      }
      
      .cookie-consent-footer {
        padding: 20px 24px;
        border-top: 2px solid #f3f4f6;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .cookie-consent-footer button {
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-family: inherit;
      }
      
      .btn-primary {
        background: #a78f72;
        color: white;
        flex: 1;
      }
      
      .btn-primary:hover {
        background: #8f7961;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(167, 143, 114, 0.3);
      }
      
      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
        flex: 1;
      }
      
      .btn-secondary:hover {
        background: #e5e7eb;
      }
      
      .btn-text {
        background: transparent;
        color: #6b7280;
        padding: 12px 16px;
      }
      
      .btn-text:hover {
        color: #374151;
        text-decoration: underline;
      }
      
      .cookie-consent-privacy {
        padding: 0 24px 20px;
        text-align: center;
      }
      
      .cookie-consent-privacy a {
        color: #a78f72;
        text-decoration: none;
        font-size: 14px;
      }
      
      .cookie-consent-privacy a:hover {
        text-decoration: underline;
      }
      
      @media (max-width: 640px) {
        .cookie-consent-modal {
          width: 95%;
          max-height: 95vh;
        }
        
        .cookie-consent-footer {
          flex-direction: column;
        }
        
        .cookie-consent-footer button {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private init(): void {
    this.consent = this.getConsent();
    
    if (!this.consent) {
      setTimeout(() => this.showBanner(), 500);
    } else {
      this.loadScripts(this.consent.preferences);
      
      if (!this.consent.preferences.analytics || !this.consent.preferences.marketing) {
        this.deleteNonNecessaryCookies();
      }
    }
    
    // Expose function to reopen settings
    (window as any).showCookieSettings = () => this.showBanner();
    
    // Inject styles
    this.injectStyles();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CookieConsent());
} else {
  new CookieConsent();
}
