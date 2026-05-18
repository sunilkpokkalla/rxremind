import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DBBroker } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Enforce clinic existence for newly verified owners
        const clinic = await DBBroker.getClinicByOwner(user.id);
        if (!clinic) {
          await DBBroker.createClinic({
            owner_id: user.id,
            name: 'RxRemind Clinic',
            email: user.email || '',
            phone: '',
            logo_url: '',
            plan: 'Pro',
            reminder_days_before: 3,
            auto_reminders: true,
            reminder_template: 'Hi {{patient_name}}, this is a friendly reminder from {{clinic_name}} that your prescription for {{medication_name}} is due for a refill on {{refill_date}}. Reply YES to confirm.',
          });
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
