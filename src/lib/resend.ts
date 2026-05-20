/**
 * Edge-compatible Email Dispatch Helper (Dual-Driver: Resend and Twilio SendGrid)
 * Sends highly deliverable transaction emails natively via Fetch API.
 * Optimal for Edge Runtimes like Cloudflare Workers/Pages.
 */

export async function sendResendEmail(
  to: string, 
  subject: string, 
  htmlContent: string, 
  fromOverride?: string,
  displayNameOverride?: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const sendgridApiKey = process.env.SENDGRID_API_KEY || process.env.TWILIO_SENDGRID_API_KEY || '';
  
  if (!resendApiKey && !sendgridApiKey) {
    console.warn('Neither Resend nor SendGrid API key is configured. Email dispatch skipped.');
    return { success: false, error: 'Email gateway not configured. Please add either RESEND_API_KEY or SENDGRID_API_KEY to your Cloudflare environment variables!' };
  }

  const fromEmail = fromOverride || process.env.RESEND_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@rxremind.us';
  const cleanFrom = fromEmail.includes('@') ? fromEmail : 'noreply@rxremind.us';
  const displayName = displayNameOverride || 'RxRemind';

  // --- TWILIO SENDGRID DRIVER ---
  if (sendgridApiKey) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sendgridApiKey}`
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }]
            }
          ],
          from: { 
            email: cleanFrom,
            name: displayName
          },
          subject: subject,
          content: [
            {
              type: 'text/html',
              value: htmlContent
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`SendGrid API responded with status ${response.status}: ${errText}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to dispatch email via Twilio SendGrid API:', error);
      return { success: false, error: error.message || 'Unknown SendGrid dispatch error' };
    }
  }

  // --- RESEND DRIVER ---
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: `${displayName} <${cleanFrom}>`,
        to: [to],
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Resend API responded with status ${response.status}: ${errText}`);
    }

    return { success: true };

  } catch (error: any) {
    console.error('Failed to dispatch email via Resend API:', error);
    return { success: false, error: error.message || 'Unknown Resend dispatch error' };
  }
}
