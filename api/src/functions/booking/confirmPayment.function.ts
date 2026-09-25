/**
 * confirmPayment HTTP Handlers (TypeScript)
 *
 * GET /api/confirm-payment renders a page only; it never changes state.
 * POST /api/dashboard/bookings/{id}/confirm-payment is the admin-only write.
 */

import { app, HttpRequest, InvocationContext } from '@azure/functions';
import type { HttpResponseInit } from '@azure/functions';
import { branding, colors } from '../../config';
import translations from '../../translations';
import {
  getBooking,
  verifyPaymentToken,
  assertPaymentTokenSecretConfigured,
} from '../../services/bookingRepository';
import { sendPaymentConfirmation, isConfigured } from '../../services/emailService';
import { confirmPayment, BookingError, BookingErrorCodes } from '../../services/bookingService';
import { checkAuthorizationWithLogging, unauthorizedResponse } from '../../utils/authMiddleware';
import { escapeHtml } from '../../utils/validation';
import {
  generatePaymentConfirmedEmailHTML,
  generateConfirmationPageHTML,
} from '../../templates/emailTemplates';
import type { Language, TranslationObject } from '../../types';

// Fail closed: the whole API refuses to start without a real payment token secret.
assertPaymentTokenSecretConfigured();

const NO_STORE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
};

// ============================================
// GET /api/confirm-payment — page only, never writes
// ============================================

async function confirmPaymentPageHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const bookingId = request.query.get('id');
  const token = request.query.get('token');

  if (!bookingId || !token) {
    return {
      status: 400,
      headers: NO_STORE_HEADERS,
      body: generateErrorPage('Token is required'),
    };
  }

  const auth = checkAuthorizationWithLogging(request, context);
  if (!auth.authorized) {
    const redirectPath = `${request.url ? new URL(request.url).pathname + new URL(request.url).search : ''}`;
    return {
      status: 200,
      headers: NO_STORE_HEADERS,
      body: generateSignInPage(redirectPath),
    };
  }

  const booking = await getBooking(bookingId);
  if (!booking || !verifyPaymentToken(token, bookingId, booking.email)) {
    return {
      status: 400,
      headers: NO_STORE_HEADERS,
      body: generateErrorPage('Invalid or expired token'),
    };
  }

  if (booking.paymentConfirmed) {
    return {
      status: 200,
      headers: NO_STORE_HEADERS,
      body: generateConfirmationPageHTML('already', 'Maksājums jau ir apstiprināts'),
    };
  }

  return {
    status: 200,
    headers: NO_STORE_HEADERS,
    body: generateAdminConfirmFormPage(bookingId, token, booking),
  };
}

// ============================================
// POST /api/dashboard/bookings/{id}/confirm-payment — admin-only write
// ============================================

async function adminConfirmPaymentHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = checkAuthorizationWithLogging(request, context);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const bookingId = request.params.id;

  try {
    const formData = await request.formData();
    const token = String(formData.get('token') || '');

    const result = await confirmPayment(bookingId, token, {
      onLog: (...args) => context.log(...args),
      onWarn: (...args) => context.warn(...args),
      onError: (...args) => context.error(...args),
    });

    const booking = await getBooking(result.bookingId);
    let emailSent = false;
    if (booking && isConfigured()) {
      const t = translations.getTranslation((booking.language as Language) || 'lv') as TranslationObject;
      const bookingData = {
        id: booking.rowKey || booking.id || '',
        name: booking.name,
        email: booking.email,
        date: booking.date,
        time: booking.time,
        service: booking.service,
        serviceName: booking.serviceName || t.services[booking.service] || booking.service,
        consultationFormat: booking.consultationFormat || 'online',
      };
      const emailHtml = generatePaymentConfirmedEmailHTML(t, bookingData);
      await sendPaymentConfirmation(
        booking.email,
        t.paymentConfirmedSubject(bookingData.id),
        emailHtml
      );
      emailSent = true;
      context.log(`Payment confirmation email sent for booking ${bookingData.id}`);
    }

    return {
      status: 200,
      headers: NO_STORE_HEADERS,
      body: generateConfirmationPageHTML('success', 'Maksājums veiksmīgi apstiprināts!', emailSent),
    };
  } catch (error: unknown) {
    if (error instanceof BookingError) {
      if (error.code === BookingErrorCodes.ALREADY_CONFIRMED) {
        return {
          status: 200,
          headers: NO_STORE_HEADERS,
          body: generateConfirmationPageHTML('already', 'Maksājums jau ir apstiprināts'),
        };
      }
      return {
        status: error.statusCode,
        headers: NO_STORE_HEADERS,
        body: generateErrorPage(error.message),
      };
    }
    const err = error as { message?: string };
    context.error('Payment confirmation error:', err.message);
    return {
      status: 500,
      headers: NO_STORE_HEADERS,
      body: generateErrorPage('An error occurred while confirming payment'),
    };
  }
}

