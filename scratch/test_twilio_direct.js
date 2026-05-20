/**
 * Twilio SMS & WhatsApp Diagnostic Script
 * Loads credentials from .env.local and executes a live request directly to Twilio.
 * Run via: node --env-file=.env.local scratch/test_twilio_direct.js <TO_PHONE_NUMBER> <SMS|WhatsApp>
 */

const args = process.argv.slice(2);
const to = args[0];
const channel = args[1] || 'SMS';

if (!to) {
  console.error('❌ Error: Recipient phone number is required.');
  console.log('Usage: node --env-file=.env.local scratch/test_twilio_direct.js <+1XXXXXXXXXX> <SMS|WhatsApp>');
  process.exit(1);
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;

console.log('🏁 Diagnostic Initialization:');
console.log(`- TWILIO_ACCOUNT_SID: ${accountSid ? '✅ Configured (Ends with ' + accountSid.slice(-4) + ')' : '❌ Not Configured'}`);
console.log(`- TWILIO_AUTH_TOKEN: ${authToken ? '✅ Configured (Ends with ' + authToken.slice(-4) + ')' : '❌ Not Configured'}`);
console.log(`- TWILIO_PHONE_NUMBER: ${from ? '✅ ' + from : '❌ Not Configured'}`);
console.log(`- Target recipient: ${to}`);
console.log(`- Target channel: ${channel}`);

if (!accountSid || !authToken || !from) {
  console.error('❌ Error: Missing credentials in .env.local.');
  process.exit(1);
}

async function runDiagnostic() {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const isWhatsApp = channel.toLowerCase() === 'whatsapp';
    const twilioTo = isWhatsApp ? (to.startsWith('whatsapp:') ? to : `whatsapp:${to}`) : to;
    const twilioFrom = isWhatsApp 
      ? (from.includes('whatsapp') ? from : 'whatsapp:+14155238886') 
      : from;

    console.log('\n📤 Sending direct request to Twilio API...');
    console.log(`- Endpoint: ${url}`);
    console.log(`- To: ${twilioTo}`);
    console.log(`- From: ${twilioFrom}`);

    const params = new URLSearchParams();
    params.append('To', twilioTo);
    params.append('From', twilioFrom);
    params.append('Body', 'Diagnostic check: Your prescription refill reminder is ready from RxRemind! 🛡️ Reply YES to confirm.');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log(`\n📥 Twilio Response Code: ${res.status} ${res.statusText}`);
    const responseText = await res.text();
    console.log('📥 Raw Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(responseText), null, 2));
    } catch {
      console.log(responseText);
    }

    if (res.ok) {
      console.log('\n🎉 Success! Twilio accepted the message.');
    } else {
      console.log('\n❌ Twilio API rejected the request. See the error details above.');
    }
  } catch (err) {
    console.error('\n💥 Network/Unexpected Error:', err);
  }
}

runDiagnostic();
