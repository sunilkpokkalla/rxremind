import { NextResponse } from 'next/server';
import { DBBroker } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let from = '';
    let body = '';

    const contentType = request.headers.get('content-type') || '';

    // 1. Parse both Twilio URL-encoded form data and standard JSON payloads
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      from = formData.get('From') as string || '';
      body = formData.get('Body') as string || '';
    } else {
      const json = await request.json().catch(() => ({}));
      from = json.From || json.from || '';
      body = json.Body || json.body || '';
    }

    if (!from || !body) {
      return NextResponse.json(
        { success: false, error: 'Parameters "From" and "Body" are required.' },
        { status: 400 }
      );
    }

    // 2. Clean phone formatting to ensure robust matching
    const cleanPhoneStr = (phone: string) => phone.replace(/[^\d+]/g, '');
    const searchPhone = cleanPhoneStr(from);

    // 3. Find matching patient across all clinics
    // Grab all clinics, fetch all patients in the system
    const clinics = await DBBroker.getAllClinics();
    let matchedPatient = null;

    for (const clinic of clinics) {
      const patients = await DBBroker.getPatients(clinic.id);
      const found = patients.find((p) => cleanPhoneStr(p.phone) === searchPhone);
      if (found) {
        matchedPatient = found;
        break;
      }
    }

    if (!matchedPatient) {
      return NextResponse.json(
        { success: false, error: `No registered patient matches the number: ${from}` },
        { status: 404 }
      );
    }

    // 4. Fire patient reply webhook engine
    const success = await DBBroker.simulatePatientReply(matchedPatient.id, body);

    return NextResponse.json({
      success: true,
      message: `Incoming message successfully processed for ${matchedPatient.name}.`,
      data: {
        patientName: matchedPatient.name,
        prescription: matchedPatient.medication_name,
        incomingText: body,
        simulationOutcome: success ? 'rescheduled_and_confirmed' : 'log_only'
      }
    });

  } catch (err: any) {
    console.error('Error processing incoming webhooks:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
