export async function sendTwilioSMS(
  to: string, 
  body: string, 
  channel: 'SMS' | 'WhatsApp' = 'SMS'
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  // Return clear error if keys are missing to inform the user
  if (!accountSid || !authToken || !from) {
    console.warn('Twilio credentials not configured. Twilio dispatch skipped.');
    return { success: false, error: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER not configured. Please add them to your Cloudflare environment variables!' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const isWhatsApp = channel === 'WhatsApp';
    const twilioTo = isWhatsApp ? (to.startsWith('whatsapp:') ? to : `whatsapp:${to}`) : to;
    
    // For trial sandboxes, the From number is always whatsapp:+14155238886. 
    // If the configured TWILIO_PHONE_NUMBER already includes "whatsapp:", we use it directly, otherwise default to the official sandbox number.
    const twilioFrom = isWhatsApp 
      ? (from.includes('whatsapp') ? from : 'whatsapp:+14155238886') 
      : from;

    // Twilio requires form-urlencoded data
    const params = new URLSearchParams();
    params.append('To', twilioTo);
    params.append('From', twilioFrom);
    params.append('Body', body);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr;
      try {
        parsedErr = JSON.parse(errText);
      } catch {}
      return { success: false, error: parsedErr?.message || `Twilio HTTP error ${res.status}: ${errText}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown Twilio gateway error' };
  }
}
