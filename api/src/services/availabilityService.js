/**
 * AvailabilityService - Business logic for availability operations
 * 
 * Handles schedule settings, blocked dates, vacation periods, and slot availability calculations.
 */

const { TableClient } = require('@azure/data-tables');
const { isLatvianHoliday } = require('./latvianHolidays');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const BOOKINGS_TABLE = 'bookings';
const SETTINGS_TABLE = 'adminSettings';
const SERVICES_TABLE = 'Services';
const PARTITION_KEY = 'SERVICE';

// Cache for service settings (TTL 5 minutes)
let servicesCache = null;
let servicesCacheTime = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

// Day name to index mapping (0 = Sunday, 1 = Monday, etc.)
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Default schedule configuration
 */
const DEFAULT_SCHEDULE = {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '09:00', end: '14:00' },
    sunday: { enabled: false, start: '09:00', end: '14:00' }
};

/**
 * Default service types for fallback
 */
const DEFAULT_SERVICES = [
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

/**
 * Load service settings from database
 * Returns only active services (isActive = true)
 * Uses caching to reduce database requests
 */
async function getServiceSettings() {
    const now = Date.now();
    if (servicesCache && servicesCacheTime && (now - servicesCacheTime < CACHE_TTL_MS)) {
        return servicesCache;
    }
    
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, SERVICES_TABLE);
        const services = [];
        
        for await (const entity of tableClient.listEntities()) {
            if (entity.partitionKey === PARTITION_KEY && entity.isActive !== false) {
                services.push({
                    id: entity.serviceId,
                    duration: entity.durationMinutes,
                    name: {
                        lv: entity.serviceName_LV,
                        ru: entity.serviceName_RU,
                        en: entity.serviceName_EN
                    }
                });
            }
        }
        
        servicesCache = services;
        servicesCacheTime = Date.now();
        
        return services;
    } catch (e) {
        return DEFAULT_SERVICES;
    }
}

/**
 * Generate time slots from schedule configuration
 */
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

/**
 * Fetch admin schedule settings from database
 */
async function getScheduleSettings() {
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);
        const entity = await tableClient.getEntity('config', 'schedule');
        return JSON.parse(entity.value);
    } catch (e) {
        return DEFAULT_SCHEDULE;
    }
}

/**
 * Fetch blocked dates from database
 */
async function getBlockedDates() {
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);
        const entity = await tableClient.getEntity('config', 'blockedDates');
        return JSON.parse(entity.value);
    } catch (e) {
        return [];
    }
}

/**
 * Fetch vacation periods from database
 */
async function getVacationPeriods() {
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, SETTINGS_TABLE);
        const entity = await tableClient.getEntity('config', 'vacationPeriods');
        return JSON.parse(entity.value);
    } catch (e) {
        return [];
    }
}

/**
 * Check if date is within any vacation period
 */
function isDateInVacation(dateStr, vacationPeriods) {
    return vacationPeriods.some(v => dateStr >= v.startDate && dateStr <= v.endDate);
}

/**
 * Fetch booked slots from bookings table (only active bookings)
 */
async function getBookedSlots(startDate, endDate) {
    const bookedSlots = {};
    
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, BOOKINGS_TABLE);
        
        for await (const entity of tableClient.listEntities()) {
            // Skip cancelled bookings
            if (entity.status === 'cancelled') {
                continue;
            }
            
            const bookingDate = entity.date;
            
            if (bookingDate >= startDate && bookingDate <= endDate) {
                if (!bookedSlots[bookingDate]) {
                    bookedSlots[bookingDate] = [];
                }
                bookedSlots[bookingDate].push(entity.time);
            }
        }
    } catch (e) {
        console.log('Could not fetch bookings:', e.message);
    }
    
    return bookedSlots;
}

/**
 * Get availability for a date range
 * 
 * @param {Object} options - Query options
 * @param {string} options.specificDate - Optional specific date to check (YYYY-MM-DD)
 * @param {number} options.daysAhead - Number of days to look ahead (default: 90)
 * @returns {Promise<Object>} Availability result
 */
async function getAvailability(options = {}) {
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
    const filterTodaySlots = (slots, dateStr) => {
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
    const checkDateAvailability = (dateStr) => {
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
    const slots = {};
    
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
async function isSlotAvailable(date, time) {
    const result = await getAvailability({ specificDate: date });
    const slotsForDate = result.slots[date] || [];
    return slotsForDate.includes(time);
}

/**
 * Clear the services cache (useful for testing or after admin changes)
 */
function clearServicesCache() {
    servicesCache = null;
    servicesCacheTime = null;
}

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
