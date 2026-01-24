const { app } = require('@azure/functions');
const { Resend } = require('resend');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const storage = require('../services/storage');

const resend = new Resend(process.env.RESEND_API_KEY);

// Business details
const BUSINESS = {
    name: 'Sofija Ivanova',
    title: 'Uztura specialiste, PhD',
    regNumber: '75650061277',
    address: 'Riga, Latvija',
    email: 'info@sofijaivanova.lv',
    phone: '+371 20 000 000',
    bank: 'Swedbank AS',
    iban: 'LV00HABA0000000000000',
    swift: 'HABALV22'
};

// Service prices in EUR
const SERVICE_PRICES = {
    'cgm-diagnostic': { 
        price: 150, 
        name: { lv: 'CGM diagnostika (60 min)', en: 'CGM Diagnostic (60 min)', ru: 'CGM-diagnostika (60 min)' } 
    },
    'consultation': { 
        price: 80, 
        name: { lv: 'Konsultacija (45 min)', en: 'Consultation (45 min)', ru: 'Konsultacija (45 min)' } 
    },
    'follow-up': { 
        price: 50, 
        name: { lv: 'Atkartota vizite (30 min)', en: 'Follow-up (30 min)', ru: 'Povtornij vizit (30 min)' } 
    }
};

// Translations (simplified for ASCII compatibility)
const TRANSLATIONS = {
    lv: {
        invoice: 'REKINS',
        invoiceNumber: 'Rekina Nr.',
        date: 'Datums',
        client: 'Klients',
        service: 'Pakalpojums',
        total: 'Kopa',
        paymentDetails: 'Maksajuma rekviziti',
        bank: 'Banka',
        dueDate: 'Apmaksas termins',
        thankYou: 'Paldies par Jusu uzticibu!',
        emailSubject: 'Rekins Nr. {id} - Sofija Ivanova',
        emailGreeting: 'Labdien, {name}!',
        emailThankYou: 'Paldies par Jusu pieteikumu konsultacijai.',
        emailDetails: 'Jusu vizites informacija:',
        emailPaymentNote: 'Ludzu, veiciet maksajumu pirms vizites.',
        emailRegards: 'Ar cienu,',
        emailSignature: 'Sofija Ivanova'
    },
    en: {
        invoice: 'INVOICE',
        invoiceNumber: 'Invoice No.',
        date: 'Date',
        client: 'Client',
        service: 'Service',
        total: 'Total',
        paymentDetails: 'Payment Details',
        bank: 'Bank',
        dueDate: 'Due Date',
        thankYou: 'Thank you for your trust!',
        emailSubject: 'Invoice No. {id} - Sofija Ivanova',
        emailGreeting: 'Hello, {name}!',
        emailThankYou: 'Thank you for booking a consultation.',
        emailDetails: 'Your appointment details:',
        emailPaymentNote: 'Please complete payment before your appointment.',
        emailRegards: 'Best regards,',
        emailSignature: 'Sofija Ivanova'
    },
    ru: {
        invoice: 'SCHET',
        invoiceNumber: 'Schet No.',
        date: 'Data',
        client: 'Klient',
        service: 'Usluga',
        total: 'Itogo',
        paymentDetails: 'Rekvizity dlya oplaty',
        bank: 'Bank',
        dueDate: 'Srok oplaty',
        thankYou: 'Blagodarim za doverie!',
        emailSubject: 'Schet No. {id} - Sofija Ivanova',
        emailGreeting: 'Zdravstvujte, {name}!',
        emailThankYou: 'Blagodarim za zapis na konsultaciju.',
        emailDetails: 'Informacija o Vashem vizite:',
        emailPaymentNote: 'Pozhalujsta, proizvedite oplatu do vizita.',
        emailRegards: 'S uvazheniem,',
        emailSignature: 'Sofija Ivanova'
    }
};

