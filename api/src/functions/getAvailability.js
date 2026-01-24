const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { isLatvianHoliday } = require('../services/latvianHolidays');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const BOOKINGS_TABLE = 'bookings';
const SETTINGS_TABLE = 'adminSettings';

// Default slots if no schedule is configured
const defaultSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
];

// Service types available
const serviceTypes = [
    {
        id: 'cgm-diagnostic',
        duration: 60,
        name: {
            lv: 'CGM diagnostika (60 min)',
            ru: 'CGM-диагностика (60 мин)',
            en: 'CGM Diagnostic (60 min)'
        }
    },
    {
        id: 'consultation',
        duration: 60,
        name: {
            lv: 'Uztura konsultācija (60 min)',
            ru: 'Консультация по питанию (60 мин)',
            en: 'Nutrition Consultation (60 min)'
        }
    },
    {
        id: 'free-consultation',
        duration: 15,
        name: {
            lv: 'Bezmaksas konsultācija (15 min)',
            ru: 'Бесплатная консультация (15 мин)',
            en: 'Free Consultation (15 min)'
        }
    }
];

// Day name to index mapping (0 = Sunday, 1 = Monday, etc.)
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Generate time slots from schedule
function generateSlotsFromSchedule(schedule, dayName) {
    const dayConfig = schedule[dayName];
    if (!dayConfig || !dayConfig.enabled) {
        return [];
    }
    
    const slots = [];
    const [startHour] = dayConfig.start.split(':').map(Number);
    const [endHour] = dayConfig.end.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
        slots.push(`${String(hour).padStart(2, '0')}:00`);
    }
    
    return slots;
}

// Fetch admin schedule settings
async function getScheduleSettings() {
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);
        const entity = await tableClient.getEntity('config', 'schedule');
        return JSON.parse(entity.value);
    } catch (e) {
        // Return default schedule
        return {
            monday: { enabled: true, start: '09:00', end: '18:00' },
            tuesday: { enabled: true, start: '09:00', end: '18:00' },
            wednesday: { enabled: true, start: '09:00', end: '18:00' },
            thursday: { enabled: true, start: '09:00', end: '18:00' },
            friday: { enabled: true, start: '09:00', end: '18:00' },
            saturday: { enabled: false, start: '09:00', end: '14:00' },
            sunday: { enabled: false, start: '09:00', end: '14:00' }
        };
    }
}

// Fetch blocked dates
async function getBlockedDates() {
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);
        const entity = await tableClient.getEntity('config', 'blockedDates');
        return JSON.parse(entity.value);
    } catch (e) {
        return [];
    }
}

// Fetch booked slots from bookings table (only active bookings)
async function getBookedSlots(startDate, endDate) {
    const bookedSlots = {};
    
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, BOOKINGS_TABLE);
        
        // Query bookings in date range that are NOT cancelled
        for await (const entity of tableClient.listEntities()) {
            // Skip cancelled bookings - they should free up the slot
            if (entity.status === 'cancelled') {
                continue;
            }
            
            const bookingDate = entity.date;
            
            // Check if booking is in our range
            if (bookingDate >= startDate && bookingDate <= endDate) {
                if (!bookedSlots[bookingDate]) {
                    bookedSlots[bookingDate] = [];
                }
                bookedSlots[bookingDate].push(entity.time);
            }
        }
    } catch (e) {
        // If table doesn't exist yet, return empty
        console.log('Could not fetch bookings:', e.message);
    }
    
    return bookedSlots;
}

