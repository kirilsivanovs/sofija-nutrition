const { app } = require('@azure/functions');

// Simple in-memory availability (for demo purposes)
// In production, this should come from a database or calendar API
const defaultSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
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
                // Return availability for next 30 days
                const availability = {};
                const today = new Date();
                
                for (let i = 1; i <= 30; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() + i);
                    
                    // Skip weekends
                    if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
                        continue;
                    }
                    
                    const dateStr = checkDate.toISOString().split('T')[0];
                    const booked = bookedSlots[dateStr] || [];
                    availability[dateStr] = defaultSlots.filter(slot => !booked.includes(slot));
                }
                
                return {
                    status: 200,
                    jsonBody: { availability }
                };
            }
            
            // Return availability for specific date
            const booked = bookedSlots[date] || [];
            const available = defaultSlots.filter(slot => !booked.includes(slot));
            
            return {
                status: 200,
                jsonBody: {
                    date,
                    availableSlots: available,
                    bookedSlots: booked
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
