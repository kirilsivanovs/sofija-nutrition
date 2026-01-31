/**
 * Input Validation & Sanitization
 * Защита от XSS, SQL Injection и невалидных данных
 */

/**
 * Escape HTML специальных символов (защита от XSS)
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Удаляет потенциально опасные символы и теги
 */
function stripDangerous(str) {
    if (typeof str !== 'string') return '';
    return str
        // Удаляем script теги и их содержимое
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Удаляем event handlers
        .replace(/\bon\w+\s*=/gi, '')
        // Удаляем javascript: URLs
        .replace(/javascript:/gi, '')
        // Удаляем data: URLs (могут содержать вредоносный код)
        .replace(/data:/gi, '')
        // Удаляем HTML теги
        .replace(/<[^>]*>/g, '')
        // Нормализуем пробелы
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Валидация и санитизация имени
 */
function sanitizeName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, value: '', error: 'Name is required' };
    }
    
    const sanitized = stripDangerous(name).substring(0, 100);
    
    if (sanitized.length < 2) {
        return { valid: false, value: sanitized, error: 'Name must be at least 2 characters' };
    }
    
    // Проверяем что имя содержит хотя бы буквы
    if (!/[a-zA-ZāčēģīķļņōŗšūžĀČĒĢĪĶĻŅŌŖŠŪŽа-яА-ЯёЁ]/.test(sanitized)) {
        return { valid: false, value: sanitized, error: 'Name must contain letters' };
    }
    
    return { valid: true, value: sanitized };
}

/**
 * Валидация и нормализация email
 */
function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, value: '', error: 'Email is required' };
    }
    
    const normalized = email.toLowerCase().trim().substring(0, 254);
    
    // RFC 5322 упрощённая проверка
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(normalized)) {
        return { valid: false, value: normalized, error: 'Invalid email format' };
    }
    
    return { valid: true, value: normalized };
}

/**
 * Валидация и санитизация телефона
 */
function sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return { valid: true, value: '' }; // Телефон опционален
    }
    
    // Оставляем только цифры и +
    const cleaned = phone.replace(/[^\d+]/g, '').substring(0, 20);
    
    if (cleaned.length === 0) {
        return { valid: true, value: '' };
    }
    
    // Проверяем формат (международный или латвийский)
    // +371XXXXXXXX или 371XXXXXXXX или 2XXXXXXX (мобильный LV)
    const phoneRegex = /^(\+?371\d{8}|\+?\d{10,15}|[26]\d{7})$/;
    
    if (!phoneRegex.test(cleaned)) {
        return { valid: false, value: cleaned, error: 'Invalid phone format. Use +371XXXXXXXX' };
    }
    
    // Нормализуем к формату +371...
    let normalized = cleaned;
    if (/^[26]\d{7}$/.test(cleaned)) {
        normalized = '+371' + cleaned;
    } else if (/^371\d{8}$/.test(cleaned)) {
        normalized = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
        normalized = '+' + cleaned;
    }
    
    return { valid: true, value: normalized };
}

/**
 * Валидация даты (YYYY-MM-DD)
 */
function sanitizeDate(date) {
    if (!date || typeof date !== 'string') {
        return { valid: false, value: '', error: 'Date is required' };
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return { valid: false, value: date, error: 'Invalid date format. Use YYYY-MM-DD' };
    }
    
    // Проверяем что дата валидна
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
        return { valid: false, value: date, error: 'Invalid date' };
    }
    
    // Проверяем что дата в будущем
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed < today) {
        return { valid: false, value: date, error: 'Date must be in the future' };
    }
    
    // Проверяем что дата не слишком далеко (6 месяцев)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    if (parsed > maxDate) {
        return { valid: false, value: date, error: 'Date cannot be more than 6 months in the future' };
    }
    
    return { valid: true, value: date };
}

/**
 * Валидация времени (HH:MM)
 */
function sanitizeTime(time) {
    if (!time || typeof time !== 'string') {
        return { valid: false, value: '', error: 'Time is required' };
    }
    
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
        return { valid: false, value: time, error: 'Invalid time format. Use HH:MM' };
    }
    
    return { valid: true, value: time };
}

