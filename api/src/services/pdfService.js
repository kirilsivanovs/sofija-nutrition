/**
 * PDF Service
 * Generates PDF invoices with proper Unicode support (Latvian, Russian)
 */

const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Cache for loaded fonts
let regularFontBytes = null;
let boldFontBytes = null;

/**
 * Load fonts from disk (cached)
 */
function loadFonts() {
    // Only reload if not already loaded or if cache was invalidated
    if (!regularFontBytes || !boldFontBytes) {
        try {
            const fontsDir = path.join(__dirname, '..', 'fonts');
            const regularPath = path.join(fontsDir, 'Roboto-Regular.ttf');
            const boldPath = path.join(fontsDir, 'Roboto-Bold.ttf');
            
            if (!fs.existsSync(regularPath)) {
                throw new Error(`Font not found: ${regularPath}`);
            }
            if (!fs.existsSync(boldPath)) {
                throw new Error(`Font not found: ${boldPath}`);
            }
            
            regularFontBytes = fs.readFileSync(regularPath);
            boldFontBytes = fs.readFileSync(boldPath);
        } catch (err) {
            throw new Error(`Failed to load fonts: ${err.message}`);
        }
    }
    return { regularFontBytes, boldFontBytes };
}

/**
 * Reset font cache (for testing)
 */
function resetFontCache() {
    regularFontBytes = null;
    boldFontBytes = null;
}

/**
 * Generate an invoice PDF
 * @param {Object} data - Invoice data
 * @param {string} data.bookingId - Booking ID
 * @param {string} data.name - Client name
 * @param {string} data.email - Client email
 * @param {string} data.phone - Client phone
 * @param {string} data.date - Appointment date
 * @param {string} data.time - Appointment time
 * @param {string} data.serviceName - Localized service name
 * @param {string} data.formatLabel - Localized format label
 * @param {number} data.price - Price in EUR
 * @param {string} data.notes - Optional notes
 * @param {Object} data.t - Translations object
 * @returns {Promise<Uint8Array>} - PDF bytes
 */
async function generateInvoicePDF({ bookingId, name, email, phone, date, time, serviceName, formatLabel, price, notes, t }) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    
    const { regularFontBytes, boldFontBytes } = loadFonts();
    const font = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    
    // Colors
    const { primaryRgb, accentRgb } = config.colors;
    const primaryColor = rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    const accentColor = rgb(accentRgb.r, accentRgb.g, accentRgb.b);
    const grayColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.95, 0.95);
    const white = rgb(1, 1, 1);
    const lightText = rgb(0.8, 0.8, 0.8);
    const divider = rgb(0.8, 0.8, 0.8);
    
    // Header
    page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: primaryColor });
    page.drawText(config.branding.name, { x: 50, y: height - 55, size: 28, font: boldFont, color: white });
    page.drawText(t.pdfSubtitle, { x: 50, y: height - 80, size: 12, font, color: lightText });
    page.drawRectangle({ x: 50, y: height - 95, width: 60, height: 3, color: accentColor });
    
    let y = height - 160;
    
    // Invoice title
    page.drawText(t.pdfInvoice, { x: 50, y, size: 24, font: boldFont, color: primaryColor });
    y -= 35;

    // Invoice number box
    page.drawRectangle({ x: 50, y: y - 50, width: 200, height: 50, color: lightGray });
    page.drawText(`${t.pdfNumber}: ${bookingId}`, { x: 60, y: y - 20, size: 11, font: boldFont });
    page.drawText(`${t.pdfDate}: ${new Date().toLocaleDateString('lv-LV')}`, { x: 60, y: y - 38, size: 11, font });
    y -= 80;

    // Client section
    page.drawText(t.pdfClient, { x: 50, y, size: 14, font: boldFont, color: primaryColor });
    y -= 22;
    page.drawText(`${t.pdfName}: ${name}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfEmail}: ${email}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfPhone}: ${phone || t.pdfNotProvided}`, { x: 50, y, size: 11, font });
    y -= 35;

    // Service section
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

    // Table header
    page.drawRectangle({ x: 50, y: y - 25, width: width - 100, height: 25, color: primaryColor });
    page.drawText(t.pdfService, { x: 60, y: y - 17, size: 11, font: boldFont, color: white });
    page.drawText(t.pdfPrice, { x: width - 130, y: y - 17, size: 11, font: boldFont, color: white });
    y -= 40;

    // Table row
    page.drawText(serviceName, { x: 60, y, size: 11, font });
    page.drawText(price > 0 ? `€${price.toFixed(2)}` : 'FREE', { x: width - 130, y, size: 11, font });
    y -= 25;

    // Divider
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: divider });
    y -= 25;

    // Total box
    page.drawRectangle({ x: width - 200, y: y - 5, width: 150, height: 30, color: lightGray });
    page.drawText(t.pdfTotal + ':', { x: width - 190, y: y + 5, size: 12, font: boldFont });
    page.drawText(price > 0 ? `€${price.toFixed(2)}` : 'FREE', { x: width - 100, y: y + 5, size: 14, font: boldFont, color: primaryColor });
    y -= 55;

    // Payment info (only if price > 0)
    if (price > 0) {
        page.drawText(t.pdfPaymentInfo, { x: 50, y, size: 14, font: boldFont, color: primaryColor });
        y -= 22;
        page.drawText(`${t.pdfBank}: ${config.payment.bank}`, { x: 50, y, size: 11, font });
        y -= 16;
        page.drawText(`IBAN: ${config.payment.iban}`, { x: 50, y, size: 11, font });
        y -= 16;
        page.drawText(`${t.pdfReference}: ${bookingId}`, { x: 50, y, size: 11, font });
        y -= 35;
    }

    // Notes (if present)
    if (notes) {
        page.drawText(t.pdfNotes, { x: 50, y, size: 14, font: boldFont, color: primaryColor });
        y -= 22;
        const truncatedNotes = notes.length > 80 ? notes.substring(0, 80) + '...' : notes;
        page.drawText(truncatedNotes, { x: 50, y, size: 11, font, color: grayColor });
    }

    // Footer
    page.drawRectangle({ x: 0, y: 0, width, height: 60, color: primaryColor });
    page.drawText(t.pdfThankYou, { x: 50, y: 35, size: 11, font, color: white });
    page.drawText(config.branding.website, { x: 50, y: 18, size: 10, font, color: accentColor });

    return await pdfDoc.save();
}

module.exports = {
    generateInvoicePDF,
    resetFontCache
};
