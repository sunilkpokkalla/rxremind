/**
 * Twilio SendGrid REST API Email Dispatch Helper
 * Optimized for Cloudflare Pages (Edge Runtimes) with zero heavy NPM packages.
 */

export async function sendSendGridEmail(
  to: string,
  subject: string,
  htmlContent: string,
  fromEmail: string = 'noreply@rxremind.us',
  displayName: string = 'RxRemind'
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY || '';

  if (!apiKey) {
    console.warn('Twilio SendGrid API Key (SENDGRID_API_KEY) is not configured.');
    return { success: false, error: 'SENDGRID_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }]
          }
        ],
        from: {
          email: fromEmail,
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

    if (response.status >= 200 && response.status < 300) {
      return { success: true };
    } else {
      const errText = await response.text();
      console.error('Twilio SendGrid dispatch failed:', errText);
      return { success: false, error: `SendGrid error (Status ${response.status}): ${errText || 'Rejected'}` };
    }

  } catch (err: any) {
    console.error('SendGrid network error:', err);
    return { success: false, error: err.message || 'SendGrid network dispatch failure' };
  }
}
