document.addEventListener('DOMContentLoaded', () => {
  // Language Handling
  const langButtons = document.querySelectorAll('.lang-btn');
  const translatableElements = document.querySelectorAll('[data-i18n]');
  let currentLang = 'lv';

  const translations = {
    lv: {
      // Navigation
      header_specialty: 'uztura speciāliste, Rīga',
      nav_services: 'Konsultācija',
      nav_about: 'Par mani',
      nav_price: 'Cenas',
      nav_contact: 'Pieteikties',
      nav_cabinet: 'Pacienta kabinets',

      // Hero (chart hero, SN-015.1)
      hero_title: 'Vienas un tās pašas brokastis. <strong>Divas dažādas glikozes līknes.</strong>',
      hero_lead:
        'Tāpēc es nesāku ar gatavu ēdienkarti. Pirmajā konsultācijā apskatām Jūsu analīzes, ikdienu un ēšanas paradumus, un plānu veidojam no tiem.',
      hero_cta: 'Pieteikties konsultācijai',
      hero_fact: '60 minūtes, klātienē Rīgā vai tiešsaistē',
      hero_chart_heading: 'Glikoze pēc brokastīm, 07:00–11:00',
      hero_legend_a: 'Cilvēks A',
      hero_legend_b: 'Cilvēks B',
      hero_readout_time: 'Laiks',
      hero_readout_a: 'Cilvēks A',
      hero_readout_b: 'Cilvēks B',
      // copy pending from Sofija: 7.8 caption wording
      hero_chart_caption:
        'Ilustratīvi, sintētiski dati, nevis pacientu mērījumi. Diapazons 3,9–7,8 mmol/L.',

      // For Whom
      whom_title: 'Konsultācija ir piemērota, ja Jūs',
      whom_1: 'Esat izmēģinājuši vairākas diētas, bet nekas nav palīdzējis ilgtermiņā',
      whom_2: 'Vēlaties kontrolēt svaru bez striktu ierobežojumu',
      whom_3: 'Jūtat hronisko nogurumu un enerģijas trūkumu',
      whom_4: 'Jums ir prediabēts, insulīna rezistence vai paaugstināts cukurs',
      whom_5: 'Vēlaties uzlabot gremošanu un zarnu veselību',
      whom_6: 'Meklējat speciālistu, kas balstās uz zinātni, nevis modes tendencēm',
      whom_cta: 'Pieteikties konsultācijai',

      // Pricing
      price_consult: 'Konsultācija (60 min)',
      price_consult_val: 'no 65 €',

      // Six-question body (SN-015.2)
      qindex_title: 'Jautājumi šajā lapā',
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
      q3_row3_t: 'Ilgtermiņa pakete',
      q3_row3_d: 'vairākas vizītes par izdevīgāku cenu',
      // prices genuinely pending Sofija, don't invent numbers
      q3_pending: 'cenu precizē Sofija',
      q4_title: 'Kas ir Sofija Ivanova?',
      q4_talk1: '<span>2025</span>EASD kongress, Vīne',
      q4_talk2:
        '<span>Lekcija</span>„Uztura loma slimību profilaksē”, Veselībpratības diena, P. Stradiņa KUS',
      q4_talk3: '<span>Stends</span>Zinātnieku nakts',
      // title wording ("sertificēta dietoloģe" vs "uztura speciāliste") pending Sofija
      q4_cred:
        'Mg.sc.sal., Rīgas Stradiņa universitāte · Doktorantūra, Latvijas Universitāte · Ārstniecības personu reģistrs Nr. 75650061277',
      q5_title: 'Ar ko šī pieeja atšķiras?',
      q5_p1:
        'Mana pieeja balstās pētniecībā un individuālos datos. Neizrakstu vispārīgas diētas: katrs ieteikums ir pielāgots tieši Jūsu situācijai, analīzēm un ikdienai.',
      q5_p2:
        'Grafiks lapas augšā parāda iemeslu: viens un tas pats ēdiens dažādiem cilvēkiem iedarbojas atšķirīgi.',
      q6_title: 'Kā pieteikties?',

      // About
      about_lead:
        'Palīdzu cilvēkiem sakārtot uzturu, balstoties uz zinātni un personalizētu pieeju. Aktīvi piedalos pētniecības projektos un praksē izmantoju pierādījumos balstītas metodes.',
      about_text:
        'Mana pieeja apvieno akadēmiskās zināšanas un praktisku pieredzi. Katra konsultācija balstās uz pierādījumiem \u2014 ne modes diētām vai vispārīgiem padomiem. Pētniecībā fokusējos uz uztura lomu diabēta ārstēšanā un profilaksē.',
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
      faq_q5: 'Cik maksā konsultācija?',
      faq_a5:
        'Individuālā konsultācija (60 min) — no 65 €. Cena ietver pilnu uztura analīzi, personalizētu plānu un rekomendācijas. Atkārtota vizīte un ilgtermiņa paketes pieejamas par izdevīgākām cenām.',
      faq_q6: 'Kā sagatavoties pirmajai konsultācijai?',
      faq_a6:
        'Nekāda īpaša sagatavošanās nav nepieciešama. Ja Jums ir nesenas analīzes (asins bioķīmija, cukurs, lipīdi) — paņemiet līdzi. Ja nav — sāksim ar to, kas ir pieejams, un visu pārējo izplānosim kopā.',

      // Why Choose Me
      why_tag: 'Kāpēc izvēlēties mani',
      why_title: 'Zinātne, nevis modes diētas',
      why_desc: 'Mana pieeja balstās pētniecībā un individuālos datos.',

      // Footer extra
      footer_terms: 'Pakalpojumu noteikumi',
      footer_privacy: 'Privātuma politika',
      footer_cookie_settings: 'Sīkdatņu iestatījumi',
      nav_cabinet: 'Pacienta kabinets',
      // Booking
      contact_tag: 'Kontakti',
      booking_eyebrow: 'Individuāla konsultācija',
      booking_badge: 'Personiska pieeja',
      booking_noscript:
        'Kalendāram nepieciešams JavaScript. Lūdzu, pieteikšanās rakstiet uz info@sofijaivanova.lv',

      // Footer
      footer_role: 'Uztura konsultācijas ar zinātnisku pieeju',
      footer_nav: 'Navigācija',
      footer_rights: '© 2026 Sofija Ivanova. Visas tiesības aizsargātas.',
      footer_subtitle: 'uztura speciāliste, Rīga',
      header_subtitle: 'Rīga · Zinātniska pieeja',
    },
    ru: {
      // Navigation
      // proposed copy, pending Sofija's confirmation
      header_specialty: 'специалист по питанию, Рига',
      nav_services: 'Консультация',
      nav_about: 'Обо мне',
      nav_price: 'Цены',
      nav_contact: 'Записаться',
      nav_cabinet: 'Кабинет пациента',

      // Hero (chart hero, SN-015.1)
      hero_title: 'Один и тот же завтрак. <strong>Две разные кривые глюкозы.</strong>',
      hero_lead:
        'Поэтому я не начинаю с готового меню. На первой консультации мы смотрим Ваши анализы, повседневные привычки и питание, и уже на их основе строим план.',
      hero_cta: 'Записаться на консультацию',
      hero_fact: '60 минут, очно в Риге или онлайн',
      hero_chart_heading: 'Глюкоза после завтрака, 07:00–11:00',
      hero_legend_a: 'Человек A',
      hero_legend_b: 'Человек B',
      hero_readout_time: 'Время',
      hero_readout_a: 'Человек A',
      hero_readout_b: 'Человек B',
      // copy pending from Sofija: 7.8 caption wording
      hero_chart_caption:
        'Иллюстративные, синтетические данные, а не показатели пациентов. Диапазон 3,9–7,8 ммоль/л.',

      // For Whom
      whom_title: 'Консультация подойдёт, если Вы',
      whom_1: 'Перепробовали несколько диет, но ничего не помогло надолго',
      whom_2: 'Хотите контролировать вес без строгих ограничений',
      whom_3: 'Чувствуете хроническую усталость и нехватку энергии',
      whom_4: 'У Вас предиабет, инсулинорезистентность или повышенный сахар',
      whom_5: 'Хотите улучшить пищеварение и здоровье кишечника',
      whom_6: 'Ищете специалиста, который опирается на науку, а не модные тренды',
      whom_cta: 'Записаться на консультацию',

      // Pricing
      price_consult: 'Консультация (60 мин)',
      price_consult_val: 'от 65 €',

      // Six-question body (SN-015.2)
      // proposed copy, pending Sofija's confirmation
      qindex_title: 'Вопросы на этой странице',
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
      q3_row3_t: 'Долгосрочный пакет',
      // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
      q3_row3_d: 'несколько визитов по более выгодной цене',
      q3_pending: 'цену уточняет София',
      q4_title: 'Кто такая Sofija Ivanova?',
      q4_talk1: '<span>2025</span>Конгресс EASD, Вена',
      q4_talk2:
        '<span>Лекция</span>«Роль питания в профилактике заболеваний», День здоровой грамотности, КУБ им. П. Страдиня',
      q4_talk3: '<span>Стенд</span>Ночь учёных',
      q4_cred:
        'Mg.sc.sal., Рижский университет Страдиня · Докторантура, Латвийский университет · Реестр медработников № 75650061277',
      q5_title: 'Чем отличается этот подход?',
      q5_p1:
        'Мой подход основан на исследованиях и индивидуальных данных. Не назначаю общих диет: каждая рекомендация адаптирована к Вашей ситуации, анализам и повседневной жизни.',
      q5_p2:
        'График вверху страницы показывает почему: одна и та же еда действует по-разному на разных людей.',
      q6_title: 'Как записаться?',

      // About
      about_lead:
        'Помогаю людям наладить питание на основе науки и персонализированного подхода. Активно участвую в исследовательских проектах и применяю доказательные методы в практике.',
      about_text:
        'Мой подход сочетает академические знания и практический опыт. Каждая консультация основана на доказательствах \u2014 не модных диетах или общих советах. В исследованиях фокусируюсь на роли питания в лечении и профилактике диабета.',
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
        'Мой подход основан на исследованиях и индивидуальных данных. Не назначаю общих диет \u2014 каждая рекомендация адаптирована к Вашей ситуации.',
      faq_q3: 'Доступны ли консультации онлайн?',
      faq_a3:
        'Да, работаю как очно в Риге, так и онлайн. Видео-консультации так же эффективны и доступны клиентам в Латвии и за её пределами.',
      faq_q4: 'Как быстро можно ожидать результатов?',
      faq_a4:
        'Первые положительные изменения (энергия, сон, самочувствие) обычно ощущаются через 2–3 недели. Устойчивые результаты по весу и здоровью — через 2–4 месяца. Follow-up консультации помогают закрепить прогресс надолго.',
      faq_q5: 'Сколько стоит консультация?',
      faq_a5:
        'Индивидуальная консультация (60 мин) — от 65 €. Цена включает полный анализ питания, персонализированный план и рекомендации. Повторные визиты и пакеты доступны по выгодным ценам.',
      faq_q6: 'Как подготовиться к первой консультации?',
      faq_a6:
        'Никакой специальной подготовки не нужно. Если у Вас есть недавние анализы (биохимия крови, сахар, липиды) — возьмите с собой. Если нет — начнём с того, что есть, и спланируем остальное вместе.',

      // Footer extra
      footer_terms: 'Условия оказания услуг',
      footer_privacy: 'Политика конфиденциальности',
      footer_cookie_settings: 'Настройки cookie',
      nav_cabinet: 'Кабинет пациента',
      // Booking
      contact_tag: 'Контакты',
      booking_eyebrow: 'Индивидуальная консультация',
      booking_badge: 'Персональный подход',
      booking_noscript:
        'Для календаря нужен JavaScript. Чтобы записаться, напишите на info@sofijaivanova.lv',

      // Footer
      footer_role: 'Консультации по питанию с научным подходом',
      footer_nav: 'Навигация',
      footer_rights: '© 2026 Sofija Ivanova. Все права защищены.',
      footer_subtitle: 'специалист по питанию, Рига',
      header_subtitle: 'Рига · Научный подход',
    },
    en: {
      // Navigation
      // proposed copy, pending Sofija's confirmation
      header_specialty: 'nutrition specialist, Riga',
      nav_services: 'Consultation',
      nav_about: 'About',
      nav_price: 'Pricing',
      nav_contact: 'Contact',
      nav_cabinet: 'Patient Cabinet',

      // Hero (chart hero, SN-015.1)
      hero_title: 'Same breakfast. <strong>Two different glucose curves.</strong>',
      hero_lead:
        "That's why I don't start with a ready-made meal plan. In the first consultation we look at your test results, daily routine and eating habits, and build the plan from there.",
      hero_cta: 'Book a consultation',
      hero_fact: '60 minutes, in person in Riga or online',
      hero_chart_heading: 'Glucose after breakfast, 07:00–11:00',
      hero_legend_a: 'Person A',
      hero_legend_b: 'Person B',
      hero_readout_time: 'Time',
      hero_readout_a: 'Person A',
      hero_readout_b: 'Person B',
      // copy pending from Sofija: 7.8 caption wording
      hero_chart_caption: 'Illustrative, synthetic data, not patient measurements. Range 3.9–7.8 mmol/L.',

      // For Whom
      whom_title: 'A consultation is right for You if',
      whom_1: "You've tried several diets but nothing worked long-term",
      whom_2: 'You want to manage weight without strict restrictions',
      whom_3: 'You feel chronic fatigue and lack of energy',
      whom_4: 'You have prediabetes, insulin resistance, or high blood sugar',
      whom_5: 'You want to improve digestion and gut health',
      whom_6: "You're looking for a specialist who relies on science, not trends",
      whom_cta: 'Book a consultation',

      // Pricing
      price_consult: 'Consultation (60 min)',
      price_consult_val: 'from €65',

      // Six-question body (SN-015.2)
      // proposed copy, pending Sofija's confirmation
      qindex_title: 'Questions on this page',
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
      q3_row3_t: 'Long-term package',
      // copy pending from Sofija: direct translation of LV factual line, not yet confirmed
      q3_row3_d: 'multiple visits at a better price',
      q3_pending: 'price to be confirmed by Sofija',
      q4_title: 'Who is Sofija Ivanova?',
      q4_talk1: '<span>2025</span>EASD Congress, Vienna',
      q4_talk2:
        '<span>Lecture</span>"The role of nutrition in disease prevention", Health Literacy Day, P. Stradins CUH',
      q4_talk3: '<span>Stand</span>Researchers’ Night',
      q4_cred:
        'Mg.sc.sal., Riga Stradins University · Doctoral studies, University of Latvia · Medical Persons Register No. 75650061277',
      q5_title: 'How is this approach different?',
      q5_p1:
        'My approach is based on research and individual data. I do not prescribe generic diets: every recommendation is tailored to your situation, test results and daily life.',
      q5_p2:
        'The chart at the top of the page shows why: the same food affects different people differently.',
      q6_title: 'How do I book?',

      // About
      about_lead:
        'I help people improve nutrition through a science-based and personalized approach. I actively participate in research projects and apply evidence-based methods in practice.',
      about_text:
        'My approach combines academic knowledge and practical experience. Every consultation is evidence-based \u2014 not trendy diets or generic advice. My research focuses on the role of nutrition in diabetes treatment and prevention.',
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
        "My approach is based on research and individual data. I don't prescribe generic diets \u2014 every recommendation is tailored to your situation.",
      faq_q3: 'Are online consultations available?',
      faq_a3:
        'Yes, I work both in-person in Riga and online. Video consultations are equally effective and available in Latvia and abroad.',
      faq_q4: 'How quickly can I expect results?',
      faq_a4:
        'First positive changes (energy, sleep, well-being) are usually felt within 2–3 weeks. Sustainable weight and health results — in 2–4 months. Follow-up consultations help maintain long-term progress.',
      faq_q5: 'How much does a consultation cost?',
      faq_a5:
        'Individual consultation (60 min) — from €65. The price includes full nutrition analysis, personalized plan, and recommendations. Follow-up visits and long-term packages available at better rates.',
      faq_q6: 'How to prepare for the first consultation?',
      faq_a6:
        "No special preparation needed. If you have recent lab results (blood biochemistry, sugar, lipids) — bring them along. If not — we'll start with what's available and plan the rest together.",

      // Footer extra
      footer_terms: 'Terms of Service',
      footer_privacy: 'Privacy Policy',
      footer_cookie_settings: 'Cookie settings',
      nav_cabinet: 'Patient cabinet',
      // Booking
      contact_tag: 'Contact',
      booking_eyebrow: 'Personal Consultation',
      booking_badge: 'Personalized Care',
      booking_noscript:
        'The calendar needs JavaScript. To book, please email info@sofijaivanova.lv',

      // Footer
      footer_role: 'Evidence-based nutrition consultations',
      footer_nav: 'Navigation',
      footer_rights: '© 2026 Sofija Ivanova. All rights reserved.',
      footer_subtitle: 'nutrition specialist, Riga',
      header_subtitle: 'Riga · Evidence-based approach',
    },
  };

  // Booking Calendar Instance
  let bookingCalendar = null;

  function updateLanguage(lang) {
    currentLang = lang;
    try {
      localStorage.setItem('preferredLang', lang);
    } catch (e) {
      /* private browsing */
    }

    // Update Buttons
    langButtons.forEach((btn) => {
      const isActive = btn.dataset.lang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
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
  const savedLang = (() => {
    try {
      return localStorage.getItem('preferredLang');
    } catch (e) {
      return null;
    }
  })();
  const initLang = ['lv', 'ru', 'en'].includes(savedLang) ? savedLang : 'lv';
  if (initLang !== 'lv') {
    updateLanguage(initLang);
  } else {
    currentLang = 'lv';
    langButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === 'lv');
    });
  }

});
