import { redirect } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import PatientsClient from '@/components/PatientsClient';

export const revalidate = 0; // Real-time

export default async function PatientsPage() {
  const session = await AuthManager.getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  let clinic;
  let patients = [];
  try {
    clinic = await DBBroker.getClinicByOwner(session.id);
    if (!clinic) {
      redirect('/');
    }
    patients = await DBBroker.getPatients(clinic.id);
  } catch (err) {
    console.error('Patients page database access denied:', err);
    redirect('/login?error=database_access_denied');
  }

  return <PatientsClient clinic={clinic} patients={patients} />;
}
