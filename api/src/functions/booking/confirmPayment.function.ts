/**
 * confirmPayment HTTP Handler (TypeScript)
 */

import { app, HttpRequest, InvocationContext } from '@azure/functions';
import type { HttpResponseInit } from '@azure/functions';
import { branding, colors } from '../../config';
import translations from '../../translations';
import { getBooking, updateBooking, verifyPaymentToken } from '../../services/bookingRepository';
import { sendPaymentConfirmation, isConfigured } from '../../services/emailService';
import { generatePaymentConfirmedEmailHTML, generateConfirmationPageHTML } from '../../templates/emailTemplates';
import type { Language, TranslationObject } from '../../types';

// ============================================
// Types
// ============================================

interface BookingEntity {
  rowKey?: string;
  id?: string;
  name: string;
  email: string;
  date: string;
  time: string;
  service: string;
  serviceName?: string;
  consultationFormat?: string;
  language?: string;
  paymentConfirmed?: boolean;
  partitionKey?: string;
}

// ============================================
// Handler
// ============================================

async function confirmPaymentHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing payment confirmation');

  try {
    const token = request.query.get('token');

    if (!token) {
      return {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: generateErrorPage('Token is required')
      };
    }

    // Verify token and extract booking ID
    const bookingId = verifyPaymentToken(token, '', '') ? token : null;
    if (!bookingId) {
      return {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: generateErrorPage('Invalid or expired token')
      };
    }

    // Get booking from storage
    const booking = await getBooking(bookingId) as BookingEntity | null;
    if (!booking) {
      return {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: generateErrorPage('Booking not found')
      };
    }

    // Check if already confirmed
    if (booking.paymentConfirmed) {
      return {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: generateConfirmationPageHTML('already', 'Maksājums jau ir apstiprināts')
      };
    }

    // Update booking status
    await updateBooking({
      ...booking,
      id: booking.rowKey || booking.id || '',
      date: booking.date,
      paymentConfirmed: true,
      paymentConfirmedAt: new Date().toISOString()
    });
    context.log(`Payment confirmed for booking ${booking.rowKey || booking.id}`);

    // Get translation object
    const t = translations.getTranslation((booking.language as Language) || 'lv') as TranslationObject;

    // Send confirmation email to client
    let emailSent = false;
    if (isConfigured()) {
      const bookingData = {
        id: booking.rowKey || booking.id || '',
        name: booking.name,
        email: booking.email,
        date: booking.date,
        time: booking.time,
        service: booking.service,
        serviceName: booking.serviceName || t.services[booking.service] || booking.service,
        consultationFormat: booking.consultationFormat || 'online'
      };
      const emailHtml = generatePaymentConfirmedEmailHTML(t, bookingData);
      await sendPaymentConfirmation(
        booking.email,
        t.paymentConfirmedSubject(booking.rowKey || booking.id || ''),
        emailHtml
      );
      emailSent = true;
      context.log('Payment confirmation email sent to client');
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: generateConfirmationPageHTML('success', 'Maksājums veiksmīgi apstiprināts!', emailSent)
    };

  } catch (error: unknown) {
    const err = error as { message?: string };
    context.error('Payment confirmation error:', err);
    return {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: generateErrorPage('An error occurred while confirming payment')
    };
  }
}

// ============================================
// Error Page Generator
// ============================================

function generateErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="lv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kļūda - ${branding.name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            color: #dc3545;
            margin: 0 0 20px 0;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
        a {
            color: ${colors.primary};
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Kļūda</h1>
        <p>${message}</p>
        <p><a href="${branding.website}">Atgriezties uz sākumlapu</a></p>
    </div>
</body>
</html>`;
}

// ============================================
// Register Function
// ============================================

app.http('confirmPayment', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'confirm-payment',
  handler: confirmPaymentHandler
});

// ============================================
// Export for testing
// ============================================

export { confirmPaymentHandler, generateErrorPage };
