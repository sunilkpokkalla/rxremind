/**
 * Supabase Patients Diagnostics Script
 * Loads credentials from .env.local and fetches all active patients to verify phone numbers and channels.
 * Run via: node --env-file=.env.local scratch/check_patients.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env.local.');
  process.exit(1);
}

async function runCheck() {
  try {
    const url = `${supabaseUrl}/rest/v1/patients?select=*`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!res.ok) {
      console.error(`❌ Supabase Error ${res.status}:`, await res.text());
      return;
    }

    const patients = await res.json();
    console.log('\n👥 Patients list in Supabase DB:');
    if (patients.length === 0) {
      console.log('No patients found.');
    } else {
      patients.forEach(p => {
        console.log(`- Name: ${p.name}`);
        console.log(`  Phone: "${p.phone}"`);
        console.log(`  Channel: ${p.reminder_channel}`);
        console.log(`  Status: ${p.status}`);
        console.log(`  Next Refill: ${p.next_refill_date}`);
        console.log('  -------------------');
      });
    }
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

runCheck();
