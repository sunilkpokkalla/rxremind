import nodemailer from 'nodemailer';

// Create reusable Nodemailer transport using Zoho SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || 'noreply@rxremind.us',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Sends a secure email notification using Zoho SMTP with custom clinic display headers.
 */
export async function sendSMTPMail(
  to: string,
  subject: string,
  htmlContent: string,
  displayNameOverride?: string
): Promise<{ success: boolean; error?: string }> {
  const fromUser = process.env.SMTP_USER || 'noreply@rxremind.us';
  const displayName = displayNameOverride || 'RxRemind';

  // Zoho Mail strictly requires the authenticated inbox address to be the sender,
  // but fully supports setting custom friendly display names before it.
  const fromHeader = `"${displayName}" <${fromUser}>`;

  if (!process.env.SMTP_PASS) {
    console.warn('SMTP App Password is not configured. Email dispatch skipped.');
    return { success: false, error: 'SMTP password not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: fromHeader,
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log('SMTP message sent successfully:', info.messageId);
    return { success: true };
  } catch (err: any) {
    console.error('SMTP email sending failed:', err);
    return { success: false, error: err.message || 'SMTP transmission error' };
  }
}
