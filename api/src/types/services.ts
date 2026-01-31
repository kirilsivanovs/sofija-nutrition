/**
 * Service Layer Type Definitions
 * 
 * These interfaces define the contracts for all service layer operations.
 * Used for both TypeScript migration and documentation.
 */

import type { 
  Booking, 
  BookingStatus, 
  Language, 
  Service, 
  FeatureFlag,
  CreateBookingRequest,
  TimeSlot,
  Vacation,
  DaySchedule
} from './index';

// ============================================
// Booking Service Types
// ============================================

export interface BookingServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export interface CreateBookingResult {
  booking: {
    id: string;
    confirmationCode: string;
    date: string;
    time: string;
    service: string;
    format: string;
    status: BookingStatus;
  };
  emailSent: boolean;
  message: string;
}

export interface ConfirmBookingResult {
  booking: Booking;
  message: string;
}

export interface CancelBookingResult {
  booking: Booking;
  message: string;
}

export interface IBookingService {
  createBooking(request: CreateBookingRequest): Promise<BookingServiceResult<CreateBookingResult>>;
  confirmBooking(bookingId: string, token: string): Promise<BookingServiceResult<ConfirmBookingResult>>;
  cancelBooking(bookingId: string, reason?: string): Promise<BookingServiceResult<CancelBookingResult>>;
  getBooking(bookingId: string): Promise<Booking | null>;
}

// ============================================
// Availability Service Types
// ============================================

export interface AvailabilityRequest {
  startDate: string;
  endDate: string;
  serviceId?: string;
}

export interface AvailabilityResult {
  dates: Record<string, TimeSlot[]>;
  services: ServiceInfo[];
  schedule: DaySchedule;
  blockedDates: string[];
  vacations: Vacation[];
}

export interface ServiceInfo {
  id: string;
  name: {
    lv: string;
    ru: string;
    en: string;
  };
  price: number;
  duration: number;
  allowOnline: boolean;
  allowInPerson: boolean;
}

export interface IAvailabilityService {
  getAvailability(request: AvailabilityRequest): Promise<AvailabilityResult>;
  isSlotAvailable(date: string, time: string, serviceId?: string): Promise<boolean>;
}

// ============================================
// Booking Repository Types
// ============================================

export interface SlotLockResult {
  success: boolean;
  lockId: string | null;
}

export interface IBookingRepository {
  saveBooking(booking: Booking): Promise<boolean>;
  getBooking(bookingId: string): Promise<Booking | null>;
  updateBooking(booking: Booking): Promise<boolean>;
  isSlotBooked(date: string, time: string): Promise<boolean>;
  acquireSlotLock(date: string, time: string): Promise<SlotLockResult>;
  releaseSlotLock(date: string, time: string, lockId: string): Promise<void>;
  generateBookingId(): string;
  generatePaymentToken(bookingId: string, email: string): string;
  verifyPaymentToken(token: string, bookingId: string, email: string): boolean;
}

// ============================================
// Email Service Types
// ============================================

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailService {
  isConfigured(): boolean;
  sendEmail(options: SendEmailOptions): Promise<EmailResult>;
  sendClientConfirmation(booking: Booking, pdfBuffer?: Buffer): Promise<EmailResult>;
  sendAdminNotification(booking: Booking): Promise<EmailResult>;
  sendCancellationEmail(booking: Booking): Promise<EmailResult>;
  sendReminderEmail(booking: Booking, hoursUntil: number): Promise<EmailResult>;
}

// ============================================
// PDF Service Types
// ============================================

export interface PdfGenerationOptions {
  booking: Booking;
  service?: Service;
  language?: Language;
}

export interface IPdfService {
  generateInvoicePDF(options: PdfGenerationOptions): Promise<Buffer>;
}

// ============================================
// Feature Flags Service Types
// ============================================

export interface IFeatureFlagsService {
  isFeatureEnabled(featureName: string): Promise<boolean>;
  getAllFeatureFlags(): Promise<FeatureFlag[]>;
  updateFeatureFlag(featureId: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag>;
  clearCache(): void;
}

// ============================================
// Rate Limiter Types
// ============================================

export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface IRateLimiter {
  checkLimit(key: string, endpoint: string): Promise<RateLimitCheck>;
  resetLimit(key: string): void;
}

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface IValidator {
  validateBookingRequest(request: CreateBookingRequest): ValidationResult;
  validateEmail(email: string): boolean;
  validatePhone(phone: string): boolean;
  validateDate(date: string): boolean;
  validateTime(time: string): boolean;
}

// ============================================
// Security Logger Types
// ============================================

export type SecurityEventType = 
  | 'auth_failure'
  | 'auth_success'
  | 'rate_limit_exceeded'
  | 'suspicious_request'
  | 'injection_attempt'
  | 'unauthorized_access';

export interface SecurityEvent {
  type: SecurityEventType;
  ip: string;
  path: string;
  method: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ISecurityLogger {
  logAuthFailure(request: unknown, reason: string): void;
  logAuthSuccess(request: unknown, userId: string): void;
  logRateLimitExceeded(request: unknown, endpoint: string): void;
  logSuspiciousRequest(request: unknown, reason: string): void;
  getRecentEvents(count?: number): SecurityEvent[];
}