// ============================================
// Page Generators
// ============================================

function generateErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="lv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kļūda - ${escapeHtml(branding.name)}</title>
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
        <p>${escapeHtml(message)}</p>
        <p><a href="${branding.website}">Atgriezties uz sākumlapu</a></p>
    </div>
</body>
</html>`;
}

function generateSignInPage(redirectPath: string): string {
  const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(redirectPath)}`;
  return `<!DOCTYPE html>
<html lang="lv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pieslēgties - ${escapeHtml(branding.name)}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin:0; padding:40px 20px; display:flex; justify-content:center; align-items:center; min-height:100vh;">
    <div style="background:white; padding:40px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1); text-align:center; max-width:500px;">
        <h1>Nepieciešama pieslēgšanās</h1>
        <p>Lai apstiprinātu maksājumu, lūdzu, piesakieties administratora kontā.</p>
        <p><a href="${loginUrl}" style="color:${colors.primary};">Pieslēgties</a></p>
    </div>
</body>
</html>`;
}

interface AdminVisibleBooking {
  rowKey?: string;
  id?: string;
  date: string;
  time: string;
  service: string;
  serviceName?: string;
}

function generateAdminConfirmFormPage(
  bookingId: string,
  token: string,
  booking: AdminVisibleBooking
): string {
  const safeId = escapeHtml(booking.rowKey || booking.id || bookingId);
  const safeDate = escapeHtml(booking.date);
  const safeTime = escapeHtml(booking.time);
  const safeService = escapeHtml(booking.serviceName || booking.service);
  const safeToken = escapeHtml(token);
  const actionUrl = `/api/dashboard/bookings/${encodeURIComponent(bookingId)}/confirm-payment`;

  return `<!DOCTYPE html>
<html lang="lv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apstiprināt maksājumu - ${escapeHtml(branding.name)}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin:0; padding:40px 20px; display:flex; justify-content:center; align-items:center; min-height:100vh;">
    <div style="background:white; padding:40px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1); text-align:center; max-width:500px;">
        <h1>Apstiprināt maksājumu</h1>
        <p>Rezervācija: <strong>${safeId}</strong></p>
        <p>${safeDate} ${safeTime} — ${safeService}</p>
        <form method="post" action="${actionUrl}">
            <input type="hidden" name="token" value="${safeToken}">
            <button type="submit" style="padding:12px 25px; background:${colors.primary}; color:white; border:none; border-radius:8px; font-size:14px; cursor:pointer;">Apstiprināt maksājumu</button>
        </form>
    </div>
</body>
</html>`;
}

// ============================================
// Register Functions
// ============================================

app.http('confirmPaymentPage', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'confirm-payment',
  handler: confirmPaymentPageHandler,
});

app.http('adminConfirmPayment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'dashboard/bookings/{id}/confirm-payment',
  handler: adminConfirmPaymentHandler,
});

// ============================================
// Export for testing
// ============================================

export { confirmPaymentPageHandler, adminConfirmPaymentHandler, generateErrorPage };
