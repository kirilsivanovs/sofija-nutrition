/**
 * Email Service (TypeScript)
 * Handles sending emails via Resend API
 */

import { Resend } from 'resend';
import { branding } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmailService');

// ============================================
// Types
// ============================================

export interface EmailAttachment {
  filename: string;
  content: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ============================================
// State
// ============================================

let resendClient: Resend | null = null;

// ============================================
// Client Management
// ============================================

/**
 * Get or create Resend client
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!resendClient && apiKey) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// ============================================
// Email Functions
// ============================================

/**
 * Send email with optional attachments
 */
export async function sendEmail({ to, subject, html, attachments = [] }: SendEmailOptions): Promise<EmailResult> {
  const client = getResendClient();

  if (!client) {
    console.error('❌ Email service not configured: RESEND_API_KEY missing');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    logger.info('Sending email', { to, subject, attachments: attachments.length });

    const result = await client.emails.send({
      from: `${branding.name} <${branding.email}>`,
      to,
      subject,
      html,
      attachments: attachments as any
    });

    logger.info('Email sent successfully', { id: result?.data?.id });
    return { success: true, id: result?.data?.id };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Email sending error:', err.message);
    if (err.message?.includes('domain')) {
      console.error('💡 Hint: На бесплатном плане Resend используйте onboarding@resend.dev');
    }
    return { success: false, error: err.message };
  }
}

/**
 * Send booking confirmation to client
 */
export async function sendClientConfirmation(
  to: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[] = []
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject,
    html,
    attachments
  });
}

/**
 * Send new booking notification to admin
 */
export async function sendAdminNotification(subject: string, html: string): Promise<EmailResult> {
  const adminEmail = process.env.ADMIN_EMAIL || 'ivanovs.kirils95@gmail.com';
  return sendEmail({
    to: adminEmail,
    subject,
    html
  });
}

/**
 * Send payment confirmation to client
 */
export async function sendPaymentConfirmation(to: string, subject: string, html: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject,
    html
  });
}

/**
 * Send cancellation notification to client
 */
export async function sendCancellationNotification(to: string, subject: string, html: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject,
    html
  });
}

/**
 * Check if email service is configured
 */
export function isConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  sendEmail,
  sendClientConfirmation,
  sendAdminNotification,
  sendPaymentConfirmation,
  sendCancellationNotification,
  isConfigured
};
