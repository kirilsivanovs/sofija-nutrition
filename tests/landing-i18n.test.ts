import { translations } from '../src/i18n/landing';

describe('landing i18n dictionary', () => {
  it('has the same keys in lv, ru and en', () => {
    const lvKeys = Object.keys(translations.lv).sort();
    const ruKeys = Object.keys(translations.ru).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(ruKeys).toEqual(lvKeys);
    expect(enKeys).toEqual(lvKeys);
  });

  it('contains no HTML markup in any dictionary value', () => {
    for (const locale of ['lv', 'ru', 'en'] as const) {
      for (const [key, value] of Object.entries(translations[locale])) {
        expect(value.includes('<')).toBe(false);
      }
    }
  });

  it('keeps the existing pending-copy wording unchanged', () => {
    expect(translations.lv.hero_chart_caption).toContain('Ilustratīvi');
    expect(translations.lv.q3_pending).toBe('cenu precizē Sofija');
    expect(translations.en.q3_pending).toBe('price to be confirmed by Sofija');
  });

  it('matches the booking CTA meaning for the EN nav contact link', () => {
    expect(translations.en.nav_contact).toBe('Book');
  });

  it('spells the glucose unit per locale (RU spelled out, LV/EN "mmol/L")', () => {
    expect(translations.lv.glucose_unit).toBe('mmol/L');
    expect(translations.ru.glucose_unit).toBe('ммоль/л');
    expect(translations.en.glucose_unit).toBe('mmol/L');
  });
});
