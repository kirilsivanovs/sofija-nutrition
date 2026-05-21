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
      hero_eyebrow: 'Sertificēta dietoloģe · Rīga',
      hero_title: 'Uzturs, kas strādā tieši Jums',
      hero_subtitle:
        'Nepalīdz diētas? Trūkst enerģijas? Vēlaties sakārtot svaru vai cukura līmeni? Palīdzēšu ar individuālu, zinātniski pamatotu pieeju — bez gatavām shēmām.',
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

      // For Whom
      whom_title: 'Konsultācija ir piemērota, ja Jūs',
      whom_1: 'Esat izmēģinājuši vairākas diētas, bet nekas nav palīdzējis ilgtermiņā',
      whom_2: 'Vēlaties kontrolēt svaru bez striktu ierobežojumu',
      whom_3: 'Jūtat hronisko nogurumu un enerģijas trūkumu',
      whom_4: 'Jums ir prediabēts, insulīna rezistence vai paaugstināts cukurs',
      whom_5: 'Vēlaties uzlabot gremošanu un zarnu veselību',
      whom_6: 'Meklējat speciālistu, kas balstās uz zinātni, nevis modes tendencēm',
      whom_cta: 'Pieteikties konsultācijai',

      // Services
      services_tag: 'Pakalpojumi',
      services_title: 'Kā es varu Jums palīdzēt',
      services_desc:
        'Katrs cilvēks ir unikāls — tāpēc mans darbs sākas ar Jūsu stāstu, nevis gatavu shēmu.',
      srv_1_title: 'Individuāla konsultācija',
      srv_1_desc:
        'Sapratīsiet, kas tieši Jūsu uzturā nestrādā un ko mainīt, lai jau pirmajās nedēļās juttu atšķirību. Klātienē vai tiešsaistē, 60 min.',
      srv_2_title: 'Personalizēts uztura plāns',
      srv_2_desc:
        'Saņemsiet konkrētu ēdienkarti, kas garšo, ir reāli iekļaujama Jūsu ikdienā un ņem vērā veselības mērķus. Nevis diēta — bet jauns ēšanas veids.',
      srv_3_title: 'Metabolā veselība',
      srv_3_desc:
        'Stabilizēsiet cukura līmeni, uzlabosiet enerģiju un kontrolēsiet svaru bez galēju ierobežojumu. Īpaši aktuāli ar prediabētu vai insulīna rezistenci.',
      srv_5_title: 'Zarnu veselība',
      srv_5_desc:
        'Atvadīsieties no vēdera uzpūšanās, diskomforta un nestabilas gremošanas. Uztura stratēģija, kas atjauno līdzsvaru zarnu traktā.',
      srv_6_title: 'Ilgtermiņa atbalsts',
      srv_6_desc:
        'Rezultāts saglabājas, jo neesat viena. Follow-up vizītes, plāna korekcijas un atbalsts, kamēr jaunie paradumi kļūst par normu.',

      // What You'll Get (Outcomes)
      outcomes_tag: 'Rezultāts',
      outcomes_title: 'Ko Jūs iegūsiet',
      out_1_title: 'Individuāls uztura plāns',
      out_1_desc:
        'Nevis gatava shēma, bet personalizēts plāns, kas ņem vērā Jūsu veselību, garšas preferences un dzīvesveidu.',
      out_2_title: 'Vairāk enerģijas un skaidrība',
      out_2_desc:
        'Pirmās izmaiņas jūtamas jau 2–3 nedēļās: labāks miegs, stabilāka enerģija dienā, skaidrāka domāšana.',
      out_3_title: 'Ilgtspējīgi rezultāti',
      out_3_desc:
        'Bez jojo efekta. Iemācīsieties ēst pareizi sev — lai rezultāti saglabājas gadiem, ne tikai nedēļām.',

      // Pricing
      price_consult: 'Konsultācija (60 min)',
      price_consult_val: 'no 65 €',

      // About
      about_tag: 'Par mani',
      about_lead:
        'Palīdzu cilvēkiem sakārtot uzturu, balstoties uz zinātni un personalizētu pieeju. Aktīvi piedalos pētniecības projektos un praksē izmantoju pierādījumos balstītas metodes.',
      about_text:
        'Mana pieeja apvieno akadēmiskās zināšanas un praktisku pieredzi. Katra konsultācija balstās uz pierādījumiem \u2014 ne modes diētām vai vispārīgiem padomiem. Pētniecībā fokusējos uz uztura lomu diabēta ārstēšanā un profilaksē.',
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

      // Booking extra
      booking_flexibility:
        'Pieteikšanās iespējama arī ārpus darba laika. Konsultācijas pieejamas klātienē Rīgā un tiešsaistē.',

      // Final CTA
      final_cta_title: 'Gatavi sākt ceļu uz labāku veselību?',
      final_cta_text: 'Pirmais solis ir vienkāršs — izvēlieties laiku, un es parūpēšos par pārējo.',
      final_cta_btn: 'Rezervēt konsultāciju',

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
      hero_eyebrow: 'Сертифицированный диетолог · Рига',
      hero_title: 'Питание, которое работает именно для Вас',
      hero_subtitle: 'Диеты не помогают? Не хватает энергии? Хотите наладить вес или уровень сахара? Помогу с индивидуальным, научно обоснованным подходом — без готовых схем.',
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

      // For Whom
      whom_title: 'Консультация подойдёт, если Вы',
      whom_1: 'Перепробовали несколько диет, но ничего не помогло надолго',
      whom_2: 'Хотите контролировать вес без строгих ограничений',
      whom_3: 'Чувствуете хроническую усталость и нехватку энергии',
      whom_4: 'У Вас предиабет, инсулинорезистентность или повышенный сахар',
      whom_5: 'Хотите улучшить пищеварение и здоровье кишечника',
      whom_6: 'Ищете специалиста, который опирается на науку, а не модные тренды',
      whom_cta: 'Записаться на консультацию',

      // Services
      services_tag: 'Услуги',
      services_title: 'Как я могу Вам помочь',
      services_desc:
        'Каждый человек уникален — поэтому моя работа начинается с Вашей истории, а не с готовой схемы.',
      srv_1_title: 'Индивидуальная консультация',
      srv_1_desc:
        'Поймёте, что именно в Вашем питании не работает и что изменить, чтобы уже в первые недели почувствовать разницу. Очно или онлайн, 60 мин.',
      srv_2_title: 'Персонализированный план питания',
      srv_2_desc:
        'Получите конкретное меню, которое вкусное, реально вписывается в Вашу жизнь и учитывает цели здоровья. Не диета — а новый способ питания.',
      srv_3_title: 'Метаболическое здоровье',
      srv_3_desc:
        'Стабилизируете сахар, улучшите энергию и возьмёте вес под контроль без крайних ограничений. Особенно актуально при предиабете или инсулинорезистентности.',
      srv_5_title: 'Здоровье кишечника',
      srv_5_desc:
        'Избавитесь от вздутия, дискомфорта и нестабильного пищеварения. Стратегия питания, которая восстанавливает баланс в ЖКТ.',
      srv_6_title: 'Долгосрочная поддержка',
      srv_6_desc:
        'Результат сохраняется, потому что Вы не одна. Follow-up визиты, корректировки плана и поддержка, пока новые привычки станут нормой.',

      // What You'll Get (Outcomes)
      outcomes_tag: 'Результат',
      outcomes_title: 'Что Вы получите',
      out_1_title: 'Индивидуальный план питания',
      out_1_desc:
        'Не готовая схема, а персонализированный план, который учитывает Ваше здоровье, вкусовые предпочтения и образ жизни.',
      out_2_title: 'Больше энергии и ясность',
      out_2_desc:
        'Первые изменения ощутимы уже через 2–3 недели: лучше сон, стабильная энергия в течение дня, ясное мышление.',
      out_3_title: 'Устойчивые результаты',
      out_3_desc:
        'Без эффекта йо-йо. Научитесь питаться правильно для себя — чтобы результат сохранялся годами, а не неделями.',

      // Pricing
      price_consult: 'Консультация (60 мин)',
      price_consult_val: 'от 65 €',

      // About
      about_tag: 'Обо мне',
      about_lead:
        'Помогаю людям наладить питание на основе науки и персонализированного подхода. Активно участвую в исследовательских проектах и применяю доказательные методы в практике.',
      about_text:
        'Мой подход сочетает академические знания и практический опыт. Каждая консультация основана на доказательствах \u2014 не модных диетах или общих советах. В исследованиях фокусируюсь на роли питания в лечении и профилактике диабета.',
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

      // Booking extra
      booking_flexibility:
        'Запись возможна и вне рабочего времени. Консультации доступны очно в Риге и онлайн.',

      // Final CTA
      final_cta_title: 'Готовы начать путь к лучшему здоровью?',
      final_cta_text: 'Первый шаг прост — выберите время, а я позабочусь об остальном.',
      final_cta_btn: 'Записаться на консультацию',

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
      hero_eyebrow: 'Certified Dietitian · Riga',
      hero_title: 'Nutrition that works for You',
      hero_subtitle:
        'Diets not working? Lacking energy? Want to manage weight or blood sugar? I\'ll help with an individual, science-based approach — no ready-made templates.',
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

      // For Whom
      whom_title: 'A consultation is right for You if',
      whom_1: 'You\'ve tried several diets but nothing worked long-term',
      whom_2: 'You want to manage weight without strict restrictions',
      whom_3: 'You feel chronic fatigue and lack of energy',
      whom_4: 'You have prediabetes, insulin resistance, or high blood sugar',
      whom_5: 'You want to improve digestion and gut health',
      whom_6: 'You\'re looking for a specialist who relies on science, not trends',
      whom_cta: 'Book a consultation',

      // Services
      services_tag: 'Services',
      services_title: 'How I can help You',
      services_desc:
        "Every person is unique — that's why my work begins with your story, not a ready-made template.",
      srv_1_title: 'Individual consultation',
      srv_1_desc:
        'Understand exactly what in your nutrition isn\'t working and what to change to feel the difference within weeks. In-person or online, 60 min.',
      srv_2_title: 'Personalized meal plan',
      srv_2_desc:
        'Get a concrete meal plan that\'s delicious, realistically fits your life, and takes health goals into account. Not a diet — a new way of eating.',
      srv_3_title: 'Metabolic health',
      srv_3_desc:
        'Stabilize blood sugar, boost energy, and take control of weight without extreme restrictions. Especially relevant for prediabetes or insulin resistance.',
      srv_5_title: 'Gut health',
      srv_5_desc:
        'Say goodbye to bloating, discomfort, and unstable digestion. A nutrition strategy that restores balance in the GI tract.',
      srv_6_title: 'Long-term support',
      srv_6_desc:
        'Results last because you\'re not alone. Follow-up visits, plan adjustments, and support until new habits become the norm.',

      // What You'll Get (Outcomes)
      outcomes_tag: 'Results',
      outcomes_title: 'What You\'ll get',
      out_1_title: 'Individual nutrition plan',
      out_1_desc:
        'Not a generic template, but a personalized plan that considers your health, taste preferences, and lifestyle.',
      out_2_title: 'More energy and clarity',
      out_2_desc:
        'First changes felt within 2–3 weeks: better sleep, stable energy throughout the day, clearer thinking.',
      out_3_title: 'Sustainable results',
      out_3_desc:
        'No yo-yo effect. Learn to eat right for yourself — so results last years, not just weeks.',

      // Pricing
      price_consult: 'Consultation (60 min)',
      price_consult_val: 'from €65',

      // About
      about_tag: 'About Me',
      about_lead:
        'I help people improve nutrition through a science-based and personalized approach. I actively participate in research projects and apply evidence-based methods in practice.',
      about_text:
        "My approach combines academic knowledge and practical experience. Every consultation is evidence-based \u2014 not trendy diets or generic advice. My research focuses on the role of nutrition in diabetes treatment and prevention.",
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
        'No special preparation needed. If you have recent lab results (blood biochemistry, sugar, lipids) — bring them along. If not — we\'ll start with what\'s available and plan the rest together.',

      // Booking extra
      booking_flexibility:
        'Booking available outside working hours as well. Consultations available in-person in Riga and online.',

      // Final CTA
      final_cta_title: 'Ready to start your journey to better health?',
      final_cta_text: 'The first step is simple — choose a time, and I\'ll take care of the rest.',
      final_cta_btn: 'Book a consultation',

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
