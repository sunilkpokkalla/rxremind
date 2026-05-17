import { redirect } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import SettingsClient from '@/components/SettingsClient';

export const revalidate = 0; // Real-time

export default async function SettingsPage() {
  const session = await AuthManager.getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  const clinic = await DBBroker.getClinicByOwner(session.id);
  if (!clinic) {
    redirect('/');
  }

  return <SettingsClient clinic={clinic} />;
}
