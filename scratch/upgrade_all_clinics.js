/**
 * Supabase Clinics Plan Upgrader Script
 * Upgrades all existing clinics in the database to 'Pro' so they show the premium tier instantly on login.
 * Run via: node --env-file=.env.local scratch/upgrade_all_clinics.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env.local.');
  process.exit(1);
}

async function runUpgrade() {
  try {
    // 1. Fetch clinics to find their IDs
    const fetchUrl = `${supabaseUrl}/rest/v1/clinics?select=id,name,plan`;
    const getRes = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!getRes.ok) {
      console.error('❌ Failed to fetch clinics:', await getRes.text());
      return;
    }

    const clinics = await getRes.json();
    console.log(`\nFound ${clinics.length} clinics in database.`);

    // 2. Perform mass upgrade via PATCH
    const patchUrl = `${supabaseUrl}/rest/v1/clinics?id=not.is.null`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        plan: 'Pro'
      })
    });

    if (!patchRes.ok) {
      console.error('❌ Failed to upgrade clinics:', await patchRes.text());
      return;
    }

    const updatedClinics = await patchRes.json();
    console.log('✅ Successfully upgraded all clinics to Pro tier! Results:');
    updatedClinics.forEach(c => {
      console.log(`- Upgraded clinic "${c.name}" (${c.id}) to: ${c.plan}`);
    });
  } catch (err) {
    console.error('💥 Unexpected error during upgrade:', err);
  }
}

runUpgrade();
