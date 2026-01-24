const { app } = require('@azure/functions');
const config = require('../config');
const translations = require('../translations');
const { saveBooking, generateBookingId, generatePaymentToken } = require('../services/bookingRepository');
const { sendClientConfirmation, sendAdminNotification, isConfigured } = require('../services/emailService');
const { generateInvoicePDF } = require('../services/pdfService');
const { generateClientEmailHTML, generateAdminEmailHTML } = require('../templates/emailTemplates');

app.http('createBooking', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'bookings',
    handler: async (request, context) => {
        context.log('Processing booking request');
        
        try {
            const body = await request.json();
            const { name, email, phone, date, time, service, language = 'lv', consultationFormat = 'online' } = body;

            // Validation
            if (!name || !email || !date || !time || !service) {
                return {
                    status: 400,
                    jsonBody: { error: 'Missing required fields: name, email, date, time, service' }
                };
            }

            // Get translation object
            const t = translations.getTranslation(language);
            const langCode = ['lv', 'en', 'ru'].includes(language) ? language : 'lv';

            // Generate booking data
            const bookingId = generateBookingId();
            const paymentToken = generatePaymentToken(bookingId);
            const price = config.servicePrices[service] || 65;
            
            // Get localized service name and format label
            const serviceName = t.services[service] || service;
            const formatLabel = consultationFormat === 'online' ? t.formatOnline : t.formatInPerson;
            
            const bookingData = {
                id: bookingId,
                bookingId, // Alias for PDF
                name,
                email,
                phone: phone || '',
                date,
                time,
                service,
                serviceName,
                formatLabel,
                language: langCode,
                consultationFormat,
                price,
                paymentToken,
                paymentConfirmed: false,
                createdAt: new Date().toISOString(),
                t // Include translations for PDF
            };

            // Save to storage (without t)
            const storageData = { ...bookingData };
            delete storageData.t;
            await saveBooking(storageData);
            context.log(`Booking ${bookingId} saved`);

            // Generate PDF invoice
            let pdfBase64 = null;
            try {
                pdfBase64 = await generateInvoicePDF(bookingData);
                context.log('PDF invoice generated');
            } catch (pdfError) {
                context.warn('PDF generation failed:', pdfError.message);
            }

            // Send emails if configured
            if (isConfigured()) {
                const confirmPaymentUrl = `${config.API_BASE_URL}/api/confirm-payment?token=${paymentToken}`;
                
                // Prepare display data for email
                const displayData = {
                    name,
                    bookingId,
                    serviceName,
                    formatLabel,
                    date,
                    time,
                    price
                };
                
                // Send client confirmation email
                const clientEmailHtml = generateClientEmailHTML(t, displayData);
                const attachments = pdfBase64 ? [{
                    filename: `invoice-${bookingId}.pdf`,
                    content: pdfBase64
                }] : [];

                await sendClientConfirmation(
                    email,
                    t.emailSubject(bookingId),
                    clientEmailHtml,
                    attachments
                );
                context.log('Client confirmation email sent');

                // Send admin notification
                const adminBooking = {
                    ...bookingData,
                    serviceName
                };
                const adminEmailHtml = generateAdminEmailHTML(adminBooking, confirmPaymentUrl);
                await sendAdminNotification(
                    `Jauna rezervācija - ${bookingId}`,
                    adminEmailHtml
                );
                context.log('Admin notification email sent');
            } else {
                context.warn('Email service not configured - skipping emails');
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: t.emailThankYou,
                    bookingId
                }
            };

        } catch (error) {
            context.error('Booking error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to process booking', details: error.message }
            };
        }
    }
});
