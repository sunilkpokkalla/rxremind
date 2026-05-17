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

  const clinic = await DBBroker.getClinicByOwner(session.id);
  if (!clinic) {
    redirect('/');
  }

  // Load all reminders and patient registry
  const reminders = await DBBroker.getReminders(clinic.id);
  const patients = await DBBroker.getPatients(clinic.id);

  return (
    <RemindersClient 
      reminders={reminders} 
      patients={patients} 
    />
  );
}