app.http('getAvailability', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'availability/{date?}',
    handler: async (request, context) => {
        try {
            const date = request.params.date;
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const currentHour = today.getHours();
            const currentMinute = today.getMinutes();
            
            // Calculate date range
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 30);
            const endDateStr = endDate.toISOString().split('T')[0];
            
            // Fetch all necessary data in parallel
            const [schedule, blockedDatesArr, bookedSlots] = await Promise.all([
                getScheduleSettings(),
                getBlockedDates(),
                getBookedSlots(todayStr, endDateStr)
            ]);
            
            // Convert blocked dates array to Set for fast lookup
            const blockedDates = new Set(blockedDatesArr.map(d => d.date));
            
            if (!date) {
                // Return availability for next 30 days
                const slots = {};
                
                for (let i = 0; i <= 30; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() + i);
                    const dateStr = checkDate.toISOString().split('T')[0];
                    const dayOfWeek = checkDate.getDay();
                    const dayName = dayNames[dayOfWeek];
                    
                    // Skip if day is not enabled in schedule
                    if (!schedule[dayName] || !schedule[dayName].enabled) {
                        continue;
                    }
                    
                    // Skip Latvian public holidays
                    const holidayCheck = isLatvianHoliday(dateStr);
                    if (holidayCheck.isHoliday) {
                        continue;
                    }
                    
                    // Skip manually blocked dates
                    if (blockedDates.has(dateStr)) {
                        continue;
                    }
                    
                    // Generate slots based on schedule
                    let availableSlots = generateSlotsFromSchedule(schedule, dayName);
                    
                    // Remove already booked slots
                    const booked = bookedSlots[dateStr] || [];
                    availableSlots = availableSlots.filter(slot => !booked.includes(slot));
                    
                    // For today, filter out past times (with 30 min buffer)
                    if (dateStr === todayStr) {
                        const currentTotalMinutes = currentHour * 60 + currentMinute + 30;
                        availableSlots = availableSlots.filter(time => {
                            const [slotHour, slotMinute] = time.split(':').map(Number);
                            return (slotHour * 60 + slotMinute) > currentTotalMinutes;
                        });
                    }
                    
                    // Only add date if there are available slots
                    if (availableSlots.length > 0) {
                        slots[dateStr] = availableSlots;
                    }
                }
                
                return {
                    status: 200,
                    jsonBody: { 
                        slots,
                        booked: [],
                        serviceTypes
                    }
                };
            }
            
            // Return availability for specific date
            const checkDate = new Date(date);
            const dayOfWeek = checkDate.getDay();
            const dayName = dayNames[dayOfWeek];
            
            // Check if day is enabled
            if (!schedule[dayName] || !schedule[dayName].enabled) {
                return {
                    status: 200,
                    jsonBody: {
                        date,
                        slots: { [date]: [] },
                        booked: [],
                        serviceTypes,
                        reason: 'Day not available'
                    }
                };
            }
            
            // Check holiday
            const holidayCheck = isLatvianHoliday(date);
            if (holidayCheck.isHoliday) {
                return {
                    status: 200,
                    jsonBody: {
                        date,
                        slots: { [date]: [] },
                        booked: [],
                        serviceTypes,
                        reason: `Holiday: ${holidayCheck.name}`
                    }
                };
            }
            
            // Check blocked
            if (blockedDates.has(date)) {
                return {
                    status: 200,
                    jsonBody: {
                        date,
                        slots: { [date]: [] },
                        booked: [],
                        serviceTypes,
                        reason: 'Date blocked'
                    }
                };
            }
            
            // Generate available slots
            let availableSlots = generateSlotsFromSchedule(schedule, dayName);
            const booked = bookedSlots[date] || [];
            availableSlots = availableSlots.filter(slot => !booked.includes(slot));
            
            // For today, filter past times
            if (date === todayStr) {
                const currentTotalMinutes = currentHour * 60 + currentMinute + 30;
                availableSlots = availableSlots.filter(time => {
                    const [slotHour, slotMinute] = time.split(':').map(Number);
                    return (slotHour * 60 + slotMinute) > currentTotalMinutes;
                });
            }
            
            return {
                status: 200,
                jsonBody: {
                    date,
                    slots: { [date]: availableSlots },
                    booked: [],
                    serviceTypes
                }
            };
            
        } catch (error) {
            context.error('Error getting availability:', error);
            return {
                status: 500,
                jsonBody: { error: 'Internal server error', details: error.message }
            };
        }
    }
});
