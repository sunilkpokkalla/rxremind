import { redirect } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import BillingClient from '@/components/BillingClient';

export const revalidate = 0; // Real-time

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BillingPage({ searchParams }: PageProps) {
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
    console.error('Billing page database access denied:', err);
    redirect('/login?error=database_access_denied');
  }

  const resolvedParams = await searchParams;
  const success = resolvedParams.success === 'true';

  return <BillingClient clinic={clinic} showSuccessBanner={success} />;
}
