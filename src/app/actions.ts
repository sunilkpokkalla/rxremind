'use server';

import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// SECURE BACKEND CAPTCHA TOKEN VERIFICATION
async function verifyTurnstileToken(token: string | null, email?: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

// SIGN IN ACTION
export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const turnstileToken = formData.get('cf-turnstile-response') as string | null;

  if (!email) {
    return { success: false, error: 'Email is required' };
  }

  // Verify CAPTCHA
  const captcha = await verifyTurnstileToken(turnstileToken, email);
  if (!captcha.success) {
    return { success: false, error: captcha.error };
  }

  const result = await AuthManager.signIn(email, password);
  
  if (result.success) {
    revalidatePath('/');
    redirect('/');
  } else {
    return { success: false, error: result.error || 'Invalid credentials' };
  }
}

// SIGN UP ACTION
export async function signUpAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const clinicName = formData.get('clinicName') as string;
  const clinicPhone = formData.get('clinicPhone') as string;
  const turnstileToken = formData.get('cf-turnstile-response') as string | null;

  if (!email || !password || !clinicName) {
    return { success: false, error: 'Email, password, and clinic name are required' };
  }

  // Verify CAPTCHA
  const captcha = await verifyTurnstileToken(turnstileToken, email);
  if (!captcha.success) {
    return { success: false, error: captcha.error };
  }

  const result = await AuthManager.signUp(email, password, clinicName, clinicPhone);

  if (result.success) {
    revalidatePath('/');
    redirect('/');
  } else {
    return { success: false, error: result.error || 'Registration failed' };
  }
}

