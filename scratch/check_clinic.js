/**
 * Supabase Clinic Diagnostics Script
 * Loads credentials from .env.local and fetches the current clinic record to check billing tier and active flags.
 * Run via: node --env-file=.env.local scratch/check_clinic.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env.local.');
  process.exit(1);
}

async function runCheck() {
  try {
    const url = `${supabaseUrl}/rest/v1/clinics?select=*`;
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

    const clinics = await res.json();
    console.log('\n🏥 Clinics list in Supabase DB:');
    if (clinics.length === 0) {
      console.log('No clinics found.');
    } else {
      clinics.forEach(c => {
        console.log(`- Clinic Name: ${c.name}`);
        console.log(`  Plan: ${c.plan}`);
        console.log(`  Subscription Active: ${c.subscription_active}`);
        console.log(`  Auto Reminders: ${c.auto_reminders}`);
        console.log('  -------------------');
      });
    }
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

runCheck();
