const { app } = require('@azure/functions');
const config = require('../config');
const translations = require('../translations');
const { getBooking, updateBooking, verifyPaymentToken } = require('../services/bookingRepository');
const { sendPaymentConfirmation, isConfigured } = require('../services/emailService');
const { generatePaymentConfirmedEmailHTML, generateConfirmationPageHTML } = require('../templates/emailTemplates');

app.http('confirmPayment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'confirm-payment',
    handler: async (request, context) => {
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
            const bookingId = verifyPaymentToken(token);
            if (!bookingId) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                    body: generateErrorPage('Invalid or expired token')
                };
            }

            // Get booking from storage
            const booking = await getBooking(bookingId);
            if (!booking) {
                return {
                    status: 404,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                    body: generateErrorPage('Booking not found')
                };
            }

            // Check if already confirmed
            if (booking.paymentConfirmed) {
                const t = translations.getTranslation(booking.language || 'lv');
                return {
                    status: 200,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                    body: generateConfirmationPageHTML(booking, t, true)
                };
            }

            // Update booking status
            await updateBooking(bookingId, { 
                paymentConfirmed: true,
                paymentConfirmedAt: new Date().toISOString()
            });
            context.log(`Payment confirmed for booking ${bookingId}`);

            // Get translation object
            const t = translations.getTranslation(booking.language || 'lv');

            // Send confirmation email to client
            if (isConfigured()) {
                const emailHtml = generatePaymentConfirmedEmailHTML(booking, t);
                await sendPaymentConfirmation(
                    booking.email,
                    t.paymentConfirmedSubject(booking.id),
                    emailHtml
                );
                context.log('Payment confirmation email sent to client');
            }

            return {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
                body: generateConfirmationPageHTML(booking, t, false)
            };

        } catch (error) {
            context.error('Payment confirmation error:', error);
            return {
                status: 500,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
                body: generateErrorPage('An error occurred while confirming payment')
            };
        }
    }
});

function generateErrorPage(message) {
    return `<!DOCTYPE html>
<html lang="lv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kļūda - ${config.branding.name}</title>
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
            color: ${config.colors.primary};
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Kļūda</h1>
        <p>${message}</p>
        <p><a href="${config.branding.website}">Atgriezties uz sākumlapu</a></p>
    </div>
</body>
</html>`;
}
