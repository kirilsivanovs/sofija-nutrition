const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Get all bookings with optional status filter
app.http('adminGetBookings', {
    methods: ['GET'],
    authLevel: 'anonymous', // SWA handles auth
    route: 'dashboard/bookings',
    handler: async (request, context) => {
        try {
            const url = new URL(request.url);
            const statusFilter = url.searchParams.get('status') || 'all';

            const tableClient = TableClient.fromConnectionString(
                connectionString,
                'bookings'
            );

            const bookings = [];
            const queryOptions = {};
            
            if (statusFilter !== 'all') {
                queryOptions.filter = `status eq '${statusFilter}'`;
            }

            for await (const entity of tableClient.listEntities(queryOptions)) {
                bookings.push({
                    id: entity.rowKey,
                    partitionKey: entity.partitionKey,
                    name: entity.name,
                    email: entity.email,
                    phone: entity.phone || '',
                    date: entity.date,
                    time: entity.time,
                    service: entity.service,
                    consultationFormat: entity.consultationFormat,
                    language: entity.language,
                    status: entity.status || 'pending',
                    createdAt: entity.createdAt,
                    price: entity.price,
                    notes: entity.notes || ''
                });
            }

            // Sort by date descending (newest first)
            bookings.sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.time);
                const dateB = new Date(b.date + 'T' + b.time);
                return dateB - dateA;
            });

            return {
                status: 200,
                jsonBody: { bookings }
            };
        } catch (error) {
            context.error('Error fetching bookings:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch bookings', details: error.message }
            };
        }
    }
});

// Update booking status
app.http('adminUpdateBooking', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'dashboard/bookings/{id}',
    handler: async (request, context) => {
        try {
            const bookingId = request.params.id;
            const body = await request.json();

            const tableClient = TableClient.fromConnectionString(
                connectionString,
                'bookings'
            );

            // Find the booking by iterating (RowKey filter doesn't work reliably in listEntities)
            let existingBooking = null;
            for await (const entity of tableClient.listEntities()) {
                if (entity.rowKey === bookingId) {
                    existingBooking = entity;
                    break;
                }
            }

            if (!existingBooking) {
                return {
                    status: 404,
                    jsonBody: { error: 'Booking not found', id: bookingId }
                };
            }

            // Update the booking
            const updatedBooking = {
                partitionKey: existingBooking.partitionKey,
                rowKey: existingBooking.rowKey,
                ...existingBooking,
                ...body,
                updatedAt: new Date().toISOString()
            };

            await tableClient.updateEntity(updatedBooking, 'Merge');

            return {
                status: 200,
                jsonBody: { success: true, booking: updatedBooking }
            };
        } catch (error) {
            context.error('Error updating booking:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to update booking', details: error.message }
            };
        }
    }
});

// Get single booking details
app.http('adminGetBooking', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/bookings/{id}',
    handler: async (request, context) => {
        try {
            const bookingId = request.params.id;

            const tableClient = TableClient.fromConnectionString(
                connectionString,
                'bookings'
            );

            // Find the booking by iterating
            let booking = null;
            for await (const entity of tableClient.listEntities()) {
                if (entity.rowKey === bookingId) {
                    booking = entity;
                    break;
                }
            }

            if (!booking) {
                return {
                    status: 404,
                    jsonBody: { error: 'Booking not found', id: bookingId }
                };
            }

            return {
                status: 200,
                jsonBody: { booking }
            };
        } catch (error) {
            context.error('Error fetching booking:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch booking', details: error.message }
            };
        }
    }
});
