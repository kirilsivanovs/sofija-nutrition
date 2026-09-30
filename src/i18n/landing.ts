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
  cred_heading: string;
  cred_degree_t: string;
  cred_degree_d: string;
  cred_phd_t: string;
  cred_phd_d: string;
  cred_project_t: string;
  cred_project_d: string;
  cred_register_t: string;
  cred_register_d: string;
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
  q1_refer: string;
  q2_title: string;
  q2_step1: string;
  q2_step2: string;
  q2_step3: string;
  q2_step4: string;
  q2_step5: string;
  q3_title: string;
  q3_row1_t: string;
  q3_row1_d: string;
  q3_row1_v: string;
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
  q5_title: string;
  q5_p1: string;
  plate_intro: string;
  plate_heading: string;
  plate_aria: string;
  plate_veg_t: string;
  plate_veg_d: string;
  plate_grain_t: string;
  plate_grain_d: string;
  plate_protein_t: string;
  plate_protein_d: string;
  plate_extra: string;
  plate_source: string;
  plate_adapt: string;
  chart_intro: string;
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
    header_specialty: 'Sertificēta uztura speciāliste, pētniece, doktorante',
    nav_services: 'Konsultācija',
    nav_about: 'Par mani',
    nav_price: 'Cenas',
    nav_contact: 'Pieteikties',
    nav_cabinet: 'Pacienta kabinets',

    // proposed copy, pending Sofija's confirmation (hero, credentials, Q1 rows, plate)
    hero_title_lead: 'Uztura speciāliste un pētniece.',
    hero_title_key: 'Konsultācijas, kas balstās pierādījumos.',
    hero_lead:
      'Konsultēju par ikdienas uzturu, svaru, gremošanu un analīžu rādītājiem. Nesāku ar gatavu ēdienkarti: pirmajā konsultācijā apskatām Jūsu analīzes, ikdienu un ēšanas paradumus, un plānu veidojam no tiem.',
    hero_cta: 'Pieteikties konsultācijai',
    // proposal for Sofija (2026-09-28)
    hero_fact: '60 minūtes, klātienē Rīgā vai tiešsaistē · latviski, krieviski vai angliski',
    cred_heading: 'Izglītība un pētniecība',
    cred_degree_t: 'Maģistra grāds',
    cred_degree_d: 'Mg.sc.sal., Rīgas Stradiņa universitāte',
    cred_phd_t: 'Doktorantūra',
    cred_phd_d: 'Latvijas Universitāte, Klīniskās un personalizētās medicīnas katedra',
    cred_project_t: 'Pētniecība',
    cred_project_d: 'Projekts PRAESIDIUM, Latvijas Universitāte',
    cred_register_t: 'Reģistrs',
    cred_register_d: 'Ārstniecības personu reģistrs Nr. 75650061277',
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
    qindex_4: 'Ko Sofija pēta?',
    qindex_5: 'Ar ko šī pieeja atšķiras?',
    qindex_6: 'Kā pieteikties?',
    qindex_cta: 'Pieteikties',
    q1_title: 'Vai konsultācija ir piemērota man?',
    q1_intro: 'Visbiežāk pie manis nāk ar šiem jautājumiem:',
    q1_row1_t: 'Ikdienas uzturs',
    q1_row1_d:
      'Kā ēst regulāri un sabalansēti: ēdienreižu sastāvs, porcijas un ritms, kas iederas Jūsu dienā.',
    q1_row2_t: 'Svars',
    q1_row2_d:
      'Svara kontrole bez striktiem ierobežojumiem, arī tad, ja vairākas diētas nav palīdzējušas ilgtermiņā.',
    q1_row3_t: 'Analīžu rādītāji',
    q1_row3_d:
      'Paaugstināts holesterīns, glikoze vai insulīna rezistence, kad ārsts ieteicis mainīt uzturu.',
    q1_row4_t: 'Enerģija un gremošana',
    q1_row4_d: 'Nogurums, vēdera uzpūšanās un diskomforts pēc ēšanas.',
    q1_scope:
      'Ja Jums vajadzīga steidzama medicīniska palīdzība, vispirms vērsieties pie sava ārsta.',
    // proposal for Sofija (2026-09-28)
    q1_refer:
      'Uztura konsultācija neaizstāj ārsta diagnozi un ārstēšanu. Ja jautājums ir ārpus manas kompetences, piemēram, ēšanas traucējumi, es to pateikšu un ieteikšu, pie kā vērsties.',
    q2_title: 'Kā notiek pirmā konsultācija?',
    q2_step1: 'Izvēlaties laiku kalendārā un saņemat apstiprinājumu e-pastā.',
    q2_step2:
      'Ja ir nesenas analīzes (bioķīmija, glikoze, lipīdi), paņemat tās līdzi. Ja nav, sāksim ar to, kas ir.',
    q2_step3: 'Sarunā izrunājam Jūsu ikdienu, ēšanu un mērķus.',
    q2_step4: 'Saņemat personalizētu uztura plānu un vienojamies par nākamo soli.',
    // proposal for Sofija (2026-09-28)
    q2_step5:
      'Starp vizītēm ēdienreizes varat pierakstīt pacienta kabinetā. Es tās redzu, un nākamajā vizītē pārrunājam, kas izdevās un ko mainīt.',
    q3_title: 'Cik tas maksā?',
    q3_row1_t: 'Individuāla konsultācija',
    q3_row1_d: '60 min, ar personalizētu uztura plānu',
    q3_row1_v: 'no 65 €',
    q4_title: 'Ko Sofija pēta?',
    about_lead: 'Doktorantūrā pētu uztura lomu diabēta ārstēšanā un profilaksē.',
    about_text:
      'Latvijas Universitātē strādāju projektā PRAESIDIUM, kas pēta, kā prognozēt un novērst paaugstinātu glikozes līmeni tukšā dūšā.',
    about_photo_alt: 'Sofija Ivanova uzstājas EASD 2025 kongresā Vīnē',
    q4_talk1_label: '2025',
    q4_talk1_text: 'EASD kongress, Vīne',
    q4_talk2_label: 'Lekcija',
    q4_talk2_text: '„Uztura loma slimību profilaksē”, Veselībpratības diena, P. Stradiņa KUS',
    q4_talk3_label: 'Stends',
    q4_talk3_text: 'Zinātnieku nakts',
    q5_title: 'Ar ko šī pieeja atšķiras?',
    // proposal for Sofija (2026-09-28)
    q5_p1:
      'Ieteikumus balstu uztura vadlīnijās un publicētos pētījumos, nevis modes diētās vai kāda viena pieredzē. Ja kādam apgalvojumam pierādījumu vēl nav pietiekami, es to pasaku atklāti.',
    plate_intro:
      'Sākumpunkts ir vispārpieņemti uztura principi. Viens no uzskatāmākajiem ir šķīvja modelis:',
    plate_heading: 'Šķīvja princips',
    plate_aria:
      'Šķīvis: puse dārzeņi un augļi, ceturtdaļa pilngraudu produkti, ceturtdaļa olbaltumvielu avoti.',
    plate_veg_t: 'Dārzeņi un augļi',
    plate_veg_d: 'Vairāk dārzeņu nekā augļu, dažādās krāsās. Kartupeļi šeit neskaitās.',
    plate_grain_t: 'Pilngraudu produkti',
    plate_grain_d: 'Griķi, auzas, pilngraudu maize, brūnie rīsi; mazāk rafinētu graudu produktu.',
    plate_protein_t: 'Olbaltumvielas',
    plate_protein_d:
      'Zivis, pākšaugi, mājputni, olas, rieksti; mazāk sarkanās un pārstrādātās gaļas.',
    plate_extra: 'Klāt: augu eļļas un ūdens, tēja vai kafija bez cukura.',
    plate_source: 'Avots: Harvard T.H. Chan School of Public Health, „Healthy Eating Plate”.',
    // proposal for Sofija (2026-09-28)
    plate_adapt:
      'Konsultācijā šo modeli pielāgojam Jūsu analīzēm, garšai, dienas ritmam un tam, ko reāli var pagatavot mājās.',
    chart_intro:
      'Viens no jautājumiem, ar ko strādā šī pētniecības joma: kāpēc viena un tā pati maltīte dažādiem cilvēkiem iedarbojas atšķirīgi. Piemērs:',
    q6_title: 'Kā pieteikties?',
    booking_noscript:
      'Kalendāram nepieciešams JavaScript. Lūdzu, pieteikšanās rakstiet uz info@sofijaivanova.lv',

    footer_subtitle: 'Sertificēta uztura speciāliste, pētniece, doktorante',
    footer_terms: 'Pakalpojumu noteikumi',
    footer_privacy: 'Privātuma politika',

    scrolltop_label: 'Atgriezties uz augšu',

    meta_title:
      'Sertificēta uztura speciāliste, pētniece, doktorante Rīgā — Sofija Ivanova | Personalizētas Uztura Konsultācijas',
    meta_description:
      'Sertificēta uztura speciāliste, pētniece, doktorante Rīgā. Individuālas uztura konsultācijas klātienē un tiešsaistē. Personalizēts uztura plāns, metabolā veselība.',
    jsonld_business_description:
      'Sertificēta uztura speciāliste, pētniece, doktorante Rīgā. Personalizētas uztura konsultācijas, metabolā veselība.',
    jsonld_offer_description: '60 min personalizēta uztura konsultācija klātienē vai tiešsaistē',
    jsonld_person_jobtitle: 'Sertificēta uztura speciāliste, pētniece, doktorante',
    jsonld_person_description:
      'Sertificēta uztura speciāliste, pētniece, doktorante (Mg.sc.sal., RSU). Pētniecība — uztura loma diabēta ārstēšanā un profilaksē, personalizēts uzturs.',
    jsonld_website_description:
      'Personalizētas uztura konsultācijas Rīgā un tiešsaistē. Metabolā veselība, zarnu veselība.',
    jsonld_webpage_description:
      'Sertificēta uztura speciāliste, pētniece, doktorante Rīgā. Individuālas uztura konsultācijas, metabolā veselība.',
    jsonld_breadcrumb_home: 'Sākums',
  },
  ru: {
    // proposed copy, pending Sofija's confirmation
    header_specialty: 'Сертифицированный специалист по питанию, исследователь, докторантка',
    nav_services: 'Консультация',
    nav_about: 'Обо мне',
    nav_price: 'Цены',
    nav_contact: 'Записаться',
    nav_cabinet: 'Кабинет пациента',

    hero_title_lead: 'Специалист по питанию и исследователь.',
    hero_title_key: 'Консультации, основанные на доказательствах.',
    hero_lead:
      'Консультирую по повседневному питанию, весу, пищеварению и показателям анализов. Я не начинаю с готового меню: на первой консультации мы смотрим Ваши анализы, образ жизни и привычки питания и уже на их основе строим план.',
    hero_cta: 'Записаться на консультацию',
    // proposal for Sofija (2026-09-28)
    hero_fact: '60 минут, очно в Риге или онлайн · на латышском, русском или английском',
    cred_heading: 'Образование и исследования',
    cred_degree_t: 'Степень магистра',
    cred_degree_d: 'Mg.sc.sal., Рижский университет Страдиня',
    cred_phd_t: 'Докторантура',
    cred_phd_d: 'Латвийский университет, кафедра клинической и персонализированной медицины',
    cred_project_t: 'Исследования',
    cred_project_d: 'Проект PRAESIDIUM, Латвийский университет',
    cred_register_t: 'Реестр',
    cred_register_d: 'Реестр медработников № 75650061277',
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
    qindex_4: 'Что исследует София?',
    qindex_5: 'Чем отличается этот подход?',
    qindex_6: 'Как записаться?',
    qindex_cta: 'Записаться',
    q1_title: 'Подходит ли мне консультация?',
    q1_intro: 'Чаще всего ко мне обращаются с такими вопросами:',
    q1_row1_t: 'Повседневное питание',
    q1_row1_d:
      'Как питаться регулярно и сбалансированно: состав приёмов пищи, порции и ритм, которые вписываются в Ваш день.',
    q1_row2_t: 'Вес',
    q1_row2_d:
      'Контроль веса без строгих ограничений, даже если несколько диет не помогли надолго.',
    q1_row3_t: 'Показатели анализов',
    q1_row3_d:
      'Повышенный холестерин, глюкоза или инсулинорезистентность, когда врач рекомендовал изменить питание.',
    q1_row4_t: 'Энергия и пищеварение',
    q1_row4_d: 'Усталость, вздутие и дискомфорт после еды.',
    q1_scope:
      'Если Вам нужна срочная медицинская помощь, в первую очередь обратитесь к своему врачу.',
    // proposal for Sofija (2026-09-28)
    q1_refer:
      'Консультация по питанию не заменяет диагноз и лечение у врача. Если вопрос выходит за рамки моей компетенции, например расстройства пищевого поведения, я скажу об этом и подскажу, к кому обратиться.',
    q2_title: 'Как проходит первая консультация?',
    q2_step1: 'Выбираете время в календаре и получаете подтверждение по email.',
    q2_step2:
      'Если есть недавние анализы (биохимия, глюкоза, липиды), берёте их с собой. Если нет, начнём с того, что есть.',
    q2_step3: 'В разговоре обсуждаем Ваш образ жизни, питание и цели.',
    q2_step4: 'Получаете персонализированный план питания, договариваемся о следующем шаге.',
    // proposal for Sofija (2026-09-28)
    q2_step5:
      'Между визитами приёмы пищи можно записывать в кабинете пациента. Я их вижу, и на следующем визите обсуждаем, что получилось и что изменить.',
    q3_title: 'Сколько это стоит?',
    q3_row1_t: 'Индивидуальная консультация',
    // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
    q3_row1_d: '60 мин, с персонализированным планом питания',
    q3_row1_v: 'от 65 €',
    q4_title: 'Что исследует София?',
    about_lead: 'В докторантуре исследую роль питания в лечении и профилактике диабета.',
    about_text:
      'В Латвийском университете работаю в проекте PRAESIDIUM, который изучает, как прогнозировать и предотвращать повышенный уровень глюкозы натощак.',
    // copy pending from Sofija: faithful translation of the LV photo alt text
    about_photo_alt: 'Sofija Ivanova выступает на конгрессе EASD 2025 в Вене',
    q4_talk1_label: '2025',
    q4_talk1_text: 'Конгресс EASD, Вена',
    q4_talk2_label: 'Лекция',
    q4_talk2_text:
      '«Роль питания в профилактике заболеваний», День здоровой грамотности, КУБ им. П. Страдиня',
    q4_talk3_label: 'Стенд',
    q4_talk3_text: 'Ночь учёных',
    q5_title: 'Чем отличается этот подход?',
    // proposal for Sofija (2026-09-28)
    q5_p1:
      'Рекомендации основываю на руководствах по питанию и опубликованных исследованиях, а не на модных диетах или чьём-то личном опыте. Если доказательств для какого-то утверждения пока недостаточно, я говорю об этом прямо.',
    plate_intro:
      'Отправная точка — общепринятые принципы питания. Один из самых наглядных — модель тарелки:',
    plate_heading: 'Принцип тарелки',
    plate_aria:
      'Тарелка: половина — овощи и фрукты, четверть — цельнозерновые продукты, четверть — источники белка.',
    plate_veg_t: 'Овощи и фрукты',
    plate_veg_d: 'Овощей больше, чем фруктов, и разных цветов. Картофель сюда не относится.',
    plate_grain_t: 'Цельнозерновые продукты',
    plate_grain_d:
      'Гречка, овсянка, цельнозерновой хлеб, бурый рис; меньше рафинированных круп и муки.',
    plate_protein_t: 'Белок',
    plate_protein_d: 'Рыба, бобовые, птица, яйца, орехи; меньше красного и переработанного мяса.',
    plate_extra: 'Дополнительно: растительные масла и вода, чай или кофе без сахара.',
    plate_source: 'Источник: Harvard T.H. Chan School of Public Health, «Healthy Eating Plate».',
    // proposal for Sofija (2026-09-28)
    plate_adapt:
      'На консультации эту модель подстраиваем под Ваши анализы, вкусы, ритм дня и то, что реально приготовить дома.',
    chart_intro:
      'Один из вопросов, которыми занимается эта область исследований: почему один и тот же приём пищи действует на разных людей по-разному. Пример:',
    q6_title: 'Как записаться?',
    booking_noscript:
      'Для календаря нужен JavaScript. Чтобы записаться, напишите на info@sofijaivanova.lv',

    footer_subtitle: 'Сертифицированный специалист по питанию, исследователь, докторантка',
    footer_terms: 'Условия оказания услуг',
    footer_privacy: 'Политика конфиденциальности',

    // copy pending from Sofija: faithful translation of the LV button label
    scrolltop_label: 'Вернуться наверх',

    // copy pending from Sofija: faithful translation of the LV meta title
    meta_title:
      'Сертифицированный специалист по питанию, исследователь, докторантка в Риге — Sofija Ivanova | Персонализированные консультации по питанию',
    // copy pending from Sofija: faithful translation of the LV meta description
    meta_description:
      'Сертифицированный специалист по питанию, исследователь, докторантка в Риге. Индивидуальные консультации по питанию очно и онлайн. Персонализированный план питания, метаболическое здоровье.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD description
    jsonld_business_description:
      'Сертифицированный специалист по питанию, исследователь, докторантка в Риге. Персонализированные консультации по питанию, метаболическое здоровье.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD offer description
    jsonld_offer_description:
      '60-минутная персонализированная консультация по питанию очно или онлайн',
    // copy pending from Sofija: faithful translation of the LV JSON-LD job title
    jsonld_person_jobtitle: 'Сертифицированный специалист по питанию, исследователь, докторантка',
    // copy pending from Sofija: faithful translation of the LV JSON-LD person description
    jsonld_person_description:
      'Сертифицированный специалист по питанию, исследователь, докторантка (Mg.sc.sal., RSU). Исследования — роль питания в лечении и профилактике диабета, персонализированное питание.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD website description
    jsonld_website_description:
      'Персонализированные консультации по питанию в Риге и онлайн. Метаболическое здоровье, здоровье кишечника.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD webpage description
    jsonld_webpage_description:
      'Сертифицированный специалист по питанию, исследователь, докторантка в Риге. Индивидуальные консультации по питанию, метаболическое здоровье.',
    // copy pending from Sofija: faithful translation of the LV breadcrumb label
    jsonld_breadcrumb_home: 'Главная',
  },
  en: {
    // proposed copy, pending Sofija's confirmation
    header_specialty: 'Certified nutrition specialist, researcher, doctoral candidate',
    nav_services: 'Consultation',
    nav_about: 'About',
    nav_price: 'Pricing',
    // copy pending from Sofija: confirm "Book" matches hero/index CTA intent
    nav_contact: 'Book',
    nav_cabinet: 'Patient Cabinet',

    hero_title_lead: 'Nutrition specialist and researcher.',
    hero_title_key: 'Consultations grounded in evidence.',
    hero_lead:
      "I advise on everyday eating, weight, digestion and test results. I don't start with a ready-made meal plan: in the first consultation we look at your test results, daily routine and eating habits, and build the plan from there.",
    hero_cta: 'Book a consultation',
    // proposal for Sofija (2026-09-28)
    hero_fact: '60 minutes, in person in Riga or online · in Latvian, Russian or English',
    cred_heading: 'Education and research',
    cred_degree_t: "Master's degree",
    cred_degree_d: 'Mg.sc.sal., Riga Stradins University',
    cred_phd_t: 'Doctoral studies',
    cred_phd_d: 'University of Latvia, Department of Clinical and Personalised Medicine',
    cred_project_t: 'Research',
    cred_project_d: 'PRAESIDIUM project, University of Latvia',
    cred_register_t: 'Register',
    cred_register_d: 'Medical Persons Register No. 75650061277',
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
    hero_chart_caption:
      'Illustrative, synthetic data, not patient measurements. Range 3.9–7.8 mmol/L.',
    glucose_unit: 'mmol/L',

    // proposed copy, pending Sofija's confirmation
    qindex_title: 'Questions on this page',
    qindex_nav_label: 'Questions on this page',
    qindex_1: 'Is this consultation right for me?',
    qindex_2: 'How does the first consultation work?',
    qindex_3: 'How much does it cost?',
    qindex_4: 'What does Sofija research?',
    qindex_5: 'How is this approach different?',
    qindex_6: 'How do I book?',
    qindex_cta: 'Book now',
    q1_title: 'Is this consultation right for me?',
    q1_intro: 'Most often I hear these questions:',
    q1_row1_t: 'Everyday eating',
    q1_row1_d:
      'How to eat regularly and in balance: meal composition, portions and a rhythm that fits your day.',
    q1_row2_t: 'Weight',
    q1_row2_d:
      'Weight control without strict restrictions, even if several diets have not helped long-term.',
    q1_row3_t: 'Test results',
    q1_row3_d:
      'Raised cholesterol, glucose or insulin resistance, when your doctor has advised changing your diet.',
    q1_row4_t: 'Energy and digestion',
    q1_row4_d: 'Fatigue, bloating and discomfort after meals.',
    q1_scope: 'If you need urgent medical care, please contact your doctor first.',
    // proposal for Sofija (2026-09-28)
    q1_refer:
      "A nutrition consultation does not replace a doctor's diagnosis and treatment. If a question is outside my competence, eating disorders for example, I will say so and suggest who to see.",
    q2_title: 'How does the first consultation work?',
    q2_step1: 'You choose a time in the calendar and get an email confirmation.',
    q2_step2:
      'If you have recent test results (biochemistry, glucose, lipids), bring them along. If not, we start with what you have.',
    q2_step3: 'In the conversation, we discuss your daily life, eating and goals.',
    q2_step4: 'You receive a personalized nutrition plan and agree on the next step.',
    // proposal for Sofija (2026-09-28)
    q2_step5:
      'Between visits you can log your meals in the patient cabinet. I see them, and at the next visit we go over what worked and what to change.',
    q3_title: 'How much does it cost?',
    q3_row1_t: 'Individual consultation',
    // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
    q3_row1_d: '60 min, with a personalized nutrition plan',
    q3_row1_v: 'from €65',
    q4_title: 'What does Sofija research?',
    about_lead:
      'In my doctoral studies I research the role of nutrition in treating and preventing diabetes.',
    about_text:
      'At the University of Latvia I work on the PRAESIDIUM project, which studies how to predict and prevent raised fasting glucose.',
    // copy pending from Sofija: faithful translation of the LV photo alt text
    about_photo_alt: 'Sofija Ivanova speaking at the EASD 2025 Congress in Vienna',
    q4_talk1_label: '2025',
    q4_talk1_text: 'EASD Congress, Vienna',
    q4_talk2_label: 'Lecture',
    q4_talk2_text:
      '"The role of nutrition in disease prevention", Health Literacy Day, P. Stradins CUH',
    q4_talk3_label: 'Stand',
    q4_talk3_text: 'Researchers’ Night',
    q5_title: 'How is this approach different?',
    // proposal for Sofija (2026-09-28)
    q5_p1:
      "I base recommendations on dietary guidelines and published research, not on trendy diets or one person's experience. Where the evidence for a claim is still thin, I say so openly.",
    plate_intro:
      'The starting point is established nutrition principles. One of the clearest is the plate model:',
    plate_heading: 'The plate principle',
    plate_aria:
      'A plate: half vegetables and fruit, a quarter whole grains, a quarter protein sources.',
    plate_veg_t: 'Vegetables and fruit',
    plate_veg_d: "More vegetables than fruit, in different colours. Potatoes don't count here.",
    plate_grain_t: 'Whole grains',
    plate_grain_d: 'Buckwheat, oats, wholegrain bread, brown rice; fewer refined grains.',
    plate_protein_t: 'Protein',
    plate_protein_d: 'Fish, legumes, poultry, eggs, nuts; less red and processed meat.',
    plate_extra: 'Alongside: plant oils, and water, tea or coffee without sugar.',
    plate_source: 'Source: Harvard T.H. Chan School of Public Health, "Healthy Eating Plate".',
    // proposal for Sofija (2026-09-28)
    plate_adapt:
      'In the consultation we adapt this model to your test results, tastes, daily rhythm and what you can realistically cook at home.',
    chart_intro:
      'One of the questions this research field works on: why the same meal acts differently in different people. An example:',
    q6_title: 'How do I book?',
    booking_noscript: 'The calendar needs JavaScript. To book, please email info@sofijaivanova.lv',

    footer_subtitle: 'Certified nutrition specialist, researcher, doctoral candidate',
    footer_terms: 'Terms of Service',
    footer_privacy: 'Privacy Policy',

    // copy pending from Sofija: faithful translation of the LV button label
    scrolltop_label: 'Back to top',

    // copy pending from Sofija: faithful translation of the LV meta title
    meta_title:
      'Certified nutrition specialist, researcher, doctoral candidate in Riga — Sofija Ivanova | Personalized Nutrition Consultations',
    // copy pending from Sofija: faithful translation of the LV meta description
    meta_description:
      'Certified nutrition specialist, researcher, doctoral candidate in Riga. Individual nutrition consultations in person and online. Personalized nutrition plan, metabolic health.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD description
    jsonld_business_description:
      'Certified nutrition specialist, researcher, doctoral candidate in Riga. Personalized nutrition consultations, metabolic health.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD offer description
    jsonld_offer_description: '60-minute personalized nutrition consultation, in person or online',
    // copy pending from Sofija: faithful translation of the LV JSON-LD job title
    jsonld_person_jobtitle: 'Certified nutrition specialist, researcher, doctoral candidate',
    // copy pending from Sofija: faithful translation of the LV JSON-LD person description
    jsonld_person_description:
      'Certified nutrition specialist, researcher, doctoral candidate (Mg.sc.sal., RSU). Research — the role of nutrition in diabetes treatment and prevention, personalized nutrition.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD website description
    jsonld_website_description:
      'Personalized nutrition consultations in Riga and online. Metabolic health, gut health.',
    // copy pending from Sofija: faithful translation of the LV JSON-LD webpage description
    jsonld_webpage_description:
      'Certified nutrition specialist, researcher, doctoral candidate in Riga. Individual nutrition consultations, metabolic health.',
    // copy pending from Sofija: faithful translation of the LV breadcrumb label
    jsonld_breadcrumb_home: 'Home',
  },
};

export function t(locale: Locale): LandingDict {
  return translations[locale];
}
