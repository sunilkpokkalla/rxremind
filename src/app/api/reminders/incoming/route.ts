import { NextResponse } from 'next/server';
import { DBBroker } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function verifyTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );

  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return expectedSignature === signature;
}

export async function POST(request: Request) {
  try {
    let from = '';
    let body = '';
    const params: Record<string, string> = {};

    const contentType = request.headers.get('content-type') || '';
    const isProduction = process.env.NODE_ENV === 'production';
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = request.headers.get('X-Twilio-Signature') || '';

    // 1. Parse both Twilio URL-encoded form data and standard JSON payloads
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const cloneReq = request.clone();
      const formData = await cloneReq.formData();
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });
      from = params['From'] || '';
      body = params['Body'] || '';
    } else {
      const json = await request.clone().json().catch(() => ({}));
      from = json.From || json.from || '';
      body = json.Body || json.body || '';
    }

    // 2. Verify Twilio Webhook Signature
    if (authToken && signature) {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'rxremind.us';
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      const publicUrl = `${proto}://${host}/api/reminders/incoming`;

      const isValid = await verifyTwilioSignature(authToken, signature, publicUrl, params);
      if (!isValid) {
        console.error('Twilio signature validation failed.');
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Twilio signature.' }, { status: 401 });
      }
    } else if (isProduction) {
      console.error('Twilio signature or auth token is missing in production.');
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing verification credentials.' }, { status: 401 });
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
    const clinics = await DBBroker.getAllClinics(true);
    let matchedPatient = null;

    for (const clinic of clinics) {
      const patients = await DBBroker.getPatients(clinic.id, true);
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
