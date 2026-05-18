export async function sendTwilioSMS(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  // Return clear error if keys are missing to inform the user
  if (!accountSid || !authToken || !from) {
    console.warn('Twilio credentials not configured. SMS dispatch skipped.');
    return { success: false, error: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER not configured. Please add them to your Cloudflare environment variables!' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    // Twilio requires form-urlencoded data
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', from);
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
