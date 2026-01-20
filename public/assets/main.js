document.addEventListener('DOMContentLoaded', () => {
    // Language Handling
    const langButtons = document.querySelectorAll('.lang-btn');
    const translatableElements = document.querySelectorAll('[data-i18n]');
    let currentLang = 'lv';

    const translations = {
        lv: {
            // Navigation
            "nav_program": "Programma",
            "nav_how": "Kā tas strādā",
            "nav_about": "Par mani",
            "nav_contact": "Pieteikties",
            "nav_services": "Pakalpojumi",
            "nav_approach": "Pieeja",
            "nav_badge": "ES Licence",
            
            "hero_badge": "Reģistrēta ārstniecības persona Nr. 75650061277",
            "hero_title": "14 dienās no cukura svārstībām līdz stabilam glikozes līmenim",
            "hero_subtitle": "PhD pētniece un reģistrēta uztura speciāliste, kas palīdz cilvēkiem ar prediabētu un insulīna rezistenci stabilizēt cukura līmeni, izmantojot CGM datus.",
            "hero_benefit_1": "14 dienu CGM monitorēšana",
            "hero_benefit_2": "Datu analīze saprotamā valodā",
            "hero_benefit_3": "Personalizēts uztura un dzīvesstila plāns",
            "hero_benefit_4": "Fokuss uz prediabētu un insulīna rezistenci",
            "hero_cta_primary": "Pieteikties 14 dienu programmai",
            "hero_cta_secondary": "Bezmaksas 15 min konsultācija",
            
            "meta_reg_title": "Reģistrācija",
            "meta_reg_val": "Ārstniecības persona",
            "meta_spec_title": "Fokuss",
            "meta_spec_val": "Diabēta profilakse un metabolā veselība",
            "meta_loc_title": "Pieejamība",
            "meta_loc_val": "Klātienē Rīgā • Tiešsaistē visā Latvijā",
            
            "overlay_reg": "PhD pētniece",
            "overlay_uni": "Latvijas Universitāte • Clinical & Personalized Medicine",

            "trust_reg": "Ārstniecības personas reģistrs",
            "trust_phd": "PhD Latvijas Universitātē",
            "trust_horizon": "Horizon Europe pētījumi",
            "trust_ul": "Clinical & Personalized Medicine",

            "services_tag": "Pakalpojumi",
            "services_title": "Kompleksa pieeja metabolajai veselībai",
            "services_desc": "Zinātniski pamatoti risinājumi diabēta profilaksei, dzīves kvalitātes uzlabošanai un hronisku slimību risku samazināšanai.",
            
            "srv_1_title": "Diabēts un prediabēts",
            "srv_1_desc": "Profilakses stratēģijas un atbalsts cukura diabēta gadījumā, balstoties uz klīniskiem pētījumiem un pacienta datiem.",
            "srv_2_title": "Imunitāte un Mikrobioms",
            "srv_2_desc": "Uztura optimizācija, balstīta uz zarnu trakta veselību un imūnsistēmas stiprināšanu.",
            "srv_3_title": "Vielmaiņas Veselība",
            "srv_3_desc": "Insulīna rezistences mazināšana un enerģijas līmeņa atjaunošana ar precīzu uzturu.",
            "srv_4_title": "Personalizēts uzturs",
            "srv_4_desc": "Uztura plāns, pamatojoties uz biomarķieriem, dzīvesveidu un reāliem pacienta mērķiem.",
            "srv_5_title": "Ilgtermiņa Rezultāti",
            "srv_5_desc": "Praktiskas stratēģijas paradumu maiņai, kas neprasa nepārtrauktu gribasspēku.",
            "srv_6_title": "PRAESIIDIUM",
            "srv_6_desc": "Darbs ar zinātniskajiem datiem un Horizon Europe AI modeļiem komplikāciju profilaksei.",

            "about_tag": "Par mani",
            "about_title": "Ne tikai uztura speciāliste. Pētniece.",
            "about_p1": "Esmu reģistrēta uztura speciāliste ar maģistra grādu uzturzinātnē un veicu PhD pētījumus Latvijas Universitātē. Darbojos 'Clinical & Personalized Medicine' pētniecības grupā, kur pētu uztura lomu diabēta profilaksē.",
            "about_p2": "Mans mērķis ir pieejamā veidā apvienot zinātni un praksi, lai palīdzētu cilvēkiem droši mainīt dzīvesveidu un samazināt hronisku saslimšanu riskus.",
            "about_p3": "5 gadu pieredze pārtikas mikrobioloģijā sniedz dziļu izpratni par uztura drošību un tās lomu sabiedrības veselībā.",
            
            "qual_title": "Izglītība un sertifikācija:",
            "qual_1": "MSc Uzturzinātnē — Rīgas Stradiņa universitāte",
            "qual_2": "PhD doktorante — Latvijas Universitāte",
            "qual_3": "Clinical & Personalized Medicine pētniecības grupa",
            "qual_4": "Reģistrēta uztura speciāliste: 75650061277 (VI.gov.lv)",

            "cred_1_title": "Klīniskā bāze",
            "cred_1_desc": "Diabēta profilakse un metabolā veselība",
            "cred_2_title": "Starpdisciplinaritāte",
            "cred_2_desc": "Uzturzinātne, mikrobioloģija, sabiedrības veselība",
            "cred_3_title": "Drošība",
            "cred_3_desc": "Pierādījumu bāze un klīniskie protokoli",
            "cred_4_title": "Pieeja",
            "cred_4_desc": "Ilgtspējīgi paradumi un ilgtermiņa rezultāti",

            "stats_res": "Pētniecības gadi<br>mikrobioloģijā",
            "stats_phd": "Latvijas Universitāte<br>Pētniecības grupa",
            "stats_msc": "Uzturzinātne<br>Rīgas Stradiņa universitāte",
            "stats_reg": "Reģistrēta uztura speciāliste<br>75650061277",

            "method_tag": "Metodoloģija",
            "method_title": "Kāpēc vispārīgas diētas nestrādā",
            "method_subtitle": "Jūsu glikozes reakcija uz ābolu var būt pilnīgi atšķirīga no cita cilvēka. Mēs to pierādām ar datiem.",
            
            "cgm_title": "Redzēt to, ko asins analīzes neparāda",
            "cgm_desc": "Standarta HbA1c tests parāda vidējo ainu. Bet diabēta risks slēpjas pīķos — straujās glikozes svārstībās pēc ēšanas, ko var redzēt tikai ar nepārtrauktu monitorēšanu. CGM sensors 14 dienas fiksē katru reakciju, un mēs kopā analizējam, kas tieši Jūsu organismā izraisa stresu.",
            "cgm_point_1": "<strong>Slēptie pīķi:</strong> Produkti, kas šķiet \"veselīgi\", bet ceļ cukuru",
            "cgm_point_2": "<strong>Individuālā tolerance:</strong> Kā tieši Jūs reaģējat uz ogļhidrātiem",
            "cgm_point_3": "<strong>Optimizācija:</strong> Precīzas izmaiņas, nevis vispārīgi padomi",
            "chart_label": "Glikozes reakcija pēc maltītes",
            "chart_sub": "Sarkanā līnija — slēptie glikozes pīķi, kas paātrina novecošanos un palielina diabēta risku",
            "chart_legend_stable": "Pēc optimizācijas",
            "chart_legend_unstable": "Pirms konsultācijas",
            
            "mini_cta_text": "Vai vēlaties redzēt savu glikozes profilu?",
            "mini_cta_btn": "Pieteikties CGM diagnostikai",
            
            "proof_stat_text": "diabēta gadījumu var novērst ar uztura un dzīvesveida izmaiņām",
            "proof_stat_source": "Diabetes Prevention Program (DPP), NIH, n=3,234",
            "proof_title": "Tas nav par svara zaudēšanu. Tas ir par slimības novēršanu.",
            "proof_text": "Prediabēts bieži paliek nepamanīts gadiem ilgi. Bet organismā jau notiek izmaiņas — asinsvadu bojājumi, iekaisums, enerģijas kritumi. CGM monitorēšana un personalizēts uzturs ļauj iejaukties agrīni, kamēr process vēl ir atgriezenisks.",
            
            "stat_prediabetes_num": "1 no 3",
            "stat_prediabetes_text": "pieaugušajiem ir prediabēts, bet 84% par to nezina",
            "stat_prediabetes_source": "CDC National Diabetes Statistics, 2024",
            "stat_personalized_text": "efektīvāks rezultāts ar personalizētu uzturu salīdzinājumā ar standarta diētām",
            "stat_personalized_source": "Weizmann Institute, Cell 2015",
            "stat_cgm_text": "dienas — pietiekams laiks, lai identificētu Jūsu glikozes modeļus",
            "stat_cgm_source": "American Diabetes Association",

            "step_1_title": "Diagnostika",
            "step_1_desc": "Kompleksa analīze: CGM sensori (14-dienu novērošana), asins bioķīmija, mikrobioma novērtējums.",
            "step_2_title": "Analīze",
            "step_2_desc": "Rezultātu interpretācija no sistēmbioloģijas un metabolisma skatpunkta",
            "step_3_title": "Stratēģija",
            "step_3_desc": "Personalizēts uztura plāns, ņemot vērā dzīvesveidu un mērķus",
            "step_4_title": "Monitorings",
            "step_4_desc": "Regulāra rādītāju kontrole un programmas korekcija",

            "cta_title": "Noskaidrojiet savu metabolo statusu",
            "cta_desc": "Sāciet ar 14 dienu CGM monitorēšanu un personalizētu analīzi. Iegūstiet skaidrību par sava organisma darbību.",
            "cta_btn": "Pieteikties diagnostikai",
            
            "faq_tag": "Biežāk uzdotie jautājumi",
            "faq_title": "Kas jāzina pirms pieteikšanās",
            "faq_q1": "Kam ir domāta CGM diagnostika?",
            "faq_a1": "CGM analīze ir ideāla cilvēkiem ar prediabētu, insulīna rezistenci, PCOS, nepaskaidrojamu nogurumu vai tiem, kas vēlas optimizēt veselību proaktīvi. Nav nepieciešama diagnoze — pietiek ar vēlmi saprast savu organismu.",
            "faq_q2": "Kāda ir atšķirība no parasta dietologa?",
            "faq_a2": "Es neizrakstu vispārīgas diētas. Katrs ieteikums balstās uz Jūsu individuālajiem CGM datiem, asins biomarķieriem un dzīvesveidu. Tā ir precīzijas medicīna uzturā.",
            "faq_q3": "Vai konsultācijas ir iespējamas tiešsaistē?",
            "faq_a3": "Jā. CGM sensoru var uzlikt pašrocīgi (nosūtu detalizētu instrukciju), un visas konsultācijas notiek video formātā. Strādāju ar klientiem visā Latvijā un ārpus tās.",
            "faq_q4": "Cik ilgs ir sadarbības process?",
            "faq_a4": "Minimālais cikls ir 14 dienu CGM monitorēšana + 2 konsultācijas (analīze un stratēģija). Ilgtermiņa atbalsts ir pieejams pēc individuālas vienošanās.",

            "contact_tag": "Kontakti",
            "booking_title": "Rezervējiet konsultāciju",
            "booking_subtitle": "Izvēlieties sev ērtu datumu un laiku. Pieejamās vietas tiek atjauninātas reāllaikā.",
            "contact_alt_text": "Vai vēlaties sazināties citādi?",
            
            "contact_title": "Sāksim ar īsu konsultāciju",
            "contact_desc": "Atstājiet pieprasījumu, un es sazināšos ar Jums, lai piemeklētu darba formātu un atbildētu uz jautājumiem",
            
            "contact_card_title": "Kontaktinformācija",
            "contact_card_desc": "Rakstiet e-pastā vai WhatsApp — atbildu personīgi.",
            "contact_loc": "Rīga, Latvija • Klātienē un tiešsaistē",
            
            "form_title": "Pieteikums konsultācijai",
            "lbl_name": "Jūsu vārds",
            "plh_name": "Anna",
            "lbl_email": "E-pasts vai mesendžeris",
            "plh_email": "@telegram vai e-pasts",
            "lbl_msg": "Īsi par pieprasījumu",
            "plh_msg": "Mērķis, diagnoze, termiņi",
            "btn_submit": "Nosūtīt pieteikumu",
            "btn_sent": "Pieteikums nosūtīts",

            // How it works
            "how_title": "Kā tas strādā?",
            "how_subtitle": "Vienkāršs process, ko varēsiet iekļaut savā ikdienā",
            "step_1_title": "1. Uzliekam CGM sensoru",
            "step_1_desc": "Mazs, nemanāms sensors uz rokas. Pilnīgi nesāpīga procedūra.",
            "step_2_title": "2. Dzīvojiet savu ierasto dzīvi",
            "step_2_desc": "Ēdat kā parasti 14 dienas. Sensors fiksē katras maltītes ietekmi.",
            "step_3_title": "3. Analizējam datus kopā",
            "step_3_desc": "Redzam, kuri ēdieni Jūs stabilizē, kuri — izraisa cukura lēcienus.",
            "step_4_title": "4. Saņemat personalizētu plānu",
            "step_4_desc": "Konkrētas rekomendācijas: ko mainīt, ko atstāt, ko pievienot.",
            
            // Program
            "program_badge": "Galvenais pakalpojums",
            "program_title": "14 dienu CGM programma",
            "program_subtitle": "Pilna diagnostika un personalizēts rīcības plāns",
            "program_includes_title": "Kas iekļauts:",
            "program_item_1": "CGM sensora uzlikšana uz 14 dienām",
            "program_item_2": "Glikozes datu analīze un detalizēta atskaite",
            "program_item_3": "60 min konsultācija (online vai klātienē)",
            "program_item_4": "Personalizēts uztura plāns uz 4 nedēļām",
            "program_item_5": "Follow-up zvans pēc 2–3 nedēļām",
            "program_for_title": "Kam paredzēts:",
            "program_for_1": "Cilvēkiem ar prediabētu vai insulīna rezistenci",
            "program_for_2": "Cilvēkiem ar 2. tipa diabēta risku",
            "program_for_3": "Cilvēkiem ar svara svārstībām un hronisko nogurumu",
            "price_label": "Programmas cena",
            "price_value": "no 249 €",
            "price_note": "CGM sensors iekļauts cenā",
            "result_title": "Rezultāts:",
            "result_1": "Sapratīsiet, kuri ēdieni tieši Jums izraisa straujus cukura lēcienus",
            "result_2": "Saņemsiet konkrētu rīcības plānu, kā stabilizēt glikozes līmeni ikdienā",
            "program_cta": "Pieteikties programmai",
            "program_guarantee": "Pirmā konsultācija bezmaksas",
            
            // Approach
            "approach_title": "Kāpēc vispārīgas diētas nestrādā?",
            
            // Proof & Testimonials
            "proof_stat": "diabēta gadījumu var novērst ar personalizētu uzturu",
            "testimonials_title": "Ko saka klienti",
            "testimonial_1": "Vienmēr domāju, ka ēdu veselīgi — brokastīs biezpiens ar medu, pusdienās salāti. Bet sensors parādīja, ka mans cukurs lēkā kā amerikāņu kalniņos. Pēc Sofijas ieteikumiem — stabils līmenis un 4 kg mazāk bez badošanās.",
            "testimonial_1_author": "Maija, 47 gadi",
            "testimonial_1_condition": "Prediabēts, vielmaiņas sindroms",
            "testimonial_2": "Kā IT speciālists visu dzīvi sēdēju pie datora un ēdu nesaregulēti. Kad ārsts teica par insulīna rezistenci, nobijos. Sofijas pieeja ar CGM bija kā hakeris manam ķermenim — beidzot sapratu, kas īsti notiek.",
            "testimonial_2_author": "Rihards, 35 gadi",
            "testimonial_2_condition": "Insulīna rezistence",
            "testimonial_3": "Pēc grūtniecības diabēta ārsti teica — uzmanies, citādi būs īstais diabēts. Bet neviens neteica KĀ. Sofija ne tikai izskaidroja, bet arī parādīja ar datiem, kāpēc tieši manam organismam vajag citādu pieeju.",
            "testimonial_3_author": "Kristīne, 34 gadi",
            "testimonial_3_condition": "Pēc gestācijas diabēta",
            
            // About
            "about_tag": "Par mani",
            "about_lead": "Esmu reģistrēta uztura speciāliste un PhD pētniece Latvijas Universitātē. Strādāju ar cilvēkiem, kuriem ir prediabēts vai insulīna rezistence, izmantojot CGM sensorus un zinātniski pamatotu pieeju.",
            "about_text": "Kāpēc CGM? Jo standarta asins analīzes parāda tikai vienu momentuzņēmumu. Bet diabēta risks slēpjas ikdienas cukura svārstībās — tās var saskatīt tikai ar nepārtrauktu monitorēšanu.",
            "cred_1_title": "Reģistrēta ārstniecības persona",
            "cred_2_title": "PhD pētniece",
            "cred_2_loc": "Latvijas Universitāte",
            "cred_3_title": "MSc Uzturzinātnē",
            "cred_3_loc": "Rīgas Stradiņa universitāte",
            
            // Science Gallery
            "science_title": "Zinātniskā darbība",
            "science_subtitle": "Aktīvi piedalos starptautiskās konferencēs un zinātnes popularizēšanas pasākumos",
            "gallery_1_tag": "Starptautisks",
            "gallery_1_title": "EASD 2025, Vīne",
            "gallery_1_desc": "Eiropas Diabēta pētījumu asociācijas kongress",
            "gallery_2_tag": "Izglītība",
            "gallery_2_title": "Zinātnieku nakts",
            "gallery_2_desc": "Ikgadējais zinātnes popularizēšanas pasākums Latvijā",
            "gallery_3_tag": "Klīniskais",
            "gallery_3_title": "Veselībpratības diena",
            "gallery_3_desc": "Paula Stradiņa Klīniskā universitātes slimnīca",
            
            // Lead Magnet
            "lead_badge": "Bezmaksas PDF",
            "lead_title": "7 ikdienas paradumi, kas paaugstina cukuru",
            "lead_desc": "Uzziniet, kādi paradumi latviešu vidū palielina diabēta risku, un kā tos mainīt.",
            "lead_item_1": "Kāpēc brokastu izlaišana paaugstina cukuru",
            "lead_item_2": "Vai augļi ir veselīgi? Atkarīgs no tā...",
            "lead_item_3": "3 vienkārši soļi, ko sākt jau šodien",
            "lead_placeholder": "Jūsu e-pasts",
            "lead_btn": "Saņemt PDF",
            "lead_note": "Nekāda spama. Jebkurā brīdī varat atteikties.",
            
            // CTA
            "cta_title": "Gatavs uzzināt, kā Jūsu organisms reaģē uz ēdienu?",
            "cta_desc": "Sāciet ar bezmaksas 15 min konsultāciju",
            "cta_btn": "Pieteikties konsultācijai",

            "footer_role": "Sertificēta uztura speciāliste, PhD doktorante",
            "footer_nav": "Navigācija",
            "footer_rights": "© 2026 Sofija Ivanova. Visas tiesības aizsargātas."
        },
        ru: {
            // Navigation
            "nav_program": "Программа",
            "nav_how": "Как это работает",
            "nav_about": "Обо мне",
            "nav_contact": "Записаться",
            "nav_services": "Услуги",
            "nav_approach": "Подход",
            "nav_badge": "Лицензия ЕС",
            
            "hero_badge": "Зарегистрированный медицинский специалист №75650061277",
            "hero_title": "За 14 дней от скачков сахара к стабильному уровню глюкозы",
            "hero_subtitle": "PhD-исследователь и зарегистрированный специалист по питанию помогает людям с предиабетом и инсулинорезистентностью стабилизировать уровень сахара с помощью CGM-данных.",
            "hero_benefit_1": "14-дневный CGM-мониторинг",
            "hero_benefit_2": "Анализ данных понятным языком",
            "hero_benefit_3": "Персонализированный план питания и образа жизни",
            "hero_benefit_4": "Фокус на предиабете и инсулинорезистентности",
            "hero_cta_primary": "Записаться на 14-дневную программу",
            "hero_cta_secondary": "Бесплатная 15 мин консультация",

            "meta_reg_title": "Регистрация",
            "meta_reg_val": "Медицинский специалист",
            "meta_spec_title": "Фокус",
            "meta_spec_val": "Профилактика диабета и метаболическое здоровье",
            "meta_loc_title": "Доступность",
            "meta_loc_val": "Очно в Риге • Онлайн по всей Латвии",

            "overlay_reg": "PhD-исследователь",
            "overlay_uni": "Латвийский Университет • Clinical & Personalized Medicine",

            "trust_reg": "Реестр медицинских специалистов",
            "trust_phd": "PhD в Латвийском Университете",
            "trust_horizon": "Исследования Horizon Europe",
            "trust_ul": "Clinical & Personalized Medicine",

            "services_tag": "Услуги",
            "services_title": "Комплексный подход к метаболическому здоровью",
            "services_desc": "Научно обоснованные решения для профилактики диабета, улучшения качества жизни и снижения рисков хронических заболеваний.",

            "srv_1_title": "Диабет и предиабет",
            "srv_1_desc": "Стратегии профилактики и поддержки при сахарном диабете на основе клинических исследований и данных пациента.",
            "srv_2_title": "Иммунитет и Микробиом",
            "srv_2_desc": "Оптимизация питания с учетом здоровья кишечника и укрепления иммунитета.",
            "srv_3_title": "Метаболическое Здоровье",
            "srv_3_desc": "Снижение инсулинорезистентности и восстановление уровня энергии через точное питание.",
            "srv_4_title": "Персонализированное питание",
            "srv_4_desc": "План питания на основе биомаркеров, образа жизни и реальных целей пациента.",
            "srv_5_title": "Долгосрочные Результаты",
            "srv_5_desc": "Практические стратегии изменения привычек, не требующие постоянной силы воли.",
            "srv_6_title": "PRAESIIDIUM",
            "srv_6_desc": "Работа с научными данными и AI-моделями Horizon Europe для профилактики осложнений.",

            "about_tag": "Обо мне",
            "about_title": "Не просто диетолог. Исследователь.",
            "about_p1": "Я — сертифицированный специалист по питанию с магистерской степенью в Nutrition Science, в настоящее время провожу PhD-исследования в Латвийском Университете. Вхожу в исследовательскую группу 'Clinical & Personalized Medicine'.",
            "about_p2": "Моя цель — объединять научные доказательства и практические стратегии, чтобы помогать людям безопасно менять образ жизни, снижать риски хронических заболеваний и улучшать качество жизни.",
            "about_p3": "5 лет опыта в пищевой микробиологии дают глубокое понимание безопасности питания и его роли в общественном здоровье.",

            "qual_title": "Образование и сертификация:",
            "qual_1": "MSc in Nutrition Science — Rīga Stradiņš University",
            "qual_2": "PhD student — University of Latvia",
            "qual_3": "Clinical & Personalized Medicine research group",
            "qual_4": "Registered nutritionist: 75650061277 (VI.gov.lv)",

            "cred_1_title": "Клиническая база",
            "cred_1_desc": "Профилактика диабета и метаболическое здоровье",
            "cred_2_title": "Междисциплинарность",
            "cred_2_desc": "Нутрициология, микробиология, общественное здоровье",
            "cred_3_title": "Безопасность",
            "cred_3_desc": "Доказательная база и клинические протоколы",
            "cred_4_title": "Подход",
            "cred_4_desc": "Устойчивые привычки и долгосрочные результаты",

            "stats_res": "Лет исследований<br>в микробиологии",
            "stats_phd": "Латвийский Университет<br>Исследовательская группа",
            "stats_msc": "Nutrition Science<br>Rīga Stradiņš University",
            "stats_reg": "Registered nutritionist<br>75650061277",

            "method_tag": "Методология",
            "method_title": "Почему общие диеты не работают",
            "method_subtitle": "Ваша реакция глюкозы на яблоко может кардинально отличаться от реакции другого человека. Мы доказываем это данными.",

            "cgm_title": "Увидеть то, что не показывают анализы крови",
            "cgm_desc": "Стандартный тест HbA1c показывает среднюю картину. Но риск диабета скрыт в пиках — резких скачках глюкозы после еды, которые видны только при непрерывном мониторинге. CGM-сенсор 14 дней фиксирует каждую реакцию, и мы вместе анализируем, что именно вызывает стресс в Вашем организме.",
            "cgm_point_1": "<strong>Скрытые пики:</strong> Продукты, которые кажутся \"здоровыми\", но повышают сахар",
            "cgm_point_2": "<strong>Индивидуальная толерантность:</strong> Как именно Вы реагируете на углеводы",
            "cgm_point_3": "<strong>Оптимизация:</strong> Точные изменения, а не общие советы",
            "chart_label": "Реакция глюкозы после приёма пищи",
            "chart_sub": "Красная линия — скрытые пики глюкозы, ускоряющие старение и повышающие риск диабета",
            "chart_legend_stable": "После оптимизации",
            "chart_legend_unstable": "До консультации",
            
            "mini_cta_text": "Хотите увидеть свой профиль глюкозы?",
            "mini_cta_btn": "Записаться на CGM-диагностику",
            
            "proof_stat_text": "случаев диабета можно предотвратить изменением питания и образа жизни",
            "proof_stat_source": "Diabetes Prevention Program (DPP), NIH, n=3,234",
            "proof_title": "Это не о потере веса. Это о предотвращении болезни.",
            "proof_text": "Предиабет часто остаётся незамеченным годами. Но в организме уже происходят изменения — повреждение сосудов, воспаление, упадок энергии. CGM-мониторинг и персонализированное питание позволяют вмешаться рано, пока процесс ещё обратим.",
            
            "stat_prediabetes_num": "1 из 3",
            "stat_prediabetes_text": "взрослых имеет предиабет, но 84% об этом не знают",
            "stat_prediabetes_source": "CDC National Diabetes Statistics, 2024",
            "stat_personalized_text": "эффективнее результат с персонализированным питанием по сравнению со стандартными диетами",
            "stat_personalized_source": "Weizmann Institute, Cell 2015",
            "stat_cgm_text": "дней — достаточно для определения Ваших глюкозных паттернов",
            "stat_cgm_source": "American Diabetes Association",

            "step_1_title": "Диагностика",
            "step_1_desc": "Комплексный анализ: CGM сенсоры (14 дней), биохимия крови, оценка микробиома.",
            "step_2_title": "Анализ",
            "step_2_desc": "Интерпретация результатов с позиции системной биологии и метаболизма.",
            "step_3_title": "Стратегия",
            "step_3_desc": "Персонализированный план питания с учетом образа жизни и целей.",
            "step_4_title": "Мониторинг",
            "step_4_desc": "Регулярный контроль показателей и корректировка программы.",

            "cta_title": "Узнайте свой метаболический статус",
            "cta_desc": "Начните с 14-дневного CGM-мониторинга и персонализированного анализа. Получите ясность о работе своего организма.",
            "cta_btn": "Записаться на диагностику",
            
            "faq_tag": "Часто задаваемые вопросы",
            "faq_title": "Что нужно знать перед записью",
            "faq_q1": "Для кого предназначена CGM-диагностика?",
            "faq_a1": "CGM-анализ идеален для людей с предиабетом, инсулинорезистентностью, СПКЯ, необъяснимой усталостью или для тех, кто хочет проактивно оптимизировать здоровье. Диагноз не требуется — достаточно желания понять свой организм.",
            "faq_q2": "Чем это отличается от обычного диетолога?",
            "faq_a2": "Я не выписываю общие диеты. Каждая рекомендация основана на Ваших индивидуальных CGM-данных, биомаркерах крови и образе жизни. Это прецизионная медицина в питании.",
            "faq_q3": "Возможны ли консультации онлайн?",
            "faq_a3": "Да. CGM-сенсор можно установить самостоятельно (высылаю подробную инструкцию), и все консультации проходят в видео-формате. Работаю с клиентами по всей Латвии и за её пределами.",
            "faq_q4": "Сколько длится процесс сотрудничества?",
            "faq_a4": "Минимальный цикл — 14 дней CGM-мониторинга + 2 консультации (анализ и стратегия). Долгосрочная поддержка доступна по индивидуальной договорённости.",

            "contact_tag": "Контакты",
            "booking_title": "Запишитесь на консультацию",
            "booking_subtitle": "Выберите удобную дату и время. Свободные места обновляются в реальном времени.",
            "contact_alt_text": "Хотите связаться другим способом?",
            "contact_title": "Давайте начнем с короткой консультации",
            "contact_desc": "Оставьте запрос, и я свяжусь с Вами, чтобы подобрать формат работы и ответить на вопросы.",

            "contact_card_title": "Контактные данные",
            "contact_card_desc": "Пишите на email или в WhatsApp — отвечаю лично.",
            "contact_loc": "Рига, Латвия • Очные и онлайн консультации",
            
            "form_title": "Заявка на консультацию",
            "lbl_name": "Ваше имя",
            "plh_name": "Ирина",
            "lbl_email": "Email или мессенджер",
            "plh_email": "@telegram или email",
            "lbl_msg": "Кратко о запросе",
            "plh_msg": "Цель, диагноз, сроки",
            "btn_submit": "Отправить заявку",
            "btn_sent": "Заявка отправлена",

            // How it works
            "how_title": "Как это работает?",
            "how_subtitle": "Простой процесс, который легко вписать в повседневную жизнь",
            "step_1_title": "1. Устанавливаем CGM сенсор",
            "step_1_desc": "Маленький, незаметный сенсор на руке. Совершенно безболезненная процедура.",
            "step_2_title": "2. Живите обычной жизнью",
            "step_2_desc": "Питайтесь как обычно 14 дней. Сенсор фиксирует влияние каждого приёма пищи.",
            "step_3_title": "3. Анализируем данные вместе",
            "step_3_desc": "Видим, какие продукты стабилизируют, какие — вызывают скачки сахара.",
            "step_4_title": "4. Получаете персонализированный план",
            "step_4_desc": "Конкретные рекомендации: что изменить, что оставить, что добавить.",
            
            // Program
            "program_badge": "Основная услуга",
            "program_title": "14-дневная CGM программа",
            "program_subtitle": "Полная диагностика и персонализированный план действий",
            "program_includes_title": "Что включено:",
            "program_item_1": "Установка CGM сенсора на 14 дней",
            "program_item_2": "Анализ данных глюкозы и детальный отчёт",
            "program_item_3": "60 мин консультация (онлайн или очно)",
            "program_item_4": "Персонализированный план питания на 4 недели",
            "program_item_5": "Follow-up звонок через 2–3 недели",
            "program_for_title": "Для кого:",
            "program_for_1": "Людей с предиабетом или инсулинорезистентностью",
            "program_for_2": "Людей с риском диабета 2 типа",
            "program_for_3": "Людей с колебаниями веса и хронической усталостью",
            "price_label": "Стоимость программы",
            "price_value": "от 249 €",
            "price_note": "CGM сенсор включён в стоимость",
            "result_title": "Результат:",
            "result_1": "Поймёте, какие продукты именно у Вас вызывают резкие скачки сахара",
            "result_2": "Получите конкретный план действий для стабилизации уровня глюкозы",
            "program_cta": "Записаться на программу",
            "program_guarantee": "Первая консультация бесплатно",
            
            // Approach
            "approach_title": "Почему общие диеты не работают?",
            
            // Proof & Testimonials
            "proof_stat": "случаев диабета можно предотвратить персонализированным питанием",
            "testimonials_title": "Что говорят клиенты",
            "testimonial_1": "«Всегда думала, что питаюсь правильно — творог с мёдом на завтрак, салаты на обед. Но сенсор показал, что мой сахар скачет как на американских горках. После рекомендаций Софии — стабильный уровень и минус 4 кг без голодовок.»",
            "testimonial_1_author": "Майя, 47 лет",
            "testimonial_1_condition": "Предиабет, метаболический синдром",
            "testimonial_2": "«Как IT-специалист всю жизнь сидел за компьютером и ел нерегулярно. Когда врач сказал про инсулинорезистентность — испугался. Подход Софии с CGM был как хакинг моего тела — наконец понял, что реально происходит.»",
            "testimonial_2_author": "Рихард, 35 лет",
            "testimonial_2_condition": "Инсулинорезистентность",
            "testimonial_3": "«После гестационного диабета врачи сказали — следи за собой, иначе будет настоящий диабет. Но никто не объяснил КАК. София не только объяснила, но и показала на данных, почему именно моему организму нужен другой подход.»",
            "testimonial_3_author": "Кристина, 34 года",
            "testimonial_3_condition": "После гестационного диабета",
            
            // About
            "about_lead": "Я зарегистрированный специалист по питанию и PhD-исследователь в Латвийском Университете. Работаю с людьми с предиабетом и инсулинорезистентностью, используя CGM сенсоры и научно обоснованный подход.",
            "about_text": "Почему CGM? Потому что стандартные анализы крови показывают лишь один моментальный снимок. Но риск диабета скрыт в ежедневных колебаниях сахара — их можно увидеть только при непрерывном мониторинге.",
            "cred_1_title": "Зарегистрированный медспециалист",
            "cred_2_title": "PhD-исследователь",
            "cred_2_loc": "Латвийский Университет",
            "cred_3_title": "MSc в нутрициологии",
            "cred_3_loc": "Рижский Университет Страдиня",
            
            // Science Gallery
            "science_title": "Научная деятельность",
            "science_subtitle": "Активно участвую в международных конференциях и мероприятиях по популяризации науки",
            "gallery_1_tag": "Международный",
            "gallery_1_title": "EASD 2025, Вена",
            "gallery_1_desc": "Конгресс Европейской ассоциации исследований диабета",
            "gallery_2_tag": "Образование",
            "gallery_2_title": "Ночь учёных",
            "gallery_2_desc": "Ежегодное мероприятие по популяризации науки в Латвии",
            "gallery_3_tag": "Клинический",
            "gallery_3_title": "День здоровой грамотности",
            "gallery_3_desc": "Клиническая университетская больница Паулса Страдиня",
            
            // Lead Magnet
            "lead_badge": "Бесплатный PDF",
            "lead_title": "7 ежедневных привычек, повышающих сахар",
            "lead_desc": "Узнайте, какие привычки увеличивают риск диабета, и как их изменить.",
            "lead_item_1": "Почему пропуск завтрака повышает сахар",
            "lead_item_2": "Полезны ли фрукты? Зависит от того...",
            "lead_item_3": "3 простых шага, которые можно начать сегодня",
            "lead_placeholder": "Ваш email",
            "lead_btn": "Получить PDF",
            "lead_note": "Никакого спама. Отписаться можно в любой момент.",
            
            // CTA
            "cta_title": "Готовы узнать, как Ваш организм реагирует на еду?",
            "cta_desc": "Начните с бесплатной 15-минутной консультации",
            "cta_btn": "Записаться на консультацию",

            "footer_role": "Сертифицированный специалист по питанию, PhD",
            "footer_nav": "Навигация",
            "footer_rights": "© 2026 Sofija Ivanova. Все права защищены."
        },
        en: {
            // Navigation
            "nav_program": "Program",
            "nav_how": "How it works",
            "nav_about": "About",
            "nav_contact": "Contact",
            "nav_services": "Services",
            "nav_approach": "Approach",
            "nav_badge": "EU License",
            
            "hero_badge": "Registered Medical Practitioner No. 75650061277",
            "hero_title": "In 14 days, from glucose spikes to stable blood sugar levels",
            "hero_subtitle": "PhD researcher and registered nutritionist helping people with prediabetes and insulin resistance stabilize blood sugar using CGM data.",
            "hero_benefit_1": "14-day CGM monitoring",
            "hero_benefit_2": "Data analysis in plain language",
            "hero_benefit_3": "Personalized nutrition and lifestyle plan",
            "hero_benefit_4": "Focus on prediabetes and insulin resistance",
            "hero_cta_primary": "Apply for 14-day program",
            "hero_cta_secondary": "Free 15 min consultation",

            "meta_reg_title": "Registration",
            "meta_reg_val": "Medical Practitioner",
            "meta_spec_title": "Focus",
            "meta_spec_val": "Diabetes prevention and metabolic health",
            "meta_loc_title": "Availability",
            "meta_loc_val": "In-person in Riga • Online across Latvia",

            "overlay_reg": "PhD Researcher",
            "overlay_uni": "University of Latvia • Clinical & Personalized Medicine",

            "trust_reg": "Medical Practitioners Registry",
            "trust_phd": "PhD at University of Latvia",
            "trust_horizon": "Horizon Europe Research",
            "trust_ul": "Clinical & Personalized Medicine",

            "services_tag": "Services",
            "services_title": "Comprehensive Approach to Metabolic Health",
            "services_desc": "Science-based solutions for diabetes prevention, quality of life improvement, and chronic disease risk reduction.",

            "srv_1_title": "Diabetes & Prediabetes",
            "srv_1_desc": "Prevention strategies and support for diabetes based on clinical studies and patient data.",
            "srv_2_title": "Immunity & Microbiome",
            "srv_2_desc": "Nutrition optimization based on gut health and immune system strengthening.",
            "srv_3_title": "Metabolic Health",
            "srv_3_desc": "Reducing insulin resistance and restoring energy levels through precise nutrition.",
            "srv_4_title": "Personalized Nutrition",
            "srv_4_desc": "Nutrition plan based on biomarkers, lifestyle, and real patient goals.",
            "srv_5_title": "Long-term Results",
            "srv_5_desc": "Practical strategies for habit change that don't require constant willpower.",
            "srv_6_title": "PRAESIIDIUM",
            "srv_6_desc": "Working with scientific data and Horizon Europe AI models for complication prevention.",

            "about_tag": "About Me",
            "about_title": "Not just a nutritionist. A researcher.",
            "about_p1": "I am a registered nutritionist with a Master's degree in Nutrition Science and currently conducting PhD research at the University of Latvia. I am part of the 'Clinical & Personalized Medicine' research group, studying the role of nutrition in diabetes prevention and treatment.",
            "about_p2": "My goal is to combine scientific evidence and practical strategies to help people safely change their lifestyle, reduce chronic disease risks, and improve quality of life.",
            "about_p3": "5 years of experience in food microbiology provide a deep understanding of food safety and its role in public health.",

            "qual_title": "Education and Certification:",
            "qual_1": "MSc in Nutrition Science — Rīga Stradiņš University",
            "qual_2": "PhD Student — University of Latvia",
            "qual_3": "Clinical & Personalized Medicine Research Group",
            "qual_4": "Registered Nutritionist: 75650061277 (VI.gov.lv)",

            "cred_1_title": "Clinical Basis",
            "cred_1_desc": "Diabetes Prevention & Metabolic Health",
            "cred_2_title": "Interdisciplinary",
            "cred_2_desc": "Nutrition Science, Microbiology, Public Health",
            "cred_3_title": "Safety",
            "cred_3_desc": "Evidence Base & Clinical Protocols",
            "cred_4_title": "Approach",
            "cred_4_desc": "Sustainable Habits & Long-term Results",

            "stats_res": "Years of Research<br>in Microbiology",
            "stats_phd": "University of Latvia<br>Research Group",
            "stats_msc": "Nutrition Science<br>Rīga Stradiņš University",
            "stats_reg": "Registered Nutritionist<br>75650061277",

            "method_tag": "Methodology",
            "method_title": "Why generic diets don't work",
            "method_subtitle": "Your glucose response to an apple can be completely different from another person's. We prove this with data.",

            "cgm_title": "See what blood tests don't show",
            "cgm_desc": "Standard HbA1c tests show the average picture. But diabetes risk hides in spikes — rapid glucose swings after eating that are only visible with continuous monitoring. A CGM sensor records every reaction for 14 days, and together we analyze what exactly causes stress in your body.",
            "cgm_point_1": "<strong>Hidden spikes:</strong> Foods that seem \"healthy\" but raise blood sugar",
            "cgm_point_2": "<strong>Individual tolerance:</strong> How you specifically react to carbohydrates",
            "cgm_point_3": "<strong>Optimization:</strong> Precise changes, not generic advice",
            "chart_label": "Glucose response after a meal",
            "chart_sub": "Red line — hidden glucose spikes that accelerate aging and increase diabetes risk",
            "chart_legend_stable": "After optimization",
            "chart_legend_unstable": "Before consultation",
            
            "mini_cta_text": "Want to see your glucose profile?",
            "mini_cta_btn": "Book CGM Diagnostic",
            
            "proof_stat_text": "of diabetes cases can be prevented through diet and lifestyle changes",
            "proof_stat_source": "Diabetes Prevention Program (DPP), NIH, n=3,234",
            "proof_title": "This isn't about weight loss. It's about disease prevention.",
            "proof_text": "Prediabetes often goes unnoticed for years. But changes are already happening in your body — vascular damage, inflammation, energy crashes. CGM monitoring and personalized nutrition allow early intervention, while the process is still reversible.",
            
            "stat_prediabetes_num": "1 in 3",
            "stat_prediabetes_text": "adults have prediabetes, but 84% don't know it",
            "stat_prediabetes_source": "CDC National Diabetes Statistics, 2024",
            "stat_personalized_text": "more effective results with personalized nutrition compared to standard diets",
            "stat_personalized_source": "Weizmann Institute, Cell 2015",
            "stat_cgm_text": "days — enough to identify your glucose patterns",
            "stat_cgm_source": "American Diabetes Association",

            "step_1_title": "Diagnostics",
            "step_1_desc": "Comprehensive analysis: CGM sensors (14-day monitoring), blood biochemistry, microbiome assessment.",
            "step_2_title": "Analysis",
            "step_2_desc": "Interpretation of results from a systems biology and metabolism perspective.",
            "step_3_title": "Strategy",
            "step_3_desc": "Personalized nutrition plan considering lifestyle and goals.",
            "step_4_title": "Monitoring",
            "step_4_desc": "Regular monitoring of indicators and program adjustment.",

            "cta_title": "Discover your metabolic status",
            "cta_desc": "Start with 14-day CGM monitoring and personalized analysis. Gain clarity about how your body works.",
            "cta_btn": "Book Diagnostic Session",
            
            "faq_tag": "Frequently Asked Questions",
            "faq_title": "What to know before booking",
            "faq_q1": "Who is CGM diagnostics for?",
            "faq_a1": "CGM analysis is ideal for people with prediabetes, insulin resistance, PCOS, unexplained fatigue, or those who want to proactively optimize their health. No diagnosis required — just a desire to understand your body.",
            "faq_q2": "How is this different from a regular dietitian?",
            "faq_a2": "I don't prescribe generic diets. Every recommendation is based on your individual CGM data, blood biomarkers, and lifestyle. This is precision medicine in nutrition.",
            "faq_q3": "Are online consultations available?",
            "faq_a3": "Yes. The CGM sensor can be self-applied (I send detailed instructions), and all consultations happen via video. I work with clients across Latvia and beyond.",
            "faq_q4": "How long is the collaboration process?",
            "faq_a4": "The minimum cycle is 14 days of CGM monitoring + 2 consultations (analysis and strategy). Long-term support is available by individual arrangement.",

            "contact_tag": "Contact",
            "booking_title": "Book a Consultation",
            "booking_subtitle": "Choose a convenient date and time. Available slots are updated in real-time.",
            "contact_alt_text": "Prefer to reach out another way?",
            "contact_title": "Let's start with a short consultation",
            "contact_desc": "Leave a request, and I will contact you to discuss the best format for cooperation.",

            "contact_card_title": "Contact Details",
            "contact_card_desc": "Contact me via email or WhatsApp — I answer personally.",
            "contact_loc": "Riga, Latvia • In-person and Online",
            
            "form_title": "Consultation Request",
            "lbl_name": "Your Name",
            "plh_name": "Anna",
            "lbl_email": "Email or Messenger",
            "plh_email": "@telegram or email",
            "lbl_msg": "Briefly about request",
            "plh_msg": "Goal, diagnosis, timeframe",
            "btn_submit": "Send Request",
            "btn_sent": "Request Sent",

            // How it works
            "how_title": "How does it work?",
            "how_subtitle": "A simple process you can fit into your daily life",
            "step_1_title": "1. We apply the CGM sensor",
            "step_1_desc": "A small, unnoticeable sensor on your arm. Completely painless procedure.",
            "step_2_title": "2. Live your normal life",
            "step_2_desc": "Eat as usual for 14 days. The sensor records the impact of each meal.",
            "step_3_title": "3. We analyze the data together",
            "step_3_desc": "We see which foods stabilize you, which ones cause sugar spikes.",
            "step_4_title": "4. You receive a personalized plan",
            "step_4_desc": "Specific recommendations: what to change, keep, or add.",
            
            // Program
            "program_badge": "Main Service",
            "program_title": "14-Day CGM Program",
            "program_subtitle": "Complete diagnostics and personalized action plan",
            "program_includes_title": "What's included:",
            "program_item_1": "CGM sensor application for 14 days",
            "program_item_2": "Glucose data analysis and detailed report",
            "program_item_3": "60 min consultation (online or in-person)",
            "program_item_4": "Personalized nutrition plan for 4 weeks",
            "program_item_5": "Follow-up call after 2–3 weeks",
            "program_for_title": "Who it's for:",
            "program_for_1": "People with prediabetes or insulin resistance",
            "program_for_2": "People at risk of type 2 diabetes",
            "program_for_3": "People with weight fluctuations and chronic fatigue",
            "price_label": "Program price",
            "price_value": "from €249",
            "price_note": "CGM sensor included",
            "result_title": "Result:",
            "result_1": "You'll understand which foods cause sharp sugar spikes for YOU specifically",
            "result_2": "You'll receive a concrete action plan to stabilize glucose levels daily",
            "program_cta": "Apply for the program",
            "program_guarantee": "First consultation free",
            
            // Approach
            "approach_title": "Why don't generic diets work?",
            
            // Proof & Testimonials
            "proof_stat": "of diabetes cases can be prevented with personalized nutrition",
            "testimonials_title": "What clients say",
            "testimonial_1": "\"I always thought I ate healthy — cottage cheese with honey for breakfast, salads for lunch. But the sensor showed my sugar was on a roller coaster. After Sofija's recommendations — stable levels and 4 kg down without starving.\"",
            "testimonial_1_author": "Maija, 47 years",
            "testimonial_1_condition": "Prediabetes, metabolic syndrome",
            "testimonial_2": "\"As an IT specialist, I spent my life at a computer eating irregularly. When the doctor mentioned insulin resistance — I got scared. Sofija's CGM approach was like hacking my own body — finally understood what was really happening.\"",
            "testimonial_2_author": "Rihards, 35 years",
            "testimonial_2_condition": "Insulin resistance",
            "testimonial_3": "\"After gestational diabetes, doctors said — watch yourself or you'll get real diabetes. But no one explained HOW. Sofija not only explained but showed me with data why my body specifically needs a different approach.\"",
            "testimonial_3_author": "Kristīne, 34 years",
            "testimonial_3_condition": "Post-gestational diabetes",
            
            // About
            "about_lead": "I'm a registered nutritionist and PhD researcher at the University of Latvia. I work with people with prediabetes and insulin resistance, using CGM sensors and a science-based approach.",
            "about_text": "Why CGM? Because standard blood tests show only one snapshot. But diabetes risk hides in daily sugar fluctuations — they can only be seen with continuous monitoring.",
            "cred_1_title": "Registered Medical Practitioner",
            "cred_2_title": "PhD Researcher",
            "cred_2_loc": "University of Latvia",
            "cred_3_title": "MSc in Nutrition Science",
            "cred_3_loc": "Rīga Stradiņš University",
            
            // Science Gallery
            "science_title": "Scientific Activity",
            "science_subtitle": "Actively participating in international conferences and science outreach events",
            "gallery_1_tag": "International",
            "gallery_1_title": "EASD 2025, Vienna",
            "gallery_1_desc": "European Association for the Study of Diabetes Congress",
            "gallery_2_tag": "Education",
            "gallery_2_title": "Researchers' Night",
            "gallery_2_desc": "Annual science outreach event in Latvia",
            "gallery_3_tag": "Clinical",
            "gallery_3_title": "Health Literacy Day",
            "gallery_3_desc": "Pauls Stradiņš Clinical University Hospital",
            
            // Lead Magnet
            "lead_badge": "Free PDF",
            "lead_title": "7 daily habits that raise your blood sugar",
            "lead_desc": "Learn which habits increase diabetes risk and how to change them.",
            "lead_item_1": "Why skipping breakfast raises blood sugar",
            "lead_item_2": "Are fruits healthy? It depends on...",
            "lead_item_3": "3 simple steps to start today",
            "lead_placeholder": "Your email",
            "lead_btn": "Get PDF",
            "lead_note": "No spam. Unsubscribe anytime.",
            
            // CTA
            "cta_title": "Ready to learn how your body responds to food?",
            "cta_desc": "Start with a free 15-minute consultation",
            "cta_btn": "Book a consultation",

            "footer_role": "Certified Nutritionist, PhD Student",
            "footer_nav": "Navigation",
            "footer_rights": "© 2026 Sofija Ivanova. All rights reserved."
        }
    };

    // Booking Calendar Instance
    let bookingCalendar = null;

    function updateLanguage(lang) {
        currentLang = lang;
        
        // Update Buttons
        langButtons.forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Text
        translatableElements.forEach(el => {
            const key = el.dataset.i18n;
            if (translations[lang] && translations[lang][key]) {
                if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
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
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            updateLanguage(btn.dataset.lang);
        });
    });

    // Initialize Booking Calendar
    if (typeof BookingCalendar !== 'undefined' && document.getElementById('bookingCalendar')) {
        bookingCalendar = new BookingCalendar('bookingCalendar', {
            lang: 'lv',
            onBookingComplete: (booking) => {
                console.log('Booking completed:', booking);
                // Here you could send the booking to a server
            }
        });
    }

    // Initialize language (without updating calendar - it initializes itself with 'lv')
    currentLang = 'lv';
    langButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === 'lv');
    });
    
    // Mobile Menu Functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navLinksAnchors = document.querySelectorAll('.nav-links a');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('mobile-open');
            document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
        });
        
        // Close menu when clicking a link
        navLinksAnchors.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('mobile-open');
                document.body.style.overflow = '';
            });
        });
    }
});