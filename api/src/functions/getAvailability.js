const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');
const storage = require('../services/storage');

app.http('getAvailability', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'availability',
    handler: async (request, context) => {
        context.log('Getting availability');

        try {
            // Read the base availability from the static file
            const availabilityPath = path.join(__dirname, '..', '..', '..', 'public', 'data', 'availability.json');
            
            let availability;
            try {
                const data = fs.readFileSync(availabilityPath, 'utf-8');
                availability = JSON.parse(data);
            } catch (err) {
                // Fallback availability if file not found
                context.log('availability.json not found, using fallback');
                availability = {
                    settings: {
                        workingDays: [1, 2, 3, 4, 5],
                        workingHours: { start: "09:00", end: "18:00" },
                        slotDuration: 60,
                        timezone: "Europe/Riga"
                    },
                    slots: generateDefaultSlots(),
                    booked: [],
                    serviceTypes: [
                        { id: "cgm-diagnostic", duration: 60, name: { lv: "CGM diagnostika (60 min)", ru: "CGM-диагностика (60 мин)", en: "CGM Diagnostic (60 min)" } },
                        { id: "consultation", duration: 45, name: { lv: "Konsultācija (45 min)", ru: "Консультация (45 мин)", en: "Consultation (45 min)" } },
                        { id: "follow-up", duration: 30, name: { lv: "Atkārtota vizīte (30 min)", ru: "Повторный визит (30 мин)", en: "Follow-up (30 min)" } }
                    ]
                };
            }

            // Get bookings from storage (Azure Table Storage or in-memory)
            context.log('Fetching bookings from storage...');
            const storedBookings = await storage.getAllBookings();
            context.log('Found', storedBookings.length, 'bookings in storage');

            // Merge static booked slots with stored bookings
            const staticBooked = availability.booked || [];
            availability.booked = [...staticBooked, ...storedBookings];

            return {
                status: 200,
                jsonBody: availability
            };
        } catch (error) {
            context.log('Error getting availability:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to get availability' }
            };
        }
    }
});

/**
 * Generate default slots for the next 30 days
 */
function generateDefaultSlots() {
    const slots = {};
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        const dayOfWeek = date.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dateStr = formatDateISO(date);
        
        // Default working hours
        slots[dateStr] = [
            "09:00", "10:00", "11:00",
            "14:00", "15:00", "16:00", "17:00"
        ];
    }
    
    return slots;
}

function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
