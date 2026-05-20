import { NextResponse } from 'next/server';
import { DBBroker } from '@/lib/db';
import { sendTwilioSMS } from '@/lib/twilio';
import { sendResendEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const { patientId } = json;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Parameter "patientId" is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch patient
    const patient = await DBBroker.getPatientById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // 2. Fetch parent clinic details
    const clinic = await DBBroker.getClinicById(patient.clinic_id);
    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Associated clinic not found' },
        { status: 404 }
      );
    }

    // 3. Compile template
    let msg = clinic.reminder_template || '';
    msg = msg.replace(/{{patient_name}}/g, patient.name);
    msg = msg.replace(/{{medication_name}}/g, patient.medication_name);
    msg = msg.replace(/{{clinic_name}}/g, clinic.name);
    msg = msg.replace(/{{refill_date}}/g, patient.next_refill_date);

    // 4. Create and dispatch reminder record
    const reminder = await DBBroker.createReminder({
      patient_id: patient.id,
      clinic_id: clinic.id,
      sent_at: new Date().toISOString(),
      channel: patient.reminder_channel,
      response: null,
      status: 'sent',
      message_body: msg
    });

    // 5. Fire physical dispatch conditionally based on channel
    try {
      if (patient.reminder_channel === 'Email') {
        const formattedHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; max-width: 580px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="font-size: 20px; font-weight: 800; color: #2563eb; margin-bottom: 20px;">${clinic.name}</div>
            <div style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
              ${msg.replace(/\n/g, '<br/>')}
            </div>
            <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              This is an automated prescription refill reminder sent on behalf of ${clinic.name}.
            </div>
          </div>
        `;
        await sendResendEmail(patient.email, `Prescription Refill Reminder from ${clinic.name} 🛡️`, formattedHtml);
      } else {
        await sendTwilioSMS(patient.phone, msg, patient.reminder_channel);
      }
    } catch (dispatchErr) {
      console.error('Physical dispatch failed:', dispatchErr);
    }

    // 6. Shift patient status to pending
    await DBBroker.updatePatient(patient.id, { status: 'pending' });

    return NextResponse.json({
      success: true,
      message: `Manual reminder successfully sent to ${patient.name} via ${patient.reminder_channel}.`,
      data: {
        reminderId: reminder.id,
        patientName: patient.name,
        channel: patient.reminder_channel,
        messageBody: msg
      }
    });

  } catch (err: any) {
    console.error('Error dispatching manual reminder API:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
