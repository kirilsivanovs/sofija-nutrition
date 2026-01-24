/**
 * Email Templates
 * HTML templates for all email types
 */

const config = require('../config');

const { colors, branding } = config;

/**
 * Common email wrapper with header and footer
 */
function emailWrapper(content, { title = '' } = {}) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
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
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    ${content}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Standard header with branding
 */
function emailHeader(subtitle, { gradient = true, bgColor = colors.primary } = {}) {
    const bgStyle = gradient 
        ? `background: linear-gradient(135deg, ${colors.primary} 0%, #3a7365 100%);`
        : `background-color: ${bgColor};`;
    
    return `
    <tr>
        <td style="${bgStyle} padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">${branding.name}</h1>
            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 400;">${subtitle}</p>
            <div style="width: 50px; height: 3px; background-color: ${colors.accent}; margin: 16px auto 0; border-radius: 2px;"></div>
        </td>
    </tr>`;
}

/**
 * Standard footer
 */
function emailFooter() {
    return `
    <tr>
        <td style="background-color: ${colors.primary}; padding: 20px; text-align: center;">
            <a href="${branding.websiteUrl}" style="color: ${colors.accent}; font-size: 14px; text-decoration: none; font-weight: 500;">${branding.website}</a>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.6); font-size: 12px;">© 2026 ${branding.name}</p>
        </td>
    </tr>`;
}

/**
 * Booking details card
 */
