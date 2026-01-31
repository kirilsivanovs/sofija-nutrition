/**
 * Core type definitions for the booking system
 */

// ============================================
// Database Entities
// ============================================

export interface Booking {
  partitionKey: string;  // date (YYYY-MM-DD)
  rowKey: string;        // guid
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  service: string;
  serviceName?: string;
  servicePrice?: number;
  format: 'online' | 'in-person';
  notes?: string;
  status: BookingStatus;
  confirmationCode: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  language: Language;
  paymentStatus?: PaymentStatus;
  reminderSent?: boolean;
  reminder2hSent?: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type Language = 'lv' | 'ru' | 'en';

export interface Service {
  partitionKey: string;  // "SERVICE"
  rowKey: string;        // serviceId
  serviceId: string;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  duration: number;      // minutes
  allowOnline: boolean;
  allowInPerson: boolean;
  isActive: boolean;
  sortOrder: number;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
}

export interface LocalizedString {
  lv: string;
  ru: string;
  en: string;
}

export interface FeatureFlag {
  partitionKey: string;  // "FEATURE"
  rowKey: string;        // featureId
  featureName: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

export interface AdminSettings {
  partitionKey: string;  // "config"
  rowKey: string;        // setting type
  [key: string]: unknown;
}

export interface WorkSchedule extends AdminSettings {
  rowKey: 'schedule';
  schedule: DaySchedule;
}

export interface DaySchedule {
  [day: string]: {
    enabled: boolean;
    start: string;  // "09:00"
    end: string;    // "17:00"
  };
}

export interface VacationSettings extends AdminSettings {
  rowKey: 'vacations';
  vacations: Vacation[];
}

export interface Vacation {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface BlockedDate extends AdminSettings {
  rowKey: 'blockedDates';
  blockedDates: string[];  // array of dates YYYY-MM-DD
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateBookingRequest {
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  service: string;
  format: 'online' | 'in-person';
  notes?: string;
  language?: Language;
}

export interface CreateBookingResponse {
  success: boolean;
  booking: {
    id: string;
    confirmationCode: string;
    date: string;
    time: string;
    service: string;
    format: string;
  };
  message: string;
}

export interface ConfirmPaymentRequest {
  bookingId: string;
  confirmationCode: string;
}

export interface AvailabilityResponse {
  dates: {
    [date: string]: TimeSlot[];
  };
  services: ServiceInfo[];
  schedule: DaySchedule;
  blockedDates: string[];
  vacations: Vacation[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
  locked?: boolean;
  lockedUntil?: string;
}

export interface ServiceInfo {
  id: string;
  name: LocalizedString;
  price: number;
  duration: number;
  allowOnline: boolean;
  allowInPerson: boolean;
}

// ============================================
// Configuration Types
// ============================================

export interface AppConfig {
  env: EnvConfig;
  tables: TableNames;
  cache: CacheConfig;
  booking: BookingConfig;
  schedule: ScheduleConfig;
  rateLimits: RateLimitsConfig;
  branding: BrandingConfig;
  payment: PaymentConfig;
  servicePrices: ServicePrices;
  colors: ColorsConfig;
  defaultServices: DefaultService[];
  validServiceIds: string[];
}

export interface EnvConfig {
  nodeEnv: string;
  azureStorageConnectionString: string;
  resendApiKey: string;
  apiBaseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

export interface TableNames {
  bookings: string;
  settings: string;
  services: string;
  servicesHistory: string;
  featureFlags: string;
}

export interface CacheConfig {
  servicesTtlMs: number;
  featureFlagsTtlMs: number;
}

export interface BookingConfig {
  slotLockDurationMs: number;
  lockTtlMs: number;
  confirmationCodeLength: number;
  maxBookingsPerDay: number;
  minBookingAdvanceHours: number;
  maxBookingAdvanceDays: number;
}

export interface ScheduleConfig {
  timezone: string;
  slotDurationMinutes: number;
  breakBetweenSlotsMinutes: number;
  defaultWorkingHours: DaySchedule;
}

export interface RateLimitsConfig {
  createBooking: RateLimitRule;
  confirmPayment: RateLimitRule;
  getAvailability: RateLimitRule;
  admin: RateLimitRule;
  default: RateLimitRule;
  [endpoint: string]: RateLimitRule;
}

export interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export interface BrandingConfig {
  name: string;
  website: string;
  websiteUrl: string;
  email: string;
  emailDomain: string;
  phone: string;
  address: string;
  registrationNumber: string;
}

export interface PaymentConfig {
  bank: string;
  bankName: string;
  iban: string;
  swift: string;
  recipientName: string;
  currency: string;
}

export interface ServicePrices {
  [serviceId: string]: number;
}

export interface ColorsConfig {
  primary: string;
  primaryRgb: { r: number; g: number; b: number };
  secondary: string;
  accent: string;
  accentRgb: { r: number; g: number; b: number };
  success: string;
  error: string;
  warning: string;
}

export interface DefaultService {
  id: string;
  duration: number;
  name: LocalizedString;
}

// ============================================
// Service Layer Types
// ============================================

export interface BookingServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface PdfGenerationResult {
  buffer: Buffer;
  filename: string;
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ============================================
// Translation Types
// ============================================

export interface TranslationObject {
  // Email translations
  emailSubject: (id: string) => string;
  emailGreeting: (name: string) => string;
  emailThankYou: string;
  emailConfirmed: string;
  emailBookingId: string;
  emailService: string;
  emailFormat: string;
  emailDate: string;
  emailTime: string;
  emailPrice: string;
  emailInvoiceAttached: string;
  emailQuestions: string;
  emailRegards: string;
  emailSubtitle: string;
  
  // Formats
  formatOnline: string;
  formatInPerson: string;
  
  // Payment
  paymentConfirmedSubject: (id: string) => string;
  paymentConfirmedTitle: string;
  paymentConfirmedText: string;
  paymentWaitingText: string;
  
  // Cancellation
  cancellationSubject: (id: string) => string;
  cancellationTitle: string;
  cancellationText: string;
  cancellationDetails: string;
  cancellationQuestions: string;
  
  // PDF
  pdfSubtitle: string;
  pdfInvoice: string;
  pdfNumber: string;
  pdfDate: string;
  pdfClient: string;
  pdfName: string;
  pdfEmail: string;
  pdfPhone: string;
  pdfFormat: string;
  pdfService: string;
  pdfTime: string;
  pdfPrice: string;
  pdfTotal: string;
  pdfPaymentInfo: string;
  pdfBank: string;
  pdfReference: string;
  pdfNotes: string;
  pdfThankYou: string;
  pdfNotProvided: string;
  
  // Services
  services: Record<string, string>;
  
  // Allow additional properties
  [key: string]: unknown;
}
