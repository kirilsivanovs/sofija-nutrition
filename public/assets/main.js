document.addEventListener('DOMContentLoaded', () => {
  // Language Handling
  const langButtons = document.querySelectorAll('.lang-btn');
  const translatableElements = document.querySelectorAll('[data-i18n]');
  let currentLang = 'lv';

  const translations = {
    lv: {
      // Navigation
      nav_services: 'Pakalpojumi',
      nav_about: 'Par mani',
      nav_faq: 'BUJ',
      nav_contact: 'Pieteikties',
      nav_cabinet: 'Pacienta kabinets',

      // Hero
      hero_eyebrow: 'Rīga · Individuālas konsultācijas',
      hero_title: 'Veselība sākas ar uzturu',
      hero_subtitle:
        'Palīdzu sakārtot uzturu, balstoties uz zinātni — individuāli, bez vispārīgām diētām.',
      hero_cta_primary: 'Rezervēt konsultāciju',
      hero_cta_secondary: 'Pakalpojumi',
      hero_credential_degree: 'Klātienē un tiešsaistē',
      hero_credential_label: 'Rīga',

      // Trust Bar
      trust_msc: 'MSc Dietoloģijā',
      trust_msc_sub: 'Rīgas Stradiņa universitāte (RSU)',
      trust_phd: 'Doktorante',
      trust_phd_sub: 'Latvijas Universitāte (LU)',
      trust_reg: 'Reģistrēta speciāliste',
      trust_reg_sub: 'ārstniecības personu reģistrs',

      // Services
      services_tag: 'Pakalpojumi',
      services_title: 'Kā es varu Jums palīdzēt',
      services_desc:
        'Katrs cilvēks ir unikāls — tāpēc mans darbs sākas ar Jūsu stāstu, nevis gatavu shēmu.',
      srv_1_title: 'Individuāla konsultācija',
      srv_1_desc:
        '60 min konsultācija klātienē vai tiešsaistē. Analizējam uztura ieradumus, veselības stāvokli un kopīgi nosakām mērķus.',
      srv_2_title: 'Personalizēts uztura plāns',
      srv_2_desc:
        'Uztura plāns, kas pielāgots Jūsu ķermeņa vajadzībām, dzīvesstilam un ēdiena preferencēm. Nav universālu diētu.',
      srv_3_title: 'Metabolā veselība',
      srv_3_desc:
        'Palīdzība ar insulīna rezistenci, prediabētu, svara kontroli un enerģijas līmeņa optimizāciju. Zinātniski pamatota pieeja.',
      srv_4_tag: 'Unikāla iespēja',
      srv_4_title: 'CGM diagnostika',
      srv_4_desc:
        '14 dienu glikozes monitorēšana ar sensoru. Precīzi dati par to, kā Jūsu organisms reaģē uz katru ēdienu. Pieejams kā papildus iespēja.',
      srv_5_title: 'Zarnu veselība',
      srv_5_desc:
        'Uztura optimizācija, kas veicina zarnu trakta veselību un stiprina imūnsistēmu. Mikrobioma atbalsts ar uzturu.',
      srv_6_title: 'Ilgtermiņa atbalsts',
      srv_6_desc:
        'Regulāras pārbaudes un plāna korekcijas. Pavadīšu Jūs ceļā uz jauniem, ilgtspējīgiem paradumiem.',

      // How I Work
      process_tag: 'Process',
      process_title: 'Kā norit sadarbība',
      proc_1_title: 'Iepazīšanās',
      proc_1_desc:
        'Īss saraksīts telefona zvans, kurā iepazīstos ar Jūsu situāciju un mērķiem. Kopīgi izlemsim, kāds formāts Jums der vislabāk.',
      proc_2_title: 'Konsultācija un plāns',
      proc_2_desc:
        'Padziļināta 60 min konsultācija. Analizējam Jūsu uzturu, veselību un izstrādājam individuālu rīcības plānu.',
      proc_3_title: 'Rezultāts un atbalsts',
      proc_3_desc:
        'Saņemat personalizētu uztura plānu un turpinu Jūs atbalstīt ar follow-up konsultācijām, lai nodrošinātu ilgtspējīgus rezultātus.',

      // Pricing
      price_consult: 'Konsultācija (60 min)',
      price_consult_val: 'no 65 €',
      price_cgm: 'CGM programma (14 dienas)',
      price_cgm_val: 'no 249 €',

      // About
      about_tag: 'Par mani',
      about_lead:
        'Palīdzu cilvēkiem sakārtot uzturu, balstoties uz zinātni un personalizētu pieeju. Aktīvi piedalos pētniecības projektos un praksē izmantoju pierādījumos balstītas metodes.',
      about_text:
        'Mana pieeja apvieno akadēmiskās zināšanas un praktisku pieredzi. Katra konsultācija balstās uz pierādījumiem — ne modes diētām vai vispārīgiem padomiem. Darbā izmantoju arī modernas tehnoloģijas, piemēram, CGM glikozes sensorus, kas ļauj precīzi izprast organisma reakcijas.',
      cred_2_title: 'Doktorante',
      cred_2_loc: 'Latvijas Universitāte',
      cred_3_title: 'MSc Dietoloģijā',
      cred_3_loc: 'Rīgas Stradiņa universitāte',
      clients_count: 'EASD 2025, Vīne',
      clients_improved: 'starptautiska konference',
      about_conf_title: 'EASD 2025, Vīne',
      about_conf_sub: 'starptautiska konference',
      reg_number_label: 'Reģistrācijas Nr.',

      // Science Gallery
      science_title: 'Zinātniskā darbība',
      science_subtitle:
        'Aktīvi piedalos starptautiskās konferencēs un zinātnes popularizēšanas pasākumos',
      gallery_1_tag: 'Starptautisks',
      gallery_1_title: 'EASD 2025, Vīne',
      gallery_1_desc: 'Eiropas Diabēta pētījumu asociācijas kongress',
      gallery_2_tag: 'Izglītība',
      gallery_2_title: 'Zinātnieku nakts',
      gallery_2_desc: 'Ikgadējais zinātnes popularizēšanas pasākums Latvijā',
      gallery_3_tag: 'Klīniskais',
      gallery_3_title: 'Veselībpratības diena',
      gallery_3_desc: 'Paula Stradiņa Klīniskā universitātes slimnīca',

      // FAQ
      faq_tag: 'Biežāk uzdotie jautājumi',
      faq_title: 'Kas jāzina pirms pieteikšanās',
      faq_q1: 'Kam ir domātas konsultācijas?',
      faq_a1:
        'Visiem, kas vēlas sakārtot uzturu zinātniski pamatotā veidā — neatkarīgi no vecuma vai mērķa. Strādāju ar svara kontroli, enerģijas līmeni, metabolo veselību, prediabētu un zarnu veselību.',
      faq_q2: 'Kāda ir atšķirība no parasta dietologa?',
      faq_a2:
        'Mana pieeja balstās pētniecībā un individuālos datos. Neizrakstu vispārīgas diētas — katrs ieteikums ir pielāgots tieši Jūsu situācijai. Papildus piedāvāju CGM diagnostiku.',
      faq_q3: 'Vai konsultācijas ir pieejamas tiešsaistē?',
      faq_a3:
        'Jā, strādāju gan klātienē Rīgā, gan tiešsaistē. Video konsultācijas ir tikpat efektīvas un pieejamas klientiem Latvijā un ārpus tās.',
      faq_q4: 'Cik ātri var sagaidīt rezultātus?',
      faq_a4:
        'Pirmās pozitīvās izmaiņas (enerģija, miegs, pašsajūta) parasti jūtamas 2–3 nedēļu laikā. Ilgtspējīgi svara un veselības rezultāti — 2–4 mēnešos. Follow-up konsultācijas palīdz noturēt progresu ilgtermiņā.',
      faq_q5: 'Kas ir CGM sensors un kam tas noderēs?',
      faq_a5:
        'CGM (nepārtrauktās glikozes monitorēšanas) sensors ir neliela ierīce uz ādas, kas 14 dienas mēra cukura līmeni reāllaikā. Tas parāda, kā Jūsu organisms reaģē uz ēdienu, stresu un miegu. Uztura konsultāciju ietvaros tā ir iespēja iegūt precīzus, personalizētus datus.',

      // Why Choose Me
      why_tag: 'Kāpēc izvēlēties mani',
      why_title: 'Zinātne, nevis modes diētas',
      why_desc: 'Mana pieeja balstās pētniecībā un individuālos datos.',

      // Booking extra
      booking_flexibility:
        'Pieteikšanās iespējama arī ārpus darba laika. Konsultācijas pieejamas klātienē Rīgā un tiešsaistē.',

      // Footer extra
      footer_contact_title: 'Kontakti',
      footer_follow_title: 'Sekojiet',
      footer_privacy: 'Privātuma politika',
      // Booking
      contact_tag: 'Kontakti',
      booking_eyebrow: 'Individuāla konsultācija',
      booking_badge: 'Personiska pieeja',
      booking_title: 'Rezervējiet konsultāciju',
      booking_subtitle:
        'Izvēlieties sev ērtu datumu un laiku. Pieejamība tiek atjaunināta reāllaikā.',
      booking_trust_compact_1: 'Konfidenciāli',
      booking_trust_compact_2: 'Klātienē vai online',
      booking_trust_compact_3: 'Atbilde 24h',
      booking_note: 'Pēc rezervācijas saņemsiet apstiprinājumu e-pastā.',

      // Footer
      footer_role: 'Uztura konsultācijas ar zinātnisku pieeju',
      footer_nav: 'Navigācija',
      footer_rights: '© 2026 Sofija Ivanova. Visas tiesības aizsargātas.',
      footer_subtitle: 'Rīga · Reģ. Nr. 75650061277',
      header_subtitle: 'Rīga · Zinātniska pieeja',
    },
    ru: {
      // Navigation
      nav_services: 'Услуги',
      nav_about: 'Обо мне',
      nav_faq: 'ЧЗВ',
      nav_contact: 'Записаться',
      nav_cabinet: 'Кабинет пациента',

      // Hero
      hero_eyebrow: 'Рига · Индивидуальные консультации',
      hero_title: 'Здоровье начинается с питания',
      hero_subtitle: 'Помогу наладить питание, опираясь на науку — индивидуально, без общих диет.',
      hero_cta_primary: 'Записаться',
      hero_cta_secondary: 'Услуги',
      hero_credential_degree: 'Очно и онлайн',
      hero_credential_label: 'Рига',

      // Trust Bar
      trust_msc: 'MSc Диетология',
      trust_msc_sub: 'Рижский университет Страдиня (RSU)',
      trust_phd: 'Докторант',
      trust_phd_sub: 'Латвийский университет (LU)',
      trust_reg: 'Зарегистрированный специалист',
      trust_reg_sub: 'реестр медработников',

      // Services
      services_tag: 'Услуги',
      services_title: 'Как я могу Вам помочь',
      services_desc:
        'Каждый человек уникален — поэтому моя работа начинается с Вашей истории, а не с готовой схемы.',
      srv_1_title: 'Индивидуальная консультация',
      srv_1_desc:
        '60 мин консультация очно или онлайн. Анализируем пищевые привычки, состояние здоровья и совместно определяем цели.',
      srv_2_title: 'Персонализированный план питания',
      srv_2_desc:
        'План питания, адаптированный к потребностям Вашего тела, образу жизни и пищевым предпочтениям. Никаких универсальных диет.',
      srv_3_title: 'Метаболическое здоровье',
      srv_3_desc:
        'Помощь при инсулинорезистентности, предиабете, контроле веса и оптимизации уровня энергии. Научно обоснованный подход.',
      srv_4_tag: 'Уникальная возможность',
      srv_4_title: 'CGM-диагностика',
      srv_4_desc:
        '14-дневный мониторинг глюкозы с помощью сенсора. Точные данные о том, как Ваш организм реагирует на каждый продукт. Доступно как дополнительная опция.',
      srv_5_title: 'Здоровье кишечника',
      srv_5_desc:
        'Оптимизация питания для здоровья желудочно-кишечного тракта и укрепления иммунитета. Поддержка микробиома через питание.',
      srv_6_title: 'Долгосрочная поддержка',
      srv_6_desc:
        'Регулярные проверки и корректировки плана. Буду сопровождать Вас на пути к новым, устойчивым привычкам.',

      // How I Work
      process_tag: 'Процесс',
      process_title: 'Как проходит сотрудничество',
      proc_1_title: 'Знакомство',
      proc_1_desc:
        'Короткий предварительный звонок, на котором узнаю Вашу ситуацию и цели. Вместе решим, какой формат подходит лучше всего.',
      proc_2_title: 'Консультация и план',
      proc_2_desc:
        'Углублённая 60-минутная консультация. Анализируем Ваше питание, здоровье и разрабатываем индивидуальный план действий.',
      proc_3_title: 'Результат и поддержка',
      proc_3_desc:
        'Получаете персонализированный план питания и продолжаю поддерживать Вас follow-up консультациями для устойчивых результатов.',

      // Pricing
      price_consult: 'Консультация (60 мин)',
      price_consult_val: 'от 65 €',
      price_cgm: 'CGM-программа (14 дней)',
      price_cgm_val: 'от 249 €',

      // About
      about_tag: 'Обо мне',
      about_lead:
        'Помогаю людям наладить питание на основе науки и персонализированного подхода. Активно участвую в исследовательских проектах и применяю доказательные методы в практике.',
      about_text:
        'Мой подход сочетает академические знания и практический опыт. Каждая консультация основана на доказательствах — не модных диетах или общих советах. В работе использую также современные технологии, например, CGM-сенсоры глюкозы, позволяющие точно понять реакции организма.',
      cred_2_title: 'Докторант',
      cred_2_loc: 'Латвийский Университет',
      cred_3_title: 'MSc в диетологии',
      cred_3_loc: 'Рижский Университет Страдиня',
      clients_count: 'EASD 2025, Вена',
      clients_improved: 'международная конференция',
      about_conf_title: 'EASD 2025, Вена',
      about_conf_sub: 'международная конференция',
      reg_number_label: 'Рег. номер',

      // Science Gallery
      science_title: 'Научная деятельность',
      science_subtitle:
        'Активно участвую в международных конференциях и мероприятиях по популяризации науки',
      gallery_1_tag: 'Международный',
      gallery_1_title: 'EASD 2025, Вена',
      gallery_1_desc: 'Конгресс Европейской ассоциации исследований диабета',
      gallery_2_tag: 'Образование',
      gallery_2_title: 'Ночь учёных',
      gallery_2_desc: 'Ежегодное мероприятие по популяризации науки в Латвии',
      gallery_3_tag: 'Клинический',
      gallery_3_title: 'День здоровой грамотности',
      gallery_3_desc: 'Клиническая университетская больница Паулса Страдиня',

      // FAQ
      faq_tag: 'Часто задаваемые вопросы',
      faq_title: 'Что нужно знать перед записью',
      faq_q1: 'Для кого предназначены консультации?',
      faq_a1:
        'Для всех, кто хочет наладить питание научно обоснованным способом — независимо от возраста или цели. Работаю с контролем веса, уровнем энергии, метаболическим здоровьем, предиабетом и здоровьем кишечника.',
      faq_q2: 'Чем это отличается от обычного диетолога?',
      faq_a2:
        'Мой подход основан на исследованиях и индивидуальных данных. Не назначаю общих диет — каждая рекомендация адаптирована к Вашей ситуации. Дополнительно предлагаю CGM-диагностику.',
      faq_q3: 'Доступны ли консультации онлайн?',
      faq_a3:
        'Да, работаю как очно в Риге, так и онлайн. Видео-консультации так же эффективны и доступны клиентам в Латвии и за её пределами.',
      faq_q4: 'Как быстро можно ожидать результатов?',
      faq_a4:
        'Первые положительные изменения (энергия, сон, самочувствие) обычно ощущаются через 2–3 недели. Устойчивые результаты по весу и здоровью — через 2–4 месяца. Follow-up консультации помогают закрепить прогресс надолго.',
      faq_q5: 'Что такое CGM-сенсор и кому он полезен?',
      faq_a5:
        'CGM (непрерывный мониторинг глюкозы) — небольшое устройство на коже, которое 14 дней измеряет уровень сахара в реальном времени. Оно показывает, как Ваш организм реагирует на еду, стресс и сон. В рамках консультации это даёт точные персонализированные данные.',

      // Booking extra
      booking_flexibility:
        'Запись возможна и вне рабочего времени. Консультации доступны очно в Риге и онлайн.',

      // Footer extra
      footer_contact_title: 'Контакты',
      footer_follow_title: 'Подписывайтесь',
      footer_privacy: 'Политика конфиденциальности',
      // Booking
      contact_tag: 'Контакты',
      booking_eyebrow: 'Индивидуальная консультация',
      booking_badge: 'Персональный подход',
      booking_title: 'Запишитесь на консультацию',
      booking_subtitle:
        'Выберите удобную дату и время. Доступность обновляется в реальном времени.',
      booking_trust_compact_1: 'Конфиденциально',
      booking_trust_compact_2: 'Очно или онлайн',
      booking_trust_compact_3: 'Ответ за 24ч',
      booking_note: 'После записи вы получите подтверждение по email.',

      // Footer
      footer_role: 'Консультации по питанию с научным подходом',
      footer_nav: 'Навигация',
      footer_rights: '© 2026 Sofija Ivanova. Все права защищены.',
      footer_subtitle: 'Рига · Рег. № 75650061277',
      header_subtitle: 'Рига · Научный подход',
    },
    en: {
      // Navigation
      nav_services: 'Services',
      nav_about: 'About',
      nav_faq: 'FAQ',
      nav_contact: 'Contact',
      nav_cabinet: 'Patient Cabinet',

      // Hero
      hero_eyebrow: 'Riga · Individual consultations',
      hero_title: 'Health starts with nutrition',
      hero_subtitle:
        'I help improve your diet based on science — individually, without generic diets.',
      hero_cta_primary: 'Book consultation',
      hero_cta_secondary: 'Services',
      hero_credential_degree: 'In-person & online',
      hero_credential_label: 'Riga',

      // Trust Bar
      trust_msc: 'MSc Dietetics',
      trust_msc_sub: 'Rīga Stradiņš University (RSU)',
      trust_phd: 'Doctoral Student',
      trust_phd_sub: 'University of Latvia (UL)',
      trust_reg: 'Registered specialist',
      trust_reg_sub: 'medical practitioners registry',

      // Services
      services_tag: 'Services',
      services_title: 'How I can help You',
      services_desc:
        "Every person is unique — that's why my work begins with your story, not a ready-made template.",
      srv_1_title: 'Individual consultation',
      srv_1_desc:
        '60 min consultation in-person or online. We analyze your dietary habits, health status, and set goals together.',
      srv_2_title: 'Personalized meal plan',
      srv_2_desc:
        "A nutrition plan tailored to your body's needs, lifestyle, and food preferences. No universal diets.",
      srv_3_title: 'Metabolic health',
      srv_3_desc:
        'Help with insulin resistance, prediabetes, weight management, and energy optimization. Science-based approach.',
      srv_4_tag: 'Unique opportunity',
      srv_4_title: 'CGM diagnostics',
      srv_4_desc:
        '14-day glucose monitoring with a sensor. Precise data on how your body responds to each food. Available as an add-on option.',
      srv_5_title: 'Gut health',
      srv_5_desc:
        'Nutrition optimization for gut health and immune system support. Microbiome support through diet.',
      srv_6_title: 'Long-term support',
      srv_6_desc:
        "Regular check-ups and plan adjustments. I'll support you on the path to new, sustainable habits.",

      // How I Work
      process_tag: 'Process',
      process_title: 'How the collaboration works',
      proc_1_title: 'Getting acquainted',
      proc_1_desc:
        "A brief introductory call where I learn about your situation and goals. Together we'll decide which format works best for you.",
      proc_2_title: 'Consultation & plan',
      proc_2_desc:
        'In-depth 60 min consultation. We analyze your nutrition, health, and develop a personalized action plan.',
      proc_3_title: 'Results & support',
      proc_3_desc:
        'You receive a personalized nutrition plan and I continue supporting you with follow-up consultations for lasting results.',

      // Pricing
      price_consult: 'Consultation (60 min)',
      price_consult_val: 'from €65',
      price_cgm: 'CGM program (14 days)',
      price_cgm_val: 'from €249',

      // About
      about_tag: 'About Me',
      about_lead:
        'I help people improve nutrition through a science-based and personalized approach. I actively participate in research projects and apply evidence-based methods in practice.',
      about_text:
        "My approach combines academic knowledge and practical experience. Every consultation is evidence-based — not trendy diets or generic advice. I also use modern technologies, such as CGM glucose sensors, which allow precise understanding of the body's responses.",
      cred_2_title: 'Doctoral Student',
      cred_2_loc: 'University of Latvia',
      cred_3_title: 'MSc in Dietetics',
      cred_3_loc: 'Rīga Stradiņš University',
      clients_count: 'EASD 2025, Vienna',
      clients_improved: 'international conference',
      about_conf_title: 'EASD 2025, Vienna',
      about_conf_sub: 'international conference',
      reg_number_label: 'Registration No.',

      // Science Gallery
      science_title: 'Scientific Activity',
      science_subtitle:
        'Actively participating in international conferences and science outreach events',
      gallery_1_tag: 'International',
      gallery_1_title: 'EASD 2025, Vienna',
      gallery_1_desc: 'European Association for the Study of Diabetes Congress',
      gallery_2_tag: 'Education',
      gallery_2_title: "Researchers' Night",
      gallery_2_desc: 'Annual science outreach event in Latvia',
      gallery_3_tag: 'Clinical',
      gallery_3_title: 'Health Literacy Day',
      gallery_3_desc: 'Pauls Stradiņš Clinical University Hospital',

      // FAQ
      faq_tag: 'Frequently Asked Questions',
      faq_title: 'What to know before booking',
      faq_q1: 'Who are the consultations for?',
      faq_a1:
        'For anyone who wants to improve nutrition in a science-based way — regardless of age or goal. I work with weight management, energy levels, metabolic health, prediabetes, and gut health.',
      faq_q2: 'How is this different from a regular dietitian?',
      faq_a2:
        "My approach is based on research and individual data. I don't prescribe generic diets — every recommendation is tailored to your situation. I also offer CGM diagnostics.",
      faq_q3: 'Are online consultations available?',
      faq_a3:
        'Yes, I work both in-person in Riga and online. Video consultations are equally effective and available in Latvia and abroad.',
      faq_q4: 'How quickly can I expect results?',
      faq_a4:
        'First positive changes (energy, sleep, well-being) are usually felt within 2–3 weeks. Sustainable weight and health results — in 2–4 months. Follow-up consultations help maintain long-term progress.',
      faq_q5: 'What is a CGM sensor and who is it useful for?',
      faq_a5:
        'CGM (continuous glucose monitoring) is a small skin-worn device that measures blood sugar in real time for 14 days. It shows how your body responds to food, stress, and sleep. Within consultations, it provides precise personalized data.',

      // Booking extra
      booking_flexibility:
        'Booking available outside working hours as well. Consultations available in-person in Riga and online.',

      // Footer extra
      footer_contact_title: 'Contact',
      footer_follow_title: 'Follow',
      footer_privacy: 'Privacy Policy',
      // Booking
      contact_tag: 'Contact',
      booking_eyebrow: 'Personal Consultation',
      booking_badge: 'Personalized Care',
      booking_title: 'Book a Consultation',
      booking_subtitle: 'Choose a convenient date and time. Availability is updated in real time.',
      booking_trust_compact_1: 'Confidential',
      booking_trust_compact_2: 'In-person or online',
      booking_trust_compact_3: 'Reply within 24h',
      booking_note: 'You will receive an email confirmation after booking.',

      // Footer
      footer_role: 'Evidence-based nutrition consultations',
      footer_nav: 'Navigation',
      footer_rights: '© 2026 Sofija Ivanova. All rights reserved.',
      footer_subtitle: 'Riga · Reg. No. 75650061277',
      header_subtitle: 'Riga · Evidence-based approach',
    },
  };

  // Booking Calendar Instance
  let bookingCalendar = null;

  function updateLanguage(lang) {
    currentLang = lang;
    try { localStorage.setItem('preferredLang', lang); } catch (e) { /* private browsing */ }

    // Update Buttons
    langButtons.forEach((btn) => {
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Text
    translatableElements.forEach((el) => {
      const key = el.dataset.i18n;
      if (translations[lang] && translations[lang][key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translations[lang][key];
        } else {
          el.innerHTML = translations[lang][key];
        }
      }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update Booking Calendar language
    if (bookingCalendar) {
      bookingCalendar.setLanguage(lang);
    }
  }

  // Event Listeners
  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      updateLanguage(btn.dataset.lang);
    });
  });

  // Initialize Booking Calendar
  if (typeof BookingCalendar !== 'undefined' && document.getElementById('bookingCalendar')) {
    bookingCalendar = new BookingCalendar('bookingCalendar', {
      lang: 'lv',
      onBookingComplete: (booking) => {
        // Could add analytics tracking here
      },
    });
  }

  // Initialize language from localStorage or default to 'lv'
  const savedLang = (() => { try { return localStorage.getItem('preferredLang'); } catch (e) { return null; } })();
  const initLang = ['lv', 'ru', 'en'].includes(savedLang) ? savedLang : 'lv';
  if (initLang !== 'lv') {
    updateLanguage(initLang);
  } else {
    currentLang = 'lv';
    langButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === 'lv');
    });
  }

  // Mobile menu is handled by inline script in index.astro
  // Only add close-on-link-click and close-on-overlay here (safe to double-attach)
  const mobileNavMenu = document.querySelector('.mobile-nav-menu');
  const mobileNavAnchors = document.querySelectorAll('.mobile-nav-menu a');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

  function closeMobileMenu() {
    if (!mobileMenuBtn || !mobileNavMenu) return;
    mobileMenuBtn.classList.remove('active');
    mobileNavMenu.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }

  // Focus trap for mobile menu (accessibility)
  function handleMenuKeydown(e) {
    if (!mobileNavMenu?.classList.contains('open')) return;

    if (e.key === 'Escape') {
      closeMobileMenu();
      mobileMenuBtn?.focus();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = mobileNavMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (mobileNavMenu) {
    // Close menu when clicking a link
    mobileNavAnchors.forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Close menu when clicking outside (on the overlay)
    mobileNavMenu.addEventListener('click', (e) => {
      if (e.target === mobileNavMenu) {
        closeMobileMenu();
      }
    });

    // Focus trap
    document.addEventListener('keydown', handleMenuKeydown);
  }
});
