const { app } = require('@azure/functions');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { Resend } = require('resend');
const { TableClient } = require('@azure/data-tables');
const fs = require('fs');
const path = require('path');

// Azure Table Storage client
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
let tableClient = null;

async function getTableClient() {
    if (!tableClient && connectionString) {
        tableClient = TableClient.fromConnectionString(connectionString, 'bookings');
        try {
            await tableClient.createTable();
        } catch (error) {
            if (error.statusCode !== 409) {
                console.error('Error creating table:', error.message);
            }
        }
    }
    return tableClient;
}

const inMemoryBookings = new Map();

async function saveBooking(booking) {
    const client = await getTableClient();
    if (client) {
        const entity = {
            partitionKey: booking.date,
            rowKey: booking.id,
            ...booking,
            createdAt: booking.createdAt || new Date().toISOString()
        };
        await client.upsertEntity(entity);
        return true;
    } else {
        inMemoryBookings.set(booking.id, booking);
        return false;
    }
}

async function getBooking(bookingId) {
    const client = await getTableClient();
    if (client) {
        const entities = client.listEntities({
            queryOptions: { filter: `RowKey eq '${bookingId}'` }
        });
        for await (const entity of entities) {
            return entity;
        }
        return null;
    } else {
        return inMemoryBookings.get(bookingId);
    }
}

async function updateBooking(booking) {
    return saveBooking(booking);
}

