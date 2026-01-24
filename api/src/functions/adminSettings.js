const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { getLatvianHolidays, getHolidaysInRange } = require('../services/latvianHolidays');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const SETTINGS_TABLE = 'adminSettings';
const PARTITION_KEY = 'config';

// Helper to ensure table exists
async function ensureTable(tableName) {
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, tableName);
        await tableClient.createTable();
    } catch (error) {
        // Table already exists, ignore
        if (error.statusCode !== 409) {
            throw error;
        }
    }
}

// Get availability settings
app.http('adminGetAvailability', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'admin/availability',
    handler: async (request, context) => {
        try {
            await ensureTable(SETTINGS_TABLE);
            
            const tableClient = TableClient.fromConnectionString(
                connectionString,
                SETTINGS_TABLE
            );

            let schedule = null;
            let blockedDates = [];

            try {
                const entity = await tableClient.getEntity(PARTITION_KEY, 'schedule');
                schedule = JSON.parse(entity.value);
            } catch (e) {
                // No schedule saved yet, return defaults
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
                const entity = await tableClient.getEntity(PARTITION_KEY, 'blockedDates');
                blockedDates = JSON.parse(entity.value);
            } catch (e) {
                // No blocked dates
            }

            return {
                status: 200,
                jsonBody: { schedule, blockedDates }
            };
        } catch (error) {
            context.error('Error fetching availability:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch availability', details: error.message }
            };
        }
    }
});

// Update availability schedule
app.http('adminUpdateAvailability', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'admin/availability',
    handler: async (request, context) => {
        try {
            await ensureTable(SETTINGS_TABLE);
            
            const body = await request.json();
            const tableClient = TableClient.fromConnectionString(
                connectionString,
                SETTINGS_TABLE
            );

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
            context.error('Error updating availability:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to update availability', details: error.message }
            };
        }
    }
});

// Add blocked date
app.http('adminAddBlockedDate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'admin/availability/block',
    handler: async (request, context) => {
        try {
            await ensureTable(SETTINGS_TABLE);
            
            const body = await request.json();
            const tableClient = TableClient.fromConnectionString(
                connectionString,
                SETTINGS_TABLE
            );

            // Get existing blocked dates
            let blockedDates = [];
            try {
                const entity = await tableClient.getEntity(PARTITION_KEY, 'blockedDates');
                blockedDates = JSON.parse(entity.value);
            } catch (e) {
                // No blocked dates yet
            }

            // Add new date if not exists
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
            context.error('Error adding blocked date:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to add blocked date', details: error.message }
            };
        }
    }
});

// Remove blocked date
app.http('adminRemoveBlockedDate', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'admin/availability/block',
    handler: async (request, context) => {
        try {
            await ensureTable(SETTINGS_TABLE);
            
            const body = await request.json();
            const tableClient = TableClient.fromConnectionString(
                connectionString,
                SETTINGS_TABLE
            );

            // Get existing blocked dates
            let blockedDates = [];
            try {
                const entity = await tableClient.getEntity(PARTITION_KEY, 'blockedDates');
                blockedDates = JSON.parse(entity.value);
            } catch (e) {
                // No blocked dates
            }

            // Remove date
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
            context.error('Error removing blocked date:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to remove blocked date', details: error.message }
            };
        }
    }
});

// Get site settings
app.http('adminGetSettings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'admin/settings',
    handler: async (request, context) => {
        try {
            await ensureTable(SETTINGS_TABLE);
            
            const tableClient = TableClient.fromConnectionString(
                connectionString,
                SETTINGS_TABLE
            );

            let settings = {
                prices: { initial: 65, followup: 45 },
                contact: { email: '', phone: '', address: '' },
                duration: { initial: 60, followup: 30 },
                bank: { name: '', iban: '' }
            };

            try {
                const entity = await tableClient.getEntity(PARTITION_KEY, 'siteSettings');
                settings = JSON.parse(entity.value);
            } catch (e) {
                // No settings saved yet
            }

            return {
                status: 200,
                jsonBody: settings
            };
        } catch (error) {
            context.error('Error fetching settings:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch settings', details: error.message }
            };
        }
    }
});

// Update site settings
app.http('adminUpdateSettings', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'admin/settings',
    handler: async (request, context) => {
        try {
            await ensureTable(SETTINGS_TABLE);
            
            const settings = await request.json();
            const tableClient = TableClient.fromConnectionString(
                connectionString,
                SETTINGS_TABLE
            );

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
            context.error('Error updating settings:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to update settings', details: error.message }
            };
        }
    }
});

// Get Latvian holidays
app.http('getHolidays', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'holidays',
    handler: async (request, context) => {
        try {
            const url = new URL(request.url);
            const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear();
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
            context.error('Error fetching holidays:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch holidays', details: error.message }
            };
        }
    }
});
