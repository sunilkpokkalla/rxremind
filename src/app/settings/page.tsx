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

  let clinic;
  try {
    clinic = await DBBroker.getClinicByOwner(session.id);
    if (!clinic) {
      redirect('/');
    }
  } catch (err) {
    console.error('Settings page database access denied:', err);
    redirect('/login?error=database_access_denied');
  }

  return <SettingsClient clinic={clinic} />;
}
