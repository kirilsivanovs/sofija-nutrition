/**
 * Admin Bookings Functions
 * Handle admin operations for managing bookings
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { TableClient } from '@azure/data-tables';
import { checkAuthorization, unauthorizedResponse } from '../../utils/authMiddleware';
import { sendCancellationNotification } from '../../services/emailService';
import { generateCancellationEmailHTML } from '../../templates/emailTemplates';
import { getTranslation } from '../../translations';
import { buildStatusFilter } from '../../utils/odataSanitizer';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';

interface BookingEntity {
  partitionKey: string;
  rowKey: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  service: string;
  serviceName?: string;
  consultationFormat?: string;
  language?: string;
  status?: string;
  createdAt?: string;
  price?: number;
  notes?: string;
  updatedAt?: string;
}

interface BookingResponse {
  id: string;
  partitionKey: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  consultationFormat?: string;
  language?: string;
  status: string;
  createdAt?: string;
  price?: number;
  notes: string;
}

interface UpdateBookingBody {
  status?: string;
  notes?: string;
  [key: string]: unknown;
}

// Get all bookings with optional status filter
app.http('adminGetBookings', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/bookings',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const auth = checkAuthorization(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }
    context.log(`Auth: ${auth.method} - ${auth.user?.name}`);

    try {
      const url = new URL(request.url);
      const statusFilter = url.searchParams.get('status') || 'all';

      const tableClient = TableClient.fromConnectionString(connectionString, 'bookings');

      const bookings: BookingResponse[] = [];

      const statusFilterQuery = buildStatusFilter(statusFilter);

      for await (const entity of tableClient.listEntities<BookingEntity>()) {
        // Apply status filter manually if needed
        if (statusFilterQuery && statusFilter !== 'all') {
          const entityStatus = entity.status || 'pending';
          if (entityStatus !== statusFilter) continue;
        }
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
          notes: entity.notes || '',
        });
      }

      // Sort by date descending (newest first)
      bookings.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateB.getTime() - dateA.getTime();
      });

      return {
        status: 200,
        jsonBody: { bookings },
      };
    } catch (error) {
      const err = error as Error;
      context.error('Error fetching bookings:', err);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch bookings', details: err.message },
      };
    }
  },
});

// Update booking status
app.http('adminUpdateBooking', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'dashboard/bookings/{id}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const auth = checkAuthorization(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }
    context.log(`Auth: ${auth.method} - ${auth.user?.name}`);

    try {
      const bookingId = request.params.id;
      const body = (await request.json()) as UpdateBookingBody;

      const tableClient = TableClient.fromConnectionString(connectionString, 'bookings');

      // Find the booking by iterating
      let existingBooking: BookingEntity | null = null;
      for await (const entity of tableClient.listEntities<BookingEntity>()) {
        if (entity.rowKey === bookingId) {
          existingBooking = entity;
          break;
        }
      }

      if (!existingBooking) {
        return {
          status: 404,
          jsonBody: { error: 'Booking not found', id: bookingId },
        };
      }

      // Update the booking
      const updatedBooking = {
        ...existingBooking,
        ...body,
        partitionKey: existingBooking.partitionKey,
        rowKey: existingBooking.rowKey,
        updatedAt: new Date().toISOString(),
      };

      await tableClient.updateEntity(updatedBooking, 'Merge');

      // Send cancellation email if status changed to cancelled
      let emailSent = false;
      if (body.status === 'cancelled' && existingBooking.status !== 'cancelled') {
        try {
          const lang = existingBooking.language || 'lv';
          const t = getTranslation(lang);

          const bookingData = {
            id: existingBooking.rowKey,
            name: existingBooking.name,
            email: existingBooking.email,
            date: existingBooking.date,
            time: existingBooking.time,
            service: existingBooking.service,
            serviceName: t.services[existingBooking.service] || existingBooking.service,
            consultationFormat: existingBooking.consultationFormat || 'online',
            language: lang,
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
          const err = emailError as Error;
          context.warn(`⚠️ Error sending cancellation email: ${err.message}`);
        }
      }

      return {
        status: 200,
        jsonBody: { success: true, booking: updatedBooking, emailSent },
      };
    } catch (error) {
      const err = error as Error;
      context.error('Error updating booking:', err);
      return {
        status: 500,
        jsonBody: { error: 'Failed to update booking', details: err.message },
      };
    }
  },
});

// Get single booking details
app.http('adminGetBooking', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/bookings/{id}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const auth = checkAuthorization(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }
    context.log(`Auth: ${auth.method} - ${auth.user?.name}`);

    try {
      const bookingId = request.params.id;

      const tableClient = TableClient.fromConnectionString(connectionString, 'bookings');

      let booking: BookingEntity | null = null;
      for await (const entity of tableClient.listEntities<BookingEntity>()) {
        if (entity.rowKey === bookingId) {
          booking = entity;
          break;
        }
      }

      if (!booking) {
        return {
          status: 404,
          jsonBody: { error: 'Booking not found', id: bookingId },
        };
      }

      return {
        status: 200,
        jsonBody: { booking },
      };
    } catch (error) {
      const err = error as Error;
      context.error('Error fetching booking:', err);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch booking', details: err.message },
      };
    }
  },
});
