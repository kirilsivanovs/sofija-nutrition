// Landing page copy (LV/RU/EN), migrated out of public/assets/main.js.
// A missing or misnamed key fails `tsc` — no index signature.

export type Locale = 'lv' | 'ru' | 'en';

export interface LandingDict {
  // Navigation
  header_specialty: string;
  nav_services: string;
  nav_about: string;
  nav_price: string;
  nav_contact: string;
  nav_cabinet: string;

  // Hero (chart hero, SN-015.1) — hero_title split so no markup lives in copy
  hero_title_lead: string;
  hero_title_key: string;
  hero_lead: string;
  hero_cta: string;
  hero_fact: string;
  hero_chart_heading: string;
  hero_chart_aria_label: string;
  hero_legend_a: string;
  hero_legend_b: string;
  hero_readout_time: string;
  hero_readout_a: string;
  hero_readout_b: string;
  hero_chart_caption: string;
  glucose_unit: string;

  // Six-question body (SN-015.2)
  qindex_title: string;
  qindex_nav_label: string;
  qindex_1: string;
  qindex_2: string;
  qindex_3: string;
  qindex_4: string;
  qindex_5: string;
  qindex_6: string;
  qindex_cta: string;
  q1_title: string;
  q1_intro: string;
  q1_row1_t: string;
  q1_row1_d: string;
  q1_row2_t: string;
  q1_row2_d: string;
  q1_row3_t: string;
  q1_row3_d: string;
  q1_row4_t: string;
  q1_row4_d: string;
  q1_scope: string;
  q2_title: string;
  q2_step1: string;
  q2_step2: string;
  q2_step3: string;
  q2_step4: string;
  q3_title: string;
  q3_row1_t: string;
  q3_row1_d: string;
  q3_row1_v: string;
  q3_row2_t: string;
  q3_row2_d: string;
  q3_pending: string;
  q3_row3_t: string;
  q3_row3_d: string;
  q4_title: string;
  about_lead: string;
  about_text: string;
  about_photo_alt: string;
  q4_talk1_label: string;
  q4_talk1_text: string;
  q4_talk2_label: string;
  q4_talk2_text: string;
  q4_talk3_label: string;
  q4_talk3_text: string;
  q4_cred: string;
  q5_title: string;
  q5_p1: string;
  q5_p2: string;
  q6_title: string;
  booking_noscript: string;

  // Footer
  footer_subtitle: string;
  footer_terms: string;
  footer_privacy: string;

  // Scroll to top (public site)
  scrolltop_label: string;

  // Meta / JSON-LD (Layout.astro)
  meta_title: string;
  meta_description: string;
  jsonld_business_description: string;
  jsonld_offer_description: string;
  jsonld_person_jobtitle: string;
  jsonld_person_description: string;
  jsonld_website_description: string;
  jsonld_webpage_description: string;
  jsonld_breadcrumb_home: string;
}

