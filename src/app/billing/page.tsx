import { redirect } from 'next/navigation';
import { Suspense } from 'react';
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

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <BillingClient clinic={clinic} />
    </Suspense>
  );
}