// Translations with proper Latvian diacritics (ā, ē, ī, ū, ļ, ņ, ķ, ģ, č, š, ž)
const translations = {
    lv: {
        emailSubject: (id) => `Rezervācijas apstiprinājums - ${id}`,
        emailGreeting: (name) => `Labdien, ${name}!`,
        emailThankYou: 'Paldies par rezervāciju!',
        emailConfirmed: 'Jūsu rezervācija ir apstiprināta:',
        emailBookingId: 'Rezervācijas numurs',
        emailService: 'Pakalpojums',
        emailFormat: 'Formāts',
        emailDate: 'Datums',
        emailTime: 'Laiks',
        emailPrice: 'Cena',
        emailInvoiceAttached: 'Rēķins ir pievienots šim e-pastam.',
        emailQuestions: 'Ja jums ir jautājumi, lūdzu, sazinieties ar mums.',
        emailRegards: 'Ar cieņu,',
        emailSubtitle: 'Uztura speciāliste · PhD',
        formatOnline: 'Attālināti (Zoom/Google Meet)',
        formatInPerson: 'Klātienē',
        paymentConfirmedSubject: (id) => `Maksājums apstiprināts - ${id}`,
        paymentConfirmedTitle: 'Maksājums saņemts!',
        paymentConfirmedText: 'Paldies! Jūsu maksājums ir saņemts. Gaidām Jūs konsultācijā:',
        paymentWaitingText: 'Gaidām Jūs:',
        pdfSubtitle: 'Uztura speciāliste · PhD',
        pdfInvoice: 'RĒĶINS',
        pdfNumber: 'Numurs',
        pdfDate: 'Datums',
        pdfClient: 'Klients',
        pdfName: 'Vārds',
        pdfEmail: 'E-pasts',
        pdfPhone: 'Telefons',
        pdfFormat: 'Formāts',
        pdfService: 'Pakalpojums',
        pdfTime: 'Laiks',
        pdfPrice: 'Cena',
        pdfTotal: 'KOPĀ',
        pdfPaymentInfo: 'Maksājuma informācija',
        pdfBank: 'Banka',
        pdfReference: 'Maksājuma mērķis',
        pdfNotes: 'Piezīmes',
        pdfThankYou: 'Paldies, ka izvēlējāties mūs!',
        pdfNotProvided: 'Nav norādīts',
        services: {
            'initial': 'Sākotnējā konsultācija',
            'followup': 'Atkārtota konsultācija',
            'package3': '3 konsultāciju pakete',
            'package5': '5 konsultāciju pakete',
            'cgm-diagnostic': 'CGM diagnostikas programma',
            'consultation': 'Uztura konsultācija',
            'free-consultation': 'Bezmaksas 15 min konsultācija'
        }
    },
    en: {
        emailSubject: (id) => `Booking Confirmation - ${id}`,
        emailGreeting: (name) => `Hello, ${name}!`,
        emailThankYou: 'Thank you for your booking!',
        emailConfirmed: 'Your booking has been confirmed:',
        emailBookingId: 'Booking ID',
        emailService: 'Service',
        emailFormat: 'Format',
        emailDate: 'Date',
        emailTime: 'Time',
        emailPrice: 'Price',
        emailInvoiceAttached: 'The invoice is attached to this email.',
        emailQuestions: 'If you have any questions, please contact us.',
        emailRegards: 'Best regards,',
        emailSubtitle: 'Nutrition Specialist · PhD',
        formatOnline: 'Online (Zoom/Google Meet)',
        formatInPerson: 'In-person',
        paymentConfirmedSubject: (id) => `Payment Confirmed - ${id}`,
        paymentConfirmedTitle: 'Payment Received!',
        paymentConfirmedText: 'Thank you! Your payment has been received. We look forward to seeing you:',
        paymentWaitingText: 'We look forward to seeing you:',
        pdfSubtitle: 'Nutrition Specialist · PhD',
        pdfInvoice: 'INVOICE',
        pdfNumber: 'Number',
        pdfDate: 'Date',
        pdfClient: 'Client',
        pdfName: 'Name',
        pdfEmail: 'Email',
        pdfPhone: 'Phone',
        pdfFormat: 'Format',
        pdfService: 'Service',
        pdfTime: 'Time',
        pdfPrice: 'Price',
        pdfTotal: 'TOTAL',
        pdfPaymentInfo: 'Payment Information',
        pdfBank: 'Bank',
        pdfReference: 'Reference',
        pdfNotes: 'Notes',
        pdfThankYou: 'Thank you for choosing us!',
        pdfNotProvided: 'Not provided',
        services: {
            'initial': 'Initial Consultation',
            'followup': 'Follow-up Consultation',
            'package3': '3 Consultation Package',
            'package5': '5 Consultation Package',
            'cgm-diagnostic': 'CGM Diagnostic Program',
            'consultation': 'Nutrition Consultation',
            'free-consultation': 'Free 15-min Consultation'
        }
    },
    ru: {
        emailSubject: (id) => `Подтверждение бронирования - ${id}`,
        emailGreeting: (name) => `Здравствуйте, ${name}!`,
        emailThankYou: 'Спасибо за бронирование!',
        emailConfirmed: 'Ваше бронирование подтверждено:',
        emailBookingId: 'Номер бронирования',
        emailService: 'Услуга',
        emailFormat: 'Формат',
        emailDate: 'Дата',
        emailTime: 'Время',
        emailPrice: 'Цена',
        emailInvoiceAttached: 'Счёт прикреплён к этому письму.',
        emailQuestions: 'Если у вас есть вопросы, пожалуйста, свяжитесь с нами.',
        emailRegards: 'С уважением,',
        emailSubtitle: 'Специалист по питанию · PhD',
        formatOnline: 'Онлайн (Zoom/Google Meet)',
        formatInPerson: 'Очно',
        paymentConfirmedSubject: (id) => `Оплата подтверждена - ${id}`,
        paymentConfirmedTitle: 'Оплата получена!',
        paymentConfirmedText: 'Спасибо! Ваша оплата получена. Ждём вас на консультации:',
        paymentWaitingText: 'Ждём вас:',
        pdfSubtitle: 'Специалист по питанию · PhD',
        pdfInvoice: 'СЧЁТ',
        pdfNumber: 'Номер',
        pdfDate: 'Дата',
        pdfClient: 'Клиент',
        pdfName: 'Имя',
        pdfEmail: 'Email',
        pdfPhone: 'Телефон',
        pdfFormat: 'Формат',
        pdfService: 'Услуга',
        pdfTime: 'Время',
        pdfPrice: 'Цена',
        pdfTotal: 'ИТОГО',
        pdfPaymentInfo: 'Платёжная информация',
        pdfBank: 'Банк',
        pdfReference: 'Назначение платежа',
        pdfNotes: 'Примечания',
        pdfThankYou: 'Спасибо, что выбрали нас!',
        pdfNotProvided: 'Не указано',
        services: {
            'initial': 'Первичная консультация',
            'followup': 'Повторная консультация',
            'package3': 'Пакет из 3 консультаций',
            'package5': 'Пакет из 5 консультаций',
            'cgm-diagnostic': 'Программа CGM диагностики',
            'consultation': 'Консультация по питанию',
            'free-consultation': 'Бесплатная 15-мин консультация'
        }
    }
};

