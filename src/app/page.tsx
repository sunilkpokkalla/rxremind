import { redirect } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import DashboardClient from '@/components/DashboardClient';

export const revalidate = 0; // Disable server caching to ensure dashboard stats are always real-time!

export default async function DashboardPage() {
  const session = await AuthManager.getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  // Load clinic and verify context
  let clinic;
  let patients = [];
  let reminders = [];

  try {
    clinic = await DBBroker.getClinicByOwner(session.id);
    
    if (!clinic) {
      // Failsafe clinic creation
      clinic = await DBBroker.createClinic({
        owner_id: session.id,
        name: session.clinicName || 'RxRemind Clinic',
        email: session.email,
        phone: '',
        logo_url: '',
        plan: 'TestPlan',
        subscription_active: false,
        reminder_days_before: 3,
        auto_reminders: true,
        reminder_template: 'Hi {{patient_name}}, this is a friendly reminder from {{clinic_name}} that your prescription for {{medication_name}} is due for a refill on {{refill_date}}. Reply YES to confirm.',
      });
    }

    // Load all patients and reminders
    patients = await DBBroker.getPatients(clinic.id);
    reminders = await DBBroker.getReminders(clinic.id);
  } catch (err) {
    console.error('Database access denied (possibly unconfirmed email or RLS issue):', err);
    redirect('/login?error=database_access_denied');
  }

  return (
    <DashboardClient 
      clinic={clinic} 
      patients={patients} 
      reminders={reminders} 
    />
  );
}