export const translations: Record<Locale, LandingDict> = {
  lv: {
    header_specialty: 'uztura speciāliste, Rīga',
    nav_services: 'Konsultācija',
    nav_about: 'Par mani',
    nav_price: 'Cenas',
    nav_contact: 'Pieteikties',
    nav_cabinet: 'Pacienta kabinets',

    hero_title_lead: 'Vienas un tās pašas brokastis.',
    hero_title_key: 'Divas dažādas glikozes līknes.',
    hero_lead:
      'Tāpēc es nesāku ar gatavu ēdienkarti. Pirmajā konsultācijā apskatām Jūsu analīzes, ikdienu un ēšanas paradumus, un plānu veidojam no tiem.',
    hero_cta: 'Pieteikties konsultācijai',
    hero_fact: '60 minūtes, klātienē Rīgā vai tiešsaistē',
    hero_chart_heading: 'Glikoze pēc brokastīm, 07:00–11:00',
    hero_chart_aria_label:
      'Divu cilvēku glikozes līknes pēc vienādām brokastīm. A paliek diapazonā 3,9–7,8 mmol/L, B uz laiku pārsniedz 7,8 mmol/L.',
    hero_legend_a: 'Cilvēks A',
    hero_legend_b: 'Cilvēks B',
    hero_readout_time: 'Laiks',
    hero_readout_a: 'Cilvēks A',
    hero_readout_b: 'Cilvēks B',
    // copy pending from Sofija: 7.8 caption wording
    hero_chart_caption:
      'Ilustratīvi, sintētiski dati, nevis pacientu mērījumi. Diapazons 3,9–7,8 mmol/L.',
    glucose_unit: 'mmol/L',

    qindex_title: 'Jautājumi šajā lapā',
    qindex_nav_label: 'Jautājumi šajā lapā',
    qindex_1: 'Vai konsultācija ir piemērota man?',
    qindex_2: 'Kā notiek pirmā konsultācija?',
    qindex_3: 'Cik tas maksā?',
    qindex_4: 'Kas ir Sofija Ivanova?',
    qindex_5: 'Ar ko šī pieeja atšķiras?',
    qindex_6: 'Kā pieteikties?',
    qindex_cta: 'Pieteikties',
    q1_title: 'Vai konsultācija ir piemērota man?',
    q1_intro:
      'Visiem, kas vēlas sakārtot uzturu zinātniski pamatotā veidā. Visbiežāk pie manis nāk ar šiem jautājumiem:',
    q1_row1_t: 'Metabolā veselība',
    q1_row1_d:
      'Prediabēts, insulīna rezistence, paaugstināts cukurs. Mērķis ir stabilāks glikozes līmenis un enerģija dienas laikā.',
    q1_row2_t: 'Svars',
    q1_row2_d:
      'Svara kontrole bez striktiem ierobežojumiem, arī tad, ja vairākas diētas nav palīdzējušas ilgtermiņā.',
    q1_row3_t: 'Enerģija',
    q1_row3_d: 'Hronisks nogurums un enerģijas trūkums.',
    q1_row4_t: 'Gremošana',
    q1_row4_d: 'Vēdera uzpūšanās, diskomforts un nestabila gremošana.',
    // copy pending from Sofija: exact wording of the practice's boundary line
    q1_scope: 'Ja Jums vajadzīga steidzama medicīniska palīdzība, vispirms vērsieties pie sava ārsta.',
    q2_title: 'Kā notiek pirmā konsultācija?',
    q2_step1: 'Izvēlaties laiku kalendārā un saņemat apstiprinājumu e-pastā.',
    q2_step2:
      'Ja ir nesenas analīzes (bioķīmija, glikoze, lipīdi), paņemat tās līdzi. Ja nav, sāksim ar to, kas ir.',
    q2_step3:
      '60 minūšu saruna klātienē Rīgā vai video tiešsaistē par Jūsu ikdienu, ēšanu un mērķiem.',
    q2_step4: 'Saņemat personalizētu uztura plānu un vienojamies par nākamo soli.',
    q3_title: 'Cik tas maksā?',
    q3_row1_t: 'Individuāla konsultācija',
    q3_row1_d: '60 min, ar personalizētu uztura plānu',
    q3_row1_v: 'no 65 €',
    q3_row2_t: 'Atkārtota vizīte',
    q3_row2_d: 'plāna pārskatīšana un korekcijas',
    // prices genuinely pending Sofija, don't invent numbers
    q3_pending: 'cenu precizē Sofija',
    q3_row3_t: 'Ilgtermiņa pakete',
    q3_row3_d: 'vairākas vizītes par izdevīgāku cenu',
    q4_title: 'Kas ir Sofija Ivanova?',
    about_lead:
      'Esmu doktorante Latvijas Universitātes Klīniskās un personalizētās medicīnas katedrā. Pētu uztura lomu diabēta ārstēšanā un profilaksē.',
    about_text:
      'Latvijas Universitātē strādāju projektā PRAESIDIUM, kas pēta, kā prognozēt un novērst paaugstinātu glikozes līmeni tukšā dūšā.',
    about_photo_alt: 'Sofija Ivanova uzstājas EASD 2025 kongresā Vīnē',
    q4_talk1_label: '2025',
    q4_talk1_text: 'EASD kongress, Vīne',
    q4_talk2_label: 'Lekcija',
    q4_talk2_text: '„Uztura loma slimību profilaksē”, Veselībpratības diena, P. Stradiņa KUS',
    q4_talk3_label: 'Stends',
    q4_talk3_text: 'Zinātnieku nakts',
    // title wording ("sertificēta dietoloģe" vs "uztura speciāliste") pending Sofija
    q4_cred:
      'Mg.sc.sal., Rīgas Stradiņa universitāte · Doktorantūra, Latvijas Universitāte · Ārstniecības personu reģistrs Nr. 75650061277',
    q5_title: 'Ar ko šī pieeja atšķiras?',
    q5_p1:
      'Mana pieeja balstās pētniecībā un individuālos datos. Neizrakstu vispārīgas diētas: katrs ieteikums ir pielāgots tieši Jūsu situācijai, analīzēm un ikdienai.',
    q5_p2:
      'Grafiks lapas augšā parāda iemeslu: viens un tas pats ēdiens dažādiem cilvēkiem iedarbojas atšķirīgi.',
    q6_title: 'Kā pieteikties?',
    booking_noscript:
      'Kalendāram nepieciešams JavaScript. Lūdzu, pieteikšanās rakstiet uz info@sofijaivanova.lv',

    footer_subtitle: 'uztura speciāliste, Rīga',
    footer_terms: 'Pakalpojumu noteikumi',
    footer_privacy: 'Privātuma politika',

    scrolltop_label: 'Atgriezties uz augšu',

    meta_title: 'Dietoloģe Rīgā — Sofija Ivanova | Personalizētas Uztura Konsultācijas',
    meta_description:
      'Sertificēta dietoloģe Rīgā. Individuālas uztura konsultācijas klātienē un tiešsaistē. Diabēta profilakse, personalizēts uztura plāns, metabolā veselība. MSc uzturzinātnē, doktorante LU.',
    jsonld_business_description:
      'Sertificēta dietoloģe Rīgā. Personalizētas uztura konsultācijas, diabēta profilakse, metabolā veselība. Doktorante Latvijas Universitātē, pētniece.',
    jsonld_offer_description: '60 min personalizēta uztura konsultācija klātienē vai tiešsaistē',
    jsonld_person_jobtitle: 'Sertificēta dietoloģe, doktorante',
    jsonld_person_description:
      'Sertificēta dietoloģe (MSc Uzturzinātnē, RSU), doktorante Latvijas Universitātē. Pētniecība — uztura loma diabēta ārstēšanā un profilaksē, personalizēts uzturs.',
    jsonld_website_description:
      'Personalizētas uztura konsultācijas Rīgā un tiešsaistē. Diabēta profilakse, metabolā veselība, zarnu veselība.',
    jsonld_webpage_description:
      'Sertificēta uztura speciāliste Rīgā. Individuālas uztura konsultācijas, diabēta profilakse, metabolā veselība.',
    jsonld_breadcrumb_home: 'Sākums',
  },
  ru: {
    // proposed copy, pending Sofija's confirmation
    header_specialty: 'специалист по питанию, Рига',
    nav_services: 'Консультация',
    nav_about: 'Обо мне',
    nav_price: 'Цены',
    nav_contact: 'Записаться',
    nav_cabinet: 'Кабинет пациента',

    hero_title_lead: 'Один и тот же завтрак.',
    hero_title_key: 'Две разные кривые глюкозы.',
    hero_lead:
      'Поэтому я не начинаю с готового меню. На первой консультации мы смотрим Ваши анализы, повседневные привычки и питание, и уже на их основе строим план.',
    hero_cta: 'Записаться на консультацию',
    hero_fact: '60 минут, очно в Риге или онлайн',
    hero_chart_heading: 'Глюкоза после завтрака, 07:00–11:00',
    // copy pending from Sofija: faithful translation of the LV chart aria-label
    hero_chart_aria_label:
      'Кривые глюкозы двух людей после одинакового завтрака. У A показатель остаётся в диапазоне 3,9–7,8 ммоль/л, у B временно превышает 7,8 ммоль/л.',
    hero_legend_a: 'Человек A',
    hero_legend_b: 'Человек B',
    hero_readout_time: 'Время',
    hero_readout_a: 'Человек A',
    hero_readout_b: 'Человек B',
    // copy pending from Sofija: 7.8 caption wording
    hero_chart_caption:
      'Иллюстративные, синтетические данные, а не показатели пациентов. Диапазон 3,9–7,8 ммоль/л.',
    glucose_unit: 'ммоль/л',

    // proposed copy, pending Sofija's confirmation
    qindex_title: 'Вопросы на этой странице',
    qindex_nav_label: 'Вопросы на этой странице',
    qindex_1: 'Подходит ли мне консультация?',
    qindex_2: 'Как проходит первая консультация?',
    qindex_3: 'Сколько это стоит?',
    qindex_4: 'Кто такая Sofija Ivanova?',
    qindex_5: 'Чем отличается этот подход?',
    qindex_6: 'Как записаться?',
    qindex_cta: 'Записаться',
    q1_title: 'Подходит ли мне консультация?',
    q1_intro:
      'Всем, кто хочет наладить питание научно обоснованным способом. Чаще всего ко мне обращаются с такими вопросами:',
    q1_row1_t: 'Метаболическое здоровье',
    q1_row1_d:
      'Предиабет, инсулинорезистентность, повышенный сахар. Цель — стабильный уровень глюкозы и энергия в течение дня.',
    q1_row2_t: 'Вес',
    q1_row2_d:
      'Контроль веса без строгих ограничений, даже если несколько диет не помогли надолго.',
    q1_row3_t: 'Энергия',
    q1_row3_d: 'Хроническая усталость и нехватка энергии.',
    q1_row4_t: 'Пищеварение',
    q1_row4_d: 'Вздутие живота, дискомфорт и нестабильное пищеварение.',
    q1_scope: 'Если Вам нужна срочная медицинская помощь, в первую очередь обратитесь к своему врачу.',
    q2_title: 'Как проходит первая консультация?',
    q2_step1: 'Выбираете время в календаре и получаете подтверждение по email.',
    q2_step2:
      'Если есть недавние анализы (биохимия, глюкоза, липиды), берёте их с собой. Если нет, начнём с того, что есть.',
    q2_step3:
      '60-минутный разговор очно в Риге или по видео онлайн о Вашем образе жизни, питании и целях.',
    q2_step4: 'Получаете персонализированный план питания, договариваемся о следующем шаге.',
    q3_title: 'Сколько это стоит?',
    q3_row1_t: 'Индивидуальная консультация',
    // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
    q3_row1_d: '60 мин, с персонализированным планом питания',
    q3_row1_v: 'от 65 €',
    q3_row2_t: 'Повторный визит',
    // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
    q3_row2_d: 'пересмотр плана и корректировки',
    q3_pending: 'цену уточняет София',
    q3_row3_t: 'Долгосрочный пакет',
    // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
    q3_row3_d: 'несколько визитов по более выгодной цене',
    q4_title: 'Кто такая Sofija Ivanova?',
    about_lead:
      'Помогаю людям наладить питание на основе науки и персонализированного подхода. Активно участвую в исследовательских проектах и применяю доказательные методы в практике.',
    about_text:
      'Мой подход сочетает академические знания и практический опыт. Каждая консультация основана на доказательствах — не модных диетах или общих советах. В исследованиях фокусируюсь на роли питания в лечении и профилактике диабета.',
    // copy pending from Sofija: faithful translation of the LV photo alt text
    about_photo_alt: 'Sofija Ivanova выступает на конгрессе EASD 2025 в Вене',
    q4_talk1_label: '2025',
    q4_talk1_text: 'Конгресс EASD, Вена',
    q4_talk2_label: 'Лекция',
    q4_talk2_text:
      '«Роль питания в профилактике заболеваний», День здоровой грамотности, КУБ им. П. Страдиня',
    q4_talk3_label: 'Стенд',
    q4_talk3_text: 'Ночь учёных',
    q4_cred:
      'Mg.sc.sal., Рижский университет Страдиня · Докторантура, Латвийский университет · Реестр медработников № 75650061277',
    q5_title: 'Чем отличается этот подход?',
    q5_p1:
      'Мой подход основан на исследованиях и индивидуальных данных. Не назначаю общих диет: каждая рекомендация адаптирована к Вашей ситуации, анализам и повседневной жизни.',
    q5_p2:
      'График вверху страницы показывает почему: одна и та же еда действует по-разному на разных людей.',
    q6_title: 'Как записаться?',
    booking_noscript:
      'Для календаря нужен JavaScript. Чтобы записаться, напишите на info@sofijaivanova.lv',

    footer_subtitle: 'специалист по питанию, Рига',
    footer_terms: 'Условия оказания услуг',
    footer_privacy: 'Политика конфиденциальности',

    // copy pending from Sofija: faithful translation of the LV button label
    scrolltop_label: 'Вернуться наверх',

    // copy pending from Sofija: faithful translation of the LV meta title
    meta_title: 'Диетолог в Риге — Sofija Ivanova | Персонализированные консультации по питанию',
    // copy pending from Sofija: faithful translation of the LV meta description
    meta_description:
      'Сертифицированный диетолог в Риге. Индивидуальные консультации по питанию очно и онлайн. Профилактика диабета, персонализированный план питания, метаболическое здоровье. MSc в области нутрициологии, докторантура ЛУ.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD description
    jsonld_business_description:
      'Сертифицированный диетолог в Риге. Персонализированные консультации по питанию, профилактика диабета, метаболическое здоровье. Докторантка Латвийского университета, исследователь.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD offer description
    jsonld_offer_description: '60-минутная персонализированная консультация по питанию очно или онлайн',
    // copy pending from Sofija: faithful translation of the LV JSON-LD job title
    jsonld_person_jobtitle: 'Сертифицированный диетолог, докторантка',
    // copy pending from Sofija: faithful translation of the LV JSON-LD person description
    jsonld_person_description:
      'Сертифицированный диетолог (MSc в области нутрициологии, RSU), докторантка Латвийского университета. Исследования — роль питания в лечении и профилактике диабета, персонализированное питание.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD website description
    jsonld_website_description:
      'Персонализированные консультации по питанию в Риге и онлайн. Профилактика диабета, метаболическое здоровье, здоровье кишечника.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD webpage description
    jsonld_webpage_description:
      'Сертифицированный специалист по питанию в Риге. Индивидуальные консультации по питанию, профилактика диабета, метаболическое здоровье.',
    // copy pending from Sofija: faithful translation of the LV breadcrumb label
    jsonld_breadcrumb_home: 'Главная',
  },
  en: {
    // proposed copy, pending Sofija's confirmation
    header_specialty: 'nutrition specialist, Riga',
    nav_services: 'Consultation',
    nav_about: 'About',
    nav_price: 'Pricing',
    // copy pending from Sofija: confirm "Book" matches hero/index CTA intent
    nav_contact: 'Book',
    nav_cabinet: 'Patient Cabinet',

    hero_title_lead: 'Same breakfast.',
    hero_title_key: 'Two different glucose curves.',
    hero_lead:
      "That's why I don't start with a ready-made meal plan. In the first consultation we look at your test results, daily routine and eating habits, and build the plan from there.",
    hero_cta: 'Book a consultation',
    hero_fact: '60 minutes, in person in Riga or online',
    hero_chart_heading: 'Glucose after breakfast, 07:00–11:00',
    // copy pending from Sofija: faithful translation of the LV chart aria-label
    hero_chart_aria_label:
      'Glucose curves of two people after the same breakfast. Person A stays within the 3.9–7.8 mmol/L range, Person B temporarily exceeds 7.8 mmol/L.',
    hero_legend_a: 'Person A',
    hero_legend_b: 'Person B',
    hero_readout_time: 'Time',
    hero_readout_a: 'Person A',
    hero_readout_b: 'Person B',
    // copy pending from Sofija: 7.8 caption wording
    hero_chart_caption: 'Illustrative, synthetic data, not patient measurements. Range 3.9–7.8 mmol/L.',
    glucose_unit: 'mmol/L',

    // proposed copy, pending Sofija's confirmation
    qindex_title: 'Questions on this page',
    qindex_nav_label: 'Questions on this page',
    qindex_1: 'Is this consultation right for me?',
    qindex_2: 'How does the first consultation work?',
    qindex_3: 'How much does it cost?',
    qindex_4: 'Who is Sofija Ivanova?',
    qindex_5: 'How is this approach different?',
    qindex_6: 'How do I book?',
    qindex_cta: 'Book now',
    q1_title: 'Is this consultation right for me?',
    q1_intro:
      'For anyone who wants to sort out their nutrition in a scientifically grounded way. Most often I hear these questions:',
    q1_row1_t: 'Metabolic health',
    q1_row1_d:
      'Prediabetes, insulin resistance, elevated blood sugar. The goal is a more stable glucose level and energy throughout the day.',
    q1_row2_t: 'Weight',
    q1_row2_d: 'Weight control without strict restrictions, even if several diets have not helped long-term.',
    q1_row3_t: 'Energy',
    q1_row3_d: 'Chronic fatigue and low energy.',
    q1_row4_t: 'Digestion',
    q1_row4_d: 'Bloating, discomfort and unstable digestion.',
    q1_scope: 'If you need urgent medical care, please contact your doctor first.',
    q2_title: 'How does the first consultation work?',
    q2_step1: 'You choose a time in the calendar and get an email confirmation.',
    q2_step2:
      'If you have recent test results (biochemistry, glucose, lipids), bring them along. If not, we start with what you have.',
    q2_step3:
      'A 60-minute conversation, in person in Riga or by video online, about your daily life, eating and goals.',
    q2_step4: 'You receive a personalized nutrition plan and agree on the next step.',
    q3_title: 'How much does it cost?',
    q3_row1_t: 'Individual consultation',
    // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
    q3_row1_d: '60 min, with a personalized nutrition plan',
    q3_row1_v: 'from €65',
    q3_row2_t: 'Follow-up visit',
    // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
    q3_row2_d: 'plan review and adjustments',
    q3_pending: 'price to be confirmed by Sofija',
    q3_row3_t: 'Long-term package',
    // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
    q3_row3_d: 'multiple visits at a better price',
    q4_title: 'Who is Sofija Ivanova?',
    about_lead:
      'I help people improve nutrition through a science-based and personalized approach. I actively participate in research projects and apply evidence-based methods in practice.',
    about_text:
      'My approach combines academic knowledge and practical experience. Every consultation is evidence-based — not trendy diets or generic advice. My research focuses on the role of nutrition in diabetes treatment and prevention.',
    // copy pending from Sofija: faithful translation of the LV photo alt text
    about_photo_alt: 'Sofija Ivanova speaking at the EASD 2025 Congress in Vienna',
    q4_talk1_label: '2025',
    q4_talk1_text: 'EASD Congress, Vienna',
    q4_talk2_label: 'Lecture',
    q4_talk2_text: '"The role of nutrition in disease prevention", Health Literacy Day, P. Stradins CUH',
    q4_talk3_label: 'Stand',
    q4_talk3_text: 'Researchers’ Night',
    q4_cred:
      'Mg.sc.sal., Riga Stradins University · Doctoral studies, University of Latvia · Medical Persons Register No. 75650061277',
    q5_title: 'How is this approach different?',
    q5_p1:
      'My approach is based on research and individual data. I do not prescribe generic diets: every recommendation is tailored to your situation, test results and daily life.',
    q5_p2: 'The chart at the top of the page shows why: the same food affects different people differently.',
    q6_title: 'How do I book?',
    booking_noscript: 'The calendar needs JavaScript. To book, please email info@sofijaivanova.lv',

    footer_subtitle: 'nutrition specialist, Riga',
    footer_terms: 'Terms of Service',
    footer_privacy: 'Privacy Policy',

    // copy pending from Sofija: faithful translation of the LV button label
    scrolltop_label: 'Back to top',

    // copy pending from Sofija: faithful translation of the LV meta title
    meta_title: 'Nutritionist in Riga — Sofija Ivanova | Personalized Nutrition Consultations',
    // copy pending from Sofija: faithful translation of the LV meta description
    meta_description:
      'Certified nutritionist in Riga. Individual nutrition consultations in person and online. Diabetes prevention, personalized nutrition plan, metabolic health. MSc in Nutrition Science, doctoral candidate at the University of Latvia.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD description
    jsonld_business_description:
      'Certified nutritionist in Riga. Personalized nutrition consultations, diabetes prevention, metabolic health. Doctoral candidate at the University of Latvia, researcher.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD offer description
    jsonld_offer_description: '60-minute personalized nutrition consultation, in person or online',
    // copy pending from Sofija: faithful translation of the LV JSON-LD job title
    jsonld_person_jobtitle: 'Certified nutritionist, doctoral candidate',
    // copy pending from Sofija: faithful translation of the LV JSON-LD person description
    jsonld_person_description:
      'Certified nutritionist (MSc in Nutrition Science, RSU), doctoral candidate at the University of Latvia. Research — the role of nutrition in diabetes treatment and prevention, personalized nutrition.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD website description
    jsonld_website_description:
      'Personalized nutrition consultations in Riga and online. Diabetes prevention, metabolic health, gut health.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD webpage description
    jsonld_webpage_description:
      'Certified nutrition specialist in Riga. Individual nutrition consultations, diabetes prevention, metabolic health.',
    // copy pending from Sofija: faithful translation of the LV breadcrumb label
    jsonld_breadcrumb_home: 'Home',
  },
};

export function t(locale: Locale): LandingDict {
  return translations[locale];
}
