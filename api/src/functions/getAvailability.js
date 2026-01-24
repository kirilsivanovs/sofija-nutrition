const { app } = require('@azure/functions');

// Simple in-memory availability (for demo purposes)
// In production, this should come from a database or calendar API
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

// Simulated booked slots (in production, fetch from database)
const bookedSlots = {};

app.http('getAvailability', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'availability/{date?}',
    handler: async (request, context) => {
        try {
            const date = request.params.date;
            
            if (!date) {
                // Return availability for next 30 days in format expected by frontend
                const slots = {};
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                const currentHour = today.getHours();
                const currentMinute = today.getMinutes();
                
                // Include today if there are still available slots
                for (let i = 0; i <= 30; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() + i);
                    
                    // Skip weekends
                    if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
                        continue;
                    }
                    
                    const dateStr = checkDate.toISOString().split('T')[0];
                    const booked = bookedSlots[dateStr] || [];
                    let availableSlots = defaultSlots.filter(slot => !booked.includes(slot));
                    
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
                
                // Return in format expected by frontend
                return {
                    status: 200,
                    jsonBody: { 
                        slots,
                        booked: [], // In production, return actual bookings
                        serviceTypes
                    }
                };
            }
            
            // Return availability for specific date
            const booked = bookedSlots[date] || [];
            const available = defaultSlots.filter(slot => !booked.includes(slot));
            
            return {
                status: 200,
                jsonBody: {
                    date,
                    slots: { [date]: available },
                    booked: [],
                    serviceTypes
                }
            };
            
        } catch (error) {
            context.error('Error getting availability:', error);
            return {
                status: 500,
                jsonBody: { error: 'Internal server error' }
            };
        }
    }
});
