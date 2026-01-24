const { app } = require('@azure/functions');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Translations for emails and PDF
const translations = {
    lv: {
        emailSubject: (id) => `Rezervācijas apstiprinājums - ${id}`,
        emailGreeting: (name) => `Labdien, ${name}!`,
        emailThankYou: 'Paldies par rezervāciju!',
        emailConfirmed: 'Jūsu rezervācija ir apstiprināta:',
        emailBookingId: 'Rezervācijas numurs',
        emailService: 'Pakalpojums',
        emailDate: 'Datums',
        emailTime: 'Laiks',
        emailPrice: 'Cena',
        emailInvoiceAttached: 'Rēķins ir pievienots šim e-pastam.',
        emailQuestions: 'Ja jums ir jautājumi, lūdzu, sazinieties ar mums.',
        emailRegards: 'Ar cieņu,',
        // PDF
        pdfSubtitle: 'Uztura speciāliste · PhD',
        pdfInvoice: 'RĒĶINS',
        pdfNumber: 'Numurs',
        pdfDate: 'Datums',
        pdfClient: 'Klients',
        pdfName: 'Vārds',
        pdfEmail: 'E-pasts',
        pdfPhone: 'Telefons',
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
        // Services
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
        emailDate: 'Date',
        emailTime: 'Time',
        emailPrice: 'Price',
        emailInvoiceAttached: 'The invoice is attached to this email.',
        emailQuestions: 'If you have any questions, please contact us.',
        emailRegards: 'Best regards,',
        // PDF
        pdfSubtitle: 'Nutrition Specialist · PhD',
        pdfInvoice: 'INVOICE',
        pdfNumber: 'Number',
        pdfDate: 'Date',
        pdfClient: 'Client',
        pdfName: 'Name',
        pdfEmail: 'Email',
        pdfPhone: 'Phone',
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
        // Services
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
        emailDate: 'Дата',
        emailTime: 'Время',
        emailPrice: 'Цена',
        emailInvoiceAttached: 'Счёт прикреплён к этому письму.',
        emailQuestions: 'Если у вас есть вопросы, пожалуйста, свяжитесь с нами.',
        emailRegards: 'С уважением,',
        // PDF
        pdfSubtitle: 'Специалист по питанию · PhD',
        pdfInvoice: 'СЧЁТ',
        pdfNumber: 'Номер',
        pdfDate: 'Дата',
        pdfClient: 'Клиент',
        pdfName: 'Имя',
        pdfEmail: 'Email',
        pdfPhone: 'Телефон',
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
        // Services
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

// Service prices
const servicePrices = {
    'initial': 65,
    'followup': 45,
    'package3': 150,
    'package5': 220,
    'cgm-diagnostic': 150,
    'consultation': 80,
    'free-consultation': 0
};

app.http('createBooking', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'bookings',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { name, email, phone, date, time, notes, message, language } = body;
            const service = body.service || body.serviceType;
            const bookingNotes = notes || message;
            const lang = translations[language] ? language : 'lv';
            const t = translations[lang];

            // Validate required fields
            if (!name || !email || !date || !time || !service) {
                return {
                    status: 400,
                    jsonBody: { error: 'Missing required fields: name, email, date, time, service' }
                };
            }

            // Generate booking ID
            const bookingId = `SN-${Date.now().toString(36).toUpperCase()}`;

            // Get service info
            const price = servicePrices[service] || 0;
            const serviceName = t.services[service] || service;

            // Generate PDF invoice
            const pdfBytes = await generateInvoicePDF({
                bookingId,
                name,
                email,
                phone,
                date,
                time,
                serviceName,
                price,
                notes: bookingNotes,
                t
            });

            // Send confirmation email with invoice
            const resendApiKey = process.env.RESEND_API_KEY;
            let emailStatus = { sent: false, error: null };
            
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);
                
                try {
                    // Email to client
                    const clientEmailResult = await resend.emails.send({
                        from: 'Sofija Nutrition <onboarding@resend.dev>',
                        to: email,
                        subject: t.emailSubject(bookingId),
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: linear-gradient(135deg, #2d5a4a 0%, #3d7a6a 100%); padding: 30px; text-align: center;">
                                    <h1 style="color: white; margin: 0; font-size: 28px;">Sofija Ivanova</h1>
                                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">${t.pdfSubtitle}</p>
                                </div>
                                <div style="padding: 30px; background: #f9f9f9;">
                                    <h2 style="color: #2d5a4a; margin-top: 0;">${t.emailThankYou}</h2>
                                    <p>${t.emailGreeting(name)}</p>
                                    <p>${t.emailConfirmed}</p>
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">${t.emailBookingId}:</td>
                                                <td style="padding: 8px 0; font-weight: bold;">${bookingId}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">${t.emailService}:</td>
                                                <td style="padding: 8px 0; font-weight: bold;">${serviceName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">${t.emailDate}:</td>
                                                <td style="padding: 8px 0; font-weight: bold;">${date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">${t.emailTime}:</td>
                                                <td style="padding: 8px 0; font-weight: bold;">${time}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;">${t.emailPrice}:</td>
                                                <td style="padding: 8px 0; font-weight: bold; color: #2d5a4a; font-size: 18px;">€${price}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <p style="color: #666;">${t.emailInvoiceAttached}</p>
                                    <p style="color: #666;">${t.emailQuestions}</p>
                                    <p style="margin-top: 30px;">
                                        ${t.emailRegards}<br>
                                        <strong>Sofija Ivanova</strong>
                                    </p>
                                </div>
                                <div style="background: #2d5a4a; padding: 20px; text-align: center;">
                                    <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">www.sofija-nutrition.lv</p>
                                </div>
                            </div>
                        `,
                        attachments: [
                            {
                                filename: `invoice-${bookingId}.pdf`,
                                content: Buffer.from(pdfBytes).toString('base64')
                            }
                        ]
                    });
                    
                    context.log('Client email result:', JSON.stringify(clientEmailResult));

                    // Email to admin (always in Latvian)
                    const adminEmail = process.env.ADMIN_EMAIL || 'ivanovs.kirils95@gmail.com';
                    const adminEmailResult = await resend.emails.send({
                        from: 'Sofija Nutrition <onboarding@resend.dev>',
                        to: adminEmail,
                        subject: `Jauna rezervācija - ${bookingId}`,
                        html: `
                            <h2>Jauna rezervācija!</h2>
                            <ul>
                                <li><strong>Numurs:</strong> ${bookingId}</li>
                                <li><strong>Klients:</strong> ${name}</li>
                                <li><strong>E-pasts:</strong> ${email}</li>
                                <li><strong>Telefons:</strong> ${phone || 'Nav norādīts'}</li>
                                <li><strong>Pakalpojums:</strong> ${serviceName}</li>
                                <li><strong>Datums:</strong> ${date}</li>
                                <li><strong>Laiks:</strong> ${time}</li>
                                <li><strong>Valoda:</strong> ${lang.toUpperCase()}</li>
                                <li><strong>Piezīmes:</strong> ${bookingNotes || 'Nav'}</li>
                            </ul>
                        `,
                        attachments: [
                            {
                                filename: `invoice-${bookingId}.pdf`,
                                content: Buffer.from(pdfBytes).toString('base64')
                            }
                        ]
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
                    booking: {
                        id: bookingId,
                        date,
                        time,
                        name,
                        email,
                        serviceType: service,
                        serviceName,
                        price
                    },
                    emailStatus,
                    message: 'Rezervācija veiksmīgi izveidota'
                }
            };

        } catch (error) {
            context.error('Error creating booking:', error);
            return {
                status: 500,
                jsonBody: { error: 'Internal server error', details: error.message }
            };
        }
    }
});

async function generateInvoicePDF({ bookingId, name, email, phone, date, time, serviceName, price, notes, t }) {
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit for custom fonts with Unicode support
    pdfDoc.registerFontkit(fontkit);
    
    // Load Roboto fonts (support Latvian/Russian characters)
    const fontsDir = path.join(__dirname, '..', 'fonts');
    const regularFontBytes = fs.readFileSync(path.join(fontsDir, 'Roboto-Regular.ttf'));
    const boldFontBytes = fs.readFileSync(path.join(fontsDir, 'Roboto-Bold.ttf'));
    
    const font = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    
    // Colors matching website
    const primaryColor = rgb(0.176, 0.353, 0.29); // #2d5a4a
    const accentColor = rgb(0.827, 0.569, 0.455); // #d39174
    const grayColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.95, 0.95);
    
    // Header background
    page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: primaryColor
    });
    
    // Header text - Doctor name and title (like on website)
    page.drawText('Sofija Ivanova', {
        x: 50,
        y: height - 55,
        size: 28,
        font: boldFont,
        color: rgb(1, 1, 1)
    });
    
    page.drawText(t.pdfSubtitle, {
        x: 50,
        y: height - 80,
        size: 12,
        font,
        color: rgb(0.8, 0.8, 0.8)
    });
    
    // Accent line
    page.drawRectangle({
        x: 50,
        y: height - 95,
        width: 60,
        height: 3,
        color: accentColor
    });
    
    let y = height - 160;
    
    // Invoice title
    page.drawText(t.pdfInvoice, {
        x: 50,
        y,
        size: 24,
        font: boldFont,
        color: primaryColor
    });
    y -= 35;

    // Invoice details box
    page.drawRectangle({
        x: 50,
        y: y - 50,
        width: 200,
        height: 50,
        color: lightGray
    });
    
    page.drawText(`${t.pdfNumber}: ${bookingId}`, {
        x: 60,
        y: y - 20,
        size: 11,
        font: boldFont
    });

    page.drawText(`${t.pdfDate}: ${new Date().toLocaleDateString('lv-LV')}`, {
        x: 60,
        y: y - 38,
        size: 11,
        font
    });
    y -= 80;

    // Client info section
    page.drawText(t.pdfClient, {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: primaryColor
    });
    y -= 22;

    page.drawText(`${t.pdfName}: ${name}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfEmail}: ${email}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfPhone}: ${phone || t.pdfNotProvided}`, { x: 50, y, size: 11, font });
    y -= 35;

    // Service section
    page.drawText(t.pdfService, {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: primaryColor
    });
    y -= 22;

    page.drawText(serviceName, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfDate}: ${date}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfTime}: ${time}`, { x: 50, y, size: 11, font });
    y -= 40;

    // Price table header
    page.drawRectangle({
        x: 50,
        y: y - 25,
        width: width - 100,
        height: 25,
        color: primaryColor
    });

    page.drawText(t.pdfService, { x: 60, y: y - 17, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText(t.pdfPrice, { x: width - 130, y: y - 17, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    y -= 40;

    // Price row
    page.drawText(serviceName, { x: 60, y, size: 11, font });
    page.drawText(`€${price.toFixed(2)}`, { x: width - 130, y, size: 11, font });
    y -= 25;

    // Separator line
    page.drawLine({
        start: { x: 50, y },
        end: { x: width - 50, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
    });
    y -= 25;

    // Total
    page.drawRectangle({
        x: width - 200,
        y: y - 5,
        width: 150,
        height: 30,
        color: lightGray
    });
    
    page.drawText(t.pdfTotal + ':', { x: width - 190, y: y + 5, size: 12, font: boldFont });
    page.drawText(`€${price.toFixed(2)}`, { x: width - 100, y: y + 5, size: 14, font: boldFont, color: primaryColor });
    y -= 55;

    // Payment info
    page.drawText(t.pdfPaymentInfo, {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: primaryColor
    });
    y -= 22;

    page.drawText(`${t.pdfBank}: Swedbank`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText('IBAN: LV00HABA0000000000000', { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfReference}: ${bookingId}`, { x: 50, y, size: 11, font });
    y -= 35;

    // Notes (if any)
    if (notes) {
        page.drawText(t.pdfNotes, {
            x: 50,
            y,
            size: 14,
            font: boldFont,
            color: primaryColor
        });
        y -= 22;
        page.drawText(notes.substring(0, 100), { x: 50, y, size: 11, font, color: grayColor });
    }

    // Footer
    page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 60,
        color: primaryColor
    });
    
    page.drawText(t.pdfThankYou, {
        x: 50,
        y: 35,
        size: 11,
        font,
        color: rgb(1, 1, 1)
    });
    page.drawText('www.sofija-nutrition.lv', {
        x: 50,
        y: 18,
        size: 10,
        font,
        color: rgb(0.7, 0.7, 0.7)
    });

    return await pdfDoc.save();
}
