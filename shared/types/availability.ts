/**
 * Availability-related TypeScript types
 * Shared between frontend and backend
 */

import type { ScheduleDay } from '../utils/constants';

/**
 * Day schedule configuration
 */
export interface DaySchedule {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
}

/**
 * Weekly schedule
 */
export type WeeklySchedule = Record<ScheduleDay, DaySchedule>;

/**
 * Schedule configuration
 */
export interface Schedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

/**
 * Holiday definition
 */
export interface Holiday {
    date: string; // yyyy-mm-dd
    name: string;
    recurring?: boolean; // If true, repeats every year
}

/**
 * Vacation period
 */
export interface Vacation {
    id?: string;
    startDate: string; // yyyy-mm-dd
    endDate: string; // yyyy-mm-dd
    reason?: string;
}

/**
 * Blocked date
 */
export interface BlockedDate {
    date: string; // yyyy-mm-dd
    reason?: string;
}

/**
 * Availability settings
 */
export interface AvailabilitySettings {
    schedule: Schedule;
    holidays: Holiday[];
    vacations: Vacation[];
    blockedDates: BlockedDate[];
    slotDuration: number; // minutes
    bufferTime?: number; // minutes between appointments
}

/**
 * Availability query parameters
 */
export interface AvailabilityQuery {
    startDate: string; // yyyy-mm-dd
    endDate: string; // yyyy-mm-dd
    service?: string;
}

/**
 * Availability response for a date range
 */
export interface AvailabilityResponse {
    dates: {
        date: string;
        available: boolean;
        slots: {
            time: string;
            available: boolean;
        }[];
    }[];
}
