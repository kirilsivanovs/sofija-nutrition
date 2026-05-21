/**
 * Shared Translations
 * 
 * Single source of truth for all translations used by both frontend and backend.
 * This file is designed to work in both Node.js (CommonJS) and browser (ES modules) environments.
 */

const sharedTranslations = {
    lv: {
        // Calendar & UI
        calendar: {
            title: "Izvēlieties datumu un laiku",
            selectDate: "Izvēlieties datumu",
            selectTime: "Pieejamie laiki",
            noSlots: "Šajā dienā nav pieejamu laiku",
            weekdays: ["Sv", "P", "O", "T", "C", "Pk", "S"],
            months: ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", 
                     "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"],
            today: "Šodien",
            selectedLabel: "Izvēlēts"
        },
        
        // Form
        form: {
            serviceLabel: "Pakalpojuma veids",
            formatLabel: "Konsultācijas formāts",
            nameLabel: "Jūsu vārds",
            emailLabel: "E-pasts",
            phoneLabel: "Telefons",
            messageLabel: "Komentārs (neobligāts)",
            submitBtn: "Apstiprināt rezervāciju"
        },
        
        // Success/Error messages
        messages: {
            successTitle: "Rezervācija veiksmīga!",
            successText: "Mēs sazināsimies ar Jums 24 stundu laikā, lai apstiprinātu vizīti.",
            closeBtn: "Aizvērt",
            errorTitle: "Sistēma īslaicīgi nepieejama",
            errorMessage: "Lūdzu, mēģiniet vēlāk vai sazinieties pa e-pastu:",
            errorRetry: "Mēģināt vēlreiz",
            slotTaken: "Šis laiks jau ir aizņemts. Lūdzu, izvēlieties citu laiku.",
            rateLimit: "Pārāk daudz pieprasījumu. Lūdzu, uzgaidiet.",
            serverError: "Servera kļūda. Lūdzu, mēģiniet vēlreiz.",
            timeout: "Pieprasījums ilga pārāk ilgi. Lūdzu, mēģiniet vēlreiz.",
            offline: "Nav interneta savienojuma."
        },
        
        // Formats
        format: {
            online: "Attālināti (Zoom/Google Meet)",
            inPerson: "Klātienē"
        },
        
        // Services
        services: {
            'initial': 'Sākotnējā konsultācija',
            'followup': 'Atkārtota konsultācija',
            'package3': '3 konsultāciju pakete',
            'package5': '5 konsultāciju pakete',
            'consultation': 'Uztura konsultācija'
        },
        
        // Email
        email: {
            subject: (id) => `Rezervācijas apstiprinājums - ${id}`,
            greeting: (name) => `Labdien, ${name}!`,
            thankYou: 'Paldies par rezervāciju!',
            confirmed: 'Jūsu rezervācija ir apstiprināta:',
            bookingId: 'Rezervācijas numurs',
            service: 'Pakalpojums',
            format: 'Formāts',
            date: 'Datums',
            time: 'Laiks',
            price: 'Cena',
            invoiceAttached: 'Rēķins ir pievienots šim e-pastam.',
            questions: 'Ja jums ir jautājumi, lūdzu, sazinieties ar mums.',
            regards: 'Ar cieņu,',
            subtitle: 'Uztura speciāliste · PhD'
        },
        
        // Testimonials
        testimonials: {
            sectionTitle: 'Atsauksmes',
            sectionSubtitle: 'Ko saka mani klienti'
        },
        
        // Payment
        payment: {
            confirmedSubject: (id) => `Maksājums apstiprināts - ${id}`,
            confirmedTitle: 'Maksājums saņemts!',
            confirmedText: 'Paldies! Jūsu maksājums ir saņemts. Gaidām Jūs konsultācijā:',
            waitingText: 'Gaidām Jūs:'
        },
        
        // Cancellation
        cancellation: {
            subject: (id) => `Rezervācija atcelta - ${id}`,
            title: 'Rezervācija atcelta',
            text: 'Jūsu rezervācija ir atcelta.',
            details: 'Atceltās rezervācijas informācija:',
            questions: 'Ja vēlaties veikt jaunu rezervāciju vai jums ir jautājumi, lūdzu, sazinieties ar mums.'
        },
        
        // PDF
        pdf: {
            subtitle: 'Uztura speciāliste · PhD',
            invoice: 'RĒĶINS',
            number: 'Numurs',
            date: 'Datums',
            client: 'Klients',
            name: 'Vārds',
            email: 'E-pasts',
            phone: 'Telefons',
            format: 'Formāts',
            service: 'Pakalpojums',
            time: 'Laiks',
            price: 'Cena',
            total: 'KOPĀ',
            paymentInfo: 'Maksājuma informācija',
            bank: 'Banka',
            reference: 'Maksājuma mērķis',
            notes: 'Piezīmes',
            thankYou: 'Paldies, ka izvēlējāties mūs!',
            notProvided: 'Nav norādīts'
        }
    },
    
    en: {
        // Calendar & UI
        calendar: {
            title: "Select date and time",
            selectDate: "Select a date",
            selectTime: "Available times",
            noSlots: "No available slots on this day",
            weekdays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            months: ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"],
            today: "Today",
            selectedLabel: "Selected"
        },
        
        // Form
        form: {
            serviceLabel: "Service type",
            formatLabel: "Consultation format",
            nameLabel: "Your name",
            emailLabel: "Email",
            phoneLabel: "Phone",
            messageLabel: "Comment (optional)",
            submitBtn: "Confirm booking"
        },
        
        // Success/Error messages
        messages: {
            successTitle: "Booking successful!",
            successText: "We will contact you within 24 hours to confirm your appointment.",
            closeBtn: "Close",
            errorTitle: "System temporarily unavailable",
            errorMessage: "Please try again later or contact us via email:",
            errorRetry: "Try again",
            slotTaken: "This time slot is already taken. Please choose another time.",
            rateLimit: "Too many requests. Please wait.",
            serverError: "Server error. Please try again.",
            timeout: "Request timed out. Please try again.",
            offline: "No internet connection."
        },
        
        // Formats
        format: {
            online: "Online (Zoom/Google Meet)",
            inPerson: "In-person"
        },
        
        // Services
        services: {
            'initial': 'Initial Consultation',
            'followup': 'Follow-up Consultation',
            'package3': '3 Consultation Package',
            'package5': '5 Consultation Package',
            'consultation': 'Nutrition Consultation'
        },
        
        // Email
        email: {
            subject: (id) => `Booking Confirmation - ${id}`,
            greeting: (name) => `Hello, ${name}!`,
            thankYou: 'Thank you for your booking!',
            confirmed: 'Your booking has been confirmed:',
            bookingId: 'Booking ID',
            service: 'Service',
            format: 'Format',
            date: 'Date',
            time: 'Time',
            price: 'Price',
            invoiceAttached: 'The invoice is attached to this email.',
            questions: 'If you have any questions, please contact us.',
            regards: 'Best regards,',
            subtitle: 'Nutrition Specialist · PhD'
        },
        
        // Testimonials
        testimonials: {
            sectionTitle: 'Testimonials',
            sectionSubtitle: 'What my clients say'
        },
        
        // Payment
        payment: {
            confirmedSubject: (id) => `Payment Confirmed - ${id}`,
            confirmedTitle: 'Payment Received!',
            confirmedText: 'Thank you! Your payment has been received. We look forward to seeing you:',
            waitingText: 'We look forward to seeing you:'
        },
        
        // Cancellation
        cancellation: {
            subject: (id) => `Booking Cancelled - ${id}`,
            title: 'Booking Cancelled',
            text: 'Your booking has been cancelled.',
            details: 'Cancelled booking details:',
            questions: 'If you would like to make a new booking or have any questions, please contact us.'
        },
        
        // PDF
        pdf: {
            subtitle: 'Nutrition Specialist · PhD',
            invoice: 'INVOICE',
            number: 'Number',
            date: 'Date',
            client: 'Client',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            format: 'Format',
            service: 'Service',
            time: 'Time',
            price: 'Price',
            total: 'TOTAL',
            paymentInfo: 'Payment Information',
            bank: 'Bank',
            reference: 'Payment Reference',
            notes: 'Notes',
            thankYou: 'Thank you for choosing us!',
            notProvided: 'Not provided'
        }
    },
    
    ru: {
        // Calendar & UI
        calendar: {
            title: "Выберите дату и время",
            selectDate: "Выберите дату",
            selectTime: "Доступное время",
            noSlots: "В этот день нет свободного времени",
            weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
            months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                     "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
            today: "Сегодня",
            selectedLabel: "Выбрано"
        },
        
        // Form
        form: {
            serviceLabel: "Тип услуги",
            formatLabel: "Формат консультации",
            nameLabel: "Ваше имя",
            emailLabel: "Email",
            phoneLabel: "Телефон",
            messageLabel: "Комментарий (необязательно)",
            submitBtn: "Подтвердить запись"
        },
        
        // Success/Error messages
        messages: {
            successTitle: "Запись успешна!",
            successText: "Мы свяжемся с Вами в течение 24 часов для подтверждения визита.",
            closeBtn: "Закрыть",
            errorTitle: "Система временно недоступна",
            errorMessage: "Пожалуйста, попробуйте позже или напишите нам:",
            errorRetry: "Попробовать снова",
            slotTaken: "Это время уже занято. Пожалуйста, выберите другое время.",
            rateLimit: "Слишком много запросов. Пожалуйста, подождите.",
            serverError: "Ошибка сервера. Пожалуйста, попробуйте снова.",
            timeout: "Превышено время ожидания. Пожалуйста, попробуйте снова.",
            offline: "Нет подключения к интернету."
        },
        
        // Formats
        format: {
            online: "Онлайн (Zoom/Google Meet)",
            inPerson: "Очно"
        },
        
        // Services
        services: {
            'initial': 'Первичная консультация',
            'followup': 'Повторная консультация',
            'package3': 'Пакет из 3 консультаций',
            'package5': 'Пакет из 5 консультаций',
            'consultation': 'Консультация по питанию'
        },
        
        // Email
        email: {
            subject: (id) => `Подтверждение бронирования - ${id}`,
            greeting: (name) => `Здравствуйте, ${name}!`,
            thankYou: 'Спасибо за бронирование!',
            confirmed: 'Ваше бронирование подтверждено:',
            bookingId: 'Номер бронирования',
            service: 'Услуга',
            format: 'Формат',
            date: 'Дата',
            time: 'Время',
            price: 'Стоимость',
            invoiceAttached: 'Счёт прилагается к этому письму.',
            questions: 'Если у вас есть вопросы, пожалуйста, свяжитесь с нами.',
            regards: 'С уважением,',
            subtitle: 'Специалист по питанию · PhD'
        },
        
        // Testimonials
        testimonials: {
            sectionTitle: 'Отзывы',
            sectionSubtitle: 'Что говорят мои клиенты'
        },
        
        // Payment
        payment: {
            confirmedSubject: (id) => `Оплата подтверждена - ${id}`,
            confirmedTitle: 'Оплата получена!',
            confirmedText: 'Спасибо! Ваша оплата получена. Ждём вас на консультации:',
            waitingText: 'Ждём вас:'
        },
        
        // Cancellation
        cancellation: {
            subject: (id) => `Бронирование отменено - ${id}`,
            title: 'Бронирование отменено',
            text: 'Ваше бронирование было отменено.',
            details: 'Информация об отменённом бронировании:',
            questions: 'Если вы хотите сделать новое бронирование или у вас есть вопросы, пожалуйста, свяжитесь с нами.'
        },
        
        // PDF
        pdf: {
            subtitle: 'Специалист по питанию · PhD',
            invoice: 'СЧЁТ',
            number: 'Номер',
            date: 'Дата',
            client: 'Клиент',
            name: 'Имя',
            email: 'Email',
            phone: 'Телефон',
            format: 'Формат',
            service: 'Услуга',
            time: 'Время',
            price: 'Цена',
            total: 'ИТОГО',
            paymentInfo: 'Платёжная информация',
            bank: 'Банк',
            reference: 'Назначение платежа',
            notes: 'Примечания',
            thankYou: 'Спасибо, что выбрали нас!',
            notProvided: 'Не указано'
        }
    }
};

// Common data (not language-specific)
const commonData = {
    email: 'info@sofija-nutrition.lv',
    website: 'sofija-nutrition.lv'
};

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sharedTranslations, commonData };
}

// Export for browser (window global)
if (typeof window !== 'undefined') {
    window.sharedTranslations = sharedTranslations;
    window.commonData = commonData;
}
