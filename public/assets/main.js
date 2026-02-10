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
      nav_testimonials: 'Atsauksmes',
      nav_contact: 'Pieteikties',
      nav_cabinet: 'Pacienta kabinets',

      // Hero
      hero_eyebrow: 'Uztura speciāliste · PhD · Rīga',
      hero_title: 'Uzturs, kas veidots tieši Jums',
      hero_subtitle:
        'Reģistrēta uztura speciāliste un PhD pētniece. Palīdzu sakārtot uzturu, uzlabot pašsajūtu un sasniegt veselības mērķus — ar individuālu, zinātniski pamatotu pieeju.',
      hero_cta_primary: 'Pieteikties konsultācijai',
      hero_cta_secondary: 'Apskatīt pakalpojumus',
      hero_credential_label: 'Uztura zinātne',

      // Trust Bar
      trust_clients: '500+ klientu',
      trust_clients_sub: 'ar uzlabotiem rādītājiem',
      trust_phd: 'PhD pētniece',
      trust_phd_sub: 'Latvijas Universitāte',
      trust_exp: '7+ gadu pieredze',
      trust_exp_sub: 'uzturzinātnē un pētniecībā',
      trust_reg: 'Reģistrēta speciāliste',
      trust_reg_sub: 'ārstniecības personu reģistrā',

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
        'Bezmaksas 15 min zvans, kurā iepazīstos ar Jūsu situāciju un mērķiem. Kopīgi izlemsim, kāds formāts Jums der vislabāk.',
      proc_2_title: 'Konsultācija un plāns',
      proc_2_desc:
        'Padziļināta 60 min konsultācija. Analizējam Jūsu uzturu, veselību un izstrādājam individuālu rīcības plānu.',
      proc_3_title: 'Rezultāts un atbalsts',
      proc_3_desc:
        'Saņemat personalizētu uztura plānu un turpinu Jūs atbalstīt ar follow-up konsultācijām, lai nodrošinātu ilgtspējīgus rezultātus.',

      // Pricing
      price_first: 'Iepazīšanās konsultācija',
      price_first_val: 'Bezmaksas',
      price_consult: 'Pilna konsultācija (60 min)',
      price_consult_val: 'no 65 €',
      price_cgm: 'CGM programma (14 dienas)',
      price_cgm_val: 'no 249 €',

      // Testimonials
      testimonials_sectionTitle: 'Atsauksmes',
      testimonials_title: 'Ko saka klienti',
      testimonial_1:
        'Gadiem mēģināju dažādas diētas — tās strādāja pāris mēnešus un beidzās. Sofijas pieeja bija pilnīgi citāda: nevis aizliegumi, bet sapratne, ko mans organisms tiešām vajag. Pēc 3 mēnešiem — 6 kg mazāk, un galvenais — saprotu, kāpēc.',
      testimonial_1_author: 'Maija, 47 gadi',
      testimonial_1_condition: 'Svara kontrole, enerģijas trūkums',
      testimonial_2:
        'Kā IT speciālists visu dzīvi ēdu haotiski un jutu hronisko nogurumu. Sofija palīdzēja saprast saistību starp uzturu un enerģiju. Tagad ir enerģija visai dienai bez kafijas maratoniem.',
      testimonial_2_author: 'Rihards, 35 gadi',
      testimonial_2_condition: 'Hronisks nogurums, haotisks uzturs',
      testimonial_3:
        'Pēc bērna piedzimšanas nekādi nevarēju atgriezties formā. Sofija izveidoja plānu, kas iekļāvās manā hektiskajā mammas dzīvē. Nav striktu ierobežojumu — tikai gudra pieeja ēdienreizēm un produktu izvēlei.',
      testimonial_3_author: 'Kristīne, 34 gadi',
      testimonial_3_condition: 'Pēcdzimdību atgūšanās',

      // About
      about_tag: 'Par mani',
      about_lead:
        'Esmu reģistrēta uztura speciāliste un PhD pētniece Latvijas Universitātē. Palīdzu cilvēkiem sakārtot uzturu, pamatojoties uz zinātni un individuālu pieeju.',
      about_text:
        'Mana pieeja apvieno akadēmiskās zināšanas un praktisku pieredzi. Katra konsultācija balstās uz pierādījumiem — ne modes diētām vai vispārīgiem padomiem. Darbā izmantoju arī modernas tehnoloģijas, piemēram, CGM glikozes sensorus, kas ļauj precīzi izprast organisma reakcijas.',
      cred_2_title: 'PhD pētniece',
      cred_2_loc: 'Latvijas Universitāte',
      cred_3_title: 'MSc Uzturzinātnē',
      cred_3_loc: 'Rīgas Stradiņa universitāte',
      clients_count: '500+ klienti',
      clients_improved: 'ar uzlabotiem rādītājiem',
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
        'Visiem, kas vēlas sakārtot uzturu zinātniski pamatotā veidā — neatkarīgi no vecuma vai mērķa. Strādāju ar svara kontroli, enerģijas problēmām, metabolo veselību, prediabētu, zarnu veselību un uztura optimizāciju.',
      faq_q2: 'Kāda ir atšķirība no parasta dietologa?',
      faq_a2:
        'Mana pieeja balstās pētniecībā un individuālos datos. Neizrakstu vispārīgas diētas — katrs ieteikums ir pielāgots tieši Jūsu situācijai. Papildus piedāvāju CGM diagnostiku, kas ir unikāla iespēja Latvijā.',
      faq_q3: 'Vai konsultācijas ir pieejamas tiešsaistē?',
      faq_a3:
        'Jā, strādāju gan klātienē Rīgā, gan tiešsaistē. Video konsultācijas ir tikpat efektīvas un pieejamas klientiem visā Latvijā un ārpus tās.',
      faq_q4: 'Cik maksā konsultācija?',
      faq_a4:
        'Pirmā iepazīšanās konsultācija (15 min) ir bezmaksas. Pilna 60 min konsultācija — no 65€. CGM programma (14 dienas) — no 249€. Konkrētu cenu noskaidrosim pirmajā sarunā.',
      faq_q5: 'Kā norit pirmā konsultācija?',
      faq_a5:
        'Sākam ar bezmaksas 15 min iepazīšanos, kurā izprotu Jūsu situāciju un mērķus. Ja izlemsim turpināt, nākamais solis ir padziļināta 60 min konsultācija ar uztura analīzi un individuāla plāna izstrādi.',

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
      footer_role: 'Sertificēta uztura speciāliste, PhD doktorante',
      footer_nav: 'Navigācija',
      footer_rights: '© 2026 Sofija Ivanova. Visas tiesības aizsargātas.',
      footer_subtitle: 'Uztura speciāliste · PhD · Reģ. Nr. 75650061277',
      header_subtitle: 'Uztura speciāliste · PhD',
    },
    ru: {
      // Navigation
      nav_services: 'Услуги',
      nav_about: 'Обо мне',
      nav_testimonials: 'Отзывы',
      nav_contact: 'Записаться',
      nav_cabinet: 'Кабинет пациента',

      // Hero
      hero_eyebrow: 'Специалист по питанию · PhD · Рига',
      hero_title: 'Питание, созданное именно для Вас',
      hero_subtitle:
        'Зарегистрированный специалист по питанию и PhD-исследователь. Помогу наладить питание, улучшить самочувствие и достичь целей здоровья — с индивидуальным, научно обоснованным подходом.',
      hero_cta_primary: 'Записаться на консультацию',
      hero_cta_secondary: 'Посмотреть услуги',
      hero_credential_label: 'Нутрициология',

      // Trust Bar
      trust_clients: '500+ клиентов',
      trust_clients_sub: 'с улучшенными показателями',
      trust_phd: 'PhD-исследователь',
      trust_phd_sub: 'Латвийский Университет',
      trust_exp: '7+ лет опыта',
      trust_exp_sub: 'в нутрициологии и исследованиях',
      trust_reg: 'Зарегистрированный специалист',
      trust_reg_sub: 'в реестре медицинских работников',

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
        'Бесплатный 15-минутный звонок, на котором узнаю Вашу ситуацию и цели. Вместе решим, какой формат подходит лучше всего.',
      proc_2_title: 'Консультация и план',
      proc_2_desc:
        'Углублённая 60-минутная консультация. Анализируем Ваше питание, здоровье и разрабатываем индивидуальный план действий.',
      proc_3_title: 'Результат и поддержка',
      proc_3_desc:
        'Получаете персонализированный план питания и продолжаю поддерживать Вас follow-up консультациями для устойчивых результатов.',

      // Pricing
      price_first: 'Ознакомительная консультация',
      price_first_val: 'Бесплатно',
      price_consult: 'Полная консультация (60 мин)',
      price_consult_val: 'от 65 €',
      price_cgm: 'CGM-программа (14 дней)',
      price_cgm_val: 'от 249 €',

      // Testimonials
      testimonials_sectionTitle: 'Отзывы',
      testimonials_title: 'Что говорят клиенты',
      testimonial_1:
        'Годами пробовала разные диеты — они работали пару месяцев и заканчивались. Подход Софии был совершенно другим: не запреты, а понимание того, что моему организму действительно нужно. Через 3 месяца — минус 6 кг, и главное — понимаю, почему.',
      testimonial_1_author: 'Майя, 47 лет',
      testimonial_1_condition: 'Контроль веса, нехватка энергии',
      testimonial_2:
        'Как IT-специалист всю жизнь ел хаотично и чувствовал хроническую усталость. София помогла понять связь между питанием и энергией. Теперь энергии хватает на весь день без кофейных марафонов.',
      testimonial_2_author: 'Рихард, 35 лет',
      testimonial_2_condition: 'Хроническая усталость, хаотичное питание',
      testimonial_3:
        'После рождения ребёнка никак не могла вернуться в форму. София составила план, который вписался в мою суматошную жизнь мамы. Никаких строгих ограничений — только умный подход к приёмам пищи и выбору продуктов.',
      testimonial_3_author: 'Кристина, 34 года',
      testimonial_3_condition: 'Послеродовое восстановление',

      // About
      about_tag: 'Обо мне',
      about_lead:
        'Я зарегистрированный специалист по питанию и PhD-исследователь в Латвийском Университете. Помогаю людям наладить питание, опираясь на науку и индивидуальный подход.',
      about_text:
        'Мой подход сочетает академические знания и практический опыт. Каждая консультация основана на доказательствах — не модных диетах или общих советах. В работе использую также современные технологии, например, CGM-сенсоры глюкозы, позволяющие точно понять реакции организма.',
      cred_2_title: 'PhD-исследователь',
      cred_2_loc: 'Латвийский Университет',
      cred_3_title: 'MSc в нутрициологии',
      cred_3_loc: 'Рижский Университет Страдиня',
      clients_count: '500+ клиентов',
      clients_improved: 'с улучшенными показателями',
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
        'Для всех, кто хочет наладить питание научно обоснованным способом — независимо от возраста или цели. Работаю с контролем веса, нехваткой энергии, метаболическим здоровьем, предиабетом, здоровьем кишечника и оптимизацией питания.',
      faq_q2: 'Чем это отличается от обычного диетолога?',
      faq_a2:
        'Мой подход основан на исследованиях и индивидуальных данных. Не назначаю общих диет — каждая рекомендация адаптирована к Вашей ситуации. Дополнительно предлагаю CGM-диагностику — уникальную возможность в Латвии.',
      faq_q3: 'Доступны ли консультации онлайн?',
      faq_a3:
        'Да, работаю как очно в Риге, так и онлайн. Видео-консультации так же эффективны и доступны клиентам по всей Латвии и за её пределами.',
      faq_q4: 'Сколько стоит консультация?',
      faq_a4:
        'Первая ознакомительная консультация (15 мин) — бесплатно. Полная 60-минутная консультация — от 65€. CGM-программа (14 дней) — от 249€. Точную стоимость обсудим на первом звонке.',
      faq_q5: 'Как проходит первая консультация?',
      faq_a5:
        'Начинаем с бесплатного 15-минутного знакомства, на котором узнаю Вашу ситуацию и цели. Если решите продолжить, следующий шаг — углублённая 60-минутная консультация с анализом питания и разработкой индивидуального плана.',

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
      footer_role: 'Сертифицированный специалист по питанию, PhD',
      footer_nav: 'Навигация',
      footer_rights: '© 2026 Sofija Ivanova. Все права защищены.',
      footer_subtitle: 'Специалист по питанию · PhD · Рег. № 75650061277',
      header_subtitle: 'Специалист по питанию · PhD',
    },
    en: {
      // Navigation
      nav_services: 'Services',
      nav_about: 'About',
      nav_testimonials: 'Testimonials',
      nav_contact: 'Contact',
      nav_cabinet: 'Patient Cabinet',

      // Hero
      hero_eyebrow: 'Nutrition Specialist · PhD · Riga',
      hero_title: 'Nutrition designed just for You',
      hero_subtitle:
        'Registered nutrition specialist and PhD researcher. I help you improve your diet, well-being, and health goals — with an individual, science-based approach.',
      hero_cta_primary: 'Book a consultation',
      hero_cta_secondary: 'View services',
      hero_credential_label: 'Nutrition Science',

      // Trust Bar
      trust_clients: '500+ clients',
      trust_clients_sub: 'with improved results',
      trust_phd: 'PhD Researcher',
      trust_phd_sub: 'University of Latvia',
      trust_exp: '7+ years of experience',
      trust_exp_sub: 'in nutrition science and research',
      trust_reg: 'Registered specialist',
      trust_reg_sub: 'in the medical practitioners registry',

      // Services
      services_tag: 'Services',
      services_title: 'How I can help You',
      services_desc:
        'Every person is unique — that\'s why my work begins with your story, not a ready-made template.',
      srv_1_title: 'Individual consultation',
      srv_1_desc:
        '60 min consultation in-person or online. We analyze your dietary habits, health status, and set goals together.',
      srv_2_title: 'Personalized meal plan',
      srv_2_desc:
        'A nutrition plan tailored to your body\'s needs, lifestyle, and food preferences. No universal diets.',
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
        'Regular check-ups and plan adjustments. I\'ll support you on the path to new, sustainable habits.',

      // How I Work
      process_tag: 'Process',
      process_title: 'How the collaboration works',
      proc_1_title: 'Getting acquainted',
      proc_1_desc:
        'Free 15 min call where I learn about your situation and goals. Together we\'ll decide which format works best for you.',
      proc_2_title: 'Consultation & plan',
      proc_2_desc:
        'In-depth 60 min consultation. We analyze your nutrition, health, and develop a personalized action plan.',
      proc_3_title: 'Results & support',
      proc_3_desc:
        'You receive a personalized nutrition plan and I continue supporting you with follow-up consultations for lasting results.',

      // Pricing
      price_first: 'Introductory consultation',
      price_first_val: 'Free',
      price_consult: 'Full consultation (60 min)',
      price_consult_val: 'from €65',
      price_cgm: 'CGM program (14 days)',
      price_cgm_val: 'from €249',

      // Testimonials
      testimonials_sectionTitle: 'Testimonials',
      testimonials_title: 'What clients say',
      testimonial_1:
        'For years I tried different diets — they worked for a couple of months and then stopped. Sofija\'s approach was completely different: not restrictions, but understanding what my body truly needs. After 3 months — 6 kg less, and most importantly — I understand why.',
      testimonial_1_author: 'Maija, 47 years',
      testimonial_1_condition: 'Weight management, lack of energy',
      testimonial_2:
        'As an IT specialist, I ate chaotically my whole life and felt chronic fatigue. Sofija helped me understand the connection between nutrition and energy. Now I have energy for the whole day without coffee marathons.',
      testimonial_2_author: 'Rihards, 35 years',
      testimonial_2_condition: 'Chronic fatigue, chaotic eating',
      testimonial_3:
        'After having a baby, I couldn\'t get back in shape. Sofija created a plan that fit into my hectic mom life. No strict restrictions — just a smart approach to meals and food choices.',
      testimonial_3_author: 'Kristīne, 34 years',
      testimonial_3_condition: 'Postpartum recovery',

      // About
      about_tag: 'About Me',
      about_lead:
        'I am a registered nutrition specialist and PhD researcher at the University of Latvia. I help people improve their diet based on science and an individual approach.',
      about_text:
        'My approach combines academic knowledge and practical experience. Every consultation is evidence-based — not trendy diets or generic advice. I also use modern technologies, such as CGM glucose sensors, which allow precise understanding of the body\'s responses.',
      cred_2_title: 'PhD Researcher',
      cred_2_loc: 'University of Latvia',
      cred_3_title: 'MSc in Nutrition Science',
      cred_3_loc: 'Rīga Stradiņš University',
      clients_count: '500+ clients',
      clients_improved: 'with improved results',
      reg_number_label: 'Registration No.',

      // Science Gallery
      science_title: 'Scientific Activity',
      science_subtitle:
        'Actively participating in international conferences and science outreach events',
      gallery_1_tag: 'International',
      gallery_1_title: 'EASD 2025, Vienna',
      gallery_1_desc: 'European Association for the Study of Diabetes Congress',
      gallery_2_tag: 'Education',
      gallery_2_title: 'Researchers\' Night',
      gallery_2_desc: 'Annual science outreach event in Latvia',
      gallery_3_tag: 'Clinical',
      gallery_3_title: 'Health Literacy Day',
      gallery_3_desc: 'Pauls Stradiņš Clinical University Hospital',

      // FAQ
      faq_tag: 'Frequently Asked Questions',
      faq_title: 'What to know before booking',
      faq_q1: 'Who are the consultations for?',
      faq_a1:
        'For anyone who wants to improve their nutrition in a science-based way — regardless of age or goal. I work with weight management, energy issues, metabolic health, prediabetes, gut health, and nutrition optimization.',
      faq_q2: 'How is this different from a regular dietitian?',
      faq_a2:
        'My approach is based on research and individual data. I don\'t prescribe generic diets — every recommendation is tailored to your situation. Additionally, I offer CGM diagnostics — a unique opportunity in Latvia.',
      faq_q3: 'Are online consultations available?',
      faq_a3:
        'Yes, I work both in-person in Riga and online. Video consultations are equally effective and available to clients across Latvia and beyond.',
      faq_q4: 'How much does a consultation cost?',
      faq_a4:
        'The first introductory consultation (15 min) is free. A full 60 min consultation — from €65. CGM program (14 days) — from €249. We\'ll discuss the exact price during the first call.',
      faq_q5: 'How does the first consultation go?',
      faq_a5:
        'We start with a free 15-minute introduction where I learn about your situation and goals. If you decide to continue, the next step is an in-depth 60-minute consultation with nutrition analysis and individual plan development.',

      // Booking
      contact_tag: 'Contact',
      booking_eyebrow: 'Personal Consultation',
      booking_badge: 'Personalized Care',
      booking_title: 'Book a Consultation',
      booking_subtitle:
        'Choose a convenient date and time. Availability is updated in real time.',
      booking_trust_compact_1: 'Confidential',
      booking_trust_compact_2: 'In-person or online',
      booking_trust_compact_3: 'Reply within 24h',
      booking_note: 'You will receive an email confirmation after booking.',

      // Footer
      footer_role: 'Certified Nutritionist, PhD Student',
      footer_nav: 'Navigation',
      footer_rights: '© 2026 Sofija Ivanova. All rights reserved.',
      footer_subtitle: 'Nutrition Specialist · PhD · Reg. No. 75650061277',
      header_subtitle: 'Nutrition Specialist · PhD',
    },
  };

  // Booking Calendar Instance
  let bookingCalendar = null;

  function updateLanguage(lang) {
    currentLang = lang;

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

  // Initialize language (without updating calendar - it initializes itself with 'lv')
  currentLang = 'lv';
  langButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === 'lv');
  });

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
  }
});
