import { redirect } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import BillingClient from '@/components/BillingClient';

export const revalidate = 0; // Real-time

export default async function BillingPage() {
  const session = await AuthManager.getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  const clinic = await DBBroker.getClinicByOwner(session.id);
  if (!clinic) {
    redirect('/');
  }

  return <BillingClient clinic={clinic} />;
}
