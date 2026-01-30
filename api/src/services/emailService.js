/**
 * Email Service
 * Handles sending emails via Resend API
 */

const { Resend } = require('resend');
const config = require('../config');

let resendClient = null;

/**
 * Get or create Resend client
 * @returns {Resend|null}
 */
function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!resendClient && apiKey) {
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}

/**
 * Send email with optional attachments
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {Array} [options.attachments] - Optional attachments
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function sendEmail({ to, subject, html, attachments = [] }) {
    const client = getResendClient();
    
    if (!client) {
        console.error('❌ Email service not configured: RESEND_API_KEY missing');
        return { success: false, error: 'RESEND_API_KEY not configured' };
    }
    
    try {
        console.log('📧 Sending email...');
        console.log('  From:', `${config.branding.name} <${config.branding.email}>`);
        console.log('  To:', to);
        console.log('  Subject:', subject);
        console.log('  Attachments:', attachments.length);
        
        const result = await client.emails.send({
            from: `${config.branding.name} <${config.branding.email}>`,
            to,
            subject,
            html,
            attachments
        });
        
        console.log('✅ Email sent successfully, ID:', result?.data?.id);
        return { success: true, id: result?.data?.id };
    } catch (error) {
        console.error('❌ Email sending error:', error.message);
        if (error.message.includes('domain')) {
            console.error('💡 Hint: На бесплатном плане Resend используйте onboarding@resend.dev');
        }
        return { success: false, error: error.message };
    }
}

/**
 * Send booking confirmation to client
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {Array} attachments - Optional attachments
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function sendClientConfirmation(to, subject, html, attachments = []) {
    return sendEmail({
        to,
        subject,
        html,
        attachments
    });
}

/**
 * Send new booking notification to admin
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function sendAdminNotification(subject, html) {
    const adminEmail = process.env.ADMIN_EMAIL || 'ivanovs.kirils95@gmail.com';
    return sendEmail({
        to: adminEmail,
        subject,
        html
    });
}

/**
 * Send payment confirmation to client
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function sendPaymentConfirmation(to, subject, html) {
    return sendEmail({
        to,
        subject,
        html
    });
}

/**
 * Check if email service is configured
 * @returns {boolean}
 */
function isConfigured() {
    return !!process.env.RESEND_API_KEY;
}

module.exports = {
    sendEmail,
    sendClientConfirmation,
    sendAdminNotification,
    sendPaymentConfirmation,
    isConfigured
};
