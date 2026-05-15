/**
 * AvailabilityService (TypeScript)
 * 
 * Handles schedule settings, blocked dates, vacation periods, and slot availability calculations.
 */

import { TableClient } from '@azure/data-tables';
import { isLatvianHoliday } from './latvianHolidays';
import {
  env,
  tables,
  cache,
  schedule as scheduleConfig,
  defaultServices as DEFAULT_SERVICES
} from '../config';
import type { DaySchedule, TimeSlot, ServiceInfo, Vacation } from '../types';

// ============================================
// Types
// ============================================

export interface AvailabilityOptions {
  specificDate?: string | null;
  daysAhead?: number;
}

export interface AvailabilityResult {
  date?: string;
  slots: Record<string, string[]>;
  booked: string[];
  serviceTypes: ServiceType[];
  reason?: string | null;
}

export interface ServiceType {
  id: string;
  duration: number;
  name: {
    lv: string;
    ru: string;
    en: string;
  };
}

export interface DateAvailability {
  available: boolean;
  reason: string | null;
  slots: string[];
}

export interface BlockedDate {
  date: string;
  reason?: string;
}

export interface VacationPeriod {
  startDate: string;
  endDate: string;
  reason?: string;
}

// ============================================
// Constants
// ============================================

const connectionString = env.azureStorageConnectionString;
const BOOKINGS_TABLE = tables.bookings;
const SETTINGS_TABLE = tables.settings;
const SERVICES_TABLE = tables.services;
const PARTITION_KEY = 'SERVICE';

// Cache for service settings
let servicesCache: ServiceType[] | null = null;
let servicesCacheTime: number | null = null;
const CACHE_TTL_MS = cache.servicesTtlMs;

// Day name to index mapping (0 = Sunday, 1 = Monday, etc.)
export const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Default schedule configuration from centralized config
 */
export const DEFAULT_SCHEDULE = scheduleConfig.defaultWorkingHours;

// ============================================
// Service Settings
// ============================================

/**
 * Load service settings from database
 * Returns only active services (isActive = true)
 * Uses caching to reduce database requests
 */
export async function getServiceSettings(): Promise<ServiceType[]> {
  const now = Date.now();
  if (servicesCache && servicesCacheTime && (now - servicesCacheTime < CACHE_TTL_MS)) {
    return servicesCache;
  }

  try {
    const tableClient = TableClient.fromConnectionString(connectionString, SERVICES_TABLE);
    const services: ServiceType[] = [];

    for await (const entity of tableClient.listEntities()) {
      if (entity.partitionKey === PARTITION_KEY && entity.isActive !== false) {
        services.push({
          id: entity.serviceId as string,
          duration: entity.durationMinutes as number,
          name: {
            lv: entity.serviceName_LV as string,
            ru: entity.serviceName_RU as string,
            en: entity.serviceName_EN as string
          }
        });
      }
    }

    servicesCache = services;
    servicesCacheTime = Date.now();

    return services;
  } catch {
    return DEFAULT_SERVICES as ServiceType[];
  }
}

// ============================================
// Schedule Settings
// ============================================

/**
 * Generate time slots from schedule configuration
 */
export function generateSlotsFromSchedule(schedule: DaySchedule, dayName: string): string[] {
  const dayConfig = schedule[dayName];
  if (!dayConfig || !dayConfig.enabled) {
    return [];
  }

  const slots: string[] = [];
  const [startHour] = dayConfig.start.split(':').map(Number);
  const [endHour] = dayConfig.end.split(':').map(Number);

  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
  }

  return slots;
}

/**
 * Fetch admin schedule settings from database
 */
export async function getScheduleSettings(): Promise<DaySchedule> {
  try {
    const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);
    const entity = await tableClient.getEntity('config', 'schedule');
    return JSON.parse(entity.value as string);
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

/**
 * Fetch blocked dates from database
 */
export async function getBlockedDates(): Promise<BlockedDate[]> {
  try {
    const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);
    const entity = await tableClient.getEntity('config', 'blockedDates');
    return JSON.parse(entity.value as string);
  } catch {
    return [];
  }
}

/**
 * Fetch vacation periods from database
 */
export async function getVacationPeriods(): Promise<VacationPeriod[]> {
  try {
    const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);
    const entity = await tableClient.getEntity('config', 'vacationPeriods');
    return JSON.parse(entity.value as string);
  } catch {
    return [];
  }
}

/**
 * Check if date is within any vacation period
 */
export function isDateInVacation(dateStr: string, vacationPeriods: VacationPeriod[]): boolean {
  return vacationPeriods.some(v => dateStr >= v.startDate && dateStr <= v.endDate);
}

// ============================================
// Booked Slots
// ============================================

/**
 * Fetch booked slots from bookings table (only active bookings)
 */