/**
 * Санитизация заметок/комментариев
 */
function sanitizeNotes(notes) {
    if (!notes || typeof notes !== 'string') {
        return { valid: true, value: '' };
    }
    
    const sanitized = stripDangerous(notes).substring(0, 500);
    return { valid: true, value: sanitized };
}

/**
 * Валидация service ID
 */
function sanitizeServiceId(serviceId) {
    if (!serviceId || typeof serviceId !== 'string') {
        return { valid: false, value: '', error: 'Service is required' };
    }
    
    const validServices = [
        'free-consultation',
        'nutrition-consultation-basic', 
        'nutrition-consultation-extended',
        'nutrition-program'
    ];
    
    const cleaned = serviceId.trim().toLowerCase();
    
    if (!validServices.includes(cleaned)) {
        return { valid: false, value: cleaned, error: 'Invalid service' };
    }
    
    return { valid: true, value: cleaned };
}

/**
 * Валидация формата консультации
 */
function sanitizeFormat(format) {
    if (!format || typeof format !== 'string') {
        return { valid: false, value: '', error: 'Format is required' };
    }
    
    const validFormats = ['online', 'in-person'];
    const cleaned = format.trim().toLowerCase();
    
    if (!validFormats.includes(cleaned)) {
        return { valid: false, value: cleaned, error: 'Invalid format. Use online or in-person' };
    }
    
    return { valid: true, value: cleaned };
}

/**
 * Валидация языка
 */
function sanitizeLanguage(language) {
    const validLanguages = ['lv', 'en', 'ru'];
    
    if (!language || typeof language !== 'string') {
        return { valid: true, value: 'lv' }; // Дефолт
    }
    
    const cleaned = language.trim().toLowerCase();
    
    if (!validLanguages.includes(cleaned)) {
        return { valid: true, value: 'lv' }; // Дефолт для невалидных
    }
    
    return { valid: true, value: cleaned };
}

/**
 * Полная валидация данных бронирования
 * @returns {{ valid: boolean, data?: object, errors?: object }}
 */
function validateBookingInput(body) {
    const errors = {};
    const data = {};
    
    // Обязательные поля
    const name = sanitizeName(body.name);
    if (!name.valid) errors.name = name.error;
    data.name = name.value;
    
    const email = sanitizeEmail(body.email);
    if (!email.valid) errors.email = email.error;
    data.email = email.value;
    
    const date = sanitizeDate(body.date);
    if (!date.valid) errors.date = date.error;
    data.date = date.value;
    
    const time = sanitizeTime(body.time);
    if (!time.valid) errors.time = time.error;
    data.time = time.value;
    
    // Support both 'service' and 'serviceId' field names
    const serviceId = sanitizeServiceId(body.serviceId || body.service);
    if (!serviceId.valid) errors.serviceId = serviceId.error;
    data.serviceId = serviceId.value;
    
    const format = sanitizeFormat(body.consultationFormat);
    if (!format.valid) errors.consultationFormat = format.error;
    data.consultationFormat = format.value;
    
    // Опциональные поля
    const phone = sanitizePhone(body.phone);
    if (!phone.valid) errors.phone = phone.error;
    data.phone = phone.value;
    
    const notes = sanitizeNotes(body.notes);
    data.notes = notes.value;
    
    const language = sanitizeLanguage(body.language);
    data.language = language.value;
    
    const hasErrors = Object.keys(errors).length > 0;
    
    return hasErrors 
        ? { valid: false, errors, data }
        : { valid: true, data };
}

/**
 * Создать HTTP response для validation error
 */
function validationErrorResponse(errors) {
    return {
        status: 400,
        jsonBody: {
            error: 'Validation Error',
            code: 'VALIDATION_ERROR',
            details: errors
        }
    };
}

module.exports = {
    escapeHtml,
    stripDangerous,
    sanitizeName,
    sanitizeEmail,
    sanitizePhone,
    sanitizeDate,
    sanitizeTime,
    sanitizeNotes,
    sanitizeServiceId,
    sanitizeFormat,
    sanitizeLanguage,
    validateBookingInput,
    validationErrorResponse
};
