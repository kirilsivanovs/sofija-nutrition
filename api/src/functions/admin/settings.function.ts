/**
 * Admin Settings Functions
 * Handle admin operations for availability and site settings
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { TableClient } from '@azure/data-tables';
import { getLatvianHolidays, getHolidaysInRange } from '../services/latvianHolidays';
import { checkAuthorization, unauthorizedResponse } from '../utils/authMiddleware';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const SETTINGS_TABLE = 'adminSettings';
const PARTITION_KEY = 'config';

interface DaySchedule {
    enabled: boolean;
    start: string;
    end: string;
}

interface WeekSchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

interface BlockedDate {
    date: string;
    reason?: string;
}

interface VacationPeriod {
    id: string;
    startDate: string;
    endDate: string;
    reason?: string;
}

interface SettingsEntity {
    partitionKey: string;
    rowKey: string;
    value: string;
    updatedAt?: string;
}

interface SiteSettings {
    prices: { initial: number; followup: number };
    contact: { email: string; phone: string; address: string };
    duration: { initial: number; followup: number };
    bank: { name: string; iban: string };
}

// Helper to ensure table exists
async function ensureTable(tableName: string): Promise<void> {
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, tableName);
        await tableClient.createTable();
    } catch (error) {
        const err = error as { statusCode?: number };
        if (err.statusCode !== 409) {
            throw error;
        }
    }
}

// Get availability settings
app.http('adminGetAvailability', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/availability',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            await ensureTable(SETTINGS_TABLE);
            
            const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);

            let schedule: WeekSchedule;
            let blockedDates: BlockedDate[] = [];
            let vacationPeriods: VacationPeriod[] = [];

            try {
                const entity = await tableClient.getEntity<SettingsEntity>(PARTITION_KEY, 'schedule');
                schedule = JSON.parse(entity.value);
            } catch {
                schedule = {
                    monday: { enabled: true, start: '09:00', end: '17:00' },
                    tuesday: { enabled: true, start: '09:00', end: '17:00' },
                    wednesday: { enabled: true, start: '09:00', end: '17:00' },
                    thursday: { enabled: true, start: '09:00', end: '17:00' },
                    friday: { enabled: true, start: '09:00', end: '17:00' },
                    saturday: { enabled: false, start: '09:00', end: '17:00' },
                    sunday: { enabled: false, start: '09:00', end: '17:00' }
                };
            }

            try {
                const entity = await tableClient.getEntity<SettingsEntity>(PARTITION_KEY, 'blockedDates');
                blockedDates = JSON.parse(entity.value);
            } catch {
                // No blocked dates
            }

            try {
                const entity = await tableClient.getEntity<SettingsEntity>(PARTITION_KEY, 'vacationPeriods');
                vacationPeriods = JSON.parse(entity.value);
            } catch {
                // No vacation periods
            }

            return {
                status: 200,
                jsonBody: { schedule, blockedDates, vacationPeriods }
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error fetching availability:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch availability', details: err.message }
            };
        }
    }
});

// Update availability schedule
app.http('adminUpdateAvailability', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'dashboard/availability',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            await ensureTable(SETTINGS_TABLE);
            
            const body = await request.json() as { schedule: WeekSchedule };
            const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);

            await tableClient.upsertEntity({
                partitionKey: PARTITION_KEY,
                rowKey: 'schedule',
                value: JSON.stringify(body.schedule),
                updatedAt: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { success: true }
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error updating availability:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to update availability', details: err.message }
            };
        }
    }
});

// Add blocked date
app.http('adminAddBlockedDate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'dashboard/availability/block',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            await ensureTable(SETTINGS_TABLE);
            
            const body = await request.json() as BlockedDate;
            const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);

            let blockedDates: BlockedDate[] = [];
            try {
                const entity = await tableClient.getEntity<SettingsEntity>(PARTITION_KEY, 'blockedDates');
                blockedDates = JSON.parse(entity.value);
            } catch {
                // No blocked dates yet
            }

            if (!blockedDates.find(d => d.date === body.date)) {
                blockedDates.push({
                    date: body.date,
                    reason: body.reason || ''
                });
                blockedDates.sort((a, b) => a.date.localeCompare(b.date));
            }

            await tableClient.upsertEntity({
                partitionKey: PARTITION_KEY,
                rowKey: 'blockedDates',
                value: JSON.stringify(blockedDates),
                updatedAt: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { success: true, blockedDates }
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error adding blocked date:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to add blocked date', details: err.message }
            };
        }
    }
});

// Remove blocked date
app.http('adminRemoveBlockedDate', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'dashboard/availability/block',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            await ensureTable(SETTINGS_TABLE);
            
            const body = await request.json() as { date: string };
            const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);

            let blockedDates: BlockedDate[] = [];
            try {
                const entity = await tableClient.getEntity<SettingsEntity>(PARTITION_KEY, 'blockedDates');
                blockedDates = JSON.parse(entity.value);
            } catch {
                // No blocked dates
            }

            blockedDates = blockedDates.filter(d => d.date !== body.date);

            await tableClient.upsertEntity({
                partitionKey: PARTITION_KEY,
                rowKey: 'blockedDates',
                value: JSON.stringify(blockedDates),
                updatedAt: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { success: true, blockedDates }
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error removing blocked date:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to remove blocked date', details: err.message }
            };
        }
    }
});

// Get site settings
app.http('adminGetSettings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/settings',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            await ensureTable(SETTINGS_TABLE);
            
            const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);

            let settings: SiteSettings = {
                prices: { initial: 65, followup: 45 },
                contact: { email: '', phone: '', address: '' },
                duration: { initial: 60, followup: 30 },
                bank: { name: '', iban: '' }
            };

            try {
                const entity = await tableClient.getEntity<SettingsEntity>(PARTITION_KEY, 'siteSettings');
                settings = JSON.parse(entity.value);
            } catch {
                // No settings saved yet
            }

            return {
                status: 200,
                jsonBody: settings
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error fetching settings:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch settings', details: err.message }
            };
        }
    }
});

// Update site settings
app.http('adminUpdateSettings', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'dashboard/settings',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            await ensureTable(SETTINGS_TABLE);
            
            const settings = await request.json() as SiteSettings;
            const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);

            await tableClient.upsertEntity({
                partitionKey: PARTITION_KEY,
                rowKey: 'siteSettings',
                value: JSON.stringify(settings),
                updatedAt: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { success: true }
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error updating settings:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to update settings', details: err.message }
            };
        }
    }
});

// Get Latvian holidays
app.http('getHolidays', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'holidays',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            const url = new URL(request.url);
            const year = parseInt(url.searchParams.get('year') || '') || new Date().getFullYear();
            const startDate = url.searchParams.get('start');
            const endDate = url.searchParams.get('end');

            let holidays;
            if (startDate && endDate) {
                holidays = getHolidaysInRange(startDate, endDate);
            } else {
                holidays = getLatvianHolidays(year);
            }

            return {
                status: 200,
                jsonBody: { holidays, year }
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error fetching holidays:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch holidays', details: err.message }
            };
        }
    }
});

// Add vacation period
app.http('adminAddVacation', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'dashboard/availability/vacation',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            await ensureTable(SETTINGS_TABLE);
            
            const body = await request.json() as { startDate: string; endDate: string; reason?: string };
            const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);

            let vacationPeriods: VacationPeriod[] = [];
            try {
                const entity = await tableClient.getEntity<SettingsEntity>(PARTITION_KEY, 'vacationPeriods');
                vacationPeriods = JSON.parse(entity.value);
            } catch {
                // No vacation periods yet
            }

            const newVacation: VacationPeriod = {
                id: Date.now().toString(),
                startDate: body.startDate,
                endDate: body.endDate,
                reason: body.reason || ''
            };
            vacationPeriods.push(newVacation);
            vacationPeriods.sort((a, b) => a.startDate.localeCompare(b.startDate));

            await tableClient.upsertEntity({
                partitionKey: PARTITION_KEY,
                rowKey: 'vacationPeriods',
                value: JSON.stringify(vacationPeriods),
                updatedAt: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { success: true, vacation: newVacation }
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error adding vacation:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to add vacation', details: err.message }
            };
        }
    }
});

// Delete vacation period
app.http('adminDeleteVacation', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'dashboard/availability/vacation',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            await ensureTable(SETTINGS_TABLE);
            
            const body = await request.json() as { id: string };
            const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);

            let vacationPeriods: VacationPeriod[] = [];
            try {
                const entity = await tableClient.getEntity<SettingsEntity>(PARTITION_KEY, 'vacationPeriods');
                vacationPeriods = JSON.parse(entity.value);
            } catch {
                return { status: 404, jsonBody: { error: 'No vacation periods found' } };
            }

            vacationPeriods = vacationPeriods.filter(v => v.id !== body.id);

            await tableClient.upsertEntity({
                partitionKey: PARTITION_KEY,
                rowKey: 'vacationPeriods',
                value: JSON.stringify(vacationPeriods),
                updatedAt: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { success: true }
            };
        } catch (error) {
            const err = error as Error;
            context.error('Error deleting vacation:', err);
            return {
                status: 500,
                jsonBody: { error: 'Failed to delete vacation', details: err.message }
            };
        }
    }
});
