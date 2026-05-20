/**
 * Supabase Clinics Initial Sandbox State Configurer
 * Sets all clinics back to 'TestPlan' so they are ready for a live presentation of the upgrade funnel.
 * Run via: node --env-file=.env.local scratch/upgrade_to_testplan.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env.local.');
  process.exit(1);
}

async function runReset() {
  try {
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
        plan: 'TestPlan'
      })
    });

    if (!patchRes.ok) {
      console.error('❌ Failed to update clinics:', await patchRes.text());
      return;
    }

    const updatedClinics = await patchRes.json();
    console.log('✅ Successfully set all clinics to TestPlan sandbox state! Results:');
    updatedClinics.forEach(c => {
      console.log(`- Clinic "${c.name}" (${c.id}) -> Plan: ${c.plan}`);
    });
  } catch (err) {
    console.error('💥 Unexpected error during reset:', err);
  }
}

runReset();
