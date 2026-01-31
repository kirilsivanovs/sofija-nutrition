const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { checkAuthorization, unauthorizedResponse } = require('../utils/authMiddleware');
const { sendCancellationNotification } = require('../services/emailService');
const { generateCancellationEmailHTML } = require('../templates/emailTemplates');
const { getTranslation, servicePrices } = require('../translations');
const { buildStatusFilter } = require('../utils/odataSanitizer');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Get all bookings with optional status filter
app.http('adminGetBookings', {
    methods: ['GET'],
    authLevel: 'anonymous', // Auth handled by middleware
    route: 'dashboard/bookings',
    handler: async (request, context) => {
        // Проверяем авторизацию (SWA auth или E2E token)
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }
        context.log(`Auth: ${auth.method} - ${auth.user.name}`);

        try {
            const url = new URL(request.url);
            const statusFilter = url.searchParams.get('status') || 'all';

            const tableClient = TableClient.fromConnectionString(
                connectionString,
                'bookings'
            );

            const bookings = [];
            const queryOptions = {};
            
            // Use sanitized filter to prevent OData injection
            const statusFilterQuery = buildStatusFilter(statusFilter);
            if (statusFilterQuery) {
                queryOptions.filter = statusFilterQuery;
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
        // Проверяем авторизацию (SWA auth или E2E token)
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }
        context.log(`Auth: ${auth.method} - ${auth.user.name}`);

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

            // Send cancellation email if status changed to cancelled
            let emailSent = false;
            if (body.status === 'cancelled' && existingBooking.status !== 'cancelled') {
                try {
                    const lang = existingBooking.language || 'lv';
                    const t = getTranslation(lang);
                    
                    // Prepare booking data for email
                    const bookingData = {
                        id: existingBooking.rowKey,
                        name: existingBooking.name,
                        email: existingBooking.email,
                        date: existingBooking.date,
                        time: existingBooking.time,
                        service: existingBooking.service,
                        serviceName: t.services[existingBooking.service] || existingBooking.service,
                        consultationFormat: existingBooking.consultationFormat || 'online',
                        language: lang
                    };
                    
                    const emailHtml = generateCancellationEmailHTML(t, bookingData);
                    const subject = t.cancellationSubject(bookingData.id);
                    
                    context.log(`📧 Sending cancellation email to ${existingBooking.email}`);
                    const emailResult = await sendCancellationNotification(
                        existingBooking.email,
                        subject,
                        emailHtml
                    );
                    
                    emailSent = emailResult.success;
                    if (emailResult.success) {
                        context.log(`✅ Cancellation email sent successfully`);
                    } else {
                        context.warn(`⚠️ Failed to send cancellation email: ${emailResult.error}`);
                    }
                } catch (emailError) {
                    context.warn(`⚠️ Error sending cancellation email: ${emailError.message}`);
                }
            }

            return {
                status: 200,
                jsonBody: { success: true, booking: updatedBooking, emailSent }
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
        // Проверяем авторизацию (SWA auth или E2E token)
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }
        context.log(`Auth: ${auth.method} - ${auth.user.name}`);

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
