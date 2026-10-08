import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', 'src');

function readStripped(...segments: string[]): string {
  return fs.readFileSync(path.join(root, ...segments), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
}

const adminCss = readStripped('styles', 'admin.css');
const patientListCss = readStripped('components', 'admin', 'PatientList', 'PatientList.css');
const mealsTabCss = readStripped('components', 'admin', 'MealsTab', 'MealsTab.css');
const dataTabCss = readStripped('components', 'admin', 'DataTab', 'DataTab.css');
const dataTabTs = readStripped('components', 'admin', 'DataTab', 'DataTab.ts');
const calendarViewControllerTs = readStripped('components', 'admin', 'CalendarViewController.ts');
const notificationsTs = readStripped('utils', 'admin', 'notifications.ts');
const dataTabAstro = fs.readFileSync(
  path.join(root, 'components', 'admin', 'DataTab', 'DataTab.astro'),
  'utf-8'
);
const mealsTabAstro = fs.readFileSync(
  path.join(root, 'components', 'admin', 'MealsTab', 'MealsTab.astro'),
  'utf-8'
);
const adminIndexAstro = readStripped('pages', 'admin', 'index.astro');
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

  it('has no named colour literal in the admin stylesheets', () => {
    for (const css of [adminCss, dataTabCss, patientListCss, mealsTabCss]) {
      expect(css).not.toMatch(
        /(?:color|background(?:-color)?|border(?:-[a-z]+)*)\s*:(?:[^;{}()]|\([^)]*\))*?(?<![-\w])(?:white|black|red|green|blue|gray|grey|orange|yellow)\b(?!-)/i
      );
    }
  });

  it('gives the Dati row delete button its own class with a White fill and Line border', () => {
    expect(dataTabTs).toMatch(/class="btn-delete-row"/);
    expect(dataTabTs).not.toMatch(/class="btn-close"/);
    const rule = ruleBody(dataTabCss, '.btn-delete-row');
    expect(rule).toMatch(/background:\s*var\(--color-white\)/);
    expect(rule).toMatch(/border:\s*1px solid var\(--color-line\)/);
    expect(ruleBody(dataTabCss, '.btn-delete-row:hover')).toMatch(/var\(--color-error\)/);
    expect(ruleBody(adminCss, '.btn-close:hover')).not.toMatch(/background:\s*var\(--color-mist\)/);
  });

  it('uses minmax(0, 1fr) for single-column patient grids so long text cannot widen them', () => {
    expect(patientListCss).not.toMatch(/grid-template-columns:\s*1fr;/);
    expect(mealsTabCss).not.toMatch(/grid-template-columns:\s*1fr;/);
  });

  it('uses minmax(0, 1fr) for the meals layout in admin.css so the Pacienti column fits 375px', () => {
    const rules = [...adminCss.matchAll(/\.meals-layout\s*{([^}]*)}/g)].map((m) => m[1]);
    expect(rules.length).toBeGreaterThan(0);
    for (const body of rules) {
      expect(body).not.toMatch(/grid-template-columns:\s*1fr\s*;/);
    }
  });

  it('excludes .btn-home from the global text-link padding rule', () => {
    const globalCss = readStripped('styles', 'global.css');
    expect(globalCss).toMatch(/a:not\([^{]*:not\(\.btn-home\)[^{]*{/);
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

  it('has no weight 500 in the admin stylesheets', () => {
    for (const css of [adminCss, dataTabCss, patientListCss, mealsTabCss]) {
      expect(css).not.toMatch(/font-weight:\s*500/);
    }
  });

  it('has no transition and animates only the spinner in the admin stylesheets', () => {
    for (const css of [adminCss, dataTabCss, patientListCss, mealsTabCss]) {
      expect(css).not.toMatch(/transition/);
      expect(css).not.toMatch(/@keyframes\s+(?!spin\b)/);
      for (const [, name] of css.matchAll(/animation:\s*([\w-]+)/g)) {
        expect(name).toBe('spin');
      }
    }
  });

  it('has no hex, rgba or inline colour in the admin component styles and scripts', () => {
    for (const css of [dataTabCss, patientListCss, mealsTabCss]) {
      expect(css).not.toMatch(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?=[\s;,)])/);
      expect(css).not.toMatch(/rgba?\(/);
    }
    for (const script of [dataTabTs, calendarViewControllerTs]) {
      expect(script).not.toMatch(/#[0-9a-fA-F]{6}\b/);
      expect(script).not.toMatch(/rgba?\(/);
      expect(script).not.toMatch(/style\.color|style="[^"]*color/);
    }
  });

  it('renders DataTab status as a booking-status class and not an inline style', () => {
    expect(dataTabTs).toMatch(/class="booking-status/);
    expect(dataTabTs).not.toMatch(/style="\$\{/);
    expect(dataTabTs).toMatch(/STATUS_MODIFIERS\.includes\(value\)/);
  });

  it('draws the access toggle as a plain button with a status dot', () => {
    expect([...patientListCss.matchAll(/\.access-toggle\s*{/g)]).toHaveLength(1);
    const toggle = ruleBody(patientListCss, '.access-toggle');
    expect(toggle).toMatch(/background:\s*var\(--color-white\)/);
    expect(toggle).not.toMatch(/border-radius:\s*\d+px|9999|rgba/);
    expect(ruleBody(patientListCss, '.access-toggle::before')).toMatch(/width:\s*8px/);
    expect(ruleBody(patientListCss, '.access-toggle.on::before')).toMatch(/var\(--color-range\)/);
    expect(ruleBody(patientListCss, '.access-toggle.off::before')).toMatch(/var\(--color-error\)/);
  });

  it('removes toast and confirm without waiting for an animation', () => {
    expect(notificationsTs).not.toMatch(/removing|'show'|requestAnimationFrame|\}, (?:200|300)\)/);
  });

  it('drops the access-denied icon', () => {
    expect(adminIndexAstro).not.toMatch(/unauthorized-icon/);
    expect(adminCss).not.toMatch(/unauthorized-icon/);
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

  it('gives every Dati filter label a for matching a control id when DataTab.astro is read', () => {
    const labels = [...dataTabAstro.matchAll(/<label[^>]*for="([^"]+)"/g)].map((m) => m[1]);
    expect(labels).toEqual(['table-search', 'filter-status', 'filter-date-from', 'filter-date-to']);
    for (const id of labels) {
      expect(dataTabAstro).toMatch(new RegExp(`<(?:input|select)[^>]*id="${id}"`));
    }
    expect(dataTabAstro).not.toMatch(/<label(?![^>]*\bfor=)/);
  });

  it('places the table footer inside the table card when DataTab.astro is read', () => {
    const card = /<div class="card table-card">([\s\S]*?)<div id="table-empty"/.exec(dataTabAstro);
    expect(card).not.toBeNull();
    const body = card![1];
    expect(body.indexOf('class="table-wrapper"')).toBeGreaterThan(-1);
    expect(body.indexOf('class="table-footer"')).toBeGreaterThan(body.indexOf('class="table-wrapper"'));
    const afterFooter = body.slice(body.indexOf('class="table-footer"'));
    expect(afterFooter).toMatch(/<\/div>\s*<\/div>\s*<\/div>\s*$/);
  });

  it('gives .input-field a 2px Slate border and no outline reset when admin.css is read', () => {
    const base = ruleBody(adminCss, '.input-field');
    expect(base).toMatch(/border:\s*2px solid var\(--color-slate\)/);
    expect(base).not.toMatch(/min-height/);
    const focus = ruleBody(adminCss, '.input-field:focus');
    expect(focus).toMatch(/border-color:\s*var\(--color-graphite\)/);
    expect(focus).not.toMatch(/outline/);
  });

  it('gives .input-field one box model so selects and inputs share a height when admin.css is read', () => {
    const base = ruleBody(adminCss, '.input-field');
    expect(base).toMatch(/box-sizing:\s*border-box/);
    expect(base).toMatch(/height:\s*54px/);
    expect(base).not.toMatch(/line-height:\s*\d+px/);
    expect(base).toMatch(/width:\s*100%/);
    expect(ruleBody(dataTabCss, '.filters-grid .input-field')).toBe('');
  });

  it('gives the blocked-date reason field the same 160px minimum as the vacation form when admin.css is read', () => {
    for (const selector of ['.vacation-form .input-field', '.blocked-date-form .input-field']) {
      const rule = ruleBody(adminCss, selector);
      expect(rule).toMatch(/min-width:\s*160px/);
      expect(rule).toMatch(/width:\s*auto/);
    }
  });

  it('wraps only the Dati header when DataTab.css is read', () => {
    expect(ruleBody(dataTabCss, '.content-header:has(> .data-controls)')).toMatch(/flex-wrap:\s*wrap/);
    expect(ruleBody(adminCss, '.content-header')).not.toMatch(/flex-wrap/);
  });

  it('defines the Dati controls only in DataTab.css when admin.css is read', () => {
    expect(adminCss).not.toMatch(/\.data-controls\s*[{,]/);
    expect(ruleBody(dataTabCss, '.data-controls')).toMatch(/gap:\s*10px/);
  });

  it('keeps the Uzturs refresh button out of the month nav and without inline style when MealsTab.astro is read', () => {
    const nav = /<div class="meals-month-nav">([\s\S]*?)<\/div>/.exec(mealsTabAstro);
    expect(nav).not.toBeNull();
    expect(nav![1]).not.toMatch(/meals-refresh/);
    const refresh = /<button[^>]*id="meals-refresh"[^>]*>/.exec(mealsTabAstro);
    expect(refresh).not.toBeNull();
    expect(refresh![0]).not.toMatch(/style=/);
    expect(mealsTabAstro.indexOf('id="meals-refresh"')).toBeGreaterThan(
      mealsTabAstro.indexOf('class="meals-month-nav"')
    );
  });

  it('defines the month header and table footer rules only in component stylesheets when admin.css is read', () => {
    for (const selector of ['.meals-calendar-header', '.meals-month-nav', '.meals-month-label', '.table-footer']) {
      const escaped = selector.replace('.', '\\.');
      expect(adminCss).not.toMatch(new RegExp(`${escaped}\\s*{`));
    }
  });

  it('names the icon-only Dati and Uzturs buttons when the markup is read', () => {
    for (const id of ['meals-prev-month', 'meals-next-month', 'meals-refresh', 'patients-refresh']) {
      expect(mealsTabAstro).toMatch(new RegExp(`<button[^>]*id="${id}"[^>]*aria-label="[^"]+"`));
    }
    expect(dataTabAstro).toMatch(/<button[^>]*id="refresh-table"[^>]*aria-label="[^"]+"/);
    expect(dataTabAstro).toMatch(/<select[^>]*id="table-select"[^>]*aria-label="[^"]+"/);
  });
});
