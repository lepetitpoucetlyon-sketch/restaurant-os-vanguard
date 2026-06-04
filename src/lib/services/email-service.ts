/**
 * 📧 Email Service
 * Unified email delivery service for Restaurant OS
 * Integrates with Resend for transactional email (requires: npm install resend)
 *
 * SETUP:
 * 1. npm install resend
 * 2. Set RESEND_API_KEY in .env.local
 * 3. Service will automatically use Resend if configured, otherwise logs emails
 */

import { logger } from '@/lib/logger';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email via Resend (or fallback logging if not configured)
 * @param to Recipient email
 * @param subject Email subject
 * @param html HTML content
 * @returns Promise<{success: boolean, messageId?: string, error?: string}>
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.RESEND_FROM_EMAIL || 'noreply@restaurant-os.app',
  replyTo = process.env.RESEND_REPLY_TO || 'support@restaurant-os.app'
}: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Validation
  if (!to || !subject || !html) {
    logger.warn('[EmailService] Missing required fields', { to, subject, hasHtml: !!html });
    return { success: false, error: 'Missing required fields' };
  }

  // If no Resend key, log and return gracefully
  if (!resendApiKey) {
    logger.info('[EmailService] No RESEND_API_KEY configured, logging email instead', {
      to,
      subject,
      htmlLength: html.length
    });
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  try {
    // Dynamic import to avoid build-time dependency if resend is not installed
    const { Resend } = await import("resend" as string) as { Resend: new(key: string) => { emails: { send: (opts: Record<string, unknown>) => Promise<{ data?: unknown; error?: { message?: string } }> } } };
    const resend = new Resend(resendApiKey);

    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo
    });

    if (!response.data) {
      logger.warn('[EmailService] Resend failed', { to, subject, error: response.error });
      return { success: false, error: response.error?.message || 'Unknown error' };
    }

    const dataId = (response.data as { id?: string })?.id;
    logger.info("[EmailService] Email sent successfully", { to, subject, messageId: dataId });
    return { success: true, messageId: dataId };
  } catch (error) {
    // If Resend package not installed, log gracefully
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      logger.info('[EmailService] Resend not installed, logging email to console', {
        to,
        subject,
        htmlLength: html.length
      });
      return { success: true, messageId: 'fallback-' + Date.now() };
    }

    logger.error('[EmailService] Failed to send email', {
      to,
      subject,
      error: error instanceof Error ? error.message : String(error)
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send billing relance email to customer
 */
export async function sendBillingRelanceEmail(
  recipientEmail: string,
  customerName: string,
  amountDue: number,
  currency: string = 'EUR'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Payment Reminder</h1>
          <p>Dear ${customerName},</p>
          <p>This is a friendly reminder that your Restaurant OS subscription payment is due.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Amount Due:</strong> ${amountDue.toFixed(2)} ${currency}</p>
          </div>

          <p>Please update your payment information to ensure uninterrupted access to your Restaurant OS.</p>

          <p>
            <a href="https://restaurant-os.app/billing" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Update Payment
            </a>
          </p>

          <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Need help? Contact our support team at support@restaurant-os.app
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `[Restaurant OS] Payment Due: ${amountDue.toFixed(2)} ${currency}`,
    html
  });
}

/**
 * Send invoice/receipt email
 */
export async function sendInvoiceEmail(
  recipientEmail: string,
  invoiceId: string,
  amount: number,
  currency: string = 'EUR'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Invoice #${invoiceId}</h1>
          <p>Thank you for your subscription to Restaurant OS.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount.toFixed(2)} ${currency}</p>
            <p style="margin: 5px 0;"><strong>Invoice ID:</strong> ${invoiceId}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>Your payment has been processed successfully.</p>

          <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Questions? Contact support@restaurant-os.app
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `[Restaurant OS] Invoice #${invoiceId} - ${amount.toFixed(2)} ${currency}`,
    html
  });
}
