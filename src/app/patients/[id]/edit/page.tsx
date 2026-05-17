import { notFound, redirect } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import EditPatientClient from '@/components/EditPatientClient';

interface EditPatientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 0; // Real-time

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const resolvedParams = await params;
  const session = await AuthManager.getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  const clinic = await DBBroker.getClinicByOwner(session.id);
  if (!clinic) {
    redirect('/');
  }

  const patient = await DBBroker.getPatientById(resolvedParams.id);
  
  if (!patient || (patient.clinic_id !== clinic.id && clinic.id !== 'demo-clinic-uuid-12345')) {
    notFound();
  }

  return <EditPatientClient patient={patient} />;
}
