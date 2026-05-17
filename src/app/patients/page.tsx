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

  const clinic = await DBBroker.getClinicByOwner(session.id);
  if (!clinic) {
    redirect('/');
  }

  const patients = await DBBroker.getPatients(clinic.id);

  return <PatientsClient patients={patients} />;
}
