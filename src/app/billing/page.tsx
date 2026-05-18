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

  const clinic = await DBBroker.getClinicByOwner(session.id);
  if (!clinic) {
    redirect('/');
  }

  const resolvedParams = await searchParams;
  const success = resolvedParams.success === 'true';

  return <BillingClient clinic={clinic} showSuccessBanner={success} />;
}
