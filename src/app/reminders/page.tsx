import { redirect } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import RemindersClient from '@/components/RemindersClient';

export const revalidate = 0; // Real-time

export default async function RemindersPage() {
  const session = await AuthManager.getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  let clinic;
  let reminders = [];
  let patients = [];
  try {
    clinic = await DBBroker.getClinicByOwner(session.id);
    if (!clinic) {
      redirect('/');
    }
    // Load all reminders and patient registry
    reminders = await DBBroker.getReminders(clinic.id);
    patients = await DBBroker.getPatients(clinic.id);
  } catch (err) {
    console.error('Reminders page database access denied:', err);
    redirect('/login?error=database_access_denied');
  }

  return (
    <RemindersClient 
      clinic={clinic}
      reminders={reminders} 
      patients={patients} 
    />
  );
}
