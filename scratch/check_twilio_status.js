/**
 * Twilio Message Status Checker
 * Query Twilio for the live delivery status of a specific message SID.
 * Run via: node --env-file=.env.local scratch/check_twilio_status.js <MESSAGE_SID>
 */

const args = process.argv.slice(2);
const sid = args[0];

if (!sid) {
  console.error('❌ Error: Message SID is required.');
  console.log('Usage: node --env-file=.env.local scratch/check_twilio_status.js <SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX>');
  process.exit(1);
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Error: Missing credentials in .env.local.');
  process.exit(1);
}

async function runCheck() {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${sid}.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    console.log(`\n📥 Fetching status from Twilio...`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

runCheck();
