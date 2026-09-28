/**
 * @jest-environment jsdom
 */

const CONSENT_KEY = 'sofija_cookie_consent';
const CONSENT_VERSION = '1.0';

function buildDom(): void {
  document.body.innerHTML = `
    <button type="button" id="footer-cookie-settings">Sīkdatņu iestatījumi</button>
    <dialog id="cookie-consent-dialog" aria-labelledby="cookieTitle" aria-describedby="cookieIntro">
      <h2 id="cookieTitle">Sīkdatņu izmantošana</h2>
      <p id="cookieIntro">Intro</p>
      <input type="checkbox" id="consent-necessary" checked disabled />
      <input type="checkbox" id="consent-analytics" />
      <input type="checkbox" id="consent-marketing" />
      <div class="cookie-dialog__actions">
        <button type="button" id="consent-reject-all">Noraidīt visu</button>
        <button type="button" id="consent-accept-all">Pieņemt visu</button>
        <button type="button" id="consent-accept-selected">Saglabāt izvēli</button>
      </div>
    </dialog>
  `;
}

/** jsdom 26 has no HTMLDialogElement.showModal/close; stub them to toggle the `open` attribute. */
function stubDialogMethods(): void {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  }
}

function storeConsent(preferences: { necessary: boolean; analytics: boolean; marketing: boolean }): void {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      preferences
    })
  );
}

function loadCookieConsent(): void {
  jest.resetModules();
  require('../src/components/CookieConsent');
}

describe('CookieConsent dialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    stubDialogMethods();
    buildDom();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('opens the dialog on first visit when no consent is stored', () => {
    loadCookieConsent();
    jest.advanceTimersByTime(500);

    const dialog = document.getElementById('cookie-consent-dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
  });

  it('does not reopen the dialog when a valid consent is already stored', () => {
    storeConsent({ necessary: true, analytics: false, marketing: false });

    loadCookieConsent();
    jest.advanceTimersByTime(500);

    const dialog = document.getElementById('cookie-consent-dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(false);
  });

  it('stores necessary-only preferences when reject all is clicked', () => {
    loadCookieConsent();
    jest.advanceTimersByTime(500);

    (document.getElementById('consent-reject-all') as HTMLButtonElement).click();

    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || '{}');
    expect(stored.preferences).toEqual({ necessary: true, analytics: false, marketing: false });

    const dialog = document.getElementById('cookie-consent-dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(false);
  });

  it('stores only the checked categories when save selection is clicked', () => {
    loadCookieConsent();
    jest.advanceTimersByTime(500);

    (document.getElementById('consent-analytics') as HTMLInputElement).checked = true;
    (document.getElementById('consent-accept-selected') as HTMLButtonElement).click();

    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || '{}');
    expect(stored.preferences).toEqual({ necessary: true, analytics: true, marketing: false });
  });

  it('reopens the dialog from the footer trigger', () => {
    storeConsent({ necessary: true, analytics: false, marketing: false });

    loadCookieConsent();
    jest.advanceTimersByTime(500);

    const dialog = document.getElementById('cookie-consent-dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(false);

    (document.getElementById('footer-cookie-settings') as HTMLButtonElement).click();

    expect(dialog.open).toBe(true);
  });
});