export async function getBookedSlots(startDate: string, endDate: string): Promise<Record<string, string[]>> {
  const bookedSlots: Record<string, string[]> = {};

  try {
    const tableClient = TableClient.fromConnectionString(connectionString, BOOKINGS_TABLE);

    for await (const entity of tableClient.listEntities()) {
      // Skip cancelled bookings
      if (entity.status === 'cancelled') {
        continue;
      }

      const bookingDate = entity.date as string;

      if (bookingDate >= startDate && bookingDate <= endDate) {
        if (!bookedSlots[bookingDate]) {
          bookedSlots[bookingDate] = [];
        }
        bookedSlots[bookingDate].push(entity.time as string);
      }
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    // Silently handle - empty booked slots is acceptable fallback
  }

  return bookedSlots;
}

// ============================================
// Availability Check
// ============================================

/**
 * Get availability for a date range
 */
export async function getAvailability(options: AvailabilityOptions = {}): Promise<AvailabilityResult> {
  const { specificDate, daysAhead = 90 } = options;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();

  // Calculate date range
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + daysAhead);
  const endDateStr = endDate.toISOString().split('T')[0];

  // Fetch all necessary data in parallel
  const [schedule, blockedDatesArr, vacationPeriods, bookedSlots, serviceTypes] = await Promise.all([
    getScheduleSettings(),
    getBlockedDates(),
    getVacationPeriods(),
    getBookedSlots(todayStr, endDateStr),
    getServiceSettings()
  ]);

  const blockedDates = new Set(blockedDatesArr.map(d => d.date));

  /**
   * Filter slots for today (remove past times with 30 min buffer)
   */
  const filterTodaySlots = (slots: string[], dateStr: string): string[] => {
    if (dateStr !== todayStr) {
      return slots;
    }
    const currentTotalMinutes = currentHour * 60 + currentMinute + 30;
    return slots.filter(time => {
      const [slotHour, slotMinute] = time.split(':').map(Number);
      return (slotHour * 60 + slotMinute) > currentTotalMinutes;
    });
  };

  /**
   * Check if a specific date is available and return available slots
   */
  const checkDateAvailability = (dateStr: string): DateAvailability => {
    const checkDate = new Date(dateStr);
    const dayOfWeek = checkDate.getDay();
    const dayName = dayNames[dayOfWeek];

    // Check if day is enabled in schedule
    if (!schedule[dayName] || !schedule[dayName].enabled) {
      return { available: false, reason: 'Day not available', slots: [] };
    }

    // Check Latvian public holidays
    const holidayCheck = isLatvianHoliday(dateStr);
    if (holidayCheck.isHoliday) {
      return { available: false, reason: `Holiday: ${holidayCheck.name}`, slots: [] };
    }

    // Check manually blocked dates
    if (blockedDates.has(dateStr)) {
      return { available: false, reason: 'Date blocked', slots: [] };
    }

    // Check vacation periods
    if (isDateInVacation(dateStr, vacationPeriods)) {
      return { available: false, reason: 'Vacation period', slots: [] };
    }

    // Generate available slots
    let availableSlots = generateSlotsFromSchedule(schedule, dayName);

    // Remove booked slots
    const booked = bookedSlots[dateStr] || [];
    availableSlots = availableSlots.filter(slot => !booked.includes(slot));

    // Filter today's past times
    availableSlots = filterTodaySlots(availableSlots, dateStr);

    return {
      available: availableSlots.length > 0,
      slots: availableSlots,
      reason: null
    };
  };

  // Handle specific date query
  if (specificDate) {
    const result = checkDateAvailability(specificDate);
    return {
      date: specificDate,
      slots: { [specificDate]: result.slots },
      booked: [],
      serviceTypes,
      reason: result.reason
    };
  }

  // Handle range query (all available dates)
  const slots: Record<string, string[]> = {};

  for (let i = 0; i <= daysAhead; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const result = checkDateAvailability(dateStr);

    if (result.available) {
      slots[dateStr] = result.slots;
    }
  }

  return {
    slots,
    booked: [],
    serviceTypes
  };
}

/**
 * Check if a specific slot is available
 */
export async function isSlotAvailable(date: string, time: string): Promise<boolean> {
  const result = await getAvailability({ specificDate: date });
  const slotsForDate = result.slots[date] || [];
  return slotsForDate.includes(time);
}

/**
 * Clear the services cache (useful for testing or after admin changes)
 */
export function clearServicesCache(): void {
  servicesCache = null;
  servicesCacheTime = null;
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  getAvailability,
  isSlotAvailable,
  getServiceSettings,
  getScheduleSettings,
  getBlockedDates,
  getVacationPeriods,
  getBookedSlots,
  clearServicesCache,
  generateSlotsFromSchedule,
  isDateInVacation,
  DEFAULT_SCHEDULE,
  DEFAULT_SERVICES,
  dayNames
};
