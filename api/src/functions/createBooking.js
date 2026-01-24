const { app } = require('@azure/functions');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

app.http('createBooking', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'bookings',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            // Support both 'service' and 'serviceType' field names, and 'notes' or 'message'
            const { name, email, phone, date, time, notes, message } = body;
            const service = body.service || body.serviceType;
            const bookingNotes = notes || message;

            // Validate required fields
            if (!name || !email || !date || !time || !service) {
                return {
                    status: 400,
                    jsonBody: { error: 'Missing required fields: name, email, date, time, service' }
                };
            }

            // Generate booking ID
            const bookingId = `SN-${Date.now().toString(36).toUpperCase()}`;

            // Service prices (support both old and new service IDs) - Latvian names for PDF
            const servicePrices = {
                'initial': { name: 'Sākotnējā konsultācija', price: 65 },
                'followup': { name: 'Atkārtota konsultācija', price: 45 },
                'package3': { name: '3 konsultāciju pakete', price: 150 },
                'package5': { name: '5 konsultāciju pakete', price: 220 },
                'cgm-diagnostic': { name: 'CGM diagnostikas programma', price: 150 },
                'consultation': { name: 'Uztura konsultācija', price: 80 },
                'free-consultation': { name: 'Bezmaksas 15 min konsultācija', price: 0 }
            };

            const selectedService = servicePrices[service] || { name: service, price: 0 };

            // Generate PDF invoice
            const pdfBytes = await generateInvoicePDF({
                bookingId,
                name,
                email,
                phone,
                date,
                time,
                service: selectedService,
                notes: bookingNotes
            });

            // Send confirmation email with invoice
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);
                
                // Email to client
                await resend.emails.send({
                    from: 'Sofija Nutrition <onboarding@resend.dev>',
                    to: email,
                    subject: `Rezervācijas apstiprinājums - ${bookingId}`,
                    html: `
                        <h2>Paldies par rezervāciju!</h2>
                        <p>Labdien, ${name}!</p>
                        <p>Jūsu rezervācija ir apstiprināta:</p>
                        <ul>
                            <li><strong>Rezervācijas numurs:</strong> ${bookingId}</li>
                            <li><strong>Pakalpojums:</strong> ${selectedService.name}</li>
                            <li><strong>Datums:</strong> ${date}</li>
                            <li><strong>Laiks:</strong> ${time}</li>
                            <li><strong>Cena:</strong> €${selectedService.price}</li>
                        </ul>
                        <p>Rēķins ir pievienots šim e-pastam.</p>
                        <p>Ja jums ir jautājumi, lūdzu, sazinieties ar mums.</p>
                        <br>
                        <p>Ar cieņu,<br>Sofija Nutrition</p>
                    `,
                    attachments: [
                        {
                            filename: `invoice-${bookingId}.pdf`,
                            content: Buffer.from(pdfBytes).toString('base64')
                        }
                    ]
                });

                // Email to admin
                const adminEmail = process.env.ADMIN_EMAIL || 'ivanovs.kirils95@gmail.com';
                await resend.emails.send({
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
                            <li><strong>Pakalpojums:</strong> ${selectedService.name}</li>
                            <li><strong>Datums:</strong> ${date}</li>
                            <li><strong>Laiks:</strong> ${time}</li>
                            <li><strong>Piezīmes:</strong> ${notes || 'Nav'}</li>
                        </ul>
                    `,
                    attachments: [
                        {
                            filename: `invoice-${bookingId}.pdf`,
                            content: Buffer.from(pdfBytes).toString('base64')
                        }
                    ]
                });
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
                        serviceName: selectedService.name,
                        price: selectedService.price
                    },
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

async function generateInvoicePDF({ bookingId, name, email, phone, date, time, service, notes }) {
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit for custom fonts with Unicode support
    pdfDoc.registerFontkit(fontkit);
    
    // Load Roboto fonts (support Latvian characters)
    const fontsDir = path.join(__dirname, '..', 'fonts');
    const regularFontBytes = fs.readFileSync(path.join(fontsDir, 'Roboto-Regular.ttf'));
    const boldFontBytes = fs.readFileSync(path.join(fontsDir, 'Roboto-Bold.ttf'));
    
    const font = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    let y = height - 50;

    // Header
    page.drawText('SOFIJA NUTRITION', {
        x: 50,
        y,
        size: 24,
        font: boldFont,
        color: rgb(0.2, 0.5, 0.3)
    });
    y -= 30;

    page.drawText('Uztura konsultācijas', {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4)
    });
    y -= 50;

    // Invoice title
    page.drawText('RĒĶINS / INVOICE', {
        x: 50,
        y,
        size: 18,
        font: boldFont
    });
    y -= 30;

    page.drawText(`Numurs: ${bookingId}`, {
        x: 50,
        y,
        size: 11,
        font
    });
    y -= 15;

    page.drawText(`Datums: ${new Date().toLocaleDateString('lv-LV')}`, {
        x: 50,
        y,
        size: 11,
        font
    });
    y -= 40;

    // Client info
    page.drawText('Klients:', {
        x: 50,
        y,
        size: 12,
        font: boldFont
    });
    y -= 18;

    page.drawText(`Vārds: ${name}`, { x: 50, y, size: 11, font });
    y -= 15;
    page.drawText(`E-pasts: ${email}`, { x: 50, y, size: 11, font });
    y -= 15;
    if (phone) {
        page.drawText(`Telefons: ${phone}`, { x: 50, y, size: 11, font });
        y -= 15;
    }
    y -= 25;

    // Service details
    page.drawText('Pakalpojums:', {
        x: 50,
        y,
        size: 12,
        font: boldFont
    });
    y -= 18;

    page.drawText(service.name, { x: 50, y, size: 11, font });
    y -= 15;
    page.drawText(`Datums: ${date}`, { x: 50, y, size: 11, font });
    y -= 15;
    page.drawText(`Laiks: ${time}`, { x: 50, y, size: 11, font });
    y -= 40;

    // Price table
    page.drawRectangle({
        x: 50,
        y: y - 30,
        width: width - 100,
        height: 30,
        color: rgb(0.9, 0.9, 0.9)
    });

    page.drawText('Pakalpojums', { x: 60, y: y - 20, size: 11, font: boldFont });
    page.drawText('Cena', { x: width - 150, y: y - 20, size: 11, font: boldFont });
    y -= 45;

    page.drawText(service.name, { x: 60, y, size: 11, font });
    page.drawText(`€${service.price.toFixed(2)}`, { x: width - 150, y, size: 11, font });
    y -= 30;

    // Total
    page.drawLine({
        start: { x: 50, y },
        end: { x: width - 50, y },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7)
    });
    y -= 20;

    page.drawText('KOPĀ / TOTAL:', { x: 60, y, size: 12, font: boldFont });
    page.drawText(`€${service.price.toFixed(2)}`, { x: width - 150, y, size: 12, font: boldFont });
    y -= 50;

    // Payment info
    page.drawText('Maksājuma informācija:', {
        x: 50,
        y,
        size: 12,
        font: boldFont
    });
    y -= 18;

    page.drawText('Banka: Swedbank', { x: 50, y, size: 11, font });
    y -= 15;
    page.drawText('IBAN: LV00HABA0000000000000', { x: 50, y, size: 11, font });
    y -= 15;
    page.drawText(`Maksājuma mērķis: ${bookingId}`, { x: 50, y, size: 11, font });
    y -= 40;

    // Notes
    if (notes) {
        page.drawText('Piezīmes:', {
            x: 50,
            y,
            size: 12,
            font: boldFont
        });
        y -= 18;
        page.drawText(notes, { x: 50, y, size: 11, font });
    }

    // Footer
    page.drawText('Paldies, ka izvēlējāties Sofija Nutrition!', {
        x: 50,
        y: 60,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4)
    });
    page.drawText('www.sofija-nutrition.lv', {
        x: 50,
        y: 45,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4)
    });

    return await pdfDoc.save();
}
