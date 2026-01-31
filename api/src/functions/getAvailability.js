/**
 * getAvailability HTTP Handler
 * 
 * Thin HTTP layer that handles request/response.
 * Business logic is delegated to AvailabilityService.
 */

const { app } = require('@azure/functions');
const { getAvailability } = require('../services/availabilityService');
const { addCorsHeaders } = require('../utils/cors');

app.http('getAvailability', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'availability/{date?}',
    handler: async (request, context) => {
        try {
            const date = request.params.date;
            
            // Delegate to service layer
            const result = await getAvailability({
                specificDate: date || null,
                daysAhead: 90
            });
            
            return {
                status: 200,
                jsonBody: result
            };
            
        } catch (error) {
            context.error('Error getting availability:', error);
            return addCorsHeaders({
                status: 500,
                jsonBody: { error: 'Internal server error', details: error.message }
            }, request);
        }
    }
});
