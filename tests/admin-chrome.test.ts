import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', 'src');

function readStripped(...segments: string[]): string {
  return fs.readFileSync(path.join(root, ...segments), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
}

const adminCss = readStripped('styles', 'admin.css');
const patientListCss = readStripped('components', 'admin', 'PatientList', 'PatientList.css');
const mealsTabCss = readStripped('components', 'admin', 'MealsTab', 'MealsTab.css');
const calendarViewAstro = fs.readFileSync(
  path.join(root, 'components', 'admin', 'CalendarView.astro'),
  'utf-8'
);

function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?:^|[}\\s,])${escaped}\\s*(?:,[^{]*)?{([^}]*)}`).exec(css);
  return match ? match[1] : '';
}

describe('admin chrome', () => {
  it('has no box-shadow or shadow token in the admin stylesheets', () => {
    for (const css of [adminCss, patientListCss, mealsTabCss]) {
      expect(css).not.toMatch(/box-shadow/);
      expect(css).not.toMatch(/--shadow-/);
    }
  });

  it('has no hex or rgba literal in admin.css', () => {
    expect(adminCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(adminCss).not.toMatch(/rgba?\(/);
  });

  it('has no uppercase transform or letter-spacing in admin.css', () => {
    expect(adminCss).not.toMatch(/text-transform:\s*uppercase/);
    expect(adminCss).not.toMatch(/letter-spacing/);
  });

  it('has no backdrop-filter in admin.css', () => {
    expect(adminCss).not.toMatch(/backdrop-filter/);
  });

  it('sets the logo subtitle to 13px, 12px at 480px, at weight 400', () => {
    const base = ruleBody(adminCss, '.admin-logo-sub');
    expect(base).toMatch(/font-size:\s*13px/);
    expect(base).toMatch(/font-weight:\s*400/);
    const rules = [...adminCss.matchAll(/\.admin-logo-sub\s*{([^}]*)}/g)].map((m) => m[1]);
    expect(rules).toHaveLength(2);
    expect(rules[1]).toMatch(/font-size:\s*12px/);
  });

  it('borders floating surfaces in place of a shadow', () => {
    for (const selector of [
      '.confirm-dialog',
      '.modal-container',
      '.calendar-card',
      '.day-details-card',
      '.status-card',
    ]) {
      expect(ruleBody(adminCss, selector)).toMatch(/border:\s*1px solid var\(--color-line\)/);
    }
    expect(ruleBody(adminCss, '.date-picker-popup')).toMatch(
      /border:\s*1px solid var\(--color-slate\)/
    );
    const toast = ruleBody(adminCss, '.toast');
    expect(toast).toMatch(/border:\s*1px solid var\(--color-slate\)/);
    expect(toast).toMatch(/border-left:\s*3px solid var\(--color-slate\)/);
  });

  it('marks the selected calendar cell with a Navy outline and hovers with a Slate outline', () => {
    expect(ruleBody(adminCss, '.calendar-cell:hover')).toMatch(
      /outline:\s*1px solid var\(--color-slate\)/
    );
    expect(ruleBody(adminCss, '.calendar-cell.selected')).toMatch(
      /outline:\s*2px solid var\(--color-navy\)/
    );
  });

  it('has no scale transform or transition-all on calendar cells', () => {
    for (const selector of [
      '.calendar-cell',
      '.calendar-cell:hover',
      '.calendar-cell.selected',
      '.calendar-cell.empty:hover',
    ]) {
      expect(ruleBody(adminCss, selector)).not.toMatch(/scale\(|transition:\s*all/);
    }
  });

  it('paints bookable cells White and non-bookable cells Mist', () => {
    expect(ruleBody(adminCss, '.calendar-cell')).toMatch(/background:\s*var\(--color-white\)/);
    expect(ruleBody(adminCss, '.calendar-cell.empty')).toMatch(/background:\s*var\(--color-white\)/);
    expect(adminCss).not.toMatch(/\.calendar-cell\.(available|booked)\s*{/);
    for (const state of ['weekend', 'holiday']) {
      expect(ruleBody(adminCss, `.calendar-cell.${state}`)).toMatch(
        /background-color:\s*var\(--color-mist\)/
      );
    }
    const holidayName = ruleBody(adminCss, '.calendar-cell .holiday-name');
    expect(holidayName).toMatch(/font-size:\s*13px/);
    expect(holidayName).toMatch(/font-weight:\s*600/);
    expect(holidayName).toMatch(/color:\s*var\(--color-slate\)/);
  });

  it('drops the Ieraksti and Svētki legend items', () => {
    expect(calendarViewAstro).not.toMatch(/Ieraksti|Svētki|legend-booked|legend-holiday/);
    expect(adminCss).not.toMatch(/\.legend-(booked|holiday)/);
    expect(ruleBody(adminCss, '.legend-confirmed')).toMatch(/var\(--color-range\)/);
    expect(ruleBody(adminCss, '.legend-pending')).toMatch(/var\(--color-high\)/);
    expect(ruleBody(adminCss, '.legend-cancelled')).toMatch(/var\(--color-error\)/);
  });

  it('does not fix the booking dot box size in any rule, so the digit is not clipped', () => {
    const rules = [...adminCss.matchAll(/\.calendar-cell \.booking-dot\s*{([^}]*)}/g)];
    expect(rules.length).toBeGreaterThan(0);
    for (const [, body] of rules) {
      expect(body).not.toMatch(/(?:^|[;\s])(?:width|height):\s*\d+px/);
    }
  });

  it('draws booking status as a dot or left border without a fill', () => {
    const dot = ruleBody(adminCss, '.calendar-cell .booking-dot');
    expect(dot).not.toMatch(/background|border|padding/);
    const status = ruleBody(adminCss, '.booking-status');
    expect(status).not.toMatch(/background|padding|border-radius|text-transform/);
    expect(status).toMatch(/color:\s*var\(--color-graphite\)/);
    expect(ruleBody(adminCss, '.booking-status::before')).toMatch(/width:\s*8px/);
    const borders: Record<string, string> = {
      pending: 'high',
      confirmed: 'range',
      cancelled: 'error',
    };
    for (const [state, token] of Object.entries(borders)) {
      expect(ruleBody(adminCss, `.booking-card.${state}`)).toMatch(
        new RegExp(`border-left-color:\\s*var\\(--color-${token}\\)`)
      );
    }
    expect(ruleBody(adminCss, '.booking-card')).toMatch(/border-left:\s*3px solid/);
  });

  it('keeps cancelled booking cards at full opacity', () => {
    expect(ruleBody(adminCss, '.booking-card.cancelled')).not.toMatch(/opacity/);
  });

  it('colours toast borders and icons from role tokens', () => {
    const tokens: Record<string, string> = {
      success: 'range',
      error: 'error',
      warning: 'high',
      info: 'slate',
    };
    for (const [type, token] of Object.entries(tokens)) {
      expect(ruleBody(adminCss, `.toast.${type}`)).toMatch(
        new RegExp(`border-left-color:\\s*var\\(--color-${token}\\)`)
      );
      expect(ruleBody(adminCss, `.toast.${type} .toast-icon`)).toMatch(
        new RegExp(`color:\\s*var\\(--color-${token}\\)`)
      );
    }
  });

  it('maps system health to Range, High and Error without a fill', () => {
    expect(ruleBody(adminCss, '.status-badge')).not.toMatch(/background/);
    const tokens: Record<string, string> = {
      healthy: 'range',
      degraded: 'high',
      unhealthy: 'error',
    };
    for (const [state, token] of Object.entries(tokens)) {
      const badge = ruleBody(adminCss, `.status-badge.${state}`);
      expect(badge).not.toMatch(/background/);
      expect(badge).toMatch(new RegExp(`color:\\s*var\\(--color-${token}\\)`));
      expect(ruleBody(adminCss, `.stat-value.stat-${state}`)).toMatch(
        new RegExp(`color:\\s*var\\(--color-${token}\\)`)
      );
    }
  });
});
