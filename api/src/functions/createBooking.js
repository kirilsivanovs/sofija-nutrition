const { app } = require('@azure/functions');
const { Resend } = require('resend');
const PDFDocument = require('pdfkit');
const storage = require('../services/storage');

const resend = new Resend(process.env.RESEND_API_KEY);

// Business details
const BUSINESS = {
    name: 'Sofija Ivanova',
    title: 'Uztura speciāliste, PhD',
    regNumber: '75650061277',
    address: 'Rīga, Latvija',
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
        name: { 
            lv: 'CGM diagnostika (60 min)', 
            en: 'CGM Diagnostic (60 min)', 
            ru: 'CGM-диагностика (60 мин)' 
        } 
    },
    'consultation': { 
        price: 80, 
        name: { 
            lv: 'Konsultācija (45 min)', 
            en: 'Consultation (45 min)', 
            ru: 'Консультация (45 мин)' 
        } 
    },
    'follow-up': { 
        price: 50, 
        name: { 
            lv: 'Atkārtota vizīte (30 min)', 
            en: 'Follow-up (30 min)', 
            ru: 'Повторный визит (30 мин)' 
        } 
    }
};

// Translations
const TRANSLATIONS = {
    lv: {
        invoice: 'RĒĶINS',
        invoiceNumber: 'Rēķina Nr.',
        date: 'Datums',
        client: 'Klients',
        email: 'E-pasts',
        service: 'Pakalpojums',
        appointmentDate: 'Vizītes datums',
        appointmentTime: 'Vizītes laiks',
        quantity: 'Skaits',
        unitPrice: 'Cena',
        total: 'Kopā',
        subtotal: 'Starpsumma',
        vat: 'PVN (0%)',
        grandTotal: 'Kopējā summa',
        paymentDetails: 'Maksājuma rekvizīti',
        bank: 'Banka',
        iban: 'IBAN',
        swift: 'SWIFT',
        reference: 'Maksājuma mērķis',
        paymentNote: 'Lūdzu, veiciet maksājumu pirms vizītes.',
        dueDate: 'Apmaksas termiņš',
        thankYou: 'Paldies par Jūsu uzticību!',
        
        // Email
        emailSubject: 'Rēķins Nr. {id} — Sofija Ivanova',
        emailGreeting: 'Labdien, {name}!',
        emailThankYou: 'Paldies par Jūsu pieteikumu konsultācijai.',
        emailDetails: 'Jūsu vizītes informācija:',
        emailServiceLabel: 'Pakalpojums:',
        emailDateLabel: 'Datums:',
        emailTimeLabel: 'Laiks:',
        emailAmountLabel: 'Summa:',
        emailPaymentIntro: 'Rēķins ir pievienots šim e-pastam PDF formātā.',
        emailPaymentNote: 'Lūdzu, veiciet maksājumu vismaz 1 darba dienu pirms vizītes, izmantojot rēķinā norādītos rekvizītus.',
        emailConfirmNote: 'Mēs sazināsimies ar Jums 24 stundu laikā, lai apstiprinātu vizītes laiku.',
        emailContact: 'Ja Jums ir jautājumi, droši rakstiet uz šo e-pastu.',
        emailRegards: 'Ar cieņu,',
        emailSignature: 'Sofija Ivanova\nUztura speciāliste, PhD'
    },
    en: {
        invoice: 'INVOICE',
        invoiceNumber: 'Invoice No.',
        date: 'Date',
        client: 'Client',
        email: 'Email',
        service: 'Service',
        appointmentDate: 'Appointment Date',
        appointmentTime: 'Appointment Time',
        quantity: 'Qty',
        unitPrice: 'Price',
        total: 'Total',
        subtotal: 'Subtotal',
        vat: 'VAT (0%)',
        grandTotal: 'Grand Total',
        paymentDetails: 'Payment Details',
        bank: 'Bank',
        iban: 'IBAN',
        swift: 'SWIFT',
        reference: 'Reference',
        paymentNote: 'Please complete payment before your appointment.',
        dueDate: 'Due Date',
        thankYou: 'Thank you for your trust!',
        
        // Email
        emailSubject: 'Invoice No. {id} — Sofija Ivanova',
        emailGreeting: 'Hello, {name}!',
        emailThankYou: 'Thank you for booking a consultation.',
        emailDetails: 'Your appointment details:',
        emailServiceLabel: 'Service:',
        emailDateLabel: 'Date:',
        emailTimeLabel: 'Time:',
        emailAmountLabel: 'Amount:',
        emailPaymentIntro: 'The invoice is attached to this email as a PDF.',
        emailPaymentNote: 'Please complete payment at least 1 business day before your appointment using the details in the invoice.',
        emailConfirmNote: 'We will contact you within 24 hours to confirm your appointment.',
        emailContact: 'If you have any questions, feel free to reply to this email.',
        emailRegards: 'Best regards,',
        emailSignature: 'Sofija Ivanova\nNutrition Specialist, PhD'
    },
    ru: {
        invoice: 'СЧЁТ',
        invoiceNumber: 'Счёт №',
        date: 'Дата',
        client: 'Клиент',
        email: 'E-mail',
        service: 'Услуга',
        appointmentDate: 'Дата визита',
        appointmentTime: 'Время визита',
        quantity: 'Кол-во',
        unitPrice: 'Цена',
        total: 'Итого',
        subtotal: 'Подытог',
        vat: 'НДС (0%)',
        grandTotal: 'Итого к оплате',
        paymentDetails: 'Реквизиты для оплаты',
        bank: 'Банк',
        iban: 'IBAN',
        swift: 'SWIFT',
        reference: 'Назначение платежа',
        paymentNote: 'Пожалуйста, произведите оплату до визита.',
        dueDate: 'Срок оплаты',
        thankYou: 'Благодарим за доверие!',
        
        // Email
        emailSubject: 'Счёт № {id} — Sofija Ivanova',
        emailGreeting: 'Здравствуйте, {name}!',
        emailThankYou: 'Благодарим за запись на консультацию.',
        emailDetails: 'Информация о Вашем визите:',
        emailServiceLabel: 'Услуга:',
        emailDateLabel: 'Дата:',
        emailTimeLabel: 'Время:',
        emailAmountLabel: 'Сумма:',
        emailPaymentIntro: 'Счёт прикреплён к этому письму в формате PDF.',
        emailPaymentNote: 'Пожалуйста, произведите оплату минимум за 1 рабочий день до визита по реквизитам, указанным в счёте.',
        emailConfirmNote: 'Мы свяжемся с Вами в течение 24 часов для подтверждения времени визита.',
        emailContact: 'Если у Вас есть вопросы, пишите на этот e-mail.',
        emailRegards: 'С уважением,',
        emailSignature: 'Sofija Ivanova\nСпециалист по питанию, PhD'
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
            context.log('Saving booking to storage...');
            const saveResult = await storage.saveBooking(booking);
            context.log('Booking saved:', saveResult);

            // Generate PDF invoice
            context.log('Generating PDF invoice...');
            const pdfBuffer = await generateInvoicePDF(booking, language);
            context.log('PDF generated, size:', pdfBuffer.length, 'bytes');

            // Send invoice email to client with PDF attachment
            context.log('Sending invoice email to:', booking.email);
            const clientEmailResult = await sendInvoiceEmail(booking, language, pdfBuffer);
            context.log('Client email result:', JSON.stringify(clientEmailResult));
            
            // Send notification to business owner
            context.log('Sending notification to owner:', process.env.BUSINESS_EMAIL);
            const ownerEmailResult = await sendOwnerNotification(booking);
            context.log('Owner email result:', JSON.stringify(ownerEmailResult));

            if (!clientEmailResult.success) {
                context.log('Failed to send client email:', clientEmailResult.error);
            }

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
 * Generate PDF Invoice
 */
async function generateInvoicePDF(booking, lang) {
    return new Promise((resolve, reject) => {
        const t = TRANSLATIONS[lang] || TRANSLATIONS.lv;
        const chunks = [];
        
        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 50,
            info: {
                Title: `${t.invoice} ${booking.id}`,
                Author: BUSINESS.name
            }
        });

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const marginLeft = 50;
        const marginRight = 50;
        const contentWidth = pageWidth - marginLeft - marginRight;

        // Colors
        const primaryColor = '#1B4332';
        const accentColor = '#D4A574';
        const grayColor = '#6B7280';
        const lightGray = '#F3F4F6';

        // Header with logo area
        doc.rect(0, 0, pageWidth, 120).fill(primaryColor);
        
        // Business name
        doc.fillColor('white')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text(BUSINESS.name, marginLeft, 40);
        
        doc.fontSize(12)
           .font('Helvetica')
           .text(BUSINESS.title, marginLeft, 75);

        // Invoice title on the right
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(t.invoice, marginLeft, 40, { 
               width: contentWidth, 
               align: 'right' 
           });

        // Invoice details below header
        let yPos = 145;

        // Invoice info box
        doc.fillColor(primaryColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(`${t.invoiceNumber}:`, marginLeft, yPos)
           .font('Helvetica')
           .text(booking.id, marginLeft + 100, yPos);

        doc.font('Helvetica-Bold')
           .text(`${t.date}:`, marginLeft + 250, yPos)
           .font('Helvetica')
           .text(formatDate(booking.createdAt, lang), marginLeft + 350, yPos);

        yPos += 25;

        // Due date (3 days before appointment)
        const appointmentDate = new Date(booking.date);
        const dueDate = new Date(appointmentDate);
        dueDate.setDate(dueDate.getDate() - 1);

        doc.font('Helvetica-Bold')
           .text(`${t.dueDate}:`, marginLeft, yPos)
           .font('Helvetica')
           .text(formatDate(dueDate.toISOString(), lang), marginLeft + 100, yPos);

        yPos += 40;

        // Client info section
        doc.rect(marginLeft, yPos, contentWidth, 80)
           .fill(lightGray);

        yPos += 15;

        doc.fillColor(primaryColor)
           .fontSize(11)
           .font('Helvetica-Bold')
           .text(t.client, marginLeft + 15, yPos);

        yPos += 18;

        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#333')
           .text(booking.name, marginLeft + 15, yPos);

        yPos += 16;

        doc.fontSize(10)
           .fillColor(grayColor)
           .text(booking.email, marginLeft + 15, yPos);

        yPos += 50;

        // Service table header
        doc.rect(marginLeft, yPos, contentWidth, 30)
           .fill(primaryColor);

        yPos += 8;

        const col1 = marginLeft + 15;
        const col2 = marginLeft + 280;
        const col3 = marginLeft + 350;
        const col4 = marginLeft + 420;

        doc.fillColor('white')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(t.service, col1, yPos)
           .text(t.quantity, col2, yPos)
           .text(t.unitPrice, col3, yPos)
           .text(t.total, col4, yPos);

        yPos += 30;

        // Service row
        doc.rect(marginLeft, yPos, contentWidth, 50)
           .fill('white')
           .stroke(lightGray);

        yPos += 15;

        doc.fillColor('#333')
           .fontSize(11)
           .font('Helvetica')
           .text(booking.serviceName, col1, yPos);

        yPos += 5;

        // Appointment date/time below service name
        doc.fontSize(9)
           .fillColor(grayColor)
           .text(`${formatDate(booking.date, lang)}, ${booking.time}`, col1, yPos + 12);

        doc.fillColor('#333')
           .fontSize(11)
           .text('1', col2, yPos)
           .text(`€${booking.price.toFixed(2)}`, col3, yPos)
           .font('Helvetica-Bold')
           .text(`€${booking.price.toFixed(2)}`, col4, yPos);

        yPos += 55;

        // Totals section
        const totalsX = marginLeft + 300;
        const totalsWidth = contentWidth - 300;

        doc.rect(totalsX, yPos, totalsWidth, 70)
           .fill(lightGray);

        yPos += 12;

        doc.fillColor(grayColor)
           .fontSize(10)
           .font('Helvetica')
           .text(t.subtotal, totalsX + 15, yPos)
           .fillColor('#333')
           .text(`€${booking.price.toFixed(2)}`, totalsX + totalsWidth - 70, yPos);

        yPos += 18;

        doc.fillColor(grayColor)
           .text(t.vat, totalsX + 15, yPos)
           .fillColor('#333')
           .text('€0.00', totalsX + totalsWidth - 70, yPos);

        yPos += 22;

        doc.rect(totalsX, yPos - 5, totalsWidth, 25)
           .fill(primaryColor);

        doc.fillColor('white')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(t.grandTotal, totalsX + 15, yPos)
           .fontSize(14)
           .text(`€${booking.price.toFixed(2)}`, totalsX + totalsWidth - 80, yPos - 2);

        yPos += 50;

        // Payment details section
        doc.rect(marginLeft, yPos, contentWidth, 100)
           .lineWidth(2)
           .stroke(accentColor);

        yPos += 15;

        doc.fillColor(primaryColor)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(t.paymentDetails, marginLeft + 15, yPos);

        yPos += 25;

        const paymentCol1 = marginLeft + 15;
        const paymentCol2 = marginLeft + 120;

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(grayColor)
           .text(`${t.bank}:`, paymentCol1, yPos)
           .fillColor('#333')
           .text(BUSINESS.bank, paymentCol2, yPos);

        yPos += 16;

        doc.fillColor(grayColor)
           .text(`${t.iban}:`, paymentCol1, yPos)
           .fillColor('#333')
           .font('Helvetica-Bold')
           .text(BUSINESS.iban, paymentCol2, yPos);

        yPos += 16;

        doc.font('Helvetica')
           .fillColor(grayColor)
           .text(`${t.swift}:`, paymentCol1, yPos)
           .fillColor('#333')
           .text(BUSINESS.swift, paymentCol2, yPos);

        yPos += 16;

        doc.fillColor(grayColor)
           .text(`${t.reference}:`, paymentCol1, yPos)
           .fillColor('#333')
           .font('Helvetica-Bold')
           .text(booking.id, paymentCol2, yPos);

        yPos += 40;

        // Note
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(grayColor)
           .text(t.paymentNote, marginLeft, yPos, { 
               width: contentWidth, 
               align: 'center' 
           });

        // Footer
        const footerY = doc.page.height - 60;
        
        doc.moveTo(marginLeft, footerY)
           .lineTo(pageWidth - marginRight, footerY)
           .strokeColor(lightGray)
           .lineWidth(1)
           .stroke();

        doc.fontSize(9)
           .fillColor(grayColor)
           .text(
               `${BUSINESS.name} | ${BUSINESS.address} | Reģ. Nr. ${BUSINESS.regNumber}`,
               marginLeft,
               footerY + 15,
               { width: contentWidth, align: 'center' }
           );

        doc.text(
            t.thankYou,
            marginLeft,
            footerY + 30,
            { width: contentWidth, align: 'center' }
        );

        doc.end();
    });
}

/**
 * Send invoice email with PDF attachment
 */
async function sendInvoiceEmail(booking, lang, pdfBuffer) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.lv;

    const subject = t.emailSubject.replace('{id}', booking.id);
    const greeting = t.emailGreeting.replace('{name}', booking.name);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1B4332 0%, #2D5A45 100%); padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">Sofija Ivanova</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Uztura speciāliste · PhD</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            
                            <!-- Greeting -->
                            <p style="font-size: 18px; color: #1B4332; margin: 0 0 20px 0; font-weight: 500;">${greeting}</p>
                            
                            <p style="font-size: 15px; color: #4B5563; line-height: 1.6; margin: 0 0 25px 0;">${t.emailThankYou}</p>
                            
                            <!-- Appointment Details Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAF9; border-radius: 8px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="font-size: 13px; color: #6B7280; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${t.emailDetails}</p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <span style="color: #6B7280; font-size: 14px;">${t.emailServiceLabel}</span>
                                                </td>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                                                    <span style="color: #1B4332; font-size: 14px; font-weight: 500;">${booking.serviceName}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <span style="color: #6B7280; font-size: 14px;">${t.emailDateLabel}</span>
                                                </td>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                                                    <span style="color: #1B4332; font-size: 14px; font-weight: 500;">${formatDate(booking.date, lang)}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                                                    <span style="color: #6B7280; font-size: 14px;">${t.emailTimeLabel}</span>
                                                </td>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                                                    <span style="color: #1B4332; font-size: 14px; font-weight: 500;">${booking.time}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <span style="color: #1B4332; font-size: 16px; font-weight: 600;">${t.emailAmountLabel}</span>
                                                </td>
                                                <td style="padding: 12px 0; text-align: right;">
                                                    <span style="color: #1B4332; font-size: 20px; font-weight: 700;">€${booking.price.toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Invoice Attachment Notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF9F3; border-left: 4px solid #D4A574; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400E; font-weight: 600;">📎 ${t.emailPaymentIntro}</p>
                                        <p style="margin: 0; font-size: 14px; color: #78716C; line-height: 1.5;">${t.emailPaymentNote}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Confirmation Note -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECFDF5; border-radius: 8px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #065F46; line-height: 1.5;">✓ ${t.emailConfirmNote}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Contact -->
                            <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin: 0 0 25px 0;">${t.emailContact}</p>
                            
                            <!-- Signature -->
                            <p style="font-size: 14px; color: #4B5563; margin: 0 0 5px 0;">${t.emailRegards}</p>
                            <p style="font-size: 15px; color: #1B4332; margin: 0; font-weight: 500; white-space: pre-line;">${t.emailSignature}</p>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 25px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0; font-size: 12px; color: #9CA3AF;">© ${new Date().getFullYear()} Sofija Ivanova. All rights reserved.</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    try {
        const result = await resend.emails.send({
            from: 'Sofija Ivanova <onboarding@resend.dev>',
            to: [booking.email],
            subject: subject,
            html: htmlContent,
            attachments: [
                {
                    filename: `Invoice-${booking.id}.pdf`,
                    content: pdfBuffer.toString('base64'),
                    contentType: 'application/pdf'
                }
            ]
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Failed to send invoice email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification to business owner
 */
async function sendOwnerNotification(booking) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px;">
        <tr>
            <td>
                <!-- Badge -->
                <table cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <tr>
                        <td style="background-color: #1B4332; color: white; padding: 12px 20px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                            🗓️ Jauns pieteikums!
                        </td>
                    </tr>
                </table>
                
                <!-- Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="padding: 25px;">
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #6B7280; font-size: 13px;">Datums un laiks</span><br>
                                        <span style="color: #1B4332; font-size: 16px; font-weight: 600;">${formatDate(booking.date, 'lv')}, ${booking.time}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #6B7280; font-size: 13px;">Klients</span><br>
                                        <span style="color: #333; font-size: 15px; font-weight: 500;">${booking.name}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #6B7280; font-size: 13px;">E-pasts</span><br>
                                        <a href="mailto:${booking.email}" style="color: #1B4332; font-size: 15px;">${booking.email}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #6B7280; font-size: 13px;">Pakalpojums</span><br>
                                        <span style="color: #333; font-size: 15px;">${booking.serviceName}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #6B7280; font-size: 13px;">Summa</span><br>
                                        <span style="color: #1B4332; font-size: 18px; font-weight: 700;">€${booking.price.toFixed(2)}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <span style="color: #6B7280; font-size: 13px;">Rēķina Nr.</span><br>
                                        <span style="color: #333; font-size: 15px; font-family: monospace;">${booking.id}</span>
                                    </td>
                                </tr>
                                ${booking.message ? `
                                <tr>
                                    <td style="padding: 15px 0 0 0; border-top: 1px solid #f0f0f0; margin-top: 10px;">
                                        <span style="color: #6B7280; font-size: 13px;">Komentārs</span><br>
                                        <span style="color: #333; font-size: 14px; font-style: italic;">"${booking.message}"</span>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                            
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    try {
        const result = await resend.emails.send({
            from: 'Booking System <onboarding@resend.dev>',
            to: [process.env.BUSINESS_EMAIL],
            subject: `🗓️ Jauns pieteikums: ${booking.name} — ${formatDate(booking.date, 'lv')}, ${booking.time}`,
            html: htmlContent
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Failed to send owner notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Format date according to language
 */
function formatDate(dateStr, lang) {
    const date = new Date(dateStr);
    const locales = { lv: 'lv-LV', en: 'en-GB', ru: 'ru-RU' };
    
    return date.toLocaleDateString(locales[lang] || 'lv-LV', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}
