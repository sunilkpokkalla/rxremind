/**
 * Resend REST API Email Dispatch Helper
 * Sends highly deliverable transaction emails natively via Fetch API.
 * Avoids extra NPM bundle size, optimal for Edge Runtimes like Cloudflare.
 */

export async function sendResendEmail(
  to: string, 
  subject: string, 
  htmlContent: string, 
  fromOverride?: string,
  displayNameOverride?: string
): Promise<{ success: boolean; error?: string }> {
  // Use the SUPABASE_SERVICE_KEY as a dynamic proxy or search for RESEND_API_KEY
  const apiKey = process.env.RESEND_API_KEY || '';
  
  if (!apiKey) {
    console.warn('Resend API key is not configured. Email dispatch skipped.');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const fromEmail = fromOverride || process.env.RESEND_FROM_EMAIL || 'noreply@rxremind.us';
    const cleanFrom = fromEmail.includes('@') ? fromEmail : 'noreply@rxremind.us';
    const displayName = displayNameOverride || 'RxRemind';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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

    const data = await response.json();
    return { success: true };

  } catch (error: any) {
    console.error('Failed to dispatch email via Resend API:', error);
    return { success: false, error: error.message || 'Unknown email dispatch error' };
  }
}
