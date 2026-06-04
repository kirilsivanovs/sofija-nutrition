/**
 * Input Validation & Sanitization (TypeScript)
 * Защита от XSS, SQL Injection и невалидных данных
 */

import { validServiceIds } from '../config';

// ============================================
// Types
// ============================================

export interface ValidationResult<T = string> {
  valid: boolean;
  value: T;
  error?: string;
}

export interface BookingInput {
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  serviceId?: string;
  service?: string;
  consultationFormat?: string;
  notes?: string;
  language?: string;
  personalCode?: string;
}

export interface SanitizedBookingData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  serviceId: string;
  consultationFormat: string;
  notes: string;
  language: string;
  personalCode: string;
}

export interface BookingValidationResult {
  valid: boolean;
  data: SanitizedBookingData;
  errors?: Record<string, string>;
}

export interface ValidationErrorResponse {
  status: 400;
  jsonBody: {
    error: string;
    code: string;
    details: Record<string, string>;
  };
}

// ============================================
// Escape Functions
// ============================================

/**
 * Escape HTML специальных символов (защита от XSS)
 */
export function escapeHtml(str: unknown): string {
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
export function stripDangerous(str: unknown): string {
  if (typeof str !== 'string') return '';

  const lower = str.toLowerCase();
  let result = '';
  let i = 0;

  while (i < str.length) {
    if (lower.startsWith('<script', i)) {
      const end = lower.indexOf('</script>', i);
      if (end === -1) break;
      i = end + '</script>'.length;
      continue;
    }

    if (lower.startsWith('<style', i)) {
      const end = lower.indexOf('</style>', i);
      if (end === -1) break;
      i = end + '</style>'.length;
      continue;
    }

    if (str[i] === '<') {
      const end = str.indexOf('>', i);
      if (end === -1) break;
      i = end + 1;
      continue;
    }

    result += str[i];
    i += 1;
  }

  const normalized = result
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return escapeHtml(normalized);
}

// ============================================
// Field Sanitizers
// ============================================

/**
 * Валидация и санитизация имени
 */
export function sanitizeName(name: unknown): ValidationResult {
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
export function sanitizeEmail(email: unknown): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, value: '', error: 'Email is required' };
  }

  const normalized = email.toLowerCase().trim().substring(0, 254);

  // RFC 5322 упрощённая проверка
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(normalized)) {
    return { valid: false, value: normalized, error: 'Invalid email format' };
  }

  return { valid: true, value: normalized };
}

/**
 * Валидация и санитизация телефона
 */
export function sanitizePhone(phone: unknown): ValidationResult {
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
export function sanitizeDate(date: unknown): ValidationResult {
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
export function sanitizeTime(time: unknown): ValidationResult {
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
export function sanitizeNotes(notes: unknown): ValidationResult {
  if (!notes || typeof notes !== 'string') {
    return { valid: true, value: '' };
  }

  const sanitized = stripDangerous(notes).substring(0, 500);
  return { valid: true, value: sanitized };
}

/**
 * Валидация service ID
 */
export function sanitizeServiceId(serviceId: unknown): ValidationResult {
  if (!serviceId || typeof serviceId !== 'string') {
    return { valid: false, value: '', error: 'Service is required' };
  }

  const cleaned = serviceId.trim().toLowerCase();

  if (!validServiceIds.includes(cleaned)) {
    return { valid: false, value: cleaned, error: 'Invalid service' };
  }

  return { valid: true, value: cleaned };
}

/**
 * Валидация формата консультации
 */
export function sanitizeFormat(format: unknown): ValidationResult {
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
 * Валидация Latvian personas kods (опционально, для подачи чека в VID).
 * Формат: DDMMYY-XXXXX или новый 32XXXX-XXXXX (11 цифр).
 */
export function sanitizePersonalCode(personalCode: unknown): ValidationResult {
  if (!personalCode || typeof personalCode !== 'string') {
    return { valid: true, value: '' };
  }

  const trimmed = personalCode.trim();
  if (trimmed === '') {
    return { valid: true, value: '' };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length !== 11) {
    return {
      valid: false,
      value: trimmed,
      error: 'Invalid personal code. Use format DDMMYY-XXXXX',
    };
  }

  return { valid: true, value: `${digits.slice(0, 6)}-${digits.slice(6)}` };
}

/**
 * Валидация языка
 */
export function sanitizeLanguage(language: unknown): ValidationResult {
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

// ============================================
// Complete Validation
// ============================================

/**
 * Полная валидация данных бронирования
 */
export function validateBookingInput(body: BookingInput): BookingValidationResult {
  const errors: Record<string, string> = {};
  const data: Partial<SanitizedBookingData> = {};

  // Обязательные поля
  const name = sanitizeName(body.name);
  if (!name.valid && name.error) errors.name = name.error;
  data.name = name.value;

  const email = sanitizeEmail(body.email);
  if (!email.valid && email.error) errors.email = email.error;
  data.email = email.value;

  const date = sanitizeDate(body.date);
  if (!date.valid && date.error) errors.date = date.error;
  data.date = date.value;

  const time = sanitizeTime(body.time);
  if (!time.valid && time.error) errors.time = time.error;
  data.time = time.value;

  // Support both 'service' and 'serviceId' field names
  const serviceId = sanitizeServiceId(body.serviceId || body.service);
  if (!serviceId.valid && serviceId.error) errors.serviceId = serviceId.error;
  data.serviceId = serviceId.value;

  const format = sanitizeFormat(body.consultationFormat);
  if (!format.valid && format.error) errors.consultationFormat = format.error;
  data.consultationFormat = format.value;

  // Опциональные поля
  const phone = sanitizePhone(body.phone);
  if (!phone.valid && phone.error) errors.phone = phone.error;
  data.phone = phone.value;

  const notes = sanitizeNotes(body.notes);
  data.notes = notes.value;

  const personalCode = sanitizePersonalCode(body.personalCode);
  if (!personalCode.valid && personalCode.error) errors.personalCode = personalCode.error;
  data.personalCode = personalCode.value;

  const language = sanitizeLanguage(body.language);
  data.language = language.value;

  const hasErrors = Object.keys(errors).length > 0;

  return hasErrors
    ? { valid: false, errors, data: data as SanitizedBookingData }
    : { valid: true, data: data as SanitizedBookingData };
}

/**
 * Создать HTTP response для validation error
 */
export function validationErrorResponse(errors: Record<string, string>): ValidationErrorResponse {
  return {
    status: 400,
    jsonBody: {
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: errors,
    },
  };
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

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
  sanitizePersonalCode,
  validateBookingInput,
  validationErrorResponse,
};
