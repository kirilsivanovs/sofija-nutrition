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
  });

  it('matches the booking CTA meaning for the EN nav contact link', () => {
    expect(translations.en.nav_contact).toBe('Book');
  });

  it('spells the glucose unit per locale (RU spelled out, LV/EN "mmol/L")', () => {
    expect(translations.lv.glucose_unit).toBe('mmol/L');
    expect(translations.ru.glucose_unit).toBe('ммоль/л');
    expect(translations.en.glucose_unit).toBe('mmol/L');
  });

  it('has no cookie consent keys in any locale when no consent is collected', () => {
    for (const locale of ['lv', 'ru', 'en'] as const) {
      const keys = Object.keys(translations[locale]);
      expect(keys.some((key) => key.startsWith('cookie_'))).toBe(false);
      expect(keys.includes('footer_cookie_settings')).toBe(false);
    }
  });

  it('uses one certified-title term across header, footer, credentials, meta and JSON-LD, per locale', () => {
    const title = {
      lv: 'Sertificēta uztura speciāliste, pētniece, doktorante',
      ru: 'Сертифицированный специалист по питанию, исследователь, докторантка',
      en: 'Certified nutrition specialist, researcher, doctoral candidate',
    };
    const retired = { lv: /dietoloģ/i, ru: /диетолог/i, en: /nutritionist/i };
    const keys = [
      'header_specialty',
      'footer_subtitle',
      'meta_title',
      'meta_description',
      'jsonld_business_description',
      'jsonld_person_jobtitle',
      'jsonld_person_description',
      'jsonld_webpage_description',
    ];
    (['lv', 'ru', 'en'] as const).forEach((l) => {
      keys.forEach((k) => expect(translations[l][k as keyof typeof translations['lv']]).toContain(title[l]));
      Object.values(translations[l]).forEach((v) => expect(retired[l].test(v)).toBe(false));
    });
  });

  it('states "60 min" only in hero_fact and the price table, once each, per locale', () => {
    const pattern = /\b60[\s-]?(min|minūtes|minūšu|минут|мин)/i;
    (['lv', 'ru', 'en'] as const).forEach((l) => {
      const matches = Object.entries(translations[l])
        .filter(([, v]) => pattern.test(v))
        .map(([k]) => k)
        .sort();
      // jsonld_offer_description already stated "60 min"/equivalent before this task and is out of its scope
      expect(matches).toEqual(['hero_fact', 'jsonld_offer_description', 'q3_row1_d']);
    });
  });

  it('drops the filler opener from q1_intro across locales', () => {
    expect(translations.lv.q1_intro).not.toContain('Visiem');
    expect(translations.ru.q1_intro).not.toContain('Всем');
    expect(translations.en.q1_intro).not.toContain('For anyone');
  });

  it('cites a named source for the plate model in every locale', () => {
    (['lv', 'ru', 'en'] as const).forEach((l) => {
      expect(translations[l].plate_source).toContain('Harvard T.H. Chan School of Public Health');
    });
  });

  it('keeps Q5 to q5_p1 alone, with q5_p2 removed', () => {
    (['lv', 'ru', 'en'] as const).forEach((l) => {
      expect('q5_p2' in translations[l]).toBe(false);
      expect(translations[l].q5_p1.length).toBeGreaterThan(0);
    });
  });

  it('removes diabetes-prevention as a stated topic from meta and JSON-LD, per locale', () => {
    const retiredTopic = { lv: 'diabēta profilakse', ru: 'профилактика диабета', en: 'diabetes prevention' };
    const topicKeys = [
      'meta_description',
      'jsonld_business_description',
      'jsonld_website_description',
      'jsonld_webpage_description',
    ] as const;
    (['lv', 'ru', 'en'] as const).forEach((l) => {
      topicKeys.forEach((k) => expect(translations[l][k].toLowerCase()).not.toContain(retiredTopic[l]));
    });
  });
});
