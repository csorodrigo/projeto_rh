/**
 * Email Sender Service
 * Handles email sending using Resend
 */

import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email will not be sent.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: params.from || process.env.EMAIL_FROM || 'RH Sistema <noreply@seu-dominio.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
      cc: params.cc,
      bcc: params.bcc,
    });

    if (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Unexpected email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send batch emails (with rate limiting)
 */
export async function sendBatchEmails(emails: EmailParams[]): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);

    // Rate limiting: wait 100ms between emails
    if (emails.indexOf(email) < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