const servicePrices = {
    'initial': 65,
    'followup': 45,
    'package3': 150,
    'package5': 220,
    'cgm-diagnostic': 150,
    'consultation': 80,
    'free-consultation': 0
};

const API_BASE_URL = process.env.API_BASE_URL || 'https://sofija-nutrition-api.azurewebsites.net';

// Responsive email template - works on mobile
function generateClientEmailHTML(t, name, bookingId, serviceName, formatLabel, date, time, price) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${t.emailSubject(bookingId)}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <!-- Main container - responsive width -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2d5a4a 0%, #3a7365 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">Sofija Ivanova</h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 400;">${t.emailSubtitle}</p>
                            <div style="width: 50px; height: 3px; background-color: #d4a574; margin: 16px auto 0; border-radius: 2px;"></div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 20px;">
                            <h2 style="margin: 0 0 15px 0; color: #2d5a4a; font-size: 22px; font-weight: 600; text-align: center;">${t.emailThankYou}</h2>
                            <p style="margin: 0 0 20px 0; color: #444; font-size: 16px; line-height: 1.5; text-align: center;">${t.emailGreeting(name)}</p>
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.5; text-align: center;">${t.emailConfirmed}</p>
                            
                            <!-- Booking Details Card -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <!-- Booking ID -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 12px; margin-bottom: 12px;">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0 0 4px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailBookingId}</p>
                                                    <p style="margin: 0; color: #2d5a4a; font-size: 16px; font-weight: 600;">${bookingId}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Service -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 12px; margin-bottom: 12px;">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0 0 4px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailService}</p>
                                                    <p style="margin: 0; color: #333; font-size: 15px; font-weight: 500;">${serviceName}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Format -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 12px; margin-bottom: 12px;">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0 0 4px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailFormat}</p>
                                                    <p style="margin: 0; color: #333; font-size: 15px; font-weight: 500;">${formatLabel}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Date & Time - side by side on desktop, stacked on mobile -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 12px; margin-bottom: 12px;">
                                            <tr>
                                                <td width="50%" style="padding-right: 10px; vertical-align: top;">
                                                    <p style="margin: 0 0 4px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailDate}</p>
                                                    <p style="margin: 0; color: #333; font-size: 15px; font-weight: 500;">${date}</p>
                                                </td>
                                                <td width="50%" style="padding-left: 10px; vertical-align: top;">
                                                    <p style="margin: 0 0 4px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailTime}</p>
                                                    <p style="margin: 0; color: #333; font-size: 15px; font-weight: 500;">${time}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Price -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0 0 4px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailPrice}</p>
                                                    <p style="margin: 0; color: #2d5a4a; font-size: 24px; font-weight: 700;">${price > 0 ? '€' + price : 'FREE'}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 12px 0; color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
                                📎 ${t.emailInvoiceAttached}
                            </p>
                            <p style="margin: 0 0 25px 0; color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
                                ${t.emailQuestions}
                            </p>
                            
                            <p style="margin: 0; color: #444; font-size: 15px; line-height: 1.6; text-align: center;">
                                ${t.emailRegards}<br>
                                <strong style="color: #2d5a4a;">Sofija Ivanova</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2d5a4a; padding: 20px; text-align: center;">
                            <a href="https://www.sofija-nutrition.lv" style="color: #d4a574; font-size: 14px; text-decoration: none; font-weight: 500;">www.sofija-nutrition.lv</a>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.6); font-size: 12px;">© 2026 Sofija Ivanova</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generateAdminEmailHTML(booking, confirmUrl) {
    const formatLabel = booking.consultationFormat === 'online' ? 'Attālināti' : 'Klātienē';
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #d4a574 0%, #c4956a 100%); padding: 25px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">🆕 Jauna rezervācija!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 25px 20px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <!-- Booking ID -->
                                        <table role="presentation" width="100%" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px;">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Numurs</p>
                                                <p style="margin: 0; color: #2d5a4a; font-size: 16px; font-weight: 700;">${booking.id}</p>
                                            </td></tr>
                                        </table>
                                        
                                        <!-- Client -->
                                        <table role="presentation" width="100%" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px;">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Klients</p>
                                                <p style="margin: 0; font-size: 15px; font-weight: 500;">${booking.name}</p>
                                            </td></tr>
                                        </table>
                                        
                                        <!-- Email -->
                                        <table role="presentation" width="100%" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px;">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">E-pasts</p>
                                                <p style="margin: 0; font-size: 14px; word-break: break-all;">${booking.email}</p>
                                            </td></tr>
                                        </table>
                                        
                                        <!-- Phone -->
                                        <table role="presentation" width="100%" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px;">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Telefons</p>
                                                <p style="margin: 0; font-size: 14px;">${booking.phone || 'Nav norādīts'}</p>
                                            </td></tr>
                                        </table>
                                        
                                        <!-- Service -->
                                        <table role="presentation" width="100%" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px;">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Pakalpojums</p>
                                                <p style="margin: 0; font-size: 14px; font-weight: 500;">${booking.serviceName}</p>
                                            </td></tr>
                                        </table>
                                        
                                        <!-- Format -->
                                        <table role="presentation" width="100%" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px;">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Formāts</p>
                                                <p style="margin: 0; font-size: 14px; font-weight: 500; color: ${booking.consultationFormat === 'online' ? '#2196F3' : '#4CAF50'};">
                                                    ${booking.consultationFormat === 'online' ? '💻' : '📍'} ${formatLabel}
                                                </p>
                                            </td></tr>
                                        </table>
                                        
                                        <!-- Date & Time -->
                                        <table role="presentation" width="100%" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px;">
                                            <tr>
                                                <td width="50%">
                                                    <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Datums</p>
                                                    <p style="margin: 0; font-size: 14px; font-weight: 500;">${booking.date}</p>
                                                </td>
                                                <td width="50%">
                                                    <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Laiks</p>
                                                    <p style="margin: 0; font-size: 14px; font-weight: 500;">${booking.time}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Price -->
                                        <table role="presentation" width="100%" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px;">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Summa</p>
                                                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #2d5a4a;">${booking.price > 0 ? '€' + booking.price : 'BEZMAKSAS'}</p>
                                            </td></tr>
                                        </table>
                                        
                                        <!-- Language -->
                                        <table role="presentation" width="100%">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Valoda</p>
                                                <p style="margin: 0; font-size: 14px;">${booking.language.toUpperCase()}</p>
                                            </td></tr>
                                        </table>
                                        
                                        ${booking.notes ? `
                                        <table role="presentation" width="100%" style="border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 10px;">
                                            <tr><td>
                                                <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">Piezīmes</p>
                                                <p style="margin: 0; font-size: 14px;">${booking.notes}</p>
                                            </td></tr>
                                        </table>
                                        ` : ''}
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Confirm Payment Button -->
                            ${booking.price > 0 ? `
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 15px 0;">
                                        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; text-align: center;">Kad maksājums saņemts, nospied pogu:</p>
                                        <a href="${confirmUrl}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
                                            ✓ Apstiprināt maksājumu
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : `
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 15px 0;">
                                        <p style="margin: 0; padding: 12px 20px; background: #e8f5e9; border-radius: 8px; color: #2e7d32; font-size: 14px; text-align: center;">
                                            ✓ Bezmaksas konsultācija - maksājums nav nepieciešams
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            `}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2d5a4a; padding: 15px 20px; text-align: center;">
                            <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">Sofija Nutrition Booking System</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generatePaymentConfirmedEmailHTML(t, booking) {
    const formatLabel = booking.consultationFormat === 'online' ? t.formatOnline : t.formatInPerson;
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 35px 20px; text-align: center;">
                            <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; line-height: 70px; font-size: 35px;">✓</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${t.paymentConfirmedTitle}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 20px;">
                            <p style="margin: 0 0 25px 0; color: #444; font-size: 16px; line-height: 1.5; text-align: center;">${t.paymentConfirmedText}</p>
                            
                            <!-- Appointment Details -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 25px; text-align: center;">
                                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${t.emailService}</p>
                                        <p style="margin: 0 0 20px 0; color: #2d5a4a; font-size: 18px; font-weight: 600;">${booking.serviceName}</p>
                                        
                                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${t.emailFormat}</p>
                                        <p style="margin: 0 0 20px 0; color: #333; font-size: 15px; font-weight: 500;">
                                            ${booking.consultationFormat === 'online' ? '💻' : '📍'} ${formatLabel}
                                        </p>
                                        
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50%" style="text-align: center; padding: 10px;">
                                                    <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">${t.emailDate}</p>
                                                    <p style="margin: 0; color: #2d5a4a; font-size: 20px; font-weight: 700;">${booking.date}</p>
                                                </td>
                                                <td width="50%" style="text-align: center; padding: 10px; border-left: 2px solid rgba(45, 90, 74, 0.2);">
                                                    <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">${t.emailTime}</p>
                                                    <p style="margin: 0; color: #2d5a4a; font-size: 20px; font-weight: 700;">${booking.time}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0; color: #444; font-size: 15px; line-height: 1.6; text-align: center;">
                                ${t.emailRegards}<br>
                                <strong style="color: #2d5a4a;">Sofija Ivanova</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2d5a4a; padding: 20px; text-align: center;">
                            <a href="https://www.sofija-nutrition.lv" style="color: #d4a574; font-size: 14px; text-decoration: none; font-weight: 500;">www.sofija-nutrition.lv</a>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.6); font-size: 12px;">© 2026 Sofija Ivanova</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Create Booking Endpoint
app.http('createBooking', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'bookings',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { email, phone, date, time, notes, message, language, consultationFormat } = body;
            const name = body.name || '';
            const service = body.service || body.serviceType;
            const bookingNotes = notes || message;
            const lang = translations[language] ? language : 'lv';
            const t = translations[lang];
            const format = consultationFormat || 'online';

            if (!name || !email || !date || !time || !service) {
                return { status: 400, jsonBody: { error: 'Missing required fields: name, email, date, time, service' } };
            }

            const bookingId = `SN-${Date.now().toString(36).toUpperCase()}`;
            const price = servicePrices[service] || 0;
            const serviceName = t.services[service] || service;
            const formatLabel = format === 'online' ? t.formatOnline : t.formatInPerson;

            const bookingData = {
                id: bookingId,
                name,
                email,
                phone,
                date,
                time,
                service,
                serviceName,
                price,
                consultationFormat: format,
                notes: bookingNotes,
                language: lang,
                paymentConfirmed: price === 0,
                createdAt: new Date().toISOString()
            };
            
            const savedToTable = await saveBooking(bookingData);
            context.log(`Booking saved to ${savedToTable ? 'Azure Table Storage' : 'in-memory storage'}`);

            const pdfBytes = await generateInvoicePDF({ bookingId, name, email, phone, date, time, serviceName, formatLabel, price, notes: bookingNotes, t });

            const resendApiKey = process.env.RESEND_API_KEY;
            let emailStatus = { sent: false, error: null };
            
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);
                
                try {
                    const clientEmailResult = await resend.emails.send({
                        from: 'Sofija Ivanova <onboarding@resend.dev>',
                        to: email,
                        subject: t.emailSubject(bookingId),
                        html: generateClientEmailHTML(t, name, bookingId, serviceName, formatLabel, date, time, price),
                        attachments: [{ filename: `invoice-${bookingId}.pdf`, content: Buffer.from(pdfBytes).toString('base64') }]
                    });
                    
                    context.log('Client email result:', JSON.stringify(clientEmailResult));

                    const adminEmail = process.env.ADMIN_EMAIL || 'ivanovs.kirils95@gmail.com';
                    const confirmUrl = `${API_BASE_URL}/api/confirm-payment?id=${bookingId}&token=${Buffer.from(bookingId + ':' + email).toString('base64')}`;
                    
                    const adminEmailResult = await resend.emails.send({
                        from: 'Sofija Ivanova <onboarding@resend.dev>',
                        to: adminEmail,
                        subject: `Jauna rezervācija - ${bookingId}`,
                        html: generateAdminEmailHTML(bookingData, confirmUrl),
                        attachments: [{ filename: `invoice-${bookingId}.pdf`, content: Buffer.from(pdfBytes).toString('base64') }]
                    });
                    
                    context.log('Admin email result:', JSON.stringify(adminEmailResult));
                    emailStatus = { sent: true, clientId: clientEmailResult?.data?.id, adminId: adminEmailResult?.data?.id };
                    
                } catch (emailError) {
                    context.error('Email sending error:', emailError);
                    emailStatus = { sent: false, error: emailError.message };
                }
            } else {
                emailStatus = { sent: false, error: 'RESEND_API_KEY not configured' };
            }

            return {
                status: 201,
                jsonBody: {
                    success: true,
                    booking: { id: bookingId, date, time, name, email, serviceType: service, serviceName, consultationFormat: format, price },
                    emailStatus,
                    storage: savedToTable ? 'azure-table' : 'in-memory',
                    message: 'Rezervācija veiksmīgi izveidota'
                }
            };

        } catch (error) {
            context.error('Error creating booking:', error);
            return { status: 500, jsonBody: { error: 'Internal server error', details: error.message } };
        }
    }
});

// Confirm Payment Endpoint
app.http('confirmPayment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'confirm-payment',
    handler: async (request, context) => {
        try {
            const url = new URL(request.url);
            const bookingId = url.searchParams.get('id');
            const token = url.searchParams.get('token');

            if (!bookingId || !token) {
                return { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: generateConfirmationPage('error', 'Nepareizi parametri / Invalid parameters') };
            }

            const booking = await getBooking(bookingId);
            
            if (!booking) {
                return { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: generateConfirmationPage('error', `Rezervācija ${bookingId} nav atrasta. Iespējams, tā tika izveidota pirms sistēmas atjaunināšanas. / Booking not found.`) };
            }

            const expectedToken = Buffer.from(bookingId + ':' + booking.email).toString('base64');
            if (token !== expectedToken) {
                return { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: generateConfirmationPage('error', 'Nepareizs tokens / Invalid token') };
            }

            if (booking.paymentConfirmed) {
                return { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: generateConfirmationPage('already', `Maksājums jau apstiprināts! / Payment already confirmed! (${bookingId})`) };
            }

            booking.paymentConfirmed = true;
            booking.paymentConfirmedAt = new Date().toISOString();
            await updateBooking(booking);

            const resendApiKey = process.env.RESEND_API_KEY;
            let emailSent = false;
            
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);
                const t = translations[booking.language] || translations.lv;
                
                try {
                    await resend.emails.send({
                        from: 'Sofija Ivanova <onboarding@resend.dev>',
                        to: booking.email,
                        subject: t.paymentConfirmedSubject(bookingId),
                        html: generatePaymentConfirmedEmailHTML(t, booking)
                    });
                    emailSent = true;
                    context.log('Payment confirmation email sent to:', booking.email);
                } catch (emailError) {
                    context.error('Failed to send payment confirmation email:', emailError);
                }
            }

            return { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: generateConfirmationPage('success', `Maksājums apstiprināts! Klientam ${booking.name} (${booking.email}) nosūtīts apstiprinājums.`, emailSent) };

        } catch (error) {
            context.error('Error confirming payment:', error);
            return { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: generateConfirmationPage('error', 'Servera kļūda / Server error: ' + error.message) };
        }
    }
});

function generateConfirmationPage(status, message, emailSent = false) {
    const statusColors = {
        success: { bg: '#e8f5e9', color: '#2e7d32', icon: '✓', title: 'Maksājums apstiprināts!' },
        error: { bg: '#ffebee', color: '#c62828', icon: '✕', title: 'Kļūda' },
        already: { bg: '#fff3e0', color: '#ef6c00', icon: '!', title: 'Jau apstiprināts' }
    };
    const s = statusColors[status] || statusColors.error;
    
    return `
<!DOCTYPE html>
<html lang="lv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maksājuma apstiprinājums</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
    <div style="width: 100%; max-width: 400px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: ${s.bg}; padding: 30px 20px; text-align: center;">
            <div style="width: 60px; height: 60px; background: ${s.color}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 30px; color: white; margin-bottom: 15px;">${s.icon}</div>
            <h1 style="margin: 0; color: ${s.color}; font-size: 20px;">${s.title}</h1>
        </div>
        <div style="padding: 25px 20px; text-align: center;">
            <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.5;">${message}</p>
            ${emailSent ? '<p style="margin: 0 0 20px 0; padding: 10px 15px; background: #e3f2fd; border-radius: 8px; color: #1565c0; font-size: 14px;">📧 E-pasts klientam nosūtīts!</p>' : ''}
            <a href="https://www.sofija-nutrition.lv" style="display: inline-block; padding: 12px 25px; background: #2d5a4a; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">Atgriezties uz mājaslapu</a>
        </div>
    </div>
</body>
</html>`;
}

async function generateInvoicePDF({ bookingId, name, email, phone, date, time, serviceName, formatLabel, price, notes, t }) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    
    const fontsDir = path.join(__dirname, '..', 'fonts');
    const regularFontBytes = fs.readFileSync(path.join(fontsDir, 'Roboto-Regular.ttf'));
    const boldFontBytes = fs.readFileSync(path.join(fontsDir, 'Roboto-Bold.ttf'));
    
    const font = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);
    
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    
    const primaryColor = rgb(0.176, 0.353, 0.29);
    const accentColor = rgb(0.831, 0.647, 0.455);
    const grayColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.95, 0.95);
    
    // Header
    page.drawRectangle({ x: 0, y: height - 120, width: width, height: 120, color: primaryColor });
    page.drawText('Sofija Ivanova', { x: 50, y: height - 55, size: 28, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText(t.pdfSubtitle, { x: 50, y: height - 80, size: 12, font, color: rgb(0.8, 0.8, 0.8) });
    page.drawRectangle({ x: 50, y: height - 95, width: 60, height: 3, color: accentColor });
    
    let y = height - 160;
    
    page.drawText(t.pdfInvoice, { x: 50, y, size: 24, font: boldFont, color: primaryColor });
    y -= 35;

    page.drawRectangle({ x: 50, y: y - 50, width: 200, height: 50, color: lightGray });
    page.drawText(`${t.pdfNumber}: ${bookingId}`, { x: 60, y: y - 20, size: 11, font: boldFont });
    page.drawText(`${t.pdfDate}: ${new Date().toLocaleDateString('lv-LV')}`, { x: 60, y: y - 38, size: 11, font });
    y -= 80;

    page.drawText(t.pdfClient, { x: 50, y, size: 14, font: boldFont, color: primaryColor });
    y -= 22;
    page.drawText(`${t.pdfName}: ${name}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfEmail}: ${email}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfPhone}: ${phone || t.pdfNotProvided}`, { x: 50, y, size: 11, font });
    y -= 35;

    page.drawText(t.pdfService, { x: 50, y, size: 14, font: boldFont, color: primaryColor });
    y -= 22;
    page.drawText(serviceName, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfFormat}: ${formatLabel}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfDate}: ${date}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfTime}: ${time}`, { x: 50, y, size: 11, font });
    y -= 40;

    page.drawRectangle({ x: 50, y: y - 25, width: width - 100, height: 25, color: primaryColor });
    page.drawText(t.pdfService, { x: 60, y: y - 17, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText(t.pdfPrice, { x: width - 130, y: y - 17, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    y -= 40;

    page.drawText(serviceName, { x: 60, y, size: 11, font });
    page.drawText(price > 0 ? `€${price.toFixed(2)}` : 'FREE', { x: width - 130, y, size: 11, font });
    y -= 25;

    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 25;

    page.drawRectangle({ x: width - 200, y: y - 5, width: 150, height: 30, color: lightGray });
    page.drawText(t.pdfTotal + ':', { x: width - 190, y: y + 5, size: 12, font: boldFont });
    page.drawText(price > 0 ? `€${price.toFixed(2)}` : 'FREE', { x: width - 100, y: y + 5, size: 14, font: boldFont, color: primaryColor });
    y -= 55;

    if (price > 0) {
        page.drawText(t.pdfPaymentInfo, { x: 50, y, size: 14, font: boldFont, color: primaryColor });
        y -= 22;
        page.drawText(`${t.pdfBank}: Swedbank`, { x: 50, y, size: 11, font });
        y -= 16;
        page.drawText('IBAN: LV00HABA0000000000000', { x: 50, y, size: 11, font });
        y -= 16;
        page.drawText(`${t.pdfReference}: ${bookingId}`, { x: 50, y, size: 11, font });
        y -= 35;
    }

    if (notes) {
        page.drawText(t.pdfNotes, { x: 50, y, size: 14, font: boldFont, color: primaryColor });
        y -= 22;
        const truncatedNotes = notes.length > 80 ? notes.substring(0, 80) + '...' : notes;
        page.drawText(truncatedNotes, { x: 50, y, size: 11, font, color: grayColor });
    }

    // Footer
    page.drawRectangle({ x: 0, y: 0, width: width, height: 60, color: primaryColor });
    page.drawText(t.pdfThankYou, { x: 50, y: 35, size: 11, font, color: rgb(1, 1, 1) });
    page.drawText('www.sofija-nutrition.lv', { x: 50, y: 18, size: 10, font, color: accentColor });

    return await pdfDoc.save();
}
