/**
 * Supabase Clinics Schema Column Audit
 * Queries the RPC or REST endpoint to see exactly what columns exist on the 'clinics' table.
 * Run via: node --env-file=.env.local scratch/check_supabase_columns.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env.local.');
  process.exit(1);
}

async function runCheck() {
  try {
    const url = `${supabaseUrl}/rest/v1/clinics?select=*&limit=1`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      }
    });

    if (!res.ok) {
      console.error(`❌ Supabase Error ${res.status}:`, await res.text());
      return;
    }

    const data = await res.json();
    console.log('\n🔍 Single Clinic Object Keys:');
    if (data.length === 0) {
      console.log('No clinics records available to inspect.');
    } else {
      console.log(JSON.stringify(Object.keys(data[0]), null, 2));
      console.log('\nRaw values:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

runCheck();
