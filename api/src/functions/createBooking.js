const { app } = require('@azure/functions');
const config = require('../config');
const translations = require('../translations');
const { saveBooking, generateBookingId, generatePaymentToken, isSlotBooked } = require('../services/bookingRepository');
const { sendClientConfirmation, sendAdminNotification, isConfigured } = require('../services/emailService');
const { generateInvoicePDF } = require('../services/pdfService');
const { generateClientEmailHTML, generateAdminEmailHTML } = require('../templates/emailTemplates');
const { isLatvianHoliday } = require('../services/latvianHolidays');

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

            // Check if date is a weekend
            const bookingDate = new Date(date);
            const dayOfWeek = bookingDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return {
                    status: 400,
                    jsonBody: { 
                        error: 'Weekend booking not allowed',
                        errorLv: 'Brīvdienās pieraksts nav iespējams',
                        errorRu: 'Запись в выходные дни недоступна',
                        errorEn: 'Booking on weekends is not available'
                    }
                };
            }

            // Check if date is a holiday
            const holidayCheck = isLatvianHoliday(date);
            if (holidayCheck.isHoliday) {
                return {
                    status: 400,
                    jsonBody: { 
                        error: 'Holiday booking not allowed',
                        holiday: holidayCheck.name,
                        errorLv: `Svētku dienā pieraksts nav iespējams: ${holidayCheck.name}`,
                        errorRu: `Запись в праздничный день недоступна: ${holidayCheck.name}`,
                        errorEn: `Booking on holidays is not available: ${holidayCheck.name}`
                    }
                };
            }

            // Check if slot is already booked
            const slotTaken = await isSlotBooked(date, time);
            if (slotTaken) {
                return {
                    status: 409,
                    jsonBody: { 
                        error: 'Time slot already booked',
                        errorLv: 'Šis laiks jau ir aizņemts. Lūdzu, izvēlieties citu laiku.',
                        errorRu: 'Это время уже занято. Пожалуйста, выберите другое время.',
                        errorEn: 'This time slot is already booked. Please choose another time.'
                    }
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
                ).then(result => {
                    if (result.success) {
                        context.log('Client email sent successfully, id:', result.id);
                    } else {
                        context.error('Client email failed:', result.error);
                    }
                });

                // Send admin notification
                const adminBooking = {
                    ...bookingData,
                    serviceName
                };
                const adminEmailHtml = generateAdminEmailHTML(adminBooking, confirmPaymentUrl);
                await sendAdminNotification(
                    `Jauna rezervācija - ${bookingId}`,
                    adminEmailHtml
                ).then(result => {
                    if (result.success) {
                        context.log('Admin email sent successfully, id:', result.id);
                    } else {
                        context.error('Admin email failed:', result.error);
                    }
                });
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