function bookingDetailsCard(items) {
    const rows = items.map(({ label, value, highlight = false }) => `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 12px; margin-bottom: 12px;">
            <tr>
                <td>
                    <p style="margin: 0 0 4px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
                    <p style="margin: 0; color: ${highlight ? colors.primary : '#333'}; font-size: ${highlight ? '24px' : '15px'}; font-weight: ${highlight ? '700' : '500'};">${value}</p>
                </td>
            </tr>
        </table>`
    ).join('');
    
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; margin-bottom: 25px;">
        <tr>
            <td style="padding: 20px;">
                ${rows}
            </td>
        </tr>
    </table>`;
}

/**
 * Generate client booking confirmation email
 */
function generateClientEmailHTML(t, { name, bookingId, serviceName, formatLabel, date, time, price }) {
    const content = `
        ${emailHeader(t.emailSubtitle)}
        <tr>
            <td style="padding: 30px 20px;">
                <h2 style="margin: 0 0 15px 0; color: ${colors.primary}; font-size: 22px; font-weight: 600; text-align: center;">${t.emailThankYou}</h2>
                <p style="margin: 0 0 20px 0; color: #444; font-size: 16px; line-height: 1.5; text-align: center;">${t.emailGreeting(name)}</p>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.5; text-align: center;">${t.emailConfirmed}</p>
                
                ${bookingDetailsCard([
                    { label: t.emailBookingId, value: bookingId },
                    { label: t.emailService, value: serviceName },
                    { label: t.emailFormat, value: formatLabel },
                    { label: t.emailDate, value: date },
                    { label: t.emailTime, value: time },
                    { label: t.emailPrice, value: price > 0 ? '€' + price : 'FREE', highlight: true }
                ])}
                
                <p style="margin: 0 0 12px 0; color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
                    📎 ${t.emailInvoiceAttached}
                </p>
                <p style="margin: 0 0 25px 0; color: #666; font-size: 14px; line-height: 1.5; text-align: center;">
                    ${t.emailQuestions}
                </p>
                
                <p style="margin: 0; color: #444; font-size: 15px; line-height: 1.6; text-align: center;">
                    ${t.emailRegards}<br>
                    <strong style="color: ${colors.primary};">${branding.name}</strong>
                </p>
            </td>
        </tr>
        ${emailFooter()}`;
    
    return emailWrapper(content, { title: t.emailSubject(bookingId) });
}

/**
 * Generate admin notification email
 */
function generateAdminEmailHTML(booking, confirmUrl) {
    const formatLabel = booking.consultationFormat === 'online' ? 'Attālināti' : 'Klātienē';
    const formatIcon = booking.consultationFormat === 'online' ? '💻' : '📍';
    const formatColor = booking.consultationFormat === 'online' ? '#2196F3' : '#4CAF50';
    
    const content = `
    <tr>
        <td style="background: linear-gradient(135deg, ${colors.accent} 0%, #c4956a 100%); padding: 25px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">🆕 Jauna rezervācija!</h1>
        </td>
    </tr>
    <tr>
        <td style="padding: 25px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 20px;">
                        ${adminDetailRow('Numurs', booking.id, { bold: true, color: colors.primary })}
                        ${adminDetailRow('Klients', booking.name)}
                        ${adminDetailRow('E-pasts', booking.email, { wordBreak: true })}
                        ${adminDetailRow('Telefons', booking.phone || 'Nav norādīts')}
                        ${adminDetailRow('Pakalpojums', booking.serviceName)}
                        ${adminDetailRow('Formāts', `${formatIcon} ${formatLabel}`, { color: formatColor })}
                        ${adminDetailRow('Datums', booking.date)}
                        ${adminDetailRow('Laiks', booking.time)}
                        ${adminDetailRow('Summa', booking.price > 0 ? '€' + booking.price : 'BEZMAKSAS', { bold: true, color: colors.primary, size: '20px' })}
                        ${adminDetailRow('Valoda', booking.language.toUpperCase(), { noBorder: !booking.notes })}
                        ${booking.notes ? adminDetailRow('Piezīmes', booking.notes, { noBorder: true }) : ''}
                    </td>
                </tr>
            </table>
            
            ${booking.price > 0 ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="padding: 15px 0;">
                        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; text-align: center;">Kad maksājums saņemts, nospied pogu:</p>
                        <a href="${confirmUrl}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, ${colors.success} 0%, #45a049 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
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
    <tr>
        <td style="background-color: ${colors.primary}; padding: 15px 20px; text-align: center;">
            <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">Sofija Nutrition Booking System</p>
        </td>
    </tr>`;
    
    return emailWrapper(content, { title: `Jauna rezervācija - ${booking.id}` });
}

function adminDetailRow(label, value, { bold = false, color = '#333', noBorder = false, wordBreak = false, size = '14px' } = {}) {
    return `
    <table role="presentation" width="100%" style="${noBorder ? '' : 'border-bottom: 1px solid #e0e0e0;'} padding-bottom: 10px; margin-bottom: 10px;">
        <tr><td>
            <p style="margin: 0 0 4px 0; color: #888; font-size: 11px; text-transform: uppercase;">${label}</p>
            <p style="margin: 0; font-size: ${size}; font-weight: ${bold ? '700' : '500'}; color: ${color}; ${wordBreak ? 'word-break: break-all;' : ''}">${value}</p>
        </td></tr>
    </table>`;
}

/**
 * Generate payment confirmation email for client
 */
function generatePaymentConfirmedEmailHTML(t, booking) {
    const formatLabel = booking.consultationFormat === 'online' ? t.formatOnline : t.formatInPerson;
    const formatIcon = booking.consultationFormat === 'online' ? '💻' : '📍';
    
    const content = `
    <tr>
        <td style="background: linear-gradient(135deg, ${colors.success} 0%, #45a049 100%); padding: 35px 20px; text-align: center;">
            <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; line-height: 70px; font-size: 35px;">✓</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${t.paymentConfirmedTitle}</h1>
        </td>
    </tr>
    <tr>
        <td style="padding: 30px 20px;">
            <p style="margin: 0 0 25px 0; color: #444; font-size: 16px; line-height: 1.5; text-align: center;">${t.paymentConfirmedText}</p>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; margin-bottom: 25px;">
                <tr>
                    <td style="padding: 25px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${t.emailService}</p>
                        <p style="margin: 0 0 20px 0; color: ${colors.primary}; font-size: 18px; font-weight: 600;">${booking.serviceName}</p>
                        
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${t.emailFormat}</p>
                        <p style="margin: 0 0 20px 0; color: #333; font-size: 15px; font-weight: 500;">
                            ${formatIcon} ${formatLabel}
                        </p>
                        
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="50%" style="text-align: center; padding: 10px;">
                                    <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">${t.emailDate}</p>
                                    <p style="margin: 0; color: ${colors.primary}; font-size: 20px; font-weight: 700;">${booking.date}</p>
                                </td>
                                <td width="50%" style="text-align: center; padding: 10px; border-left: 2px solid rgba(45, 90, 74, 0.2);">
                                    <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">${t.emailTime}</p>
                                    <p style="margin: 0; color: ${colors.primary}; font-size: 20px; font-weight: 700;">${booking.time}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            
            <p style="margin: 0; color: #444; font-size: 15px; line-height: 1.6; text-align: center;">
                ${t.emailRegards}<br>
                <strong style="color: ${colors.primary};">${branding.name}</strong>
            </p>
        </td>
    </tr>
    ${emailFooter()}`;
    
    return emailWrapper(content, { title: t.paymentConfirmedSubject(booking.id) });
}

/**
 * Generate confirmation page HTML (shown after admin clicks confirm button)
 */
function generateConfirmationPageHTML(status, message, emailSent = false) {
    const statusConfig = {
        success: { bg: '#e8f5e9', color: '#2e7d32', icon: '✓', title: 'Maksājums apstiprināts!' },
        error: { bg: '#ffebee', color: colors.error, icon: '✕', title: 'Kļūda' },
        already: { bg: '#fff3e0', color: colors.warning, icon: '!', title: 'Jau apstiprināts' }
    };
    const s = statusConfig[status] || statusConfig.error;
    
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
            <a href="${branding.websiteUrl}" style="display: inline-block; padding: 12px 25px; background: ${colors.primary}; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">Atgriezties uz mājaslapu</a>
        </div>
    </div>
</body>
</html>`;
}

module.exports = {
    generateClientEmailHTML,
    generateAdminEmailHTML,
    generatePaymentConfirmedEmailHTML,
    generateConfirmationPageHTML
};