app.http('createBooking', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'booking',
    handler: async (request, context) => {
        context.log('Processing booking request');

        try {
            const body = await request.json();
            const { date, time, name, email, serviceType, message, language = 'lv' } = body;

            // Validate required fields
            if (!date || !time || !name || !email || !serviceType) {
                return {
                    status: 400,
                    jsonBody: { error: 'Missing required fields', success: false }
                };
            }

            // Get service details
            const service = SERVICE_PRICES[serviceType];
            if (!service) {
                return {
                    status: 400,
                    jsonBody: { error: 'Invalid service type', success: false }
                };
            }

            // Generate invoice number
            const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

            // Create booking object
            const booking = {
                id: invoiceNumber,
                date,
                time,
                name,
                email,
                serviceType,
                serviceName: service.name[language] || service.name.en,
                price: service.price,
                message: message || '',
                language,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };

            context.log('Booking created:', booking);

            // Save booking to storage
            await storage.saveBooking(booking);

            // Generate PDF invoice
            const pdfBuffer = await generateInvoicePDF(booking, language);
            context.log('PDF generated, size:', pdfBuffer.length, 'bytes');

            // Send invoice email to client
            await sendInvoiceEmail(booking, language, pdfBuffer);
            
            // Send notification to business owner
            await sendOwnerNotification(booking);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    booking: {
                        id: booking.id,
                        date: booking.date,
                        time: booking.time,
                        serviceName: booking.serviceName,
                        price: booking.price
                    },
                    message: 'Booking created successfully. Invoice sent to your email.'
                }
            };

        } catch (error) {
            context.log('Error processing booking:', error);
            return {
                status: 500,
                jsonBody: { error: 'Internal server error', success: false }
            };
        }
    }
});

/**
 * Generate PDF Invoice using pdf-lib
 */
async function generateInvoicePDF(booking, lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.lv;
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;
    
    // Colors
    const primaryColor = rgb(0.11, 0.26, 0.2); // #1B4332
    const grayColor = rgb(0.4, 0.4, 0.4);
    
    // Header
    page.drawRectangle({
        x: 0, y: height - 100, width, height: 100,
        color: primaryColor
    });
    
    page.drawText(BUSINESS.name, {
        x: margin, y: height - 50,
        size: 24, font: fontBold, color: rgb(1, 1, 1)
    });
    
    page.drawText(BUSINESS.title, {
        x: margin, y: height - 75,
        size: 12, font, color: rgb(1, 1, 1)
    });
    
    page.drawText(t.invoice, {
        x: width - margin - 100, y: height - 50,
        size: 20, font: fontBold, color: rgb(1, 1, 1)
    });
    
    y = height - 130;
    
    // Invoice details
    page.drawText(`${t.invoiceNumber}: ${booking.id}`, {
        x: margin, y, size: 11, font: fontBold, color: primaryColor
    });
    
    const dateStr = formatDate(booking.createdAt, lang);
    page.drawText(`${t.date}: ${dateStr}`, {
        x: width - margin - 150, y, size: 11, font, color: grayColor
    });
    
    y -= 40;
    
    // Client info
    page.drawText(t.client, {
        x: margin, y, size: 12, font: fontBold, color: primaryColor
    });
    y -= 20;
    page.drawText(booking.name, {
        x: margin, y, size: 11, font, color: grayColor
    });
    y -= 15;
    page.drawText(booking.email, {
        x: margin, y, size: 10, font, color: grayColor
    });
    
    y -= 40;
    
    // Service table header
    page.drawRectangle({
        x: margin, y: y - 5, width: width - 2 * margin, height: 25,
        color: primaryColor
    });
    
    page.drawText(t.service, {
        x: margin + 10, y: y, size: 10, font: fontBold, color: rgb(1, 1, 1)
    });
    page.drawText(t.total, {
        x: width - margin - 60, y: y, size: 10, font: fontBold, color: rgb(1, 1, 1)
    });
    
    y -= 35;
    
    // Service row
    page.drawText(booking.serviceName, {
        x: margin + 10, y, size: 11, font, color: grayColor
    });
    y -= 15;
    page.drawText(`${booking.date}, ${booking.time}`, {
        x: margin + 10, y, size: 9, font, color: grayColor
    });
    page.drawText(`EUR ${booking.price.toFixed(2)}`, {
        x: width - margin - 80, y: y + 8, size: 12, font: fontBold, color: primaryColor
    });
    
    y -= 50;
    
    // Total
    page.drawRectangle({
        x: width - margin - 150, y: y - 5, width: 150, height: 30,
        color: rgb(0.95, 0.95, 0.95)
    });
    page.drawText(`${t.total}: EUR ${booking.price.toFixed(2)}`, {
        x: width - margin - 140, y: y + 2, size: 14, font: fontBold, color: primaryColor
    });
    
    y -= 60;
    
    // Payment details
    page.drawText(t.paymentDetails, {
        x: margin, y, size: 12, font: fontBold, color: primaryColor
    });
    y -= 20;
    page.drawText(`${t.bank}: ${BUSINESS.bank}`, {
        x: margin, y, size: 10, font, color: grayColor
    });
    y -= 15;
    page.drawText(`IBAN: ${BUSINESS.iban}`, {
        x: margin, y, size: 10, font, color: grayColor
    });
    y -= 15;
    page.drawText(`SWIFT: ${BUSINESS.swift}`, {
        x: margin, y, size: 10, font, color: grayColor
    });
    y -= 15;
    page.drawText(`Reference: ${booking.id}`, {
        x: margin, y, size: 10, font, color: grayColor
    });
    
    y -= 40;
    
    // Thank you
    page.drawText(t.thankYou, {
        x: margin, y, size: 12, font: fontBold, color: primaryColor
    });
    
    // Footer
    page.drawText(`${BUSINESS.name} | ${BUSINESS.email} | ${BUSINESS.phone}`, {
        x: margin, y: 30, size: 9, font, color: grayColor
    });
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

/**
 * Format date based on language
 */
function formatDate(dateString, lang) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const locale = lang === 'lv' ? 'lv-LV' : lang === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(locale, options);
}

