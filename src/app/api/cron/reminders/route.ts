import { NextResponse } from 'next/server';
import { DBBroker } from '@/lib/db';

// Force dynamic execution to bypass Vercel static rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Load all registered clinics
    const clinics = await DBBroker.getAllClinics();
    let totalScanned = 0;
    let totalSent = 0;

    // 2. Trigger daily scans for active clinics
    for (const clinic of clinics) {
      if (clinic.auto_reminders) {
        const result = await DBBroker.triggerReminderScan(clinic.id);
        totalScanned += result.scanned;
        totalSent += result.sent;
      }
    }

    return NextResponse.json({
      success: true,
      message: `RxRemind daily cron sweep complete. Scanned ${totalScanned} patients across ${clinics.length} clinics. Dispatched ${totalSent} new reminders.`,
      data: {
        clinicsScanned: clinics.length,
        patientsScanned: totalScanned,
        remindersDispatched: totalSent,
      }
    });
  } catch (err: any) {
    console.error('Error executing automated reminder cron:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