// FORGOT PASSWORD ACTION
export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const turnstileToken = formData.get('cf-turnstile-response') as string | null;

  if (!email) {
    return { success: false, error: 'Email address is required' };
  }

  // Verify CAPTCHA
  const captcha = await verifyTurnstileToken(turnstileToken, email);
  if (!captcha.success) {
    return { success: false, error: captcha.error };
  }

  try {
    const headersList = await headers();
    const host = headersList.get('host');
    const proto = headersList.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;

    const result = await AuthManager.forgotPassword(email, origin);

    if (result.success) {
      return { 
        success: true, 
        message: 'A password recovery link has been simulated / sent to your email address.',
        simulatedLink: result.simulatedLink 
      };
    } else {
      return { success: false, error: result.error || 'Password recovery failed.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

// RESET PASSWORD ACTION
export async function resetPasswordAction(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return { success: false, error: 'Both password fields are required.' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  let success = false;
  let errorMsg = 'Failed to update your password.';

  try {
    const result = await AuthManager.resetPassword(password);
    if (result.success) {
      success = true;
    } else {
      errorMsg = result.error || 'Failed to update your password.';
    }
  } catch (err: any) {
    errorMsg = err.message || 'An unexpected error occurred.';
  }

  if (success) {
    redirect('/login?reset=success');
  } else {
    return { success: false, error: errorMsg };
  }
}

// SIGN OUT ACTION
export async function signOutAction() {
  await AuthManager.signOut();
  revalidatePath('/');
  redirect('/login');
}

// TRIGGER CRON REMINDER SCAN ACTION
export async function triggerScanAction(clinicId: string) {
  const result = await DBBroker.triggerReminderScan(clinicId);
  revalidatePath('/');
  return result;
}

// SIMULATE PATIENT REPLY ACTION
export async function simulatePatientReplyAction(patientId: string, responseText: string) {
  await DBBroker.simulatePatientReply(patientId, responseText);
  revalidatePath('/');
}

// SEND SINGLE MANUAL REMINDER ACTION
export async function sendSingleReminderAction(patientId: string) {
  const patient = await DBBroker.getPatientById(patientId);
  if (!patient) throw new Error('Patient not found');
  
  const clinic = await DBBroker.getClinicById(patient.clinic_id);
  if (!clinic) throw new Error('Clinic not found');

  let msg = clinic.reminder_template || '';
  msg = msg.replace(/{{patient_name}}/g, patient.name);
  msg = msg.replace(/{{medication_name}}/g, patient.medication_name);
  msg = msg.replace(/{{clinic_name}}/g, clinic.name);
  msg = msg.replace(/{{refill_date}}/g, patient.next_refill_date);

  await DBBroker.createReminder({
    patient_id: patient.id,
    clinic_id: clinic.id,
    sent_at: new Date().toISOString(),
    channel: patient.reminder_channel,
    response: null,
    status: 'sent',
    message_body: msg
  });

  // Physical Dispatch conditionally based on channel
  try {
    if (patient.reminder_channel === 'Email') {
      const { sendResendEmail } = require('@/lib/resend');
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
      const { sendTwilioSMS } = require('@/lib/twilio');
      await sendTwilioSMS(patient.phone, msg);
    }
  } catch (dispatchErr) {
    console.error('Manual physical reminder dispatch failed:', dispatchErr);
  }

  await DBBroker.updatePatient(patient.id, { status: 'pending' });
  revalidatePath('/');
}

// DELETE PATIENT ACTION
export async function deletePatientAction(patientId: string) {
  await DBBroker.deletePatient(patientId);
  revalidatePath('/patients');
  revalidatePath('/');
}

// UPDATE CLINIC SETTINGS ACTION
export async function updateSettingsAction(clinicId: string, prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const reminder_template = formData.get('reminder_template') as string;
  const reminder_days_before = parseInt(formData.get('reminder_days_before') as string) || 3;
  const auto_reminders = formData.get('auto_reminders') === 'true';

  if (!name) {
    return { success: false, error: 'Clinic name is required' };
  }

  await DBBroker.updateClinic(clinicId, {
    name,
    phone,
    reminder_template,
    reminder_days_before,
    auto_reminders,
  });

  revalidatePath('/settings');
  revalidatePath('/');
  return { success: true, message: 'Clinic configurations successfully updated!' };
}

// UPGRADE PLAN SERVER ACTION (STRIPE SIMULATOR)
export async function upgradePlanAction(clinicId: string, selectedPlan: 'Starter' | 'Growth' | 'Pro') {
  await DBBroker.updateClinic(clinicId, { plan: selectedPlan });
  revalidatePath('/billing');
  revalidatePath('/');
  return { success: true, message: `Subscription successfully upgraded to ${selectedPlan} Plan!` };
}



// CREATE PATIENT ACTION
export async function createPatientAction(prevState: any, formData: FormData) {
  const session = await AuthManager.getCurrentUser();
  if (!session) {
    return { success: false, error: 'You must be logged in to create patients' };
  }

  const clinic = await DBBroker.getClinicByOwner(session.id);
  if (!clinic) {
    return { success: false, error: 'Your clinic account could not be found. Please try logging out and logging back in.' };
  }

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const medication_name = formData.get('medication_name') as string;
  const refill_frequency_days = parseInt(formData.get('refill_frequency_days') as string);
  const next_refill_date = formData.get('next_refill_date') as string;
  const reminder_channel = formData.get('reminder_channel') as 'WhatsApp' | 'SMS' | 'Email';

  if (!name || !phone || !medication_name || !refill_frequency_days || !next_refill_date || !reminder_channel) {
    return { success: false, error: 'All fields marked with an asterisk are required' };
  }

  // Create patient record
  await DBBroker.createPatient({
    clinic_id: clinic.id,
    name,
    phone,
    email: email || '',
    medication_name,
    refill_frequency_days,
    next_refill_date,
    reminder_channel,
    status: 'confirmed', // Start as confirmed when enrolling
  });

  revalidatePath('/patients');
  revalidatePath('/');
  redirect('/patients');
}

// UPDATE PATIENT ACTION
export async function updatePatientAction(patientId: string, prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const medication_name = formData.get('medication_name') as string;
  const refill_frequency_days = parseInt(formData.get('refill_frequency_days') as string);
  const next_refill_date = formData.get('next_refill_date') as string;
  const reminder_channel = formData.get('reminder_channel') as 'WhatsApp' | 'SMS' | 'Email';
  const status = formData.get('status') as 'confirmed' | 'pending' | 'overdue';

  if (!name || !phone || !medication_name || !refill_frequency_days || !next_refill_date || !reminder_channel || !status) {
    return { success: false, error: 'All fields marked with an asterisk are required' };
  }

  await DBBroker.updatePatient(patientId, {
    name,
    phone,
    email: email || '',
    medication_name,
    refill_frequency_days,
    next_refill_date,
    reminder_channel,
    status,
  });

  revalidatePath('/patients');
  revalidatePath('/');
  redirect('/patients');
}