/**
 * Send invoice email to client
 */
async function sendInvoiceEmail(booking, lang, pdfBuffer) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.lv;
    
    const subject = t.emailSubject.replace('{id}', booking.id);
    const greeting = t.emailGreeting.replace('{name}', booking.name.split(' ')[0]);
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1B4332; color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0;">${BUSINESS.name}</h1>
                <p style="margin: 5px 0 0;">${BUSINESS.title}</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #1B4332;">${greeting}</h2>
                <p>${t.emailThankYou}</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1B4332; margin-top: 0;">${t.emailDetails}</h3>
                    <p><strong>Service:</strong> ${booking.serviceName}</p>
                    <p><strong>Date:</strong> ${booking.date}</p>
                    <p><strong>Time:</strong> ${booking.time}</p>
                    <p><strong>Amount:</strong> EUR ${booking.price.toFixed(2)}</p>
                </div>
                
                <p>${t.emailPaymentNote}</p>
                
                <p style="margin-top: 30px;">${t.emailRegards}<br><strong>${t.emailSignature}</strong></p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                <p>${BUSINESS.email} | ${BUSINESS.phone}</p>
            </div>
        </div>
    `;
    
    try {
        const result = await resend.emails.send({
            from: `${BUSINESS.name} <onboarding@resend.dev>`,
            to: booking.email,
            subject,
            html,
            attachments: [{
                filename: `invoice-${booking.id}.pdf`,
                content: pdfBuffer.toString('base64')
            }]
        });
        return { success: true, id: result.data?.id };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification to business owner
 */
async function sendOwnerNotification(booking) {
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1B4332;">New Booking Request</h2>
            <p><strong>Invoice:</strong> ${booking.id}</p>
            <p><strong>Client:</strong> ${booking.name}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Service:</strong> ${booking.serviceName}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            <p><strong>Amount:</strong> EUR ${booking.price.toFixed(2)}</p>
            ${booking.message ? `<p><strong>Message:</strong> ${booking.message}</p>` : ''}
        </div>
    `;
    
    try {
        await resend.emails.send({
            from: `Booking System <onboarding@resend.dev>`,
            to: process.env.BUSINESS_EMAIL || 'ivanovs.kirils95@gmail.com',
            subject: `New Booking: ${booking.name} - ${booking.date} ${booking.time}`,
            html
        });
        return { success: true };
    } catch (error) {
        console.error('Owner notification error:', error);
        return { success: false };
    }
}
